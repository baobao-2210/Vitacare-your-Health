# BÁO CÁO NGHIỆM THU HOÀN THIỆN
# MODULE 3: HYBRID ACTIVITY TRACKING
## (AUTOMATIC DAILY STEP TRACKING + WORKOUT SESSION)

**Dự án:** VitaCare – Your Health, Your Life  
**Vị trí:** Senior React Native Architect, iOS/Android Native Engineer, NestJS Backend Engineer & QA Lead  
**Ngày báo cáo:** 20/11/2026  
**Tài liệu:** `docs/MODULE_3_ACTIVITY_TRACKING_REPORT.md`  
**Trạng thái phân loại:**  
- ✅ **COMPLETED & TESTED:** Database, Backend APIs, State Management, UI Stitch, Integration Tests (14/14 PASS), Emulator Verification.  
- ⚠️ **IMPLEMENTED BUT NOT VERIFIED (PHYSICAL HARDWARE):** Cảm biến phần cứng thực tế trên điện thoại thật iPhone/Android (cần cài Development Build lên máy vật lý để kích hoạt bước chân thật từ túi quần).  
- ⛔ **NOT IMPLEMENTED (BY DESIGN):** Apple HealthKit, Android Health Connect, Smartwatch Sync (Tuyệt đối không sử dụng theo quy định của Module 3).

---

## 1. TỔNG QUAN KIẾN TRÚC ĐÃ TRIỂN KHAI

Hệ thống Module 3 được thiết kế theo mô hình **Hybrid Activity Tracking Architecture**, phân tách mạch lạc giữa hai chế độ vận động:

```
                          ┌─────────────────────────────────────┐
                          │     VÒNG ĐỜI VẬN ĐỘNG (MODULE 3)    │
                          └──────────────────┬──────────────────┘
                                             │
                    ┌────────────────────────┴────────────────────────┐
                    │                                                 │
     ┌──────────────▼─────────────┐                    ┌──────────────▼─────────────┐
     │   DAILY ACTIVITY ENGINE    │                    │   WORKOUT SESSION ENGINE   │
     │  (Tự động theo dõi cả ngày) │                    │ (Phiên tập luyện độc lập)   │
     └──────────────┬─────────────┘                    └──────────────┬─────────────┘
                    │                                                 │
          ┌─────────┴─────────┐                             ┌─────────┴─────────┐
          │                   │                             │                   │
   [iOS CoreMotion]    [Android Sensor]               [Timer & Pause Calc] [Live Pace/Km]
   (CMPedometer)       (TYPE_STEP_COUNTER)                  │                   │
          │                   │                             └─────────┬─────────┘
          └─────────┬─────────┘                                       │
                    │                                                 │
          [Midnight Split & Reboot]                                   │
          [Idempotent Sync Service]                                   │
                    │                                                 │
                    ▼                                                 ▼
      ┌───────────────────────────┐                     ┌───────────────────────────┐
      │   ActivityDailySummary    │                     │      ActivitySession      │
      │  (POST /activity/sync)    │                     │ (POST /activity/sessions) │
      └───────────────────────────┘                     └───────────────────────────┘
```

---

## 2. NATIVE IMPLEMENTATION (iOS & ANDROID)

### 2.1. iOS Native (Apple CoreMotion - `CMPedometer`)
- **Framework:** `CoreMotion.framework` thông qua `expo-sensors/Pedometer` chuẩn Expo SDK 52.
- **Quyền hạn:** Khai báo `NSMotionUsageDescription` trong `app.json`:
  > *"VitaCare cần quyền truy cập cảm biến chuyển động để tự động đếm số bước chân và theo dõi hoạt động hàng ngày của bạn."*
- **Cơ chế thu thập:**
  - `Pedometer.isAvailableAsync()`: Xác định bộ đồng xử lý chuyển động phần cứng (M-series).
  - `Pedometer.getStepCountAsync(startDate, endDate)`: Truy vấn số bước bị gián đoạn khi ứng dụng chạy ngầm hoặc bị hệ điều hành đóng.
  - `Pedometer.watchStepCount()`: Lắng nghe bước chân trực tiếp khi ứng dụng mở.
- **Reconciliation:** Khi người dùng mở lại app (`AppState = 'active'`), tự động đồng bộ chênh lệch từ đầu ngày.

### 2.2. Android Native (SensorManager - `Sensor.TYPE_STEP_COUNTER`)
- **Cảm biến cấp thấp:** `Sensor.TYPE_STEP_COUNTER` (đếm bước lũy kế phần cứng kể từ boot).
- **Quyền hạn:** Khai báo `android.permission.ACTIVITY_RECOGNITION` và `FOREGROUND_SERVICE` trong `app.json` và `AndroidManifest.xml`.
- **Cơ chế bảo vệ dữ liệu & Xử lý Reboot:**
  - Lưu trữ baseline bước chân trong ngày.
  - Tự động phát hiện điện thoại reboot (khi raw counter nhỏ hơn baseline cũ) $\rightarrow$ Thiết lập baseline mới mà không làm mất số bước đã đếm.
  - Chống số âm và chống cộng trùng lặp bước chân.

---

## 3. DATABASE MIGRATIONS & BACKEND APIS

### 3.1. Database Schema (`apps/backend/prisma/schema.prisma`)
Đã bổ sung 2 bảng mới vào PostgreSQL/Supabase:

1. **`ActivityDailySummary` (`activity_daily_summaries`):**
   - Lưu trữ tổng kết bước chân, quãng đường, thời gian và calo theo ngày.
   - Unique Index: `@@unique([userId, activityDate])` $\rightarrow$ Đảm bảo tính **Idempotent** tuyệt đối khi thiết bị đồng bộ nhiều lần trong ngày.
2. **`ActivitySession` (`activity_sessions`):**
   - Lưu trữ chi tiết phiên tập (`WALKING`, `RUNNING`).
   - Các trường: `status` (`ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`), `startedAt`, `endedAt`, `durationSeconds`, `pausedSeconds`, `steps`, `distanceMeters`, `caloriesKcal`, `averagePace`.
   - Index: `@@index([userId, startedAt(sort: Desc)])`.

### 3.2. Danh mục API Backend (`/api/v1/activity`)

| Endpoint | Method | DTO Body | Chức năng | Phân quyền |
| :--- | :---: | :--- | :--- | :---: |
| `/activity/sync` | `POST` | `SyncDailyActivityDto` | Đồng bộ bước chân từ sensor (Idempotent upsert theo ngày) | User Token |
| `/activity/daily` | `GET` | Query `?date=YYYY-MM-DD` | Lấy chi tiết tổng kết hoạt động theo ngày | User Token |
| `/activity/today` | `GET` | Không | Lấy tổng kết ngày hôm nay theo múi giờ user | User Token |
| `/activity/goals` | `GET` | Không | Lấy mục tiêu bước chân (mặc định 6.000 - 10.000 bước) | User Token |
| `/activity/goals` | `PATCH` | `UpdateActivityGoalDto` | Cập nhật mục tiêu số bước chân và thời lượng | User Token |
| `/activity/history` | `GET` | Query `startDate`, `endDate` | Lấy lịch sử theo tuần/tháng kèm các phiên tập gần nhất | User Token |
| `/activity/sessions` | `POST` | `CreateWorkoutSessionDto` | Bắt đầu bài tập mới (`WALKING`, `RUNNING`) | User Token |
| `/activity/sessions/:id/pause` | `PATCH` | Không | Tạm dừng bài tập | User Owner |
| `/activity/sessions/:id/resume`| `PATCH` | Không | Tiếp tục bài tập | User Owner |
| `/activity/sessions/:id/finish`| `PATCH` | `FinishWorkoutSessionDto` | Kết thúc bài tập, chốt bước chân, quãng đường, calo | User Owner |
| `/activity/sessions` | `GET` | Query `page`, `limit` | Lấy danh sách bài tập đã hoàn thành | User Token |
| `/activity/sessions/:id` | `GET` | `id: UUID` | Xem chi tiết tóm tắt 1 bài tập | User Owner |

---

## 4. MOBILE UI & STATE MANAGEMENT

### 4.1. Màn hình Activity Tab (`apps/mobile/app/(tabs)/activity/index.tsx`)
- Tích hợp hook `useDailyActivity()`:
  - 3 Vòng vận động đồng tâm (Tri-Rings SVG): Calo (cam), Thời gian (xanh lá), Bước chân (xanh dương).
  - Khối hiển thị bước chân thời gian thực (`Pedometer Sensor`): Cập nhật tự động từng bước khi di chuyển.
  - Banner trạng thái thông minh: Tự động nhắc nhở bật quyền Pedometer nếu chưa cấp; tự động hiển thị nút giả lập `+100 bước` khi chạy trên máy ảo.
  - Lưới môn thể thao (`Đi bộ`, `Chạy bộ`): Bấm trực tiếp mở màn hình bài tập độc lập `WorkoutScreen`.

### 4.2. Màn hình Tập Luyện Độc Lập (`apps/mobile/app/activity/workout.tsx`)
- Chế độ tập trung cao độ (Deep Dark Athletic UI `#0f172a`).
- Đồng hồ bấm giờ điện tử lớn: `00:00:00`.
- 4 Thẻ chỉ số trực tiếp: Quãng đường (km), Bước chân phiên tập, Pace trung bình (`'/km`), Calo tiêu hao (kcal).
- Bộ nút điều khiển trạng thái:
  - Khi tập: `Tạm Dừng` (Amber) và `Kết Thúc` (Đỏ).
  - Khi tạm dừng: `Tiếp Tục` (Xanh lá) và `Kết Thúc` (Đỏ).
- Nút `+50 Bước (Test)` tiện ích cho môi trường kiểm thử/máy ảo.

### 4.3. Màn hình Tóm Tắt Thành Tích (`apps/mobile/app/activity/summary.tsx`)
- Biểu tượng cúp vinh danh `🏆` chúc mừng người dùng.
- Thẻ chi tiết thành tích: Thời lượng thực tế (loại trừ thời gian tạm dừng), Quãng đường, Bước chân, Calo tiêu hao, Pace trung bình.
- Chú thích minh bạch: *"Số bước trong bài tập này đã được đồng bộ tự động vào tổng số bước hàng ngày qua cảm biến điện thoại."* (Tuân thủ nguyên tắc không cộng bước 2 lần).

---

## 5. MA TRẬN KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (INTEGRATION TEST MATRIX)

Kịch bản kiểm thử tích hợp 14 ca kiểm thử (`scratch/test_module_3_fetch.js`):

```
=== BẮT ĐẦU KIỂM THỬ TÍCH HỢP MODULE 3: HYBRID ACTIVITY TRACKING ===

[Setup] Tạo User 1 thành công: tester.mod3.u1.1795113148@vitacare.vn (ID: af90d584-c90a-435d-b733-cdf224fdd606)
[Setup] Tạo User 2 thành công: tester.mod3.u2.1795113148@vitacare.vn (ID: 4162433b-a37a-47ec-ba35-4c264fcef383)

[Test 1] Đồng bộ số bước từ Sensor (3500 bước): PASS
[Test 2] Tính Idempotent sync (Cập nhật 4200 bước, giữ nguyên bản ghi duy nhất): PASS
[Test 3] Đọc tổng kết ngày hôm nay (4200 bước, 3.02 km): PASS
[Test 4] Cập nhật mục tiêu bước chân (10,000 bước, 60 phút): PASS
[Test 5] Bắt đầu phiên tập RUNNING: PASS (Session ID: a87fadb7-e93b-49a6-8199-5f0be4ce22a7)
[Test 6] Tạm dừng phiên tập (PAUSED): PASS
[Test 7] Tiếp tục phiên tập (ACTIVE): PASS
[Test 8] Hoàn thành phiên tập (COMPLETED: 1850 bước, 1.57 km, 110.5 kcal): PASS
[Test 9] Lấy danh sách phiên tập (1 phiên): PASS
[Test 10] Xem chi tiết phiên tập: PASS
[Test 11] Lấy lịch sử hoạt động tuần/tháng: PASS
[Test 12] Bảo mật: Chặn User 2 xem bài tập của User 1: PASS (403 Forbidden)
[Test 13] Bảo mật: Chặn User 2 can thiệp bài tập của User 1: PASS (403 Forbidden)
[Test 14] Validation chặn số bước âm (-500): PASS (400 Bad Request)

=== KẾT QUẢ: TOÀN BỘ 14 TEST CASES ĐẠT CHUẨN 100% ===
```

---

## 6. HƯỚNG DẪN BUILD & KIỂM THỬ TRÊN THIẾT BỊ THẬT

### 6.1. Kiểm thử trên Android thật
1. Kết nối điện thoại Android với máy tính qua cáp USB và bật **USB Debugging** (Gỡ lỗi USB).
2. Kiểm tra thiết bị nhận qua adb:
   ```powershell
   adb devices
   ```
3. Chạy lệnh cài đặt Development Build trực tiếp:
   ```powershell
   cd apps/mobile
   npx expo run:android
   ```
4. Mở ứng dụng, cấp quyền **Hoạt động thể chất (ACTIVITY_RECOGNITION)** khi có thông báo.
5. Bỏ điện thoại vào túi quần và đi bộ 50 - 100 bước thật $\rightarrow$ Quan sát số bước trên màn hình Hoạt động tự động nhảy tăng theo từng nhịp chân.

### 6.2. Kiểm thử trên iPhone thật
1. Kết nối iPhone với máy Mac có cài Xcode.
2. Mở dự án trong `apps/mobile`:
   ```bash
   npx expo run:ios --device
   ```
3. Cấp quyền **Motion & Fitness** khi hệ thống hiển thị popup.
4. Bắt đầu bài tập Đi bộ / Chạy bộ và di chuyển thực tế ngoài trời.

---

## 7. KẾT LUẬN & BÀN GIAO

- Module 3: Hybrid Activity Tracking đã hoàn tất 100% cấu trúc kỹ thuật từ Native Sensor Adapter, Backend APIs, Database Migrations, UI Stitch, Timer vòng đời bài tập và Phân quyền bảo mật đa người dùng.
- Mã nguồn sạch sẽ, không có lỗi TypeScript (`tsc --noEmit` pass 100% ở cả Mobile và Backend).
- Đã sẵn sàng để chuyển giao và tiếp tục các giai đoạn tiếp theo của dự án VitaCare.

