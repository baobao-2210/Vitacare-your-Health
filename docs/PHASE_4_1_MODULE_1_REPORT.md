# VITACARE – BÁO CÁO NGHIỆM THU PHASE 4.1: MODULE 1 (AUTHENTICATION & USER PROFILE)

- **Dự án:** VitaCare – Your Health, Your Life
- **Công nghệ:** Expo SDK 52 (React Native), Expo Router v4, NestJS, Prisma ORM, PostgreSQL (Supabase), Zustand, TanStack Query, Expo SecureStore, Expo LocalAuthentication.
- **Ngày hoàn thành:** 20/11/2026
- **Trạng thái:** HOÀN THÀNH TOÀN DIỆN (12/12 Tasks)

---

## 1. MÀN HÌNH ĐÃ TRIỂN KHAI (IMPLEMENTED SCREENS)

| Tuyến đường (Route) | Tên màn hình | Chức năng chính | Trạng thái |
| :--- | :--- | :--- | :--- |
| `app/(auth)/login.tsx` | Đăng nhập | Xác thực email/mật khẩu, kiểm tra hợp lệ client, ẩn/hiện mật khẩu, chống submit lặp, lưu token bảo mật, nút vào Chế độ Dùng Thử (Demo). | ✅ Hoàn thành & Kiểm thử |
| `app/(auth)/register.tsx` | Đăng ký | Đăng ký tài khoản mới (Họ tên, Email, Mật khẩu, Xác nhận), thang đo độ mạnh mật khẩu (1-4 mức), báo lỗi trùng email (409), tự chuyển login. | ✅ Hoàn thành & Kiểm thử |
| `app/(tabs)/profile/index.tsx` | Hồ sơ Cá nhân | Thẻ định danh (#VC-XXXX), thông tin thể chất Bento (Chiều cao, Cân nặng, BMI động, Tuổi sinh học), Mục tiêu sức khỏe, Bật/Tắt Sinh trắc học, Đăng xuất. | ✅ Hoàn thành & Khớp Stitch |
| `Modal Edit Profile` | Chỉnh sửa Thể chất | Bottom-sheet modal cho phép sửa Họ tên, Ngày sinh, Giới tính, Chiều cao (cm), Cân nặng (kg). Đồng bộ trực tiếp về PostgreSQL qua API. | ✅ Hoàn thành & Đồng bộ DB |
| `app/_layout.tsx` | Điều hướng & Bảo vệ tuyến đường | `NavigationGuard` tự động kiểm tra phiên (`restoreSession`), nạp phông chữ vector icons (`MaterialIcons`, `Ionicons`, `MaterialCommunityIcons`), hiển thị banner Demo mode. | ✅ Hoàn thành & Bảo mật |

---

## 2. CÁC COMPONENT & UTILITIES ĐÃ TRIỂN KHAI

1. **`apps/mobile/src/stores/auth.store.ts`**: Store Zustand quản lý trạng thái xác thực (`user`, `healthProfile`, `bmiAnalysis`, `tokens`, `isDemoMode`, `isLoading`).
2. **`apps/mobile/src/lib/api.ts`**: Axios instance cấu hình interceptors, cơ chế hàng đợi (`failedQueue`) ngăn gọi lặp `/auth/refresh`, tự động refresh token ngầm khi gặp 401 và xử lý an toàn khi hết hạn phiên.
3. **`apps/mobile/src/services/biometric.service.ts`**: Tích hợp `expo-local-authentication`, kiểm tra phần cứng thiết bị, vân tay/Face ID, lưu trạng thái kích hoạt trong `Expo SecureStore`.
4. **`apps/mobile/src/utils/bmi.ts`**: Bộ tính toán chỉ số BMI theo chuẩn WHO Châu Á - Thái Bình Dương (Thiếu cân, Bình thường, Thừa cân, Tiền béo phì, Béo phì cấp độ I & II, dải cân nặng lý tưởng).

---

## 3. DANH SÁCH ENDPOINT BACKEND ĐÃ TÍCH HỢP

Tất cả các endpoint đều là REST API thực tế chạy trên NestJS backend (`http://localhost:3000/api/v1`):

| Phương thức | Endpoint | DTO Gửi lên | Dữ liệu trả về | Mã phản hồi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `RegisterDto` (`email`, `password`, `fullName`) | `User`, `HealthProfile`, `accessToken`, `refreshToken` | 201 Created |
| `POST` | `/api/v1/auth/login` | `LoginDto` (`email`, `password`) | `User`, `HealthProfile`, `accessToken`, `refreshToken` | 200 OK |
| `POST` | `/api/v1/auth/refresh` | `RefreshTokenDto` (`refreshToken`) | `accessToken`, `refreshToken` (xoay vòng token) | 200 OK |
| `POST` | `/api/v1/auth/logout` | `RefreshTokenDto` (`refreshToken`) | `{ message: "Đăng xuất thành công." }` | 200 OK |
| `GET` | `/api/v1/auth/me` | Bearer Header | `User` (email, fullName, role, ...) | 200 OK |
| `GET` | `/api/v1/profile` | Bearer Header | `UserProfile` (height, weight, dob, bmi, ...) | 200 OK |
| `PATCH` | `/api/v1/profile` | `UpdateProfileDto` (fullName, dateOfBirth, heightCm, weightKg, gender) | Profile cập nhật kèm phân tích `bmiAnalysis` | 200 OK |

---

## 4. CẤU TRÚC REQUEST / RESPONSE THỰC TẾ ĐÃ ĐƯỢC XÁC THỰC

### 4.1. Đăng ký & Đăng nhập
```json
// POST /api/v1/auth/login
// Request:
{
  "email": "test.user.1763570650@vitacare.vn",
  "password": "Password123!"
}

// Response: 200 OK
{
  "user": {
    "id": "8e1efb2f-4e4b-4503-ae5f-2bcd89021144",
    "email": "test.user.1763570650@vitacare.vn",
    "fullName": "Nguyen Van A",
    "role": "USER",
    "isActive": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4.2. Cập nhật hồ sơ & Phân tích BMI
```json
// PATCH /api/v1/profile
// Request:
{
  "fullName": "Nguyen Van A (Cap Nhat)",
  "heightCm": 175,
  "weightKg": 68,
  "gender": "MALE",
  "dateOfBirth": "1994-05-15"
}

// Response: 200 OK
{
  "profile": {
    "userId": "8e1efb2f-4e4b-4503-ae5f-2bcd89021144",
    "dateOfBirth": "1994-05-15T00:00:00.000Z",
    "gender": "MALE",
    "heightCm": 175,
    "weightKg": 68
  },
  "bmiAnalysis": {
    "bmi": 22.2,
    "category": "Bình thường",
    "status": "Thể trạng tốt",
    "recommendation": "Duy trì chế độ ăn uống và tập luyện hiện tại.",
    "idealWeightRange": {
      "minKg": 56.7,
      "maxKg": 70.1
    }
  }
}
```

---

## 5. KIẾN TRÚC XÁC THỰC & BẢO MẬT (SECURITY ARCHITECTURE)

1. **Lưu trữ Token an toàn (Secure Token Storage):**
   - Sử dụng `expo-secure-store` để lưu trữ `accessToken`, `refreshToken` và `vitacare_biometric_enabled`.
   - **Tuyệt đối không lưu trữ mật khẩu** hoặc token nhạy cảm trong `AsyncStorage` hay `localStorage`.
2. **Khôi phục phiên (Session Restoration):**
   - Khi khởi động ứng dụng, `NavigationGuard` gọi `authStore.restoreSession()`.
   - Đọc token từ SecureStore, gọi `GET /api/v1/profile` để đồng bộ thông tin mới nhất.
   - Nếu token hợp lệ, tự động chuyển người dùng vào `(tabs)`.
3. **Bảo vệ luồng và Xoay vòng Token (Token Refresh Rotation):**
   - Axios Interceptor tự động gắn `Authorization: Bearer <token>`.
   - Khi gặp mã lỗi `401 Unauthorized`, interceptor dừng các request tiếp theo, đưa vào `failedQueue`, và gọi `POST /api/v1/auth/refresh`.
   - Cập nhật cặp token mới vào SecureStore và replay toàn bộ các request đang chờ.
   - Nếu refresh thất bại (hết hạn hoàn toàn), xóa sạch SecureStore và điều hướng an toàn về `/(auth)/login`.
4. **Bảo mật Sinh trắc học (Biometrics):**
   - Tích hợp qua `expo-local-authentication`.
   - Chỉ lưu trạng thái ưu tiên của người dùng trên thiết bị, không truyền template sinh trắc học lên backend.

---

## 6. CÔNG THỨC & QUY TẮC BMI (CHUẨN WHO CHÂU Á - THÁI BÌNH DƯƠNG)

$$BMI = \frac{Cân\ nặng\ (kg)}{(Chiều\ cao\ (m))^2}$$

- **< 18.5**: Thiếu cân (Màu: Vàng cam `#F59E0B`)
- **18.5 - 22.9**: Bình thường / Thể trạng tốt (Màu: Xanh ngọc `#006A60`)
- **23.0 - 24.9**: Thừa cân (Màu: Cam `#EA580C`)
- **25.0 - 29.9**: Tiền béo phì (Béo phì độ I) (Màu: Đỏ san hô `#DC2626`)
- **≥ 30.0**: Béo phì độ II (Màu: Đỏ thẫm `#991B1B`)

Chỉ số BMI được tính toán tức thời tại giao diện khi người dùng thay đổi chiều cao hoặc cân nặng, đồng thời được đồng bộ chính xác với kết quả phân tích do backend NestJS trả về.

---

## 7. CHẾ ĐỘ DÙNG THỬ (DEMO MODE)

- Cho phép người dùng trải nghiệm ngay toàn bộ giao diện và luồng nghiệp vụ của VitaCare mà không cần đăng ký tài khoản.
- Dữ liệu demo được cô lập hoàn toàn trong bộ nhớ máy khách (Client Memory), hiển thị banner màu hổ phách cảnh báo cố định ở đầu màn hình:
  `CHẾ ĐỘ DÙNG THỬ (DEMO) — Dữ liệu chỉ lưu tạm trên thiết bị`
- Không gửi hoặc giả lập việc lưu dữ liệu demo vào cơ sở dữ liệu Supabase PostgreSQL thật.

---

## 8. BẢNG KẾT QUẢ KIỂM THỬ (TEST RESULTS MATRIX)

| STT | Kịch bản kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Đăng ký với email sai định dạng | Báo lỗi định dạng email ngay tại ô nhập | Hiển thị "Email không đúng định dạng" | ✅ PASS |
| 2 | Đăng ký với mật khẩu yếu (<8 ký tự) | Thanh đo độ mạnh cảnh báo, nút bấm khóa | Hiển thị mức đỏ "Mật khẩu yếu" | ✅ PASS |
| 3 | Đăng ký tài khoản mới thành công | Lưu vào DB, trả về 201 và cặp JWT tokens | Backend trả về 201, User ID được tạo trong DB | ✅ PASS |
| 4 | Đăng ký với email đã tồn tại | Backend trả về lỗi 409 Conflict | Báo lỗi "Email này đã được sử dụng" | ✅ PASS |
| 5 | Đăng nhập với thông tin chính xác | Nhận JWT tokens, lưu SecureStore, vào App | Đăng nhập thành công, chuyển hướng vào Dashboard | ✅ PASS |
| 6 | Đăng nhập với mật khẩu sai | Báo lỗi thông tin đăng nhập không hợp lệ | Hiển thị banner lỗi 401 tiếng Việt | ✅ PASS |
| 7 | Lưu trữ SecureStore an toàn | Token được mã hóa trong phần cứng thiết bị | Token được lưu và đọc chính xác | ✅ PASS |
| 8 | Khôi phục phiên khi khởi động lại App | Tự động giữ đăng nhập không cần nhập lại | `restoreSession()` nạp dữ liệu và vào thẳng Tabs | ✅ PASS |
| 9 | Tự động làm mới Token (Refresh Token) | Cấp accessToken mới và xoay vòng refreshToken | Backend xoay vòng token thành công | ✅ PASS |
| 10 | Đăng xuất người dùng | Gọi `/auth/logout`, hủy token backend, xóa SecureStore | Token bị vô hiệu hóa, dọn dẹp state sạch sẽ, chuyển về Login | ✅ PASS |
| 11 | Chặn truy cập trái phép sau đăng xuất | Cố vào `/profile` bị chặn và đẩy về Login | `NavigationGuard` bắt và chuyển hướng về Login | ✅ PASS |
| 12 | Tải hồ sơ người dùng thực | Hiển thị mã bệnh nhân, ngày sinh, chiều cao, cân nặng | Hiển thị chính xác thông tin từ DB | ✅ PASS |
| 13 | Chỉnh sửa Chiều cao & Cân nặng | Gửi `PATCH /api/v1/profile` và cập nhật DB | Dữ liệu lưu vào PostgreSQL thành công | ✅ PASS |
| 14 | Tính toán lại BMI sau khi đổi số đo | BMI và phân loại tự động tính lại chuẩn xác | 175cm, 68kg -> BMI 22.2 (Bình thường) | ✅ PASS |
| 15 | Kiểm tra tính khả dụng của Sinh trắc học | Nhận diện vân tay/Face ID theo máy | Kiểm tra đúng trạng thái phần cứng thiết bị | ✅ PASS |
| 16 | Cô lập Chế độ Dùng Thử (Demo) | Hoạt động độc lập, không ghi đè DB | Dữ liệu demo tách biệt, có banner nhận diện | ✅ PASS |
| 17 | Kiểm tra lỗi kiểu TypeScript | `pnpm --filter mobile exec tsc --noEmit` | Đạt 0 lỗi (Exit Code 0) | ✅ PASS |
| 18 | Kiểm tra phông biểu tượng Tab Bar | Hiển thị đầy đủ icon 5 tab | Cài đặt `expo-font`, nạp TTF, hiển thị chuẩn 100% | ✅ PASS |

---

## 9. CÁC HẠN CHẾ & KHOẢNG TRỐNG DATABASE ĐƯỢC GHI NHẬN (KNOWN GAPS)

1. **Trường Nhóm Máu (Blood Group) & Liên hệ Khẩn Cấp (Emergency Contact):**
   - Theo yêu cầu Rule 7 & 8: Không được tự ý sửa database schema hoặc bịa đặt endpoint khi chưa được phê duyệt.
   - Bảng `User` và `HealthProfile` trong `apps/backend/prisma/schema.prisma` hiện tại chưa có 2 cột này. Giao diện đã được thiết kế mở sẵn sàng tiếp nhận khi backend cập nhật migration.
2. **Khôi phục mật khẩu qua Email (Forgot Password):**
   - Hiện backend chưa cấu hình SMTP mailer service để gửi OTP / reset link. Trên mobile đã có nút điều hướng và thông báo hỗ trợ để sẵn sàng tích hợp khi backend bổ sung service gửi mail.

---

## KẾT LUẬN

Module 1 (Authentication & User Profile) đã hoàn thành toàn diện, đáp ứng đầy đủ tất cả các tiêu chí nghiệm thu của Phase 4.1, sẵn sàng để chuyển giao và tiếp tục thực hiện Module 2.

