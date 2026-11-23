# BÁO CÁO REVIEW DATABASE VERSION 1.1 – VITACARE

**Dự án:** VitaCare – Your Health, Your Life  
**Phiên bản đánh giá:** 1.1  
**Tài liệu đối chiếu:** `docs/SRS.md`, `docs/BUSINESS_RULES.md`, `docs/ERD.md` (v1.1), `docs/DATABASE_SPECIFICATION.md` (v1.1)  
**Ngày thực hiện:** 17/11/2026  
**Trạng thái:** ĐÃ HOÀN TẤT NÂNG CẤP VÀ XÁC MINH  

---

## 1. TỔNG QUAN

Báo cáo này đánh giá kết quả cập nhật toàn diện tài liệu thiết kế cơ sở dữ liệu VitaCare từ phiên bản **1.0** lên **1.1** dựa trên các phát hiện trong `docs/DATABASE_REVIEW.md`.

Mục tiêu đợt nâng cấp:
1. Xử lý triệt để **11/11 vấn đề** (từ Critical đến Low).
2. Chuẩn hóa tính nhất quán tuyệt đối giữa `docs/ERD.md` và `docs/DATABASE_SPECIFICATION.md`.
3. Đảm bảo tuân thủ nghiêm ngặt các quy tắc nghiệp vụ trong `docs/SRS.md` và `docs/BUSINESS_RULES.md`.

---

## 2. KẾT QUẢ XỬ LÝ 11 VẤN ĐỀ TỪ BÁO CÁO V1.0

| Mã vấn đề | Mức độ | Vấn đề ban đầu | Tình trạng v1.1 | Chi tiết giải pháp đã áp dụng |
|:---:|:---:|---|:---:|---|
| **ISS-01** | **Critical** | Thiếu bảng lưu trữ Refresh Token / User Session | **ĐÃ GIẢI QUYẾT** | Đã bổ sung bảng `refresh_tokens` gồm: `id`, `user_id`, `token_hash` (SHA-256), `device_info`, `expires_at`, `revoked_at`, `created_at`. Khóa ngoại `user_id` tham chiếu `users(id)` với `ON DELETE CASCADE`. Hỗ trợ đầy đủ Token Rotation và thu hồi phiên khi đăng xuất (đáp ứng SRS 2.1, 4.2 và `FR-AUTH-03`). |
| **ISS-02** | **High** | Chống trùng dữ liệu HealthKit/Health Connect mới chỉ dùng index thường | **ĐÃ GIẢI QUYẾT** | Đã quy định Partial Unique Index: `CREATE UNIQUE INDEX activity_logs_user_source_ext_uniq ON activity_logs (user_id, source, external_id) WHERE external_id IS NOT NULL;` ngăn chặn hoàn toàn việc duplicate sự kiện bước chân/vận động (đáp ứng `BR-ACT-05`). |
| **ISS-03** | **High** | Thiếu index trên các Foreign Key con gây chậm truy vấn | **ĐÃ GIẢI QUYẾT** | Đã bổ sung đầy đủ chỉ mục B-tree cho tất cả các khóa ngoại: `meal_items(meal_log_id)`, `meal_items(food_item_id)`, `medication_schedules(medication_id)`, `medication_logs(schedule_id)`, `health_attachments(health_record_id)`, `food_items(created_by)`, `refresh_tokens(user_id)`. |
| **ISS-04** | **High** | Lưu `file_url` tĩnh không tương thích với signed URL y tế | **ĐÃ GIẢI QUYẾT** | Đã thay thế cột `file_url` bằng `storage_path VARCHAR(500) NOT NULL` trỏ tới private cloud storage bucket. Backend chịu trách nhiệm sinh presigned URL ngắn hạn khi client yêu cầu xem tài liệu, bảo vệ an toàn dữ liệu sức khỏe (đáp ứng `BR-HEALTH-05`, SRS 4.2). |
| **ISS-05** | **High** | Bảng `health_goals` thiếu cờ xác định mục tiêu đang hiệu lực | **ĐÃ GIẢI QUYẾT** | Đã thêm cột `is_active BOOLEAN NOT NULL DEFAULT TRUE` và thiết lập Partial Unique Index `(user_id, goal_type) WHERE is_active = TRUE`, đảm bảo mỗi loại chỉ có tối đa 1 mục tiêu active tại một thời điểm cho Dashboard (đáp ứng `BR-DASH-04`). |
| **ISS-06** | **High** | `users.timezone` là NOT NULL nhưng thiếu DEFAULT gây lỗi đăng ký | **ĐÃ GIẢI QUYẾT** | Đã thiết lập `DEFAULT 'Asia/Ho_Chi_Minh'` cho cột `timezone`, đảm bảo luồng đăng ký tài khoản (FR-AUTH-01) hoạt động trơn tru ngay cả khi client không gửi kèm timezone. |
| **ISS-07** | **Medium** | `notification_preferences` chỉ có 1 giờ nhắc, không hỗ trợ nhắc nước theo chu kỳ | **ĐÃ GIẢI QUYẾT** | Đã chuyển đổi cột `reminder_time TIME` thành `reminder_times TEXT[] NOT NULL DEFAULT '{}'`, cho phép lưu trữ mảng các mốc giờ trong ngày (ví dụ: `['08:00', '10:00', '14:00', '16:00', '18:00', '20:00']`) (đáp ứng `FR-WATER-05`). |
| **ISS-08** | **Medium** | Bảng `meal_items` thiếu trường `updated_at` | **ĐÃ GIẢI QUYẾT** | Đã bổ sung `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` vào bảng `meal_items` để ghi vết khi người dùng chỉnh sửa khẩu phần gram của món ăn. |
| **ISS-09** | **Medium** | Tên cột ghi chú không đồng nhất giữa `note` và `notes` | **ĐÃ GIẢI QUYẾT** | Đã chuẩn hóa toàn bộ thành `note TEXT NULL` trên tất cả các bảng: `medications`, `health_records`, `water_logs`, `sleep_logs`, `meal_logs`, `medication_logs`. |
| **ISS-10** | **Medium** | Bảng `users` thiếu trường hỗ trợ soft-delete | **ĐÃ GIẢI QUYẾT** | Đã bổ sung `deleted_at TIMESTAMPTZ NULL` vào bảng `users` cùng chỉ mục lọc `WHERE deleted_at IS NOT NULL` phục vụ quy trình xóa tài khoản an toàn và thời gian ân hạn 30 ngày (đáp ứng `BR-AUTH-05`, `FR-AUTH-04`). |
| **ISS-11** | **Low** | Bảng `health_profiles` thiếu trường `avatar_url` | **ĐÃ GIẢI QUYẾT** | Đã bổ sung trường `avatar_url VARCHAR(500) NULL` vào `health_profiles` hỗ trợ hiển thị ảnh đại diện người dùng trên giao diện Profile và Dashboard. |

---

## 3. KIỂM TRA TÍNH NHẤT QUÁN GIỮA ERD VÀ DATABASE SPECIFICATION (V1.1)

Hai tài liệu `docs/ERD.md` và `docs/DATABASE_SPECIFICATION.md` đã được đối chiếu chéo từng bảng và từng cột:

1. **Số lượng bảng:** Cả hai tài liệu đều thống nhất **16 bảng**.
2. **Khóa chính & Khóa ngoại:**
   - 100% sử dụng `UUID` cho PK (`id`) và FK.
   - Toàn bộ tên FK đều thống nhất theo chuẩn `<table_singular>_id`.
3. **Quy tắc ON DELETE:**
   - Quan hệ phụ thuộc trực tiếp (`users` -> logs, profiles, goals, attachments): Sử dụng `CASCADE`.
   - Quan hệ bảo toàn lịch sử y tế (`medications` -> `schedules` -> `logs`): Sử dụng **`RESTRICT`** (đáp ứng `BR-MED-08`).
   - Quan hệ danh mục thực phẩm (`food_items` -> `meal_items`): Sử dụng **`SET NULL`** (đáp ứng `BR-NUT-05`).
4. **Kiểu dữ liệu:**
   - Toàn bộ mốc thời gian lưu trữ đều là `TIMESTAMPTZ` (UTC).
   - Số thập phân đo lường đều là `NUMERIC(p,s)` chính xác, không dùng float.
   - Giờ nhắc thông báo linh hoạt dùng mảng `TEXT[]`.

---

## 4. ĐỐI CHIẾU VỚI SRS VÀ BUSINESS RULES

| Quy tắc nghiệp vụ | Yêu cầu nghiệp vụ | Đánh giá đáp ứng của Database v1.1 |
|---|---|---|
| **BR-AUTH-01..05** | Đăng ký email duy nhất, bảo mật mật khẩu, phân quyền sở hữu, soft-delete | **ĐẠT.** Bảng `users` có unique email, `password_hash`, `deleted_at`, `refresh_tokens` tách biệt. |
| **BR-WATER-01..07** | Lượng nước > 0, lưu ml, tính toán ngày theo timezone, bảo toàn lịch sử | **ĐẠT.** `amount_ml INTEGER CHECK > 0`, `consumed_at TIMESTAMPTZ`, index `(user_id, consumed_at DESC)`. |
| **BR-SLEEP-01..06** | sleep_end > sleep_start, tính qua nửa đêm, duration > 0 | **ĐẠT.** CHECK `sleep_end > sleep_start`, `duration_minutes > 0`, lưu UTC độc lập mốc 0h. |
| **BR-ACT-01..06** | Hoạt động hợp lệ, bước chân >= 0, chống trùng sync thiết bị | **ĐẠT.** CHECK `steps >= 0`, `duration_minutes > 0`, Partial Unique Index chống trùng sync. |
| **BR-MED-01..09** | Bảo toàn lịch sử uống thuốc, ON DELETE RESTRICT, status PENDING/TAKEN/SKIPPED | **ĐẠT.** Tách 3 tầng, `medication_logs` có UNIQUE `(schedule_id, scheduled_at)`, ON DELETE RESTRICT. |
| **BR-NUT-01..07** | Snapshot dinh dưỡng bất biến, thực phẩm hệ thống vs tự tạo, khẩu phần > 0 | **ĐẠT.** `MEAL_ITEMS` có 5 cột snapshot, `food_item_id SET NULL`, `food_items.created_by` phân biệt nguồn. |
| **BR-HEALTH-01..07** | Chỉ số đo hợp lệ, tệp bảo mật private storage, kiểm tra quyền sở hữu | **ĐẠT.** `health_records` có `value` + `secondary_value`, `health_attachments` dùng `storage_path`. |
| **BR-DASH-01..05** | Dashboard theo timezone user, mục tiêu active duy nhất | **ĐẠT.** `users.timezone` có default, `health_goals.is_active` có partial unique index, index lọc ngày tối ưu. |
| **BR-SYS-01..06** | Thời gian lưu UTC, hiển thị local, xác thực đầu vào, bảo vệ lịch sử | **ĐẠT.** Toàn bộ cột thời gian là `TIMESTAMPTZ`, CHECK constraints đảm bảo tính toàn vẹn dữ liệu. |
| **BR-NOTI-01..05** | Bật/tắt thông báo, nhiều khung giờ nhắc nước, hủy lịch khi tắt | **ĐẠT.** `notification_preferences.reminder_times TEXT[]` hỗ trợ nhiều mốc giờ trong ngày. |

---

## 5. CÁC LƯU Ý KHI BƯỚC VÀO TRIỂN KHAI BACKEND & PRISMA

Mặc dù tài liệu thiết kế database đã hoàn thiện 100%, đội ngũ Backend cần lưu ý một số điểm kỹ thuật khi lập trình:

1. **Tạo CHECK Constraint & Partial Index qua Migration SQL:**  
   Prisma Schema file (`.prisma`) hiện tại chưa hỗ trợ cú pháp `CHECK` constraint và `Partial Index (WHERE clause)` trực tiếp trong file schema. Do đó:
   - Các index partial (`activity_logs_user_source_ext_uniq`, `health_goals_user_type_active_uniq`) và các CHECK constraints sinh học (`amount_ml > 0`, `sleep_end > sleep_start`...) phải được đưa vào file migration SQL đầu tiên (`prisma/migrations/0_init/migration.sql`).
   - Đồng thời, tại tầng ứng dụng (NestJS DTOs), bắt buộc dùng `class-validator` để validate dữ liệu đầu vào trước khi gọi Prisma Client.
2. **Quản lý presigned URL cho tệp đính kèm:**  
   Backend service `health-records` cần tích hợp với Supabase Storage client để tạo signed URL có thời hạn (ví dụ: 15 phút) mỗi khi client truy vấn thông tin attachment.
3. **Mã hóa chuỗi Refresh Token:**  
   Trước khi lưu vào `refresh_tokens.token_hash`, chuỗi token phải được băm qua SHA-256 (`crypto.createHash('sha256').update(token).digest('hex')`).

---

## 6. KẾT LUẬN

> ✅ **KẾT LUẬN: BẢN THIẾT KẾ DATABASE VERSION 1.1 ĐÃ ĐẠT TIÊU CHUẨN CAO NHẤT VỀ TÍNH TOÀN VẸN, BẢO MẬT VÀ HIỆU NĂNG.**  
> - **0 vấn đề Critical** còn tồn tại.  
> - **0 vấn đề High** còn tồn tại.  
> - Hai tài liệu `docs/ERD.md` và `docs/DATABASE_SPECIFICATION.md` đã đồng bộ và sẵn sàng 100% để chuyển sang giai đoạn tạo Prisma Schema và Migration.

