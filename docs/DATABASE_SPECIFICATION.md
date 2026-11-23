# VITACARE – DATABASE SPECIFICATION

**Version:** 1.1  
**Ngày cập nhật:** 17/11/2026  
**Database Engine:** PostgreSQL 16+  
**ORM:** Prisma ORM  
**Primary Key Standard:** UUID v4  
**Timestamp Standard:** UTC (TIMESTAMPTZ)  
**Tài liệu tham chiếu:** `docs/SRS.md`, `docs/BUSINESS_RULES.md`, `docs/ERD.md`, `docs/DATABASE_REVIEW.md`  

---

# 1. QUY ƯỚC DATABASE

## 1.1. Quy tắc đặt tên
- **Tên bảng:** Viết thường, phân cách bằng dấu gạch dưới (`snake_case`), danh từ số nhiều (ví dụ: `users`, `water_logs`, `health_records`, `refresh_tokens`).
- **Tên cột:** `snake_case` (ví dụ: `user_id`, `password_hash`, `storage_path`, `consumed_at`).
- **Primary Key:** Luôn đặt tên là `id` (kiểu `UUID`).
- **Foreign Key:** `<tên_bảng_số_ít>_id` (ví dụ: `user_id`, `medication_id`, `schedule_id`, `meal_log_id`, `health_record_id`).
- **Cột Boolean:** Sử dụng tiền tố `is_`, `has_` hoặc tính từ xác định trạng thái (ví dụ: `is_active`, `is_enabled`, `enabled`).
- **Cột thời gian:**
  - `created_at`: Thời điểm bản ghi được tạo trong hệ thống (`TIMESTAMPTZ`, mặc định `NOW()`).
  - `updated_at`: Thời điểm bản ghi được cập nhật lần cuối (`TIMESTAMPTZ`, tự động cập nhật).
  - `deleted_at`: Thời điểm soft-delete (`TIMESTAMPTZ`, cho phép `NULL`).
  - Mốc thời gian nghiệp vụ: Sử dụng phân từ hoặc mô tả rõ ràng (ví dụ: `consumed_at`, `recorded_at`, `scheduled_at`, `taken_at`, `sleep_start`, `sleep_end`).
- **Cột ghi chú:** Thống nhất đặt tên là `note` (số ít, kiểu `TEXT NULL`) trên toàn bộ các bảng.

## 1.2. Bảng kiểu dữ liệu chuẩn PostgreSQL

| Kiểu dữ liệu | Mục đích sử dụng | Ví dụ áp dụng |
|---|---|---|
| `UUID` | Khóa chính (`PK`), Khóa ngoại (`FK`) | `id`, `user_id`, `medication_id` |
| `VARCHAR(n)` | Chuỗi ký tự có giới hạn độ dài cố định | `email (255)`, `full_name (150)`, `timezone (100)` |
| `TEXT` | Nội dung văn bản độ dài tự do | `note`, `password_hash` |
| `INTEGER` | Số nguyên 4 bytes (-2.1 tỷ đến +2.1 tỷ) | `amount_ml`, `steps`, `duration_minutes` |
| `BIGINT` | Số nguyên 8 bytes cho dung lượng tệp | `file_size` (tính theo byte) |
| `BOOLEAN` | Đúng / Sai (`TRUE` / `FALSE`) | `is_active`, `is_enabled` |
| `NUMERIC(p,s)` | Số thập phân chính xác tuyệt đối, tránh sai số float | `height_cm (5,2)`, `weight_kg (5,2)`, `quantity_g (10,2)` |
| `DATE` | Mốc ngày tháng năm (không chứa giờ) | `date_of_birth`, `start_date`, `end_date` |
| `TIME` | Mốc giờ phút giây (không chứa ngày) | `reminder_time` |
| `TIMESTAMPTZ` | Thời điểm chính xác gắn với múi giờ chuẩn UTC | `created_at`, `consumed_at`, `sleep_start` |
| `TEXT[]` / `INTEGER[]` | Mảng dữ liệu PostgreSQL | `reminder_times (TEXT[])`, `weekdays (INTEGER[])` |

## 1.3. Quy tắc múi giờ (Timezone Standard)
- **Lưu trữ chuẩn UTC (BR-SYS-01):** Toàn bộ các trường `TIMESTAMPTZ` trong PostgreSQL đều lưu trữ thống nhất theo giờ chuẩn quốc tế UTC.
- **Múi giờ người dùng (BR-SYS-02, BR-SYS-03):** Cột `users.timezone` lưu định danh múi giờ chuẩn IANA (ví dụ: `Asia/Ho_Chi_Minh`, `America/New_York`), với giá trị mặc định là `'Asia/Ho_Chi_Minh'`.
- **Truy vấn thống kê theo ngày (Dashboard/Reports):** Backend sử dụng `timezone` của người dùng để xác định thời điểm bắt đầu ngày (`00:00:00`) và kết thúc ngày (`23:59:59.999`) tương ứng theo giờ địa phương, chuyển đổi sang UTC trước khi thực hiện truy vấn `WHERE consumed_at >= start_utc AND consumed_at <= end_utc`.

---

# 2. CHI TIẾT CẤU TRÚC 16 BẢNG DỮ LIỆU

---

## 2.1. USERS
- **Mục đích:** Lưu trữ tài khoản người dùng, thông tin xác thực cơ bản, múi giờ và trạng thái tài khoản.
- **Quy tắc liên quan:** `BR-AUTH-01`, `BR-AUTH-02`, `BR-AUTH-04`, `BR-AUTH-05`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh tài khoản duy nhất |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Không | Địa chỉ email đăng nhập (chuẩn hóa chữ thường) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Không | Mật khẩu đã băm bằng thuật toán Argon2id |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | Không | Họ và tên người dùng hiển thị trên app |
| `timezone` | `VARCHAR(100)` | `NOT NULL` | `'Asia/Ho_Chi_Minh'` | Múi giờ IANA của người dùng (khắc phục ISS-06) |
| `is_active` | `BOOLEAN` | `NOT NULL` | `TRUE` | Trạng thái tài khoản khả dụng |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo tài khoản |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật thông tin gần nhất |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | `NULL` | Mốc thời gian soft-delete (khắc phục ISS-10) |

- **Indexes:**
  - `UNIQUE INDEX users_email_unique ON users (email);`
  - `INDEX users_is_active_idx ON users (is_active);`
  - `INDEX users_deleted_at_idx ON users (deleted_at) WHERE deleted_at IS NOT NULL;`

---

## 2.2. REFRESH_TOKENS (Mới bổ sung theo Version 1.1)
- **Mục đích:** Quản lý phiên xác thực JWT, hỗ trợ xoay vòng token (Token Rotation), thu hồi phiên khi đăng xuất hoặc đổi mật khẩu.
- **Quy tắc liên quan:** SRS 2.1, 4.2, `FR-AUTH-02`, `FR-AUTH-03`, `BR-AUTH-02`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh bản ghi phiên làm việc |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `token_hash` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Không | Hash SHA-256 của refresh token (khắc phục ISS-01) |
| `device_info` | `VARCHAR(255)` | `NULL` | `NULL` | Thông tin thiết bị (e.g., iPhone 15, Android 14) |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Không | Thời điểm hết hạn của Refresh Token |
| `revoked_at` | `TIMESTAMPTZ` | `NULL` | `NULL` | Thời điểm token bị thu hồi khi đăng xuất/rotate |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cấp phát phiên |

- **Indexes:**
  - `UNIQUE INDEX refresh_tokens_token_hash_unique ON refresh_tokens (token_hash);`
  - `INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);`
  - `INDEX refresh_tokens_expires_at_idx ON refresh_tokens (expires_at);`

---

## 2.3. HEALTH_PROFILES
- **Mục đích:** Lưu trữ hồ sơ thể chất cá nhân của người dùng.
- **Quy tắc liên quan:** `FR-PROFILE-01`, `FR-PROFILE-02`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh hồ sơ cá nhân |
| `user_id` | `UUID` | `UNIQUE, NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `date_of_birth` | `DATE` | `NULL` | `NULL` | Ngày tháng năm sinh |
| `height_cm` | `NUMERIC(5,2)` | `NULL` | `NULL` | Chiều cao (cm), ví dụ: 172.50 |
| `weight_kg` | `NUMERIC(5,2)` | `NULL` | `NULL` | Cân nặng (kg), ví dụ: 68.20 |
| `gender` | `VARCHAR(30)` | `NULL` | `NULL` | Giới tính tự khai báo (`MALE`, `FEMALE`, `OTHER`) |
| `avatar_url` | `VARCHAR(500)` | `NULL` | `NULL` | Đường dẫn ảnh đại diện (khắc phục ISS-11) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo hồ sơ |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật hồ sơ |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `height_cm IS NULL OR height_cm > 0`
  - `weight_kg IS NULL OR weight_kg > 0`
- **Indexes:**
  - `UNIQUE INDEX health_profiles_user_id_unique ON health_profiles (user_id);`

---

## 2.4. HEALTH_GOALS
- **Mục đích:** Quản lý các mục tiêu sức khỏe của người dùng theo thời gian.
- **Quy tắc liên quan:** `FR-PROFILE-03`, `BR-DASH-04`, `BR-DASH-05`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh mục tiêu |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `goal_type` | `VARCHAR(50)` | `NOT NULL` | Không | `WATER`, `SLEEP`, `STEPS`, `ACTIVITY_DURATION`, `CALORIES` |
| `target_value` | `NUMERIC(10,2)`| `NOT NULL` | Không | Giá trị mục tiêu (ví dụ: 2000 ml, 8 giờ, 10000 bước) |
| `unit` | `VARCHAR(30)` | `NOT NULL` | Không | Đơn vị: `ml`, `hours`, `steps`, `minutes`, `kcal` |
| `start_date` | `DATE` | `NOT NULL` | `CURRENT_DATE` | Ngày bắt đầu áp dụng |
| `end_date` | `DATE` | `NULL` | `NULL` | Ngày kết thúc áp dụng (NULL = đang áp dụng) |
| `is_active` | `BOOLEAN` | `NOT NULL` | `TRUE` | Cờ trạng thái active mục tiêu (khắc phục ISS-05) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo bản ghi |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật mục tiêu |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `target_value > 0`
  - `end_date IS NULL OR end_date >= start_date`
- **Indexes:**
  - `INDEX health_goals_user_goal_start_idx ON health_goals (user_id, goal_type, start_date DESC);`
  - `CREATE UNIQUE INDEX health_goals_user_type_active_uniq ON health_goals (user_id, goal_type) WHERE is_active = TRUE;` (Đảm bảo mỗi user chỉ có duy nhất 1 mục tiêu active cho mỗi loại).

---

## 2.5. WATER_LOGS
- **Mục đích:** Lưu trữ lịch sử các lần uống nước.
- **Quy tắc liên quan:** `FR-WATER-01`, `FR-WATER-02`, `FR-WATER-03`, `BR-WATER-01`, `BR-WATER-02`, `BR-WATER-03`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh bản ghi uống nước |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `amount_ml` | `INTEGER` | `NOT NULL` | Không | Lượng nước uống (ml) |
| `consumed_at` | `TIMESTAMPTZ` | `NOT NULL` | Không | Thời điểm thực tế người dùng uống nước |
| `note` | `TEXT` | `NULL` | `NULL` | Ghi chú thêm (khắc phục ISS-09) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm ghi nhận trên máy chủ |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật bản ghi |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `amount_ml > 0`
- **Indexes:**
  - `INDEX water_logs_user_consumed_idx ON water_logs (user_id, consumed_at DESC);`

---

## 2.6. SLEEP_LOGS
- **Mục đích:** Lưu trữ bản ghi thời gian và chất lượng giấc ngủ.
- **Quy tắc liên quan:** `FR-SLEEP-01`, `FR-SLEEP-02`, `BR-SLEEP-01`, `BR-SLEEP-02`, `BR-SLEEP-03`, `BR-SLEEP-05`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh bản ghi giấc ngủ |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `sleep_start` | `TIMESTAMPTZ` | `NOT NULL` | Không | Thời điểm bắt đầu ngủ (có thể qua nửa đêm) |
| `sleep_end` | `TIMESTAMPTZ` | `NOT NULL` | Không | Thời điểm thức dậy |
| `duration_minutes`| `INTEGER` | `NOT NULL` | Không | Thời lượng ngủ (phút), tính bởi Backend |
| `quality` | `VARCHAR(30)` | `NULL` | `NULL` | `VERY_POOR`, `POOR`, `NORMAL`, `GOOD`, `EXCELLENT` |
| `note` | `TEXT` | `NULL` | `NULL` | Ghi chú giấc ngủ |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo bản ghi |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật bản ghi |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `sleep_end > sleep_start`
  - `duration_minutes > 0`
- **Indexes:**
  - `INDEX sleep_logs_user_start_idx ON sleep_logs (user_id, sleep_start DESC);`

---

## 2.7. ACTIVITY_LOGS
- **Mục đích:** Lưu trữ nhật ký hoạt động thể chất và bước chân.
- **Quy tắc liên quan:** `FR-ACTIVITY-01`, `FR-ACTIVITY-02`, `BR-ACT-01`, `BR-ACT-02`, `BR-ACT-03`, `BR-ACT-04`, `BR-ACT-05`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh hoạt động |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `activity_type` | `VARCHAR(50)` | `NOT NULL` | Không | `WALKING`, `RUNNING`, `CYCLING`, `GYM`, `OTHER` |
| `steps` | `INTEGER` | `NULL` | `NULL` | Số bước chân ghi nhận được |
| `duration_minutes`| `INTEGER` | `NULL` | `NULL` | Thời gian vận động (phút) |
| `source` | `VARCHAR(30)` | `NOT NULL` | `'MANUAL'` | Nguồn: `MANUAL`, `HEALTHKIT`, `HEALTH_CONNECT` |
| `external_id` | `VARCHAR(255)` | `NULL` | `NULL` | ID định danh từ HealthKit / Health Connect |
| `recorded_at` | `TIMESTAMPTZ` | `NOT NULL` | Không | Thời điểm diễn ra hoạt động |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm lưu bản ghi |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `steps IS NULL OR steps >= 0`
  - `duration_minutes IS NULL OR duration_minutes > 0`
- **Indexes:**
  - `INDEX activity_logs_user_recorded_idx ON activity_logs (user_id, recorded_at DESC);`
  - `CREATE UNIQUE INDEX activity_logs_user_source_ext_uniq ON activity_logs (user_id, source, external_id) WHERE external_id IS NOT NULL;` (Chống trùng lặp dữ liệu đồng bộ - khắc phục ISS-02).

---

## 2.8. MEDICATIONS
- **Mục đích:** Quản lý danh sách các loại thuốc của người dùng.
- **Quy tắc liên quan:** `FR-MED-01`, `BR-MED-01`, `BR-MED-08`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh thuốc |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `name` | `VARCHAR(255)` | `NOT NULL` | Không | Tên thuốc |
| `dosage_label` | `VARCHAR(255)` | `NULL` | `NULL` | Liều dùng (ví dụ: "1 viên sau ăn") |
| `note` | `TEXT` | `NULL` | `NULL` | Hướng dẫn hoặc ghi chú (khắc phục ISS-09) |
| `is_active` | `BOOLEAN` | `NOT NULL` | `TRUE` | Cờ trạng thái: Đang uống / Đã ngưng |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm thêm thuốc |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật thuốc |

- **Indexes:**
  - `INDEX medications_user_is_active_idx ON medications (user_id, is_active);`

---

## 2.9. MEDICATION_SCHEDULES
- **Mục đích:** Thiết lập cấu hình lịch nhắc uống thuốc cho từng loại thuốc.
- **Quy tắc liên quan:** `FR-MED-02`, `BR-MED-03`, `BR-MED-04`, `BR-MED-08`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh lịch nhắc |
| `medication_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `medications.id` (**`ON DELETE RESTRICT`**) |
| `frequency` | `VARCHAR(30)` | `NOT NULL` | Không | `DAILY`, `WEEKLY`, `INTERVAL`, `CUSTOM` |
| `reminder_time` | `TIME` | `NOT NULL` | Không | Giờ nhắc trong ngày (ví dụ: `08:00:00`) |
| `weekdays` | `INTEGER[]` | `NULL` | `NULL` | Ngày trong tuần (1 = Thứ 2, 7 = Chủ nhật) |
| `interval_days` | `INTEGER` | `NULL` | `NULL` | Khoảng cách số ngày nếu tần suất là `INTERVAL` |
| `start_date` | `DATE` | `NOT NULL` | `CURRENT_DATE` | Ngày bắt đầu uống thuốc |
| `end_date` | `DATE` | `NULL` | `NULL` | Ngày kết thúc uống thuốc |
| `is_enabled` | `BOOLEAN` | `NOT NULL` | `TRUE` | Bật/tắt lịch nhắc này |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo lịch |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật lịch |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `end_date IS NULL OR end_date >= start_date`
  - `interval_days IS NULL OR interval_days > 0`
- **Indexes:**
  - `INDEX medication_schedules_med_enabled_idx ON medication_schedules (medication_id, is_enabled);` (khắc phục ISS-03).

---

## 2.10. MEDICATION_LOGS
- **Mục đích:** Ghi nhận lịch sử tuân thủ uống thuốc theo lịch nhắc.
- **Quy tắc liên quan:** `FR-MED-03`, `FR-MED-04`, `BR-MED-05`, `BR-MED-06`, `BR-MED-07`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh bản ghi uống thuốc |
| `schedule_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `medication_schedules.id` (**`ON DELETE RESTRICT`**) |
| `scheduled_at` | `TIMESTAMPTZ` | `NOT NULL` | Không | Thời điểm dự kiến uống theo lịch |
| `taken_at` | `TIMESTAMPTZ` | `NULL` | `NULL` | Thời điểm người dùng bấm xác nhận đã uống |
| `status` | `VARCHAR(20)` | `NOT NULL` | `'PENDING'` | Trạng thái: `PENDING`, `TAKEN`, `SKIPPED` |
| `note` | `TEXT` | `NULL` | `NULL` | Ghi chú lý do bỏ qua hoặc triệu chứng |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo bản ghi |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật trạng thái |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `status IN ('PENDING', 'TAKEN', 'SKIPPED')`
  - `(status = 'TAKEN' AND taken_at IS NOT NULL) OR (status != 'TAKEN')`
- **Indexes:**
  - `UNIQUE INDEX medication_logs_schedule_scheduled_uniq ON medication_logs (schedule_id, scheduled_at);`
  - `INDEX medication_logs_schedule_id_idx ON medication_logs (schedule_id);` (khắc phục ISS-03).

---

## 2.11. FOOD_ITEMS
- **Mục đích:** Danh mục thực phẩm tham chiếu dinh dưỡng (hệ thống & người dùng tạo).
- **Quy tắc liên quan:** `FR-NUT-02`, `BR-NUT-06`, `BR-NUT-07`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh món ăn/nguyên liệu |
| `created_by` | `UUID` | `NULL, FK` | `NULL` | Tham chiếu `users.id` (`NULL` = thực phẩm chuẩn hệ thống) |
| `name` | `VARCHAR(255)` | `NOT NULL` | Không | Tên món ăn / thực phẩm |
| `calories_per_100g`| `NUMERIC(10,2)`| `NULL` | `NULL` | Năng lượng (kcal trên 100g) |
| `protein_per_100g` | `NUMERIC(10,2)`| `NULL` | `NULL` | Chất đạm (g trên 100g) |
| `carbs_per_100g` | `NUMERIC(10,2)`| `NULL` | `NULL` | Carbohydrate (g trên 100g) |
| `fat_per_100g` | `NUMERIC(10,2)`| `NULL` | `NULL` | Chất béo (g trên 100g) |
| `source` | `VARCHAR(100)` | `NULL` | `NULL` | Nguồn viện trợ dữ liệu (e.g. Viện Dinh Dưỡng) |
| `is_active` | `BOOLEAN` | `NOT NULL` | `TRUE` | Cờ khả dụng |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm thêm vào danh mục |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật danh mục |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `calories_per_100g IS NULL OR calories_per_100g >= 0`
  - `protein_per_100g IS NULL OR protein_per_100g >= 0`
  - `carbs_per_100g IS NULL OR carbs_per_100g >= 0`
  - `fat_per_100g IS NULL OR fat_per_100g >= 0`
- **Indexes:**
  - `INDEX food_items_created_by_idx ON food_items (created_by);` (khắc phục ISS-03).
  - `INDEX food_items_name_idx ON food_items (name);`
  - `CREATE INDEX food_items_name_trgm_idx ON food_items USING gin (name gin_trgm_ops);` (Tối ưu tìm kiếm văn bản).

---

## 2.12. MEAL_LOGS
- **Mục đích:** Lưu trữ nhật ký các bữa ăn theo ngày.
- **Quy tắc liên quan:** `FR-NUT-01`, `BR-NUT-01`, `BR-NUT-02`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh nhật ký bữa ăn |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `meal_type` | `VARCHAR(30)` | `NOT NULL` | Không | `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK` |
| `consumed_at` | `TIMESTAMPTZ` | `NOT NULL` | Không | Thời điểm ăn thực tế |
| `note` | `TEXT` | `NULL` | `NULL` | Ghi chú về bữa ăn |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo bản ghi |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật |

- **Indexes:**
  - `INDEX meal_logs_user_consumed_idx ON meal_logs (user_id, consumed_at DESC);`

---

## 2.13. MEAL_ITEMS
- **Mục đích:** Lưu danh sách các món ăn chi tiết trong bữa ăn và bảo toàn snapshot dinh dưỡng lịch sử.
- **Quy tắc liên quan:** `FR-NUT-03`, `FR-NUT-04`, `BR-NUT-03`, `BR-NUT-04`, `BR-NUT-05`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh món ăn trong bữa |
| `meal_log_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `meal_logs.id` (`ON DELETE CASCADE`) |
| `food_item_id` | `UUID` | `NULL, FK` | `NULL` | Tham chiếu `food_items.id` (**`ON DELETE SET NULL`**) |
| `food_name_snapshot` | `VARCHAR(255)`| `NOT NULL` | Không | Tên món ăn tại thời điểm lưu nhật ký |
| `quantity_g` | `NUMERIC(10,2)`| `NOT NULL` | Không | Khẩu phần thực tế ăn (gram) |
| `calories_snapshot`| `NUMERIC(10,2)`| `NULL` | `NULL` | Kcal tính toán cho khẩu phần tương ứng |
| `protein_snapshot` | `NUMERIC(10,2)`| `NULL` | `NULL` | Protein (g) snapshot |
| `carbs_snapshot` | `NUMERIC(10,2)`| `NULL` | `NULL` | Carbohydrate (g) snapshot |
| `fat_snapshot` | `NUMERIC(10,2)`| `NULL` | `NULL` | Chất béo (g) snapshot |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo món |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật khẩu phần (khắc phục ISS-08) |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `quantity_g > 0`
  - `calories_snapshot IS NULL OR calories_snapshot >= 0`
- **Indexes:**
  - `INDEX meal_items_meal_log_id_idx ON meal_items (meal_log_id);` (khắc phục ISS-03).
  - `INDEX meal_items_food_item_id_idx ON meal_items (food_item_id);` (khắc phục ISS-03).

---

## 2.14. HEALTH_RECORDS
- **Mục đích:** Lưu trữ các chỉ số sức khỏe định kỳ (huyết áp, nhịp tim, đường huyết...).
- **Quy tắc liên quan:** `FR-HEALTH-01`, `FR-HEALTH-02`, `BR-HEALTH-01`, `BR-HEALTH-02`, `BR-HEALTH-03`, `BR-HEALTH-07`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh chỉ số sức khỏe |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `record_type` | `VARCHAR(50)` | `NOT NULL` | Không | `WEIGHT`, `HEIGHT`, `BLOOD_PRESSURE`, `HEART_RATE`, `BLOOD_GLUCOSE`, `OTHER` |
| `value` | `NUMERIC(12,2)`| `NOT NULL` | Không | Giá trị đo chính (hoặc huyết áp tâm thu) |
| `secondary_value`| `NUMERIC(12,2)`| `NULL` | `NULL` | Giá trị phụ (huyết áp tâm trương) |
| `unit` | `VARCHAR(30)` | `NOT NULL` | Không | Đơn vị: `kg`, `cm`, `mmHg`, `bpm`, `mg/dL` |
| `source` | `VARCHAR(30)` | `NOT NULL` | `'MANUAL'` | Nguồn: `MANUAL`, `HEALTHKIT`, `HEALTH_CONNECT` |
| `recorded_at` | `TIMESTAMPTZ` | `NOT NULL` | Không | Thời điểm đo đạc |
| `note` | `TEXT` | `NULL` | `NULL` | Ghi chú người dùng (khắc phục ISS-09) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo bản ghi |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật |

- **Ràng buộc kiểm tra (CHECK Constraints):**
  - `value > 0`
  - `record_type != 'BLOOD_PRESSURE' OR (secondary_value IS NOT NULL AND secondary_value > 0)`
- **Indexes:**
  - `INDEX health_records_user_type_rec_idx ON health_records (user_id, record_type, recorded_at DESC);`

---

## 2.15. HEALTH_ATTACHMENTS
- **Mục đích:** Quản lý metadata và đường dẫn bảo mật của tệp đính kèm y tế (kết quả xét nghiệm, đơn thuốc, ảnh X-quang).
- **Quy tắc liên quan:** `FR-HEALTH-03`, `BR-HEALTH-05`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh tệp đính kèm |
| `health_record_id`| `UUID` | `NOT NULL, FK` | Không | Tham chiếu `health_records.id` (`ON DELETE CASCADE`) |
| `storage_path` | `VARCHAR(500)` | `NOT NULL` | Không | Đường dẫn object trên private cloud bucket (khắc phục ISS-04) |
| `file_name` | `VARCHAR(255)` | `NOT NULL` | Không | Tên tệp gốc người dùng tải lên |
| `file_type` | `VARCHAR(100)` | `NOT NULL` | Không | MIME type hợp lệ (`image/jpeg`, `image/png`, `application/pdf`) |
| `file_size` | `BIGINT` | `NULL` | `NULL` | Dung lượng tệp (byte) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tải lên |

- **Quy chuẩn bảo mật:**
  - Không lưu trữ public URL hay fixed signed URL vào database.
  - Cột `storage_path` lưu đường dẫn chuẩn, ví dụ: `records/{userId}/{recordId}/{uuid}-{fileName}`.
  - Backend chịu trách nhiệm kiểm tra quyền sở hữu và sinh presigned URL (thời hạn 15–30 phút) khi Mobile app yêu cầu xem hoặc tải tệp.
- **Indexes:**
  - `INDEX health_attachments_record_id_idx ON health_attachments (health_record_id);` (khắc phục ISS-03).

---

## 2.16. NOTIFICATION_PREFERENCES
- **Mục đích:** Lưu trữ cấu hình bật/tắt và các mốc giờ thông báo, nhắc nhở sinh hoạt.
- **Quy tắc liên quan:** `FR-NOTI-01`, `FR-NOTI-04`, `BR-NOTI-01`, `BR-NOTI-02`, `BR-NOTI-03`, `BR-NOTI-05`.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Định danh cấu hình thông báo |
| `user_id` | `UUID` | `NOT NULL, FK` | Không | Tham chiếu `users.id` (`ON DELETE CASCADE`) |
| `notification_type`| `VARCHAR(50)`| `NOT NULL` | Không | `WATER`, `SLEEP`, `MEDICATION`, `ACTIVITY` |
| `enabled` | `BOOLEAN` | `NOT NULL` | `TRUE` | Trạng thái kích hoạt thông báo |
| `reminder_times` | `TEXT[]` | `NOT NULL` | `'{}'` | Danh sách mốc giờ nhắc dạng `HH:mm` (khắc phục ISS-07) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm tạo cấu hình |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | Thời điểm cập nhật |

- **Quy chuẩn mốc giờ:**
  - Ví dụ thông báo nước uống nhắc nhiều lần trong ngày: `ARRAY['08:00', '10:00', '14:00', '16:00', '18:00', '20:00']`.
  - Mốc giờ được hiểu theo múi giờ `users.timezone` tương ứng của người dùng.
- **Indexes:**
  - `UNIQUE INDEX notification_preferences_user_type_uniq ON notification_preferences (user_id, notification_type);`

---

# 3. QUY TẮC KHÓA NGOẠI VÀ CHÍNH SÁCH XÓA (FOREIGN KEYS & ON DELETE)

| Bảng con | Cột Foreign Key | Bảng cha tham chiếu | Hành vi ON DELETE | Lý do kiến trúc & Nghiệp vụ |
|---|---|---|---|---|
| `refresh_tokens` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì dọn dẹp sạch toàn bộ phiên đăng nhập |
| `health_profiles` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì xóa hồ sơ cá nhân |
| `health_goals` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì xóa danh sách mục tiêu |
| `water_logs` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì xóa toàn bộ dữ liệu nước uống |
| `sleep_logs` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì xóa dữ liệu giấc ngủ |
| `activity_logs` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì xóa dữ liệu vận động |
| `medications` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì xóa danh sách thuốc |
| `medication_schedules`| `medication_id`| `medications(id)`| **`RESTRICT`** | Ngăn xóa cứng thuốc khi đã có lịch; buộc dùng cờ `is_active` |
| `medication_logs` | `schedule_id` | `medication_schedules(id)`| **`RESTRICT`** | Bảo toàn tuyệt đối lịch sử uống thuốc (`BR-MED-08`) |
| `food_items` | `created_by` | `users(id)` | **`SET NULL`** | User bị xóa thì món ăn cá nhân chuyển về hệ thống vô danh |
| `meal_logs` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì xóa nhật ký bữa ăn |
| `meal_items` | `meal_log_id` | `meal_logs(id)` | **`CASCADE`** | Xóa bữa ăn thì tự động xóa các món thuộc bữa đó |
| `meal_items` | `food_item_id` | `food_items(id)` | **`SET NULL`** | Món gốc bị xóa thì snapshot dinh dưỡng vẫn còn nguyên (`BR-NUT-05`) |
| `health_records` | `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì xóa hồ sơ bệnh án |
| `health_attachments`| `health_record_id`| `health_records(id)`| **`CASCADE`** | Xóa hồ sơ thì xóa metadata tệp và dọn dẹp cloud object |
| `notification_preferences`| `user_id` | `users(id)` | **`CASCADE`** | Xóa user thì dọn dẹp cài đặt thông báo |

---

# 4. DANH MỤC INDEX VÀ TỐI ƯU HIỆU NĂNG

Toàn bộ các khóa ngoại và trường truy vấn thường xuyên đều được lập chỉ mục:

```sql
-- 1. USERS & SESSIONS
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users (is_active);
CREATE INDEX IF NOT EXISTS users_deleted_at_idx ON users (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_hash_unique ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens (expires_at);

-- 2. PROFILES & GOALS
CREATE UNIQUE INDEX IF NOT EXISTS health_profiles_user_id_unique ON health_profiles (user_id);
CREATE INDEX IF NOT EXISTS health_goals_user_goal_start_idx ON health_goals (user_id, goal_type, start_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS health_goals_user_type_active_uniq ON health_goals (user_id, goal_type) WHERE is_active = TRUE;

-- 3. LOGS (DASHBOARD QUERIES)
CREATE INDEX IF NOT EXISTS water_logs_user_consumed_idx ON water_logs (user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS sleep_logs_user_start_idx ON sleep_logs (user_id, sleep_start DESC);
CREATE INDEX IF NOT EXISTS activity_logs_user_recorded_idx ON activity_logs (user_id, recorded_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS activity_logs_user_source_ext_uniq ON activity_logs (user_id, source, external_id) WHERE external_id IS NOT NULL;

-- 4. MEDICATIONS
CREATE INDEX IF NOT EXISTS medications_user_is_active_idx ON medications (user_id, is_active);
CREATE INDEX IF NOT EXISTS medication_schedules_med_enabled_idx ON medication_schedules (medication_id, is_enabled);
CREATE UNIQUE INDEX IF NOT EXISTS medication_logs_schedule_scheduled_uniq ON medication_logs (schedule_id, scheduled_at);
CREATE INDEX IF NOT EXISTS medication_logs_schedule_id_idx ON medication_logs (schedule_id);

-- 5. NUTRITION
CREATE INDEX IF NOT EXISTS food_items_created_by_idx ON food_items (created_by);
CREATE INDEX IF NOT EXISTS food_items_name_idx ON food_items (name);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS food_items_name_trgm_idx ON food_items USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS meal_logs_user_consumed_idx ON meal_logs (user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS meal_items_meal_log_id_idx ON meal_items (meal_log_id);
CREATE INDEX IF NOT EXISTS meal_items_food_item_id_idx ON meal_items (food_item_id);

-- 6. HEALTH RECORDS & ATTACHMENTS
CREATE INDEX IF NOT EXISTS health_records_user_type_rec_idx ON health_records (user_id, record_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS health_attachments_record_id_idx ON health_attachments (health_record_id);

-- 7. NOTIFICATIONS
CREATE UNIQUE INDEX IF NOT EXISTS notification_preferences_user_type_uniq ON notification_preferences (user_id, notification_type);
```

---

# 5. NGUYÊN TẮC BẢO MẬT DỮ LIỆU (SECURITY STANDARDS)

1. **Kiểm tra quyền sở hữu tuyệt đối (Multi-tenant Data Isolation):**
   - Không tin tưởng bất kỳ `user_id` nào được truyền từ phía client (qua Body hay Query Params).
   - Backend trích xuất danh tính người dùng (`userId`) trực tiếp từ JWT Access Token đã xác thực thành công.
   - Đối với các bảng con không chứa trực tiếp `user_id` (`medication_schedules`, `medication_logs`, `meal_items`, `health_attachments`), Backend bắt buộc phải JOIN với bảng cha để xác thực quyền sở hữu trước khi thực hiện thao tác Đọc, Ghi hoặc Xóa (phòng chống lỗ hổng IDOR).
2. **Bảo vệ mật khẩu:**
   - Mật khẩu người dùng được băm một chiều bằng thuật toán **Argon2id** với tham số an toàn (hoặc bcrypt cost factor >= 12).
   - Tuyệt đối không lưu mật khẩu dạng plain-text (`BR-AUTH-04`).
   - Cột `password_hash` không bao giờ được đưa vào payload của API response.
3. **Bảo vệ Refresh Token:**
   - Database chỉ lưu chuỗi băm `token_hash` của Refresh Token (sử dụng SHA-256).
   - Khi nhận Refresh Token từ client, Backend băm token và so sánh với `token_hash` trong cơ sở dữ liệu. Ngay cả khi rò rỉ database, kẻ tấn công cũng không thể mạo danh phiên làm việc.
4. **Bảo mật tệp hồ sơ y tế:**
   - Cloud Storage bucket được cấu hình hoàn toàn Private.
   - Tệp đính kèm được truy cập thông qua Signed URL có thời hạn ngắn (15–30 phút).
   - Không cho phép người dùng khác truy cập hồ sơ hay tệp đính kèm không thuộc về mình (`BR-HEALTH-05`).
5. **Quy trình xóa tài khoản an toàn (BR-AUTH-05):**
   - Khi nhận yêu cầu xóa tài khoản, hệ thống kích hoạt soft-delete: đặt `users.deleted_at = NOW()` và `users.is_active = FALSE`, thu hồi toàn bộ token trong `refresh_tokens`.
   - Sau thời gian ân hạn (30 ngày), tiến trình background sẽ thực hiện hard-delete dữ liệu trong DB và dọn dẹp các tệp đính kèm liên quan trên Cloud Storage.

---

# 6. LỊCH SỬ THAY ĐỔI (CHANGE LOG)

### Phiên bản 1.1 (17/11/2026)
- **ISS-01 (Critical):** Bổ sung bảng `refresh_tokens` lưu `token_hash`, quản lý JWT rotation, thu hồi phiên khi đăng xuất.
- **ISS-02 (High):** Bổ sung Partial Unique Index `activity_logs (user_id, source, external_id) WHERE external_id IS NOT NULL` để chống duplicate sync.
- **ISS-03 (High):** Bổ sung đầy đủ index cho các Foreign Keys: `meal_items(meal_log_id, food_item_id)`, `medication_schedules(medication_id)`, `health_attachments(health_record_id)`, `food_items(created_by)`.
- **ISS-04 (High):** Chuẩn hóa bảng `health_attachments`, thay trường `file_url` bằng `storage_path VARCHAR(500)` để hỗ trợ Signed URL bảo mật.
- **ISS-05 (High):** Bổ sung trường `is_active` và Partial Unique Index cho `health_goals (user_id, goal_type) WHERE is_active = TRUE`.
- **ISS-06 (High):** Thiết lập giá trị mặc định cho `users.timezone` là `'Asia/Ho_Chi_Minh'` để tránh lỗi insert khi đăng ký.
- **ISS-07 (Medium):** Thay đổi `reminder_time TIME` thành `reminder_times TEXT[]` trong `notification_preferences` hỗ trợ nhiều mốc giờ nhắc nước trong ngày.
- **ISS-08 (Medium):** Bổ sung `updated_at` vào bảng `meal_items`.
- **ISS-09 (Medium):** Chuẩn hóa đồng nhất tên cột ghi chú thành `note TEXT NULL` trên tất cả các bảng.
- **ISS-10 (Medium):** Bổ sung cột `deleted_at` vào bảng `users` phục vụ quy trình xóa tài khoản an toàn.
- **ISS-11 (Low):** Bổ sung trường `avatar_url` vào bảng `health_profiles`.

### Phiên bản 1.0 (Bản đặc tả ban đầu)
- Khởi tạo tài liệu đặc tả 15 bảng ban đầu.
