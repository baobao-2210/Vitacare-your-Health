# BÁO CÁO TRIỂN KHAI & NGHIỆM THU HOÀN THIỆN
# MODULE 2: HEALTH RECORDS & GOLDEN VITALS (MANUAL DATA ENTRY)
**Dự án:** VitaCare – Your Health, Your Life  
**Vị trí:** Senior React Native Architect, NestJS Backend Engineer & QA Lead  
**Ngày báo cáo:** 20/11/2026  
**Trạng thái:** ✅ **HOÀN THÀNH TOÀN DIỆN (14/14 TEST CASES ĐẠT CHUẨN 100%)**

---

## 1. ĐỊNH HƯỚNG SẢN PHẨM & TUÂN THỦ NGUYÊN TẮC CỐT LÕI

| Nguyên tắc | Trạng thái tuân thủ | Chi tiết triển khai |
| :--- | :---: | :--- |
| **Nhập thủ công độc quyền (Manual Data Entry)** | ✅ Đạt 100% | Người dùng tự nhập chỉ số từ thiết bị cá nhân (Omron, Microlife, Accu-Chek...) hoặc sổ khám bệnh. |
| **Tuyệt đối không Native Health Sync** | ✅ Đạt 100% | Không cài đặt hoặc gọi Apple HealthKit, Android Health Connect, Smartwatch hay Bluetooth SDK. |
| **Bảo toàn thiết kế Google Stitch** | ✅ Đạt 100% | Giữ nguyên 100% layout, typography, màu sắc thương hiệu `#0D9488`, card elevation và components Stitch. |
| **Không dùng Mock Data làm đẹp** | ✅ Đạt 100% | Đã loại bỏ toàn bộ dữ liệu giả (`94 mg/dL`, `118/76 mmHg`, `72 bpm`). Khi chưa có số đo, hiển thị `--` và trạng thái `Chưa đo`. |
| **Bảo mật & Phân quyền đa người dùng** | ✅ Đạt 100% | Bản ghi gắn chặt với `userId` từ JWT token. Chặn 403 Forbidden khi xem/sửa/xóa chéo dữ liệu giữa các tài khoản. |

---

## 2. TRIỂN KHAI 4 CHỈ SỐ SINH HỌC VÀNG (GOLDEN VITALS)

### 2.1. Huyết áp (Blood Pressure)
- **Cấu trúc lưu trữ:** Lưu trữ đồng thời cả hai chỉ số **Huyết áp Tâm thu (Systolic)** và **Huyết áp Tâm trương (Diastolic)** trong cùng một bản ghi duy nhất:
  - `recordType`: `BLOOD_PRESSURE`
  - `value`: Tâm thu (Systolic, ví dụ: 120)
  - `secondaryValue`: Tâm trương (Diastolic, ví dụ: 80)
  - `unit`: `mmHg`
- **Ràng buộc nghiệp vụ:** Bắt buộc `Systolic > Diastolic`. Kiểm tra 2 lớp (Client form validation và Backend Service `BadRequestException`).
- **Đánh giá y khoa sơ bộ (Non-blocking):**
  - Cao huyết áp độ 2: $\ge 140/90\text{ mmHg}$ (Cảnh báo cam)
  - Huyết áp thấp: $< 90/60\text{ mmHg}$ (Cảnh báo vàng)
  - Bình thường: $90 - 129$ / $60 - 84\text{ mmHg}$ (Thẻ xanh tối ưu)

### 2.2. Nhịp tim (Heart Rate)
- **Cấu trúc lưu trữ:**
  - `recordType`: `HEART_RATE`
  - `value`: Nhịp tim (bpm, ví dụ: 75)
  - `unit`: `bpm`
- **Đánh giá y khoa sơ bộ:**
  - Nhịp tim nhanh (Tachycardia): $> 100\text{ bpm}$
  - Nhịp tim chậm (Bradycardia): $< 55\text{ bpm}$
  - Bình thường: $60 - 100\text{ bpm}$

### 2.3. Đường huyết (Blood Glucose)
- **Cấu trúc lưu trữ:**
  - `recordType`: `BLOOD_GLUCOSE`
  - `value`: Giá trị đường huyết
  - `unit`: Hỗ trợ cả 2 đơn vị chuẩn: `mg/dL` và `mmol/L`
  - `note`: Lưu trữ tự động ngữ cảnh đo đã chọn:
    - *Lúc đói (Nhịn ăn $\ge$ 8h)*
    - *Sau ăn 2 giờ*
    - *Trước khi đi ngủ*
    - *Đo ngẫu nhiên / Bất kỳ*
- **Đổi đơn vị tự động:** Hệ số chuyển đổi $1\text{ mmol/L} = 18.018\text{ mg/dL}$ khi người dùng bấm chuyển đổi tab đơn vị trên UI.

### 2.4. Cân nặng (Weight)
- **Cấu trúc lưu trữ:**
  - `recordType`: `WEIGHT`
  - `value`: Cân nặng (kg, ví dụ: 68.5)
  - `unit`: `kg`
- **Tự động đồng bộ HealthProfile:** Khi tạo mới hoặc cập nhật một bản ghi cân nặng, hệ thống tự động cập nhật trường `weightKg` trong bảng `HealthProfile` của người dùng, đảm bảo dữ liệu tính toán chỉ số BMI trên toàn ứng dụng luôn đồng bộ.

---

## 3. DANH SÁCH MÀN HÌNH ĐÃ KẾT NỐI & TÍCH HỢP

| Đường dẫn màn hình | Chức năng thực hiện | Trạng thái |
| :--- | :--- | :---: |
| `apps/mobile/app/(tabs)/health/index.tsx` | **Health Dashboard:** Hiển thị 3 thẻ sinh hóa gần nhất (`BLOOD_GLUCOSE`, `BLOOD_PRESSURE`, `HEART_RATE`) từ API `GET /health-records/latest`. Hiển thị timeline 5 bản ghi mới nhất. Thẻ Empty State khi chưa có số đo. Nút FAB mở form nhập liệu. Nút xem danh mục mở lịch sử. | ✅ Sẵn sàng |
| `apps/mobile/app/health/add.tsx` | **Form Ghi Nhận Chỉ Số Thủ Công:** Chọn nhóm chỉ số (4 Golden Vitals), form 2 ô cho Huyết áp, toggle đơn vị & ngữ cảnh đo cho Đường huyết, date picker/hiện tại, ô nhập cơ sở y tế/thiết bị đo, ghi chú triệu chứng, disclaimer y tế, validation trực quan. | ✅ Sẵn sàng |
| `apps/mobile/app/health/[id].tsx` | **Chi Tiết & Sửa/Xóa Bản Ghi:** Hiển thị chi tiết số đo, badge trạng thái, mốc thời gian, ghi chú ngữ cảnh. **Modal chỉnh sửa số đo** (hỗ trợ sửa cả 2 số đo huyết áp), **Xóa bản ghi có hộp thoại xác nhận** (`Alert.alert`). | ✅ Sẵn sàng |
| `apps/mobile/app/health/history.tsx` | **Lịch Sử Đo Sức Khỏe:** Thanh tìm kiếm theo ghi chú / số đo, bộ lọc ngang theo nhóm (`Tất cả`, `Huyết áp`, `Nhịp tim`, `Đường huyết`, `Cân nặng`), danh sách thẻ bản ghi chi tiết, empty state thân thiện với nút chuyển sang màn hình thêm mới. | ✅ Sẵn sàng |

---

## 4. DANH SÁCH API BACKEND ĐÃ TRIỂN KHAI & KIỂM TRA

| Phương thức | Endpoint | DTO Request | Chức năng | Phân quyền |
| :---: | :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/health-records` | `CreateHealthRecordDto` | Thêm mới chỉ số sức khỏe thủ công. Tự động đồng bộ cân nặng sang `HealthProfile`. | User sở hữu |
| `GET` | `/api/v1/health-records` | `HealthRecordQueryDto` (`recordType`, `startDate`, `endDate`, `page`, `limit`) | Lấy danh sách lịch sử theo bộ lọc loại chỉ số hoặc khoảng thời gian. | User sở hữu |
| `GET` | `/api/v1/health-records/latest` | Không | Lấy nhanh các chỉ số đo mới nhất của từng loại để hiển thị lên Dashboard. | User sở hữu |
| `GET` | `/api/v1/health-records/:id` | `id: UUID` | Xem chi tiết 1 bản ghi. Chặn 403 nếu không phải chủ sở hữu. | User sở hữu |
| `PATCH` | `/api/v1/health-records/:id` | `UpdateHealthRecordDto` | Chỉnh sửa số đo, thời gian, đơn vị, ghi chú. Tự động cập nhật `HealthProfile.weightKg` nếu sửa cân nặng. Chặn 403 nếu sai chủ. | User sở hữu |
| `DELETE` | `/api/v1/health-records/:id` | `id: UUID` | Xóa bản ghi vĩnh viễn khỏi hệ thống. Chặn 403 nếu sai chủ. | User sở hữu |

---

## 5. MA TRẬN KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (INTEGRATION TEST MATRIX)

Kịch bản kiểm thử tích hợp toàn diện chạy độc lập qua script `scratch/test_module_2_fetch.js`:

```
=== BẮT ĐẦU KIỂM THỬ TÍCH HỢP MODULE 2: MANUAL HEALTH DATA ENTRY ===

[Setup] Tạo User 1 thành công: tester.mod2.u1.1795111565@vitacare.vn (ID: 5d0d5282-a025-4684-be2d-69ac770e2536)
[Setup] Tạo User 2 thành công: tester.mod2.u2.1795111565@vitacare.vn (ID: c49e0f7e-f45a-4896-84fd-d8c330cf40f1)

[Test 1] Thêm Huyết áp (120/80 mmHg): PASS (ID: 8e5e727d-3ccb-48fd-8b49-24a86a82bdfe)
[Test 2] Thêm Nhịp tim (75 bpm): PASS (ID: 81499667-25c0-44cf-b57c-ff09cab8a36b)
[Test 3] Thêm Đường huyết (95 mg/dL): PASS (ID: 2c8450af-6e9a-416c-8ea3-ce27d9e3f658)
[Test 4] Thêm Cân nặng (68.5 kg): PASS (ID: 8210c609-9fab-411e-aee4-2ef6981d69db)
         -> Tự động cập nhật HealthProfile: 68.5 kg
[Test 5] Validation chặn giá trị âm (-15): PASS (Mã phản hồi: 400 Bad Request)
[Test 6] Tra cứu ID không tồn tại: PASS (Mã phản hồi: 404 Not Found)
[Test 7] Chỉnh sửa Huyết áp (PATCH): PASS (Giá trị cập nhật: 125/82 mmHg)
[Test 8] Xóa bản ghi (ID: cf41a3d8-4b29-4b10-b38f-9694bbb0e29c): PASS
         -> Xác nhận bản ghi đã xóa vĩnh viễn (404 Not Found)
[Test 9] Lọc danh sách theo HEART_RATE: PASS (1 bản ghi, 100% đúng loại)
[Test 10] Lấy chỉ số mới nhất (Latest Vitals): PASS (BP: 125/82, HR: 75, Glu: 95, W: 68.5)
[Test 11] Bảo mật: Chặn User 2 xem bản ghi của User 1: PASS (403 Forbidden)
[Test 12] Bảo mật: Chặn User 2 sửa bản ghi của User 1: PASS (403 Forbidden)
[Test 13] Bảo mật: Chặn User 2 xóa bản ghi của User 1: PASS (403 Forbidden)
[Test 14] Độc lập dữ liệu người dùng: PASS (User 2 mới tạo có 0 bản ghi, không bị rò rỉ dữ liệu của User 1)

=== KẾT QUẢ: TOÀN BỘ 14 TEST CASES ĐẠT CHUẨN 100% ===
```

---

## 6. BÁO CÁO KHOẢNG TRỐNG KỸ THUẬT (TECHNICAL GAPS)

Theo quy định nghiêm ngặt của dự án (Không tự bịa ra tính năng hoặc hạ tầng khi chưa có):

1. **Đính kèm tệp kết quả khám (Medical Attachments):**
   - **Hiện trạng Database:** Đã có bảng `health_attachments` liên kết khóa ngoại với `health_records`.
   - **Khoảng trống:** Backend NestJS hiện tại chưa tích hợp Cloud Storage Uploader (như AWS S3, Cloudinary hoặc Supabase Storage Bucket) để sinh URL và tiếp nhận file upload đa phương tiện.
   - **Hướng xử lý chuẩn mực:** Trong giai đoạn này, form nhập liệu tập trung hoàn hảo vào số liệu sinh trắc học và ngữ cảnh; cấu trúc bảng đính kèm được giữ nguyên sẵn sàng để kích hoạt khi phân hệ File Storage Service được cấu hình chính thức.

---

## 7. KẾT LUẬN & BÀN GIAO

- Module 2: Nhập dữ liệu chỉ số sức khỏe thủ công (Manual Health Records & Golden Vitals) đã hoàn thiện 100% về UI Stitch, State Management, Validation y tế, API Backend, Security Guards và Kiểm thử tự động.
- Ứng dụng đã sẵn sàng bước sang các phân hệ tiếp theo.

