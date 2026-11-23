# VITACARE – KIẾN TRÚC TÍCH HỢP DỮ LIỆU SỨC KHỎE (HEALTH DATA INTEGRATION ARCHITECTURE)
## KẾ HOẠCH KỸ THUẬT & BÁO CÁO KIỂM TOÁN HỆ THỐNG (TECHNICAL PLANNING & AUDIT)

> **Tài liệu thẩm định chuyên sâu bởi:** Senior React Native Architect, NestJS Backend Architect & Mobile Health Integration Engineer.  
> **Dự án:** VitaCare – Your Health, Your Life  
> **Phiên bản tài liệu:** 1.0.0  
> **Ngày lập:** 20/11/2026  
> **Quy tắc bắt buộc:** Giai đoạn này **CHỈ PHÂN TÍCH VÀ THIẾT KẾ KIẾN TRÚC**, không can thiệp mã nguồn, không cài đặt package, không thay đổi database/migration.

---

## 1. KIỂM TOÁN HỆ THỐNG HIỆN TẠI (EXISTING ARCHITECTURE AUDIT)

### 1.1. Ứng dụng Di động (Mobile App)
- **Framework & SDK:**
  - `react-native`: `0.76.3`
  - `expo`: `~52.0.0`
  - `expo-router`: `~4.0.0` (v4 File-based routing)
  - `typescript`: `^5.7.2` (Strict mode)
  - Kiến trúc mới: New Architecture (`Bridgeless` & `TurboModules` sẵn sàng trên RN 0.76).
- **Cấu hình Native & Prebuild:**
  - `apps/mobile/app.json`: Đã cấu hình bundleIdentifier `com.vitacare.app`, package `com.vitacare.app`.
  - iOS `infoPlist` hiện tại có 2 quyền khai báo cơ bản: `NSHealthShareUsageDescription` và `NSHealthUpdateUsageDescription` (cần chuẩn hóa lại theo nguyên tắc *Least Privilege*).
  - Thư mục native `android/` đã tồn tại (prebuilt), target SDK `34`, compile SDK `35`, min SDK `24`.
  - Android `AndroidManifest.xml` hiện đang khai báo `android.permission.HEALTH_READ` và `HEALTH_WRITE` (đây là các quyền cũ/không hợp lệ với Health Connect tiêu chuẩn của Google, cần thay thế bằng các quyền `android.permission.health.READ_*`).
  - Thư mục `ios/` chưa được sinh ra (sẽ được sinh tự động thông qua `npx expo prebuild`).
- **Quản lý trạng thái & Truy vấn dữ liệu:**
  - `zustand`: `^5.0.2` (Store trung tâm quản lý auth, profile, local session).
  - `@tanstack/react-query`: `^5.62.3` (Quản lý cache server-state, query keys phân tầng `health-records`, `latest`, `list`).
- **Giao tiếp API (HTTP Client):**
  - `axios`: `^1.7.9` tích hợp hàng đợi `failedQueue` chống duplicate refresh token, tự động gắn Bearer token từ `expo-secure-store`.
- **Giao diện Health hiện có:**
  - Màn hình chính: `apps/mobile/app/(tabs)/health/index.tsx` (Dashboard chỉ số huyết áp, đường huyết, nhịp tim, cân nặng).
  - Màn hình phụ: `apps/mobile/app/health/add.tsx` (Nhập thủ công), `history.tsx` (Lịch sử đo), `[id].tsx` (Chi tiết bản ghi).
  - Hook truy vấn: `apps/mobile/src/hooks/useHealthRecords.ts` đã kết nối API `/api/v1/health-records`.

### 1.2. Máy chủ Backend (NestJS Monorepo)
- **Công nghệ nền tảng:** NestJS v10+, Prisma ORM `v6.19.3`, cơ sở dữ liệu PostgreSQL (Supabase).
- **Module Health Records hiện hữu:**
  - `HealthRecordsController` (`/api/v1/health-records`):
    - `POST /`: Tạo bản ghi chỉ số đơn lẻ (`CreateHealthRecordDto`).
    - `GET /`: Tra cứu danh sách theo loại chỉ số và khoảng thời gian (`HealthRecordQueryDto`).
    - `GET /latest`: Lấy chỉ số mới nhất của từng loại (`findLatestByType`).
    - `GET /:id`: Lấy chi tiết bản ghi.
    - `DELETE /:id`: Xóa bản ghi (chỉ chủ sở hữu).
- **Mô hình dữ liệu Database (`schema.prisma`):**
  - Bảng `health_records`:
    - Cột: `id (UUID)`, `userId (UUID)`, `recordType (Enum)`, `value (Decimal 12,2)`, `secondaryValue (Decimal 12,2 - Diastolic)`, `unit (VarChar 30)`, `source (Enum: MANUAL, HEALTHKIT, HEALTH_CONNECT)`, `recordedAt (Timestamptz)`, `note (Text)`.
    - Quan hệ: `attachments (HealthAttachment[])`.
    - Index: `@@index([userId, recordType, recordedAt(sort: Desc)])`.
  - **Điểm khuyết thiếu hiện tại của Database:**
    - Chưa có cột `externalId` / `sourceRecordId` để lưu UUID từ HealthKit / Health Connect (dù trong bảng `activity_logs` đã có cột `externalId`).
    - Chưa có cột `sourceDevice` (ví dụ: Apple Watch Series 9, Samsung Galaxy Watch 6, Omron Hem-7120).
    - Chưa có bảng/cột quản lý `sync_cursors` (Checkpoint đồng bộ theo thời gian).
    - Chưa hỗ trợ API Batch Import để đồng bộ khối lượng lớn dữ liệu ngoại tuyến.

---

## 2. BÁO CÁO TƯƠNG THÍCH EXPO (EXPO SDK 52 COMPATIBILITY REPORT)

### 2.1. Đánh giá khả năng hoạt động trên Expo Go
> [!CAUTION]
> **EXPO GO KHÔNG THỂ CHẠY CÁC THƯ VIỆN HEALTHKIT VÀ HEALTH CONNECT NATIVE.**
> 
> - **Lý do kỹ thuật đối với iOS HealthKit:** Apple yêu cầu ứng dụng phải có Entitlement `com.apple.developer.healthkit` được ký bởi Provisioning Profile thật. Bản build Expo Go phân phối trên App Store không chứa entitlement này cho bundle của bên thứ ba, đồng thời thiếu mã nguồn Objective-C/Swift của SDK HealthKit.
> - **Lý do kỹ thuật đối với Android Health Connect:** Health Connect SDK (`androidx.health.connect:connect-client`) yêu cầu khai báo `activity-alias` chứa intent-filter `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE` và các permissions hệ thống mới trong `AndroidManifest.xml`. Ứng dụng Expo Go tiêu chuẩn không chứa các khai báo này.
> - **Giải pháp bắt buộc:** Toàn bộ quá trình phát triển và kiểm thử tính năng đồng bộ thiết bị phải sử dụng **Expo Prebuild** hoặc **Expo Development Client (`expo-dev-client`)**.

### 2.2. Kiểm định các thư viện Native trên React Native 0.76 (Expo SDK 52)

| Nền tảng | Thư viện đề xuất | Phiên bản đề xuất | Tương thích RN 0.76 & Expo 52 | Đánh giá kiến trúc & Cơ chế hoạt động |
| :--- | :--- | :--- | :--- | :--- |
| **iOS** | `@kingstinct/react-native-healthkit` | `^7.4.x` | ✅ **Tương thích cao nhất** (Được Expo khuyến nghị chính thức) | - Cung cấp sẵn Expo Config Plugin (`plugins: ["@kingstinct/react-native-healthkit"]`).<br>- Hỗ trợ hoàn toàn TypeScript.<br>- Tương thích cả New Architecture lẫn Bridgeless.<br>- Hỗ trợ truy vấn mẫu lượng (`queryQuantitySamples`), phân trang và tự động cấu hình Info.plist / Entitlements qua Prebuild. |
| **Android** | `react-native-health-connect` | `^3.2.x` | ✅ **Tương thích cao nhất** (Chuẩn Google Health Connect) | - Thư viện chuẩn được duy trì tích cực bởi Matin Zandkarimi.<br>- Đã tích hợp sẵn Expo Config Plugin tự động tiêm Permission Rationale Activity vào `AndroidManifest.xml`.<br>- Dựa trên Android Jetpack Health Connect Client (`1.1.0-alpha10`+).<br>- Hỗ trợ tính năng `getChangesToken` và `getChanges` phục vụ đồng bộ vi sai (Incremental Sync). |
| *Thay thế cũ* | `react-native-health` | `v1.16.x` | ⚠️ Không tối ưu | Thư viện cũ, thiếu Config Plugin chính thức cho Expo 52, việc hỗ trợ TypeScript yếu và không tương thích tốt với New Architecture. |
| *Thay thế cũ* | `react-native-google-fit` | `v0.19.x` | ❌ **BỊ LOẠI BỎ** | Google đã chính thức **khai tử Google Fit REST API và SDK vào năm 2024-2025**, thay thế toàn bộ bằng Health Connect. Không được sử dụng. |

---

## 3. KIẾN TRÚC TÍCH HỢP APPLE HEALTHKIT (IOS)

```
+-----------------------------------------------------------------------+
|                              iOS Device                               |
|                                                                       |
|  +--------------------+     +--------------------------------------+  |
|  | Apple Health Store | <-> | @kingstinct/react-native-healthkit   |  |
|  +--------------------+     +--------------------------------------+  |
|                                                |                      |
|                                   [HealthKitAdapter.ts]               |
|                                                |                      |
|                             - Kiểm tra khả dụng (isHealthDataAvailable)|
|                             - Yêu cầu quyền đọc có chọn lọc          |
|                             - Đọc dữ liệu thô (Samples Query)        |
|                             - Chuẩn hóa: mmHg, bpm, mmol/L, kg       |
|                                                |                      |
|                                                v                      |
|                                   [HealthSyncEngine.ts]               |
+-----------------------------------------------------------------------+
```

### 3.1. Cấu hình Entitlements & Info.plist
Trong `apps/mobile/app.json`, cấu hình plugin thông qua Config Plugin:
```json
{
  "plugins": [
    [
      "@kingstinct/react-native-healthkit",
      {
        "NSHealthShareUsageDescription": "VitaCare cần quyền đọc chỉ số nhịp tim, huyết áp, đường huyết và cân nặng để giúp bạn theo dõi sức khỏe liên tục.",
        "background": false
      }
    ]
  ]
}
```
*Lưu ý bảo mật:* Không yêu cầu quyền `NSHealthUpdateUsageDescription` ở giai đoạn 1 vì ứng dụng chỉ đóng vai trò **Consumer** (chỉ đọc dữ liệu về VitaCare, không ghi đè vào Apple Health).

### 3.2. Danh mục quyền đọc tối thiểu (Read Permissions)
Chỉ yêu cầu các Identifier sau:
1. `HKQuantityTypeIdentifierHeartRate` (Nhịp tim)
2. `HKQuantityTypeIdentifierBloodPressureSystolic` (Huyết áp tâm thu)
3. `HKQuantityTypeIdentifierBloodPressureDiastolic` (Huyết áp tâm trương)
4. `HKQuantityTypeIdentifierBloodGlucose` (Đường huyết)
5. `HKQuantityTypeIdentifierBodyMass` (Cân nặng)

### 3.3. Xử lý đặc thù của Apple HealthKit
> [!IMPORTANT]
> **NGUYÊN TẮC QUYỀN RIÊNG TƯ CỦA APPLE HEALTH:**  
> Apple cố tình thiết kế để ứng dụng **KHÔNG THỂ BIẾT** người dùng đã cấp quyền đọc hay từ chối cấp quyền đọc (hàm `requestAuthorization` luôn trả về thành công để bảo vệ sự riêng tư của người dùng).
> - Do đó, nếu người dùng từ chối quyền, API truy vấn dữ liệu sẽ trả về danh sách rỗng `[]` mà không có lỗi.
> - Hệ thống không được đánh đồng danh sách rỗng là "đã đồng bộ xong", mà phải hiển thị hướng dẫn người dùng kiểm tra lại mục *Cài đặt > Sức khỏe > Quyền truy cập dữ liệu* nếu phát hiện không có dữ liệu nào được trả về trong khoảng thời gian có đo.

### 3.4. Ghép cặp Huyết áp (Blood Pressure Correlation)
- Trong HealthKit, Huyết áp được lưu dưới dạng `HKCorrelationTypeIdentifierBloodPressure`, chứa 2 `HKQuantitySample` con: Systolic và Diastolic.
- Module adapter sẽ truy vấn các Correlation này để trích xuất đồng thời cả tâm thu và tâm trương trong cùng một thời điểm đo (tránh tình trạng chỉ lấy được tâm thu mà thiếu tâm trương).

### 3.5. Đồng bộ vi sai (Incremental Synchronization)
- Lưu `lastSyncAnchor` (hoặc `lastSyncTimestamp`) của iOS vào `expo-secure-store`.
- Mỗi lần kích hoạt đồng bộ, chỉ truy vấn:
  `from: lastSyncTimestamp ?? (now - 30 days) to: now`.
- Giới hạn tối đa 30 ngày cho lần đồng bộ đầu tiên (Initial Sync) để tránh tràn bộ nhớ và nghẽn mạng thiết bị.

---

## 4. KIẾN TRÚC TÍCH HỢP ANDROID HEALTH CONNECT (ANDROID)

```
+-----------------------------------------------------------------------+
|                            Android Device                             |
|                                                                       |
|  +--------------------+     +--------------------------------------+  |
|  |   Health Connect   | <-> |    react-native-health-connect       |  |
|  |  (System / App)    |     +--------------------------------------+  |
|  +--------------------+                        |                      |
|                                                |                      |
|                                  [HealthConnectAdapter.ts]            |
|                                                |                      |
|                             - Kiểm tra SDK Status (Available/Update) |
|                             - Kiểm tra quyền thực tế (getGranted)    |
|                             - Yêu cầu quyền qua Permission Intent     |
|                             - Đọc dữ liệu vi sai (Changes Token API)  |
|                             - Chuẩn hóa: mmHg, bpm, mmol/L, kg       |
|                                                |                      |
|                                                v                      |
|                                   [HealthSyncEngine.ts]               |
+-----------------------------------------------------------------------+
```

### 4.1. Khả dụng & Tương thích hệ điều hành
Không phải tất cả điện thoại Android đều có sẵn Health Connect:
- **Android 14+ (API 34+):** Health Connect đã được tích hợp sẵn vào sâu trong Core Framework của hệ điều hành.
- **Android 9 đến 13 (API 28 - 33):** Người dùng phải cài đặt ứng dụng [Health Connect by Google](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata) từ Google Play Store.
- **Android 8 trở xuống:** Không hỗ trợ.

**Quy trình kiểm tra tính khả dụng:**
1. Gọi `getSdkStatus()`.
2. Xử lý 3 trạng thái:
   - `SdkAvailabilityStatus.SDK_AVAILABLE`: Tiến hành yêu cầu quyền.
   - `SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED`: Chuyển hướng người dùng sang Google Play Store để cài đặt/cập nhật Health Connect.
   - `SdkAvailabilityStatus.SDK_UNAVAILABLE`: Ẩn tùy chọn Health Connect và thông báo thiết bị không hỗ trợ.

### 4.2. Khai báo Permissions & Rationale Activity
Trong `AndroidManifest.xml` (thông qua Expo Config Plugin):
```xml
<!-- Quyền đọc Health Connect tiêu chuẩn -->
<uses-permission android:name="android.permission.health.READ_HEART_RATE"/>
<uses-permission android:name="android.permission.health.READ_BLOOD_PRESSURE"/>
<uses-permission android:name="android.permission.health.READ_BLOOD_GLUCOSE"/>
<uses-permission android:name="android.permission.health.READ_WEIGHT"/>

<!-- Khai báo Rationale Activity bắt buộc theo chính sách của Google Play -->
<activity-alias
    android:name="ViewPermissionUsageActivity"
    android:exported="true"
    android:targetActivity=".MainActivity"
    android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
    <intent-filter>
        <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
    </intent-filter>
</activity-alias>
```

### 4.3. Các Record cần đọc
1. `HeartRateRecord`: Đọc `samples[].beatsPerMinute` và `startTime`.
2. `BloodPressureRecord`: Đọc `systolic.inMillimetersOfMercury`, `diastolic.inMillimetersOfMercury`, `time`.
3. `BloodGlucoseRecord`: Đọc `level.inMillimolesPerLiter` (hoặc milligramsPerDeciliter) và `time`.
4. `WeightRecord`: Đọc `weight.inKilograms` và `time`.

### 4.4. Cơ chế Changes Token (Đồng bộ vi sai tối ưu nhất)
Khác với HealthKit, Health Connect cung cấp cơ chế **Changes API** cực kỳ mạnh mẽ:
1. Lấy token ban đầu: `getChangesToken({ recordTypes: [...] })`.
2. Lưu token vào bộ nhớ máy khách.
3. Trong các lần đồng bộ kế tiếp, chỉ cần gọi `getChanges(token)`:
   - Trả về danh sách `upsertionRecords` (các bản ghi mới đo hoặc được cập nhật).
   - Trả về danh sách `deletionRecordIds` (các bản ghi người dùng đã xóa trong ứng dụng gốc).
   - Trả về `nextChangesToken` mới để lưu lại cho phiên sau.
4. Xử lý phân trang: Nếu `hasMore === true`, tiếp tục gọi `getChanges` với token được trả về cho tới khi hết dữ liệu.

---

## 5. KIẾN TRÚC MÔ HÌNH DỮ LIỆU CHUNG (UNIFIED DATA ARCHITECTURE)

Dữ liệu sức khỏe đến từ 4 nguồn khác nhau: **Nhập tay (MANUAL)**, **Apple Health (HEALTHKIT)**, **Health Connect (HEALTH_CONNECT)** và **Nhận diện tài liệu (DOCUMENT_OCR)**. Cần một cấu trúc chuẩn hóa đồng nhất trước khi lưu trữ và hiển thị.

```
+---------------------------------------------------------------------------------------+
|                                    DATA NORMALIZATION                                 |
+---------------------------------------------------------------------------------------+
|  Apple HealthKit        Health Connect          Manual Entry          Document OCR    |
|  (HKQuantitySample)   (HealthConnectRecord)     (User Form)             (Camera/PDF)  |
|         \                   |                        |                      /         |
|          \                  |                        |                     /          |
|           +-----------------+------------------------+--------------------+           |
|                                         |                                             |
|                                         v                                             |
|                             [NormalizedHealthMeasurement]                             |
|                             - userId: string (UUID)                                   |
|                             - metricType: HealthRecordType                            |
|                             - value: number (Systolic / Glucose / Weight / HR)        |
|                             - secondaryValue: number | null (Diastolic)               |
|                             - unit: string (mmHg, bpm, mmol/L, kg)                    |
|                             - measuredAt: ISO 8601 (UTC Timestamptz)                  |
|                             - source: DataSource                                      |
|                             - sourceRecordId: string | null (UUID / Record ID)        |
|                             - sourceDevice: string | null                             |
|                             - deduplicationHash: SHA-256 (Compound Key)               |
|                             - metadata: JSON                                          |
+---------------------------------------------------------------------------------------+
```

### 5.1. Bảng Quy chuẩn Đơn vị Đo lường (Unit Standardization)

| Chỉ số sức khỏe (`metricType`) | Đơn vị chuẩn VitaCare | Quy đổi từ HealthKit | Quy đổi từ Health Connect | Giá trị chính (`value`) | Giá trị phụ (`secondaryValue`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BLOOD_PRESSURE` | `mmHg` | `mmHg` | `inMillimetersOfMercury` | Huyết áp tâm thu (Systolic) | Huyết áp tâm trương (Diastolic) |
| `HEART_RATE` | `bpm` | `count/min` | `beatsPerMinute` | Nhịp tim trung bình | `null` |
| `BLOOD_GLUCOSE` | `mmol/L` | `mg/dL` hoặc `mmol/L` | `inMillimolesPerLiter` | Nồng độ đường huyết | `null` (kèm meal context trong metadata) |
| `WEIGHT` | `kg` | `kg` hoặc `lb` ($\times 0.453592$) | `inKilograms` | Cân nặng cơ thể | `null` |

### 5.2. Chiến lược Chống trùng lặp Dữ liệu (Deduplication Strategy)
Trùng lặp dữ liệu là nguy cơ lớn nhất khi đồng bộ từ nhiều thiết bị và đồng bộ định kỳ.

#### A. Trùng lặp cùng nguồn (Same-source Duplication)
- Trường hợp: Một bản ghi từ Apple Health hoặc Health Connect được quét lại nhiều lần trong các phiên sync.
- Giải pháp: Sử dụng **Compound Key**:
  `source + sourceRecordId`
- Khi lưu trữ, kiểm tra: Nếu cặp `(userId, source, sourceRecordId)` đã tồn tại trong cơ sở dữ liệu thì bỏ qua (Skip) hoặc cập nhật (Upsert) chứ không chèn bản ghi mới.

#### B. Trùng lặp đa nguồn (Cross-source Duplication)
- Trường hợp: Người dùng đo huyết áp bằng máy Omron kết nối với Apple Health, đồng thời tự gõ lại huyết áp đó bằng tay (MANUAL) trên VitaCare trong cùng một buổi sáng.
- Giải pháp: Sử dụng cơ chế phát hiện xung đột **Time-window Matching**:
  - Cùng `userId`
  - Cùng `metricType`
  - Khoảng cách thời gian $|t_{\text{measuredAt}} - t_{\text{existing}}| \le 2\text{ phút}$
  - Sai số giá trị $|v_1 - v_2| \le 1\%$
- **Quy tắc ưu tiên dữ liệu (Precedence Hierarchy):**
  1. `MANUAL`: Ưu tiên cao nhất (quyết định chủ quan có ý thức của người dùng).
  2. `DOCUMENT_OCR`: Ưu tiên thứ hai (có phiếu xét nghiệm/kết quả bệnh viện đính kèm).
  3. `HEALTHKIT` / `HEALTH_CONNECT`: Nguồn đồng bộ tự động nền.
- Nếu phát hiện trùng đa nguồn, hệ thống đánh dấu bản ghi tự động là `DUPLICATE_MERGED` vào metadata thay vì xóa hẳn, đảm bảo tính vẹn toàn dữ liệu.

### 5.3. Đề xuất nâng cấp Schema trong tương lai (Future Schema Recommendation)
> [!NOTE]
> Bảng `health_records` hiện tại của Prisma đã có sẵn các trường cốt lõi (`userId`, `recordType`, `value`, `secondaryValue`, `unit`, `source`, `recordedAt`, `note`).
> 
> Trong giai đoạn triển khai sau này, kiến trúc đề xuất mở rộng thêm các trường:
> - `source_record_id VARCHAR(255)`: ID duy nhất của bản ghi từ HealthKit/Health Connect.
> - `source_device VARCHAR(150)`: Thông tin phần cứng thiết bị đo.
> - `metadata JSONB`: Lưu context chuyên sâu (ví dụ: tư thế đo huyết áp, trạng thái nhịn ăn của đường huyết).
> - `@@unique([userId, source, source_record_id])`: Ràng buộc chống trùng tuyệt đối ở mức Database.

---

## 6. THIẾT KẾ KIẾN TRÚC BACKEND (NESTJS BACKEND ARCHITECTURE)

### 6.1. Audit Module Hiện tại & Khoảng trống (Gaps)
- `HealthRecordsService` hiện tại chỉ có các phương thức: `create` (1 bản ghi), `findAll` (lọc đơn giản), `findLatestByType`, `findOne`, `delete`.
- **Khoảng trống:**
  1. Chưa có endpoint tiếp nhận đồng bộ hàng loạt (**Batch Import**). Nếu client gửi 100 bản ghi đo từ HealthKit qua 100 HTTP requests riêng lẻ, máy chủ sẽ bị nghẽn (connection pool exhaustion) và tốn pin thiết bị.
  2. Chưa có cơ chế quản lý trạng thái đồng bộ (**Sync Checkpoint API**).
  3. Chưa có giao dịch database (`$transaction`) tối ưu cho việc chèn nhiều bản ghi kèm kiểm tra trùng lặp.

### 6.2. Đề xuất API Endpoint Cần thiết (Cho Phase thực thi)

| Phương thức | Tuyến đường (Route) | Mục đích | Payload chính |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/health-records/batch-sync` | Nhận danh sách bản ghi đồng bộ từ thiết bị | `records: NormalizedHealthMeasurement[]`, `platform: 'IOS' \| 'ANDROID'`, `syncSessionId: string` |
| `GET` | `/api/v1/health-records/sync-status` | Lấy mốc thời gian / checkpoint đồng bộ gần nhất | Query: `source: DataSource` -> Trả về `lastSyncAt`, `totalSynced` |
| `POST` | `/api/v1/health-records/sync-status` | Cập nhật checkpoint đồng bộ thành công | `{ source: DataSource, cursorToken?: string, syncedAt: string }` |
| `DELETE` | `/api/v1/health-records/source/:source`| Thu hồi/Xóa toàn bộ dữ liệu từ nguồn nhất định | Phục vụ người dùng khi ngắt kết nối Apple Health / Health Connect |

### 6.3. Kiến trúc Xử lý Batch Import trên NestJS
```typescript
// Kiến trúc thuật toán xử lý tại HealthRecordsService.batchSync:
// 1. Xác thực quyền sở hữu với @CurrentUser('id')
// 2. Validate toàn bộ mảng dữ liệu với class-validator (ArrayMaxSize: 200 bản ghi/lô)
// 3. Thực thi Prisma Interactive Transaction:
//    - Tìm các sourceRecordId đã tồn tại trong DB của user này
//    - Lọc bỏ các bản ghi trùng
//    - Bulk insert các bản ghi mới bằng createMany (hoặc song song lặp có transaction)
//    - Cập nhật chỉ số mới nhất sang HealthProfile (chiều cao, cân nặng)
// 4. Trả về kết quả: { insertedCount: number, skippedCount: number, failedCount: number }
```

---

## 7. QUY TRÌNH HOẠT ĐỘNG CỦA HEALTH SYNC ENGINE (10-STEP SYNC FLOW)

```
 [1. Check Platform] --------> Không hỗ trợ Web/Simulator
          |
 [2. Check Availability] ----> HealthKit / Health Connect khả dụng?
          |                    (Nếu thiếu -> Hướng dẫn cài / Bỏ qua)
          |
 [3. Request Permissions] ---> Hỏi quyền tối thiểu (HeartRate, BP, Glucose, Weight)
          |                    (Bị từ chối -> Đánh dấu denied, dừng luồng)
          |
 [4. Read Records] ----------> Đọc vi sai (Anchor / Changes Token hoặc Timestamp Cursor)
          |                    (Giới hạn tối đa 30 ngày cho lần đầu)
          |
 [5. Normalize Data] --------> Đổi đơn vị chuẩn (mmHg, bpm, mmol/L, kg) + UTC Time
          |
 [6. Deduplicate] -----------> Lọc trùng cùng nguồn (Compound Key) & đa nguồn (Time-window)
          |
 [7. Batch Import] ----------> Gửi POST /api/v1/health-records/batch-sync
          |
 [8. Handle Retries] --------> Lỗi mạng -> Lưu tạm vào Offline Cache (AsyncStorage/Watermelon)
          |
 [9. Update Checkpoint] -----> Ghi nhận mốc đồng bộ mới vào SecureStore & Server
          |
[10. Refresh UI] ------------> Invalidate React Query Cache -> Cập nhật Dashboard tức thì
```

### 7.1. Xử lý các tình huống biên (Edge Cases & Resilience)

1. **Từ chối hoặc Thu hồi quyền (Partial or Revoked Permissions):**
   - Ứng dụng kiểm tra quyền trước mỗi lần quét.
   - Nếu người dùng chỉ cấp quyền đo Cân nặng nhưng từ chối Huyết áp, Engine vẫn tiến hành đồng bộ Cân nặng bình thường và bỏ qua Huyết áp mà không báo lỗi sập ứng dụng.
   - Cung cấp nút trạng thái phân quyền trong giao diện Cài đặt để người dùng biết quyền nào đang bật, quyền nào đang tắt.
2. **Xử lý Mất kết nối Mạng (Network Offline during Sync):**
   - Không làm mất dữ liệu đã đọc từ thiết bị.
   - Dữ liệu chuẩn hóa được đưa vào hàng đợi `OfflineSyncQueue` lưu tạm trong thiết bị.
   - Khi mạng kết nối lại (`NetInfo.isConnected === true`), tự động thực hiện flush hàng đợi lên server.
   - Chỉ cập nhật `lastSyncAnchor` sau khi server phản hồi HTTP `200 OK` (Ack).
3. **Lệch Múi giờ & Daylight Saving Time (Timezone Variations):**
   - Tất cả bản ghi đồng bộ đều phải được chuyển đổi thành chuỗi ISO-8601 kèm múi giờ gốc hoặc chuẩn hóa về UTC (`Z`) kèm offset tại thời điểm đo.
   - Database PostgreSQL lưu trữ dưới dạng `TIMESTAMPTZ` để đảm bảo khi người dùng di chuyển giữa các quốc gia, thứ tự đo lường vẫn được bảo toàn nguyên vẹn.
4. **Xóa bản ghi ở ứng dụng gốc (Deletions in Health Connect):**
   - Khi Health Connect trả về `deletionRecordIds`, ở phiên bản đầu tiên (Phase 1), VitaCare **không tự động xóa bản ghi tương ứng trong cơ sở dữ liệu VitaCare** để tránh mất mát hồ sơ bệnh án của người dùng, mà sẽ cập nhật metadata `isOrphanedFromSource: true`.

---

## 8. BẢO MẬT & QUYỀN RIÊNG TƯ (SECURITY & PRIVACY BY DESIGN)

Tuân thủ nghiêm ngặt các quy định về dữ liệu y tế (HIPAA, GDPR Health Data, Nghị định 13/2023/NĐ-CP của Việt Nam):

1. **Nguyên tắc Quyền tối thiểu (Least Privilege):**
   - Chỉ xin quyền ĐỌC (`READ`), tuyệt đối không xin quyền GHI (`WRITE`) khi không có tính năng tương ứng.
   - Chỉ xin các chỉ số phục vụ trực tiếp cho dashboard của VitaCare (Huyết áp, Nhịp tim, Đường huyết, Cân nặng).
2. **Sự đồng thuận minh bạch (Explicit Consent):**
   - Người dùng phải chủ động nhấn nút "Kết nối Apple Health" hoặc "Kết nối Health Connect" trên màn hình Cài đặt Sức khỏe.
   - Hiển thị màn hình giải thích (Rationale Sheet) trước khi gọi hộp thoại cấp quyền hệ điều hành, nêu rõ: Dữ liệu nào được đọc, mục đích sử dụng, và cam kết không chia sẻ cho bên thứ ba.
3. **Mã hóa trong truyền tải (Secure Transport):**
   - 100% dữ liệu truyền qua HTTPS với TLS 1.3.
   - Xác thực người dùng qua JWT Access Token ngắn hạn trong Authorization Header.
4. **Vệ sinh Nhật ký (Sanitized Logging):**
   - Cấm ghi log (cả ở Mobile console và Backend log) chứa giá trị chỉ số sức khỏe, tên người dùng hoặc email.
   - Chỉ log mã sự kiện, số lượng bản ghi và mã lỗi:
     `[HealthSync] Synced 14 records for user 8e1e*** in 420ms.`
5. **Quy trình Hủy liên kết & Xóa dữ liệu (Disconnect & Data Deletion Workflow):**
   - Khi người dùng chọn "Ngắt kết nối", ứng dụng phải xóa token đồng bộ trên máy, ngừng mọi tác vụ quét nền.
   - Cung cấp tùy chọn cho người dùng: *"Giữ lại dữ liệu đã đồng bộ trước đó trên VitaCare"* HOẶC *"Xóa toàn bộ dữ liệu đã nhập từ nguồn này"*.

---

## 9. CHIẾN LƯỢC KIỂM THỬ (TESTING STRATEGY)

| Môi trường kiểm thử | Nền tảng | Công cụ & Thiết bị | Khả năng kiểm thử | Lưu ý kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **Android Emulator** | Android 14 (API 34) | AVD `Medium_Phone` | ✅ Kiểm thử Health Connect tích hợp | - Cài đặt ứng dụng Health Connect Toolbox (Google) để inject dữ liệu mẫu vào Health Connect của máy ảo.<br>- Kiểm tra luồng cấp quyền và đọc `BloodPressureRecord`. |
| **Android Physical Device** | Android 10 - 13 | Điện thoại Samsung / Pixel thật | ✅ Toàn diện Health Connect | - Kiểm thử tình huống máy chưa cài ứng dụng Health Connect -> xác nhận chuyển hướng sang CH Play.<br>- Kiểm thử kết nối Bluetooth từ đồng hồ thông minh sang Health Connect. |
| **iOS Simulator** | iOS 17 / 18 | Xcode Simulator | ⚠️ Một phần HealthKit | - HealthKit hoạt động trên Simulator nhưng không hỗ trợ Background Delivery thực tế.<br>- Có thể nhập dữ liệu vào app Health trên Simulator. |
| **iPhone Physical Device** | iOS 17 / 18 | iPhone 12/13/14/15 thật | ✅ Toàn diện Apple Health | - Cần Apple Developer Account để ký Development Provisioning Profile có HealthKit Entitlement.<br>- Chạy bản build `expo run:ios` hoặc Expo Dev Client. |
| **Expo Go** | Cả hai | Mọi thiết bị | ❌ **KHÔNG KIỂM THỬ ĐƯỢC NATIVE** | Chỉ dùng để kiểm thử UI mock hoặc luồng nhập thủ công. Không thể dùng để kiểm thử đồng bộ native. |

### Ma trận Kịch bản Kiểm thử bắt buộc (Test Cases):
1. **Kiểm thử Quyền (Permissions):** Cấp đủ quyền -> Cấp 1 phần quyền -> Từ chối tất cả -> Thu hồi quyền trong Settings hệ điều hành.
2. **Kiểm thử Dữ liệu Rỗng (Empty Data):** Thiết bị mới chưa có dữ liệu đo -> Hệ thống không báo lỗi, giữ nguyên giao diện sạch sẽ.
3. **Kiểm thử Dữ liệu Trùng lặp (Deduplication):** Đo 1 lần, bấm sync 3 lần liên tiếp -> Database chỉ ghi nhận đúng 1 bản ghi duy nhất.
4. **Kiểm thử Đứt quãng Mạng (Network Loss):** Tắt Wi-Fi giữa chừng khi đang sync -> Ứng dụng không crash, lưu queue ngoại tuyến, sync lại khi có mạng.
5. **Kiểm thử Chuyển đổi Tài khoản (Multi-account Switch):** User A đăng xuất, User B đăng nhập trên cùng 1 điện thoại -> Dữ liệu HealthKit của máy không được tự ý gán nhầm vào tài khoản User B nếu không có sự đồng ý.

---

## 10. LỘ TRÌNH TRIỂN KHAI CHI TIẾT (DEVELOPMENT PHASES)

```
+---------------------------------------------------------------------------------------+
|  PHASE 1: CHUẨN BỊ NỀN TẢNG NATIVE & CORE ADAPTERS                                    |
|  - Cấu hình Expo Config Plugins trong app.json                                        |
|  - Cài đặt @kingstinct/react-native-healthkit & react-native-health-connect           |
|  - Thực hiện npx expo prebuild tạo mã nguồn native chuẩn                              |
|  - Xây dựng IHealthAdapter interface và HealthKitAdapter, HealthConnectAdapter       |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|  PHASE 2: HEALTH SYNC ENGINE & BACKEND BATCH API                                      |
|  - Xây dựng NormalizedHealthMeasurement và bộ mapper quy đổi đơn vị                   |
|  - Xây dựng thuật toán chống trùng Compound Key & Time-window matching                |
|  - Bổ sung Batch Import endpoint tại Backend NestJS (có transaction)                  |
|  - Xây dựng State Machine cho HealthSyncEngine (Progress, Success, Error states)      |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|  PHASE 3: GIAO DIỆN CÀI ĐẶT ĐỒNG BỘ & QUẢN LÝ NGUỒN DỮ LIỆU                           |
|  - Màn hình "Nguồn Dữ Liệu Sức Khỏe" trong Cài đặt (Bật/tắt Apple Health / Health Conn)|
|  - Thẻ nguồn gốc (Source Badge: HealthKit / Health Connect) trên từng thẻ chỉ số đo   |
|  - Trạng thái "Đang đồng bộ..." và thời điểm "Đồng bộ lần cuối lúc XX:YY"             |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|  PHASE 4: KIỂM THỬ THỰC TẾ TRÊN THIẾT BỊ NATIVE & NGHIỆM THU                         |
|  - Build Android APK Dev Client & chạy trên Android Emulator + Máy thật              |
|  - Build iOS Dev Client & chạy trên iPhone thật                                       |
|  - Kiểm định toàn diện 5 nhóm kịch bản Test Matrix                                   |
+---------------------------------------------------------------------------------------+
```

---

## 11. CÁC TỆP DỰ KIẾN SẼ ĐƯỢC CHỈNH SỬA / TẠO MỚI (EXPECTED FILE CHANGES)

Khi bước vào giai đoạn thực thi mã nguồn (sau khi được duyệt), các tệp sau sẽ được tác động:

### Mobile App:
1. `apps/mobile/app.json`: Bổ sung cấu hình Config Plugins cho HealthKit và Health Connect.
2. `apps/mobile/package.json`: Bổ sung `@kingstinct/react-native-healthkit`, `react-native-health-connect`, `expo-dev-client`.
3. `apps/mobile/src/services/health-sync/`:
   - `types.ts`: Khai báo Interface chuẩn hóa `NormalizedHealthMeasurement`, `IHealthAdapter`.
   - `HealthKitAdapter.ts`: Xử lý riêng cho iOS Apple HealthKit.
   - `HealthConnectAdapter.ts`: Xử lý riêng cho Android Health Connect.
   - `HealthSyncEngine.ts`: Bộ điều phối 10 bước (Normalization, Deduplication, Queue).
4. `apps/mobile/src/hooks/useHealthSync.ts`: Hook kích hoạt đồng bộ và theo dõi tiến trình.
5. `apps/mobile/app/(tabs)/health/index.tsx`: Hiển thị icon nguồn dữ liệu (Apple Health / Health Connect / Manual).
6. `apps/mobile/app/health/sync-settings.tsx`: Màn hình cấu hình kết nối thiết bị.

### Backend App:
1. `apps/backend/src/modules/health-records/health-records.controller.ts`: Bổ sung endpoint `@Post('batch-sync')`.
2. `apps/backend/src/modules/health-records/health-records.service.ts`: Triển khai hàm `batchSync` sử dụng Prisma interactive transaction.
3. `apps/backend/src/modules/health-records/dto/batch-sync-health-records.dto.ts`: DTO kiểm định mảng bản ghi gửi lên.

---

## 12. RỦI RO KỸ THUẬT & BIỆN PHÁP PHÒNG NGỪA (RISKS & MITIGATIONS)

| Rủi ro kỹ thuật | Mức độ | Hậu quả | Biện pháp phòng ngừa kiến trúc |
| :--- | :---: | :--- | :--- |
| **Xung đột phiên bản Android SDK** | Cao | Lỗi biên dịch Gradle khi build native | Khóa phiên bản Health Connect tương thích với `compileSdkVersion 35` và `targetSdkVersion 34` trong `android/build.gradle`. |
| **Apple Health không phản hồi lỗi quyền** | Trung bình | Người dùng không thấy dữ liệu, tưởng ứng dụng bị đơ | Kiểm tra nếu kết quả trả về 0 bản ghi sau lần sync đầu -> Hiển thị Tooltip nhắc người dùng kiểm tra quyền trong iOS Settings. |
| **Treo thiết bị khi sync lần đầu (Nhiều năm dữ liệu)** | Cao | Tràn bộ nhớ (OOM crash), đơ giao diện | Giới hạn cứng cửa sổ truy vấn ban đầu tối đa 30 ngày gần nhất. Phân trang tối đa 100 bản ghi/lô. |
| **Lệch múi giờ làm đảo lộn biểu đồ** | Trung bình | Nhịp tim ban đêm bị vẽ vào ban ngày | Bắt buộc chuyển đổi về ISO-8601 UTC kèm lưu trữ timezone offset của thiết bị tại thời điểm đo. |
| **Người dùng đổi điện thoại hoặc xóa app cài lại** | Thấp | Trùng lặp dữ liệu cũ | Thuật toán Deduplication trên Server sẽ tự động nhận diện và bỏ qua các bản ghi đã có. |

---

## KẾT LUẬN & KIẾN NGHỊ

Kiến trúc tích hợp dữ liệu sức khỏe kết hợp giữa **Nhập tay (Manual)**, **Apple HealthKit** và **Android Health Connect** cho VitaCare đã được thiết kế hoàn chỉnh, đồng bộ chặt chẽ giữa ứng dụng React Native Expo SDK 52 và máy chủ NestJS Prisma PostgreSQL.

Báo cáo này đã hoàn tất theo đúng quy định: **KHÔNG viết code, KHÔNG cài đặt package, KHÔNG sửa database, KHÔNG thay đổi giao diện**.

Kính trình kiến trúc sư duyệt kế hoạch để sẵn sàng cho Phase triển khai mã nguồn tiếp theo.

