# BÁO CÁO KIỂM TOÁN KIẾN TRÚC & KẾ HOẠCH TRIỂN KHAI
# MODULE 3: HYBRID ACTIVITY TRACKING
## (AUTOMATIC DAILY STEP TRACKING + WORKOUT SESSION)

**Dự án:** VitaCare – Your Health, Your Life  
**Vị trí:** Senior React Native Architect, iOS/Android Native Engineer, NestJS Backend Architect & QA Lead  
**Ngày báo cáo:** 20/11/2026  
**Tài liệu:** `docs/MODULE_3_ARCHITECTURE_AUDIT.md`  
**Trạng thái:** ✅ **ĐÃ HOÀN THÀNH KIỂM TOÁN – SẴN SÀNG TRIỂN KHAI**

---

## 1. TỔNG QUAN VÀ ĐỊNH HƯỚNG SẢN PHẨM

Module 3 là phân hệ **theo dõi vận động tự động bằng cảm biến phần cứng tích hợp của điện thoại**, tuyệt đối **không phải module nhập số bước thủ công** và **tuyệt đối không sử dụng Apple HealthKit hay Android Health Connect** trong giai đoạn này.

Hệ thống bắt buộc hỗ trợ đồng thời hai nền tảng **iOS** và **Android** với hai chế độ hoạt động:
1. **Daily Activity Tracking (Theo dõi tự động cả ngày):**
   - Đọc số bước từ cảm biến điện thoại trong nền/foreground.
   - Không yêu cầu người dùng bấm nút Start mỗi khi đi bộ.
   - Tổng hợp số bước, quãng đường ước tính, thời gian vận động và calo tiêu hao theo ngày.
   - Tự động phân tách khi sang ngày mới (Midnight boundary) theo đúng timezone của người dùng.
   - Xử lý tình huống khởi động lại điện thoại (Device Reboot làm bộ đếm phần cứng reset về 0).
   - Khôi phục trạng thái và đồng bộ dữ liệu sau khi ứng dụng bị tắt/mở lại (Crash/Reconciliation).
2. **Workout Session Tracking (Phiên tập luyện độc lập):**
   - Người dùng chủ động bắt đầu phiên: `WALKING` (Đi bộ) hoặc `RUNNING` (Chạy bộ).
   - Quản lý vòng đời phiên tập: `START` $\rightarrow$ `PAUSE` $\rightarrow$ `RESUME` $\rightarrow$ `FINISH` $\rightarrow$ `VIEW SUMMARY`.
   - Tính toán chính xác thời gian thực tế (loại trừ thời gian pause), số bước trong phiên, quãng đường, pace trung bình, calo tiêu hao.
   - **Quy tắc vàng:** Không cộng dồn bước chân của phiên tập vào tổng bước ngày lần thứ hai (vì cảm biến phần cứng của điện thoại đã tự động ghi nhận những bước chân này trong tổng bước ngày).

---

## 2. KIỂM TOÁN KIẾN TRÚC HIỆN TẠI (MOBILE & BACKEND)

### 2.1. Mobile Application (`apps/mobile`)
- **Nền tảng:** React Native 0.76.3, Expo SDK 52.0.0, Expo Router v4.
- **Thư mục Native:** Đã có thư mục `apps/mobile/android` cấu hình Continuous Native Generation (CNG) / Prebuild.
- **Thư viện Quản lý State & Network:**
  - State: Zustand v5.0.2 (đã dùng cho AuthStore, HealthStore).
  - Data Fetching & Caching: TanStack Query v5.62.3.
  - Network: Axios với interceptor tự động làm mới token.
  - Lưu trữ an toàn: `expo-secure-store` v14.0.0.
- **Giao diện hiện có:**
  - `apps/mobile/app/(tabs)/activity/index.tsx`: Đã có giao diện Stitch với 3 vòng tròn tiến độ (Tri-rings: Calo, Thời gian, Bước chân), danh sách môn thể thao, lịch tuần. Tuy nhiên, hiện tại vẫn còn fallback vào mock data tĩnh (`6840 bước`, `42 phút`).
  - `apps/mobile/app/activity/add.tsx`: Màn hình ghi nhận thủ công cũ.
  - `apps/mobile/app/activity/history.tsx`: Màn hình lịch sử tĩnh.
- **Cảm biến hiện có:** Dự án chưa cài đặt `expo-sensors`. Cần cài đặt `expo-sensors` (~52.0.0) để tương tác trực tiếp với phần cứng Pedometer/Step Counter.

### 2.2. Backend NestJS (`apps/backend`)
- **Module hiện có:** Đã có module `ActivityModule` (`activity.controller.ts`, `activity.service.ts`).
- **Thực thể hiện tại trong Prisma (`ActivityLog`):**
  - Mới chỉ có bảng `ActivityLog` lưu trữ các bản ghi log rời rạc (`userId`, `activityType`, `steps`, `durationMinutes`, `source`, `recordedAt`).
  - **Khoảng trống:** Chưa có thực thể chuyên biệt để lưu **Tổng kết ngày (`ActivityDailySummary`)** và **Phiên tập độc lập (`ActivitySession`)**.
  - Endpoint hiện tại: `POST /activity`, `GET /activity/today`, `GET /activity/history`, `PATCH /activity/:id`, `DELETE /activity/:id`.

---

## 3. PHƯƠNG ÁN TÍCH HỢP NATIVE SENSOR (iOS & ANDROID)

### 3.1. Phương án iOS – Apple CoreMotion (`CMPedometer`)
- **Cơ chế:** Sử dụng trực tiếp `CMPedometer` từ framework `CoreMotion` của Apple (được bọc chuẩn hóa qua `expo-sensors/Pedometer` trong Expo SDK 52).
- **Quyền hạn bắt buộc:** Khai báo `NSMotionUsageDescription` trong `app.json` / `Info.plist`:
  > *"VitaCare cần quyền truy cập cảm biến chuyển động để tự động đếm số bước chân và tính toán quãng đường vận động hàng ngày của bạn."*
- **Tính năng phần cứng:**
  - `CMPedometer.isStepCountingAvailable()`: Kiểm tra thiết bị có bộ đồng xử lý chuyển động (Apple M-series coprocessor) hay không.
  - `queryPedometerDataFromDate:toDate:`: Truy vấn bù lịch sử bước chân chính xác theo mốc thời gian (kể cả khi ứng dụng đã bị đóng hoàn toàn).
  - `startPedometerUpdatesFromDate:withHandler:`: Nhận luồng cập nhật bước chân thời gian thực (live updates) khi ứng dụng đang chạy.
- **Xử lý nền & Gián đoạn:** Khi ứng dụng quay lại Foreground (`AppState = 'active'`), thực hiện ngay bước **Reconciliation** bằng cách truy vấn số bước từ đầu ngày (`startOfDay`) đến hiện tại (`now`) để đảm bảo không mất bước nào khi app bị đình chỉ.

### 3.2. Phương án Android – Native Step Counter (`SensorManager`)
- **Cơ chế:** Sử dụng `Sensor.TYPE_STEP_COUNTER` (phần cứng cấp thấp của hệ điều hành Android).
- **Quyền hạn bắt buộc:**
  - Khai báo `android.permission.ACTIVITY_RECOGNITION` (bắt buộc từ Android 10 / API 29 trở lên).
  - Khai báo `android.permission.FOREGROUND_SERVICE` và `android.permission.FOREGROUND_SERVICE_HEALTH` (nếu chạy foreground service).
- **Đặc điểm kỹ thuật của Android `TYPE_STEP_COUNTER`:**
  - Cảm biến này trả về **tổng số bước lũy kế kể từ lần khởi động máy gần nhất (Reboot)**.
  - Giá trị này là một bộ đếm tăng dần liên tục, **không tự động reset về 0 vào nửa đêm**.
- **Thuật toán xử lý Android Step Counter (Bảo vệ dữ liệu & Xử lý Reboot):**
  1. **Lưu trữ Baseline:** Khi ứng dụng khởi chạy hoặc bắt đầu ngày mới, ghi nhận `baselineStepCount = currentRawSensorValue`.
  2. **Tính Delta:** $\Delta\text{steps} = \text{currentRawSensorValue} - \text{baselineStepCount}$.
  3. **Phát hiện Reboot:** Nếu `currentRawSensorValue < baselineStepCount`, chứng tỏ điện thoại vừa bị khởi động lại $\rightarrow$ Reset baseline mới bằng `currentRawSensorValue` và cộng dồn $\Delta$ trước đó vào tổng tích lũy của ngày.
  4. **Chống số âm:** Nếu $\Delta < 0$, gán $\Delta = 0$ và ghi log cảnh báo.

---

## 4. THIẾT KẾ DATABASE & DATA ARCHITECTURE (PRISMA SCHEMA)

Để đáp ứng đầy đủ yêu cầu của Module 3 mà **không phá vỡ Module 1 và Module 2**, chúng tôi bổ sung 2 thực thể mới vào `schema.prisma`:

### 4.1. Thực thể `ActivityDailySummary` (Tổng kết vận động ngày)
```prisma
model ActivityDailySummary {
  id             String     @id @default(uuid()) @db.Uuid
  userId         String     @map("user_id") @db.Uuid
  activityDate   String     @map("activity_date") @db.VarChar(10) // Format: YYYY-MM-DD
  timezone       String     @default("Asia/Ho_Chi_Minh") @db.VarChar(50)
  steps          Int        @default(0)
  distanceMeters Decimal    @default(0) @map("distance_meters") @db.Decimal(10, 2)
  activeSeconds  Int        @default(0) @map("active_seconds")
  caloriesKcal   Decimal    @default(0) @map("calories_kcal") @db.Decimal(8, 2)
  dataSource     DataSource @default(MANUAL) @map("data_source")
  lastSyncedAt   DateTime   @default(now()) @map("last_synced_at") @db.Timestamptz
  createdAt      DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, activityDate])
  @@index([userId, activityDate])
  @@map("activity_daily_summaries")
}
```

### 4.2. Thực thể `ActivitySession` (Phiên tập luyện độc lập)
```prisma
enum SessionStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

model ActivitySession {
  id              String        @id @default(uuid()) @db.Uuid
  userId          String        @map("user_id") @db.Uuid
  activityType    ActivityType  @map("activity_type") // WALKING, RUNNING, v.v.
  status          SessionStatus @default(ACTIVE)
  startedAt       DateTime      @map("started_at") @db.Timestamptz
  endedAt         DateTime?     @map("ended_at") @db.Timestamptz
  durationSeconds Int           @default(0) @map("duration_seconds")
  pausedSeconds   Int           @default(0) @map("paused_seconds")
  steps           Int           @default(0)
  distanceMeters  Decimal       @default(0) @map("distance_meters") @db.Decimal(10, 2)
  caloriesKcal    Decimal       @default(0) @map("calories_kcal") @db.Decimal(8, 2)
  averagePace     Decimal?      @map("average_pace") @db.Decimal(6, 2) // Giây/km hoặc phút/km
  createdAt       DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, startedAt(sort: Desc)])
  @@map("activity_sessions")
}
```

---

## 5. BỔ SUNG & HOÀN THIỆN API BACKEND

Giữ nguyên các API cũ của `ActivityLog` để không ảnh hưởng module khác; bổ sung các endpoint chuẩn mực:

| Nhóm | Phương thức | Endpoint | Chức năng | Phân quyền |
| :--- | :---: | :--- | :--- | :---: |
| **Daily** | `GET` | `/api/v1/activity/daily` | Lấy chi tiết tổng kết hoạt động theo ngày chỉ định (`?date=YYYY-MM-DD`). Mặc định là hôm nay. | JWT User |
| **Sync** | `POST` | `/api/v1/activity/sync` | Đồng bộ dữ liệu số bước từ Native Sensor lên server (Idempotent upsert theo `userId` + `activityDate`). | JWT User |
| **Goals** | `GET` | `/api/v1/activity/goals` | Lấy mục tiêu bước chân và thời lượng vận động của người dùng. | JWT User |
| **Goals** | `PATCH` | `/api/v1/activity/goals` | Cập nhật mục tiêu bước chân (ví dụ: 10,000 bước). | JWT User |
| **Session**| `POST` | `/api/v1/activity/sessions` | Bắt đầu phiên tập luyện (`WALKING`, `RUNNING`). Trả về session ID. | JWT User |
| **Session**| `PATCH` | `/api/v1/activity/sessions/:id/pause` | Tạm dừng phiên tập luyện. | JWT User (Owner) |
| **Session**| `PATCH` | `/api/v1/activity/sessions/:id/resume` | Tiếp tục phiên tập luyện. | JWT User (Owner) |
| **Session**| `PATCH` | `/api/v1/activity/sessions/:id/finish`| Kết thúc phiên tập luyện, chốt số bước, quãng đường, pace và calo. | JWT User (Owner) |
| **Session**| `GET` | `/api/v1/activity/sessions` | Lấy danh sách các phiên tập đã thực hiện (có phân trang). | JWT User |
| **Session**| `GET` | `/api/v1/activity/sessions/:id` | Xem chi tiết tóm tắt của 1 phiên tập cụ thể. | JWT User (Owner) |

---

## 6. THIẾT KẾ CÔNG THỨC VẬN ĐỘNG & CALORIES DỰA TRÊN THỂ TRẠNG

Không dùng số liệu ngẫu nhiên hay giả lập. Công thức chuẩn dựa trên hồ sơ thể trạng của người dùng (`HealthProfile.weightKg`, `heightCm`):

1. **Quãng đường ước tính (Distance):**
   - Chiều dài sải chân ước tính: $\text{Stride Length} = \text{heightCm} \times 0.415\text{ (m)}$ (Mặc định: $0.72\text{ m}$ nếu chưa có chiều cao).
   - $\text{Distance (m)} = \text{Steps} \times \text{Stride Length}$.
2. **Năng lượng tiêu hao (Calories Kcal) theo METs (Metabolic Equivalent of Task):**
   - Đi bộ bình thường ($\approx 4\text{ km/h}$): $\text{MET} = 3.5$.
   - Đi bộ nhanh / Chạy bộ nhẹ ($\approx 8\text{ km/h}$): $\text{MET} = 7.0$.
   - Công thức: $\text{Calories (kcal)} = \text{MET} \times \text{Weight (kg)} \times \text{Duration (hours)}$.
   - Nếu chưa có cân nặng: Sử dụng cân nặng chuẩn mặc định $65\text{ kg}$ kèm chú thích minh bạch trên UI: *"Ước tính theo thể trạng tham chiếu 65kg"*.

---

## 7. RỦI RO KỸ THUẬT & BIỆN PHÁP PHÒNG NGỪA

| Rủi ro kỹ thuật | Mức độ | Biện pháp xử lý kiến trúc |
| :--- | :---: | :--- |
| **Môi trường Máy ảo (Android Emulator) không có phần cứng đếm bước thực tế** | Cao | Xây dựng **ActivitySensorAdapter**: Tự động phát hiện nếu phần cứng trả về `isAvailable = false` $\rightarrow$ Chuyển sang hiển thị trạng thái `SENSOR_UNAVAILABLE` rõ ràng, kèm nút *"Mô phỏng 100 bước thử nghiệm"* chỉ dùng riêng trong chế độ Debug/Test, không ảnh hưởng dữ liệu sản xuất. |
| **Khởi động lại điện thoại làm reset Android Step Counter** | Trung bình | Lưu giá trị sensor thô (`lastRawCounter`) và mốc khởi động trong SecureStore/AsyncStorage. Khi giá trị mới nhỏ hơn giá trị cũ $\rightarrow$ Nhận diện Reboot $\rightarrow$ Tạo baseline mới mà không làm giảm tổng số bước đã ghi nhận. |
| **Chồng lấn bước chân giữa Daily Tracker và Workout Session** | Nghiêm trọng | Khi kết thúc Workout Session, bản ghi session được lưu độc lập vào bảng `activity_sessions` để hiển thị thành tích bài tập; **tuyệt đối không gửi lệnh cộng bước session vào Daily Summary**, vì Pedometer phần cứng của điện thoại đã tự động tính các bước đó vào tổng bước ngày. |
| **Đồng bộ mạng bị chập chờn / Mất kết nối khi đang tập** | Trung bình | Cơ chế **Offline-first**: Mọi trạng thái phiên tập (`status`, `steps`, `startTime`, `elapsedTime`) được lưu liên tục vào local store. Khi có kết nối Internet trở lại, hệ thống tự động đẩy dữ liệu lên qua API `/activity/sync` và `/sessions/:id/finish`. |

---

## 8. KẾ HOẠCH KIỂM THỬ TRÊN THIẾT BỊ THẬT & MÁY ẢO

1. **Giai đoạn Emulator/Simulator:**
   - Kiểm thử UI Stitch: Đảm bảo hiển thị hoàn hảo các vòng tiến độ, nút điều khiển Start/Pause/Resume/Finish, thẻ tóm tắt phiên tập, biểu đồ tuần.
   - Kiểm thử API Backend & Phân quyền bảo mật (403 Forbidden giữa các người dùng).
   - Kiểm thử tính toàn vẹn của Database và các migration.
2. **Giai đoạn Thiết bị Thật (Android & iPhone):**
   - Cài đặt Development Build (`npx expo run:android` / `npx expo run:ios`).
   - Kiểm tra cấp quyền `ACTIVITY_RECOGNITION` (Android) và `NSMotionUsageDescription` (iOS).
   - Test thực tế: Đi bộ 100 bước thật $\rightarrow$ Đo đạc độ nhạy của cảm biến $\rightarrow$ So sánh delta $\rightarrow$ Kiểm tra chuyển background và mở lại ứng dụng.

---

### KẾT LUẬN & ĐỀ XUẤT TIẾP TỤC
Kiểm toán kiến trúc xác nhận dự án đã có nền tảng vững chắc. Chúng tôi sẽ tiến hành ngay các bước triển khai:
1. Cài đặt thư viện cảm biến `expo-sensors`.
2. Tạo Prisma Migration bổ sung `ActivityDailySummary` và `ActivitySession`.
3. Triển khai Service & Controller Backend cho Daily & Session Tracking.
4. Xây dựng bộ lõi `ActivitySensorAdapter`, `ActivityTrackingService`, `WorkoutSessionService` trên Mobile.
5. Cập nhật và hoàn thiện giao diện Stitch cho Tab Activity và Workout.

