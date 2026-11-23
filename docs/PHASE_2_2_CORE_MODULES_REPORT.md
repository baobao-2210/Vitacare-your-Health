# BÁO CÁO TRIỂN KHAI PHÂN HỆ NGHIỆP VỤ CỐT LÕI (PHASE 2.2)
# VITACARE – YOUR HEALTH, YOUR LIFE

**Ngày thực hiện:** 17/11/2026  
**Phiên bản:** 1.0 (Phase 2.2 Core Modules)  
**Phân hệ hoàn thành:** Water Tracking, Sleep Tracking, Profile & Health Goals  
**Cơ sở dữ liệu:** PostgreSQL 17 (Supabase Pooler)  
**Trạng thái kiểm thử:** 100% PASS (Đã kiểm thử End-to-End trực tiếp với Supabase)  

---

## 1. CÁC MODULE NGHIỆP VỤ ĐÃ HOÀN THIỆN

### 1.1. Phân hệ Hồ sơ & Mục tiêu sức khỏe (Profile & Health Goals)
- **Đường dẫn mã nguồn:** `apps/backend/src/modules/profile/`
- **Các API đã hoạt động:**
  - `GET /api/v1/profile`: Lấy thông tin cá nhân, hồ sơ thể chất, tự động tính chỉ số BMI, tuổi và dải cân nặng lý tưởng theo chuẩn WHO Châu Á - Thái Bình Dương.
  - `PATCH /api/v1/profile`: Cập nhật chiều cao, cân nặng, ngày sinh, giới tính, avatar, múi giờ và họ tên.
  - `GET /api/v1/profile/goals`: Lấy danh sách mục tiêu sức khỏe đang kích hoạt (`isActive: true`).
  - `POST /api/v1/profile/goals`: Thiết lập hoặc cập nhật mục tiêu sức khỏe (Tự động vô hiệu hóa mục tiêu cũ cùng loại và kích hoạt mục tiêu mới theo mô hình Transaction).
  - `DELETE /api/v1/profile/goals/:id`: Hủy kích hoạt một mục tiêu.

### 1.2. Phân hệ Theo dõi nước uống (Water Tracking)
- **Đường dẫn mã nguồn:** `apps/backend/src/modules/water/`
- **Quy tắc nghiệp vụ tuân thủ:**
  - `BR-WATER-01`: Lượng nước phải lớn hơn 0 ml (`@Min(1)` và kiểm tra `amountMl > 0`).
  - `BR-WATER-02`: Đơn vị lưu trữ chuẩn `ml`.
  - `BR-WATER-03`: Tính tổng lượng nước trong ngày theo múi giờ địa phương của người dùng (`startOfDay` -> `endOfDay`).
  - `BR-WATER-04` & `BR-WATER-05`: Tính phần trăm hoàn thành theo mục tiêu ngày (`totalAmountMl / targetMl * 100%`) và tính phần trăm hiển thị tối đa 100% (`progress`).
  - `BR-WATER-06`: Kiểm tra quyền sở hữu (`userId`) khi cập nhật hoặc xóa bản ghi.
  - `BR-WATER-07`: Khi thay đổi mục tiêu nước, lịch sử uống nước không bị thay đổi.
- **Các API đã hoạt động:**
  - `POST /api/v1/water`: Ghi nhận lượng nước uống.
  - `GET /api/v1/water/today`: Lấy thống kê chi tiết hôm nay (tổng ml, mục tiêu ml, phần trăm, lượng nước còn thiếu, danh sách log).
  - `GET /api/v1/water/history`: Lấy lịch sử theo khoảng thời gian (nhóm theo ngày).
  - `PATCH /api/v1/water/:id`: Chỉnh sửa bản ghi nước uống.
  - `DELETE /api/v1/water/:id`: Xóa bản ghi nước uống.

### 1.3. Phân hệ Theo dõi giấc ngủ (Sleep Tracking)
- **Đường dẫn mã nguồn:** `apps/backend/src/modules/sleep/`
- **Quy tắc nghiệp vụ tuân thủ:**
  - `BR-SLEEP-01`: Thời điểm kết thúc phải sau thời điểm bắt đầu (`sleepEnd > sleepStart`).
  - `BR-SLEEP-02`: Tự động tính toán đúng thời gian ngủ qua nửa đêm.
  - `BR-SLEEP-03`: Tự động tính thời lượng ngủ theo phút (`durationMinutes`) và giờ (`durationHours`).
  - `BR-SLEEP-04`: Ràng buộc bản ghi theo `userId`, người dùng chỉ có quyền sửa/xóa bản ghi của mình.
  - `BR-SLEEP-05`: Từ chối bản ghi có thời lượng bằng 0 hoặc âm; cảnh báo nếu vượt quá 24 giờ.
  - `BR-SLEEP-06`: Đánh giá chất lượng chủ quan theo enum `SleepQuality` (`VERY_POOR`, `POOR`, `NORMAL`, `GOOD`, `EXCELLENT`).
- **Các API đã hoạt động:**
  - `POST /api/v1/sleep`: Ghi nhận giấc ngủ.
  - `GET /api/v1/sleep/latest`: Lấy giấc ngủ gần nhất và so sánh với mục tiêu số giờ ngủ.
  - `GET /api/v1/sleep/history`: Thống kê lịch sử giấc ngủ (tổng số giờ ngủ, trung bình mỗi lần ngủ, chi tiết log).
  - `PATCH /api/v1/sleep/:id`: Chỉnh sửa bản ghi giấc ngủ (tự động tính lại thời lượng).
  - `DELETE /api/v1/sleep/:id`: Xóa bản ghi giấc ngủ.

---

## 2. KẾT QUẢ KIỂM THỬ END-TO-END TÍCH HỢP SUPABASE

Đã chạy kiểm thử tự động toàn diện qua tiến trình HTTP Client với cơ sở dữ liệu Supabase:
- **Tạo tài khoản & xác thực JWT:** Thành công (User ID tạo mới trên Supabase).
- **Cập nhật thể chất & tính BMI:**
  - Chiều cao: `175 cm`, Cân nặng: `68 kg` -> Chỉ số BMI: `22.2` (Phân loại: `NORMAL - Thể trạng tốt`, Dải cân nặng chuẩn: `56.7 kg - 70.1 kg`).
- **Thiết lập mục tiêu sức khỏe:**
  - Mục tiêu nước: `2500 ml`
  - Mục tiêu ngủ: `8 hours`
- **Kiểm tra ràng buộc nghiệp vụ Water:**
  - Gửi lượng nước `-50 ml` -> Hệ thống chặn và trả về **400 Bad Request** (`BR-WATER-01`).
  - Gửi bản ghi hợp lệ 350ml và 500ml -> Hệ thống ghi nhận thành công, tính tổng `850 ml`, tiến độ `34%`.
- **Kiểm tra ràng buộc nghiệp vụ Sleep:**
  - Gửi thời gian thức dậy trước thời gian ngủ -> Hệ thống chặn và trả về **400 Bad Request** (`BR-SLEEP-01`).
  - Gửi giấc ngủ từ 22:30 đến 06:30 -> Hệ thống tự động tính chính xác `480 phút` (`8.0 giờ`), đạt `100%` mục tiêu ngày.

---

## 3. DANH SÁCH 17 ENDPOINTS HOẠT ĐỘNG HIỆN TẠI

| # | Nhóm | Phương thức | Endpoint | Mô tả |
|:---:|---|:---:|---|---|
| 1 | **Auth** | `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới |
| 2 | **Auth** | `POST` | `/api/v1/auth/login` | Đăng nhập hệ thống |
| 3 | **Auth** | `POST` | `/api/v1/auth/refresh` | Làm mới Access Token (Token Rotation) |
| 4 | **Auth** | `POST` | `/api/v1/auth/logout` | Đăng xuất phiên hiện tại |
| 5 | **Auth** | `POST` | `/api/v1/auth/logout-all` | Đăng xuất toàn bộ thiết bị |
| 6 | **Auth** | `GET` | `/api/v1/auth/me` | Lấy thông tin tài khoản hiện tại |
| 7 | **Profile** | `GET` | `/api/v1/profile` | Xem hồ sơ thể chất & phân tích BMI |
| 8 | **Profile** | `PATCH` | `/api/v1/profile` | Cập nhật hồ sơ thể chất |
| 9 | **Profile** | `GET` | `/api/v1/profile/goals` | Lấy danh sách mục tiêu sức khỏe |
| 10 | **Profile** | `POST` | `/api/v1/profile/goals` | Thiết lập / Cập nhật mục tiêu sức khỏe |
| 11 | **Profile** | `DELETE` | `/api/v1/profile/goals/:id` | Hủy kích hoạt mục tiêu |
| 12 | **Water** | `POST` | `/api/v1/water` | Ghi nhận lượng nước uống |
| 13 | **Water** | `GET` | `/api/v1/water/today` | Xem tiến độ nước uống hôm nay |
| 14 | **Water** | `GET` | `/api/v1/water/history` | Xem lịch sử nước uống |
| 15 | **Water** | `PATCH` | `/api/v1/water/:id` | Chỉnh sửa bản ghi nước uống |
| 16 | **Water** | `DELETE` | `/api/v1/water/:id` | Xóa bản ghi nước uống |
| 17 | **Sleep** | `POST` | `/api/v1/sleep` | Ghi nhận giấc ngủ |
| 18 | **Sleep** | `GET` | `/api/v1/sleep/latest` | Xem giấc ngủ gần nhất & tiến độ |
| 19 | **Sleep** | `GET` | `/api/v1/sleep/history` | Xem lịch sử & thống kê giấc ngủ |
| 20 | **Sleep** | `PATCH` | `/api/v1/sleep/:id` | Chỉnh sửa bản ghi giấc ngủ |
| 21 | **Sleep** | `DELETE` | `/api/v1/sleep/:id` | Xóa bản ghi giấc ngủ |

---

## 4. BƯỚC TIẾP THEO (PHASE 2.3)
Triển khai các phân hệ nghiệp vụ tiếp theo:
1. **Activity Tracking Module** (`activity_logs`): Đi bộ, chạy bộ, đạp xe, tính calo tiêu hao, đồng bộ bước chân.
2. **Medication Management Module** (`medications`, `medication_schedules`, `medication_logs`): Quản lý tủ thuốc, lịch nhắc uống thuốc, xác nhận uống thuốc/bỏ qua.
3. **Nutrition Module** (`food_items`, `meal_logs`, `meal_items`): Ghi nhận bữa ăn, tính toán calo và macro (protein, carbs, fat).

