# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

# VITACARE – YOUR HEALTH, YOUR LIFE

**Phiên bản:** 1.0  
**Trạng thái:** Draft – Bản đặc tả ban đầu  
**Nền tảng:** iOS và Android  
**Frontend:** React Native + Expo + TypeScript  
**Backend:** NestJS + Prisma ORM  
**Database:** PostgreSQL  
**Ngôn ngữ giao diện:** Tiếng Việt (giai đoạn đầu)

---

# PHẦN I. GIỚI THIỆU

## 1.1. Mục đích tài liệu

Tài liệu SRS mô tả các yêu cầu chức năng, yêu cầu phi chức năng, quy tắc nghiệp vụ và các điều kiện vận hành của ứng dụng VitaCare.

Tài liệu được sử dụng làm cơ sở cho:

- Phân tích và thiết kế hệ thống.
- Thiết kế cơ sở dữ liệu.
- Phát triển API Backend.
- Xây dựng giao diện Mobile App.
- Kiểm thử phần mềm.
- Đánh giá mức độ hoàn thiện sản phẩm trước khi phát hành lên App Store và Google Play.

## 1.2. Tổng quan sản phẩm

**VitaCare** là ứng dụng hỗ trợ người dùng quản lý và theo dõi sức khỏe cá nhân thông qua việc ghi nhận các hoạt động sinh hoạt hằng ngày, quản lý thói quen và lưu trữ thông tin sức khỏe.

Ứng dụng tập trung vào việc giúp người dùng:

- Theo dõi lượng nước uống mỗi ngày.
- Ghi nhận thời gian và chất lượng giấc ngủ.
- Theo dõi hoạt động thể chất.
- Quản lý lịch uống thuốc và nhắc nhở.
- Ghi nhật ký dinh dưỡng.
- Lưu trữ hồ sơ và các chỉ số sức khỏe.

**Định hướng sản phẩm:** Personal Health & Wellness Management.

VitaCare là công cụ hỗ trợ theo dõi và lưu trữ thông tin, không thay thế bác sĩ, cơ sở y tế hoặc các thiết bị đo lường chuyên dụng.

## 1.3. Đối tượng sử dụng

| Đối tượng          | Mô tả                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| Người dùng cá nhân | Người đăng ký tài khoản và sử dụng các chức năng quản lý sức khỏe           |
| Người dùng mới     | Người chưa có tài khoản, cần đăng ký hoặc đăng nhập                         |
| Quản trị hệ thống  | Quản lý các dữ liệu và dịch vụ vận hành nếu triển khai trang quản trị riêng |

Trong phạm vi MVP, ứng dụng tập trung vào người dùng cá nhân. Không triển khai hệ thống bác sĩ, bệnh viện hoặc tư vấn y tế trực tuyến.

## 1.4. Phạm vi hệ thống

Hệ thống gồm 6 phân hệ nghiệp vụ chính:

1. Water Tracking – Quản lý nước uống.
2. Sleep Tracking – Quản lý giấc ngủ.
3. Activity Tracking – Quản lý hoạt động.
4. Medication Management – Quản lý thuốc.
5. Nutrition Tracking – Quản lý dinh dưỡng.
6. Health Records – Quản lý hồ sơ sức khỏe.

Các chức năng nền tảng:

- Đăng ký, đăng nhập và xác thực.
- Quản lý hồ sơ cá nhân.
- Quản lý mục tiêu sức khỏe.
- Dashboard tổng quan.
- Thông báo và nhắc nhở.
- Quản lý quyền riêng tư và dữ liệu cá nhân.

## 1.5. Thuật ngữ

| Thuật ngữ      | Ý nghĩa                             |
| -------------- | ----------------------------------- |
| SRS            | Software Requirements Specification |
| BR             | Business Rule                       |
| MVP            | Minimum Viable Product              |
| CRUD           | Create, Read, Update, Delete        |
| API            | Application Programming Interface   |
| JWT            | JSON Web Token                      |
| HealthKit      | Nền tảng dữ liệu sức khỏe của Apple |
| Health Connect | Nền tảng dữ liệu sức khỏe Android   |
| Dashboard      | Màn hình tổng quan                  |
| Log            | Bản ghi dữ liệu                     |
| User           | Người dùng                          |

---

# PHẦN II. MÔ TẢ TỔNG QUAN HỆ THỐNG

## 2.1. Môi trường vận hành

| Thành phần           | Công nghệ             |
| -------------------- | --------------------- |
| Mobile Application   | React Native + Expo   |
| Programming Language | TypeScript            |
| Navigation           | Expo Router           |
| State Management     | Zustand               |
| Server State         | TanStack Query        |
| Form Validation      | React Hook Form + Zod |
| Backend              | NestJS                |
| ORM                  | Prisma                |
| Database             | PostgreSQL            |
| Authentication       | JWT + Refresh Token   |
| File Storage         | Supabase Storage      |
| Notifications        | Expo Notifications    |
| Charts               | Victory Native        |

## 2.2. Kiến trúc tổng quan

Ứng dụng sử dụng mô hình Client – Server.

- Mobile App: hiển thị giao diện, tiếp nhận dữ liệu và tương tác với người dùng.
- Backend API: xử lý nghiệp vụ, xác thực, phân quyền và truy xuất dữ liệu.
- PostgreSQL: lưu trữ dữ liệu tài khoản và thông tin sức khỏe.
- Supabase Storage: lưu trữ tệp đính kèm hồ sơ.
- HealthKit/Health Connect: tích hợp dữ liệu sức khỏe từ thiết bị khi được người dùng cho phép.

## 2.3. Vai trò và quyền hạn

| Chức năng                   | Khách chưa đăng nhập | Người dùng |
| --------------------------- | -------------------: | ---------: |
| Xem giới thiệu ứng dụng     |                   Có |         Có |
| Đăng ký / đăng nhập         |                   Có |         Có |
| Xem Dashboard cá nhân       |                Không |         Có |
| Ghi nhận nước uống          |                Không |         Có |
| Ghi nhận giấc ngủ           |                Không |         Có |
| Ghi nhận hoạt động          |                Không |         Có |
| Quản lý thuốc               |                Không |         Có |
| Ghi nhật ký dinh dưỡng      |                Không |         Có |
| Quản lý hồ sơ sức khỏe      |                Không |         Có |
| Quản lý mục tiêu            |                Không |         Có |
| Quản lý cài đặt cá nhân     |                Không |         Có |
| Xuất và xóa dữ liệu cá nhân |                Không |         Có |

Nguyên tắc: mỗi người dùng chỉ được truy cập và thao tác trên dữ liệu thuộc tài khoản của mình.

---

# PHẦN III. YÊU CẦU CHỨC NĂNG

## 3.1. Phân hệ xác thực và tài khoản

### FR-AUTH-01: Đăng ký tài khoản

Người dùng có thể tạo tài khoản bằng email và mật khẩu.

Thông tin đầu vào:

- Email.
- Mật khẩu.
- Họ và tên.
- Xác nhận mật khẩu.

Điều kiện:

- Email phải đúng định dạng.
- Email chưa được sử dụng.
- Mật khẩu phải đáp ứng chính sách bảo mật.
- Hai trường mật khẩu phải trùng khớp.

Kết quả: hệ thống tạo tài khoản và cho phép người dùng đăng nhập.

### FR-AUTH-02: Đăng nhập

Người dùng đăng nhập bằng email và mật khẩu.

Hệ thống xác thực thông tin, cấp Access Token và Refresh Token khi hợp lệ.

### FR-AUTH-03: Đăng xuất

Người dùng có thể đăng xuất khỏi tài khoản.

Hệ thống thu hồi hoặc vô hiệu hóa phiên làm mới tương ứng và xóa thông tin xác thực được lưu trên thiết bị.

### FR-AUTH-04: Quản lý tài khoản

Người dùng có thể:

- Xem thông tin tài khoản.
- Cập nhật họ tên.
- Cập nhật thông tin cá nhân.
- Đổi mật khẩu.
- Yêu cầu xóa tài khoản.

## 3.2. Phân hệ quản lý hồ sơ cá nhân

### FR-PROFILE-01: Xem hồ sơ

Hiển thị các thông tin:

- Họ và tên.
- Email.
- Ngày sinh.
- Chiều cao.
- Cân nặng.
- Giới tính (không bắt buộc).
- Ngày tạo tài khoản.

### FR-PROFILE-02: Cập nhật hồ sơ

Người dùng có thể chỉnh sửa các thông tin cá nhân.

### FR-PROFILE-03: Quản lý mục tiêu

Người dùng có thể thiết lập các mục tiêu:

- Lượng nước uống mỗi ngày.
- Thời lượng ngủ mỗi ngày.
- Số bước chân mỗi ngày.
- Mục tiêu vận động.
- Mục tiêu dinh dưỡng nếu có dữ liệu phù hợp.

## 3.3. Phân hệ Water Tracking

### FR-WATER-01: Xem lượng nước trong ngày

Hiển thị:

- Tổng lượng nước đã uống.
- Mục tiêu nước hằng ngày.
- Phần trăm hoàn thành.
- Danh sách các lần uống nước.

### FR-WATER-02: Ghi nhận nước uống

Người dùng có thể nhập nhanh các mức:

- 100 ml.
- 200 ml.
- 300 ml.
- 500 ml.

Đồng thời hỗ trợ nhập số lượng tùy chỉnh.

### FR-WATER-03: Chỉnh sửa bản ghi

Người dùng được chỉnh sửa hoặc xóa bản ghi nước uống của mình.

### FR-WATER-04: Thống kê nước uống

Hệ thống cung cấp:

- Thống kê theo ngày.
- Thống kê theo tuần.
- Thống kê theo tháng.
- So sánh với mục tiêu đã thiết lập.

### FR-WATER-05: Nhắc uống nước

Người dùng có thể bật/tắt nhắc nhở và thiết lập khung giờ phù hợp.

## 3.4. Phân hệ Sleep Tracking

### FR-SLEEP-01: Ghi nhận giấc ngủ

Người dùng nhập:

- Thời điểm bắt đầu ngủ.
- Thời điểm thức dậy.
- Chất lượng giấc ngủ.
- Ghi chú tùy chọn.

### FR-SLEEP-02: Tính thời lượng ngủ

Hệ thống tự động tính thời lượng ngủ dựa trên thời gian bắt đầu và kết thúc.

### FR-SLEEP-03: Lịch sử giấc ngủ

Hiển thị lịch sử giấc ngủ theo ngày, tuần và tháng.

### FR-SLEEP-04: Thống kê giấc ngủ

Hiển thị:

- Thời lượng ngủ trung bình.
- Ngày ngủ nhiều nhất.
- Ngày ngủ ít nhất.
- Mức độ hoàn thành mục tiêu ngủ.

## 3.5. Phân hệ Activity Tracking

### FR-ACTIVITY-01: Ghi nhận hoạt động

Người dùng có thể nhập hoạt động:

- Đi bộ.
- Chạy bộ.
- Đạp xe.
- Tập gym.
- Các hoạt động khác.

### FR-ACTIVITY-02: Lưu thông tin hoạt động

Mỗi bản ghi có thể bao gồm:

- Loại hoạt động.
- Thời gian vận động.
- Số bước chân nếu có.
- Thời điểm ghi nhận.
- Nguồn dữ liệu.

### FR-ACTIVITY-03: Xem lịch sử

Người dùng có thể xem danh sách hoạt động theo ngày, tuần và tháng.

### FR-ACTIVITY-04: Đồng bộ dữ liệu thiết bị

Hệ thống có thể đồng bộ dữ liệu từ HealthKit hoặc Health Connect khi người dùng cấp quyền và thiết bị hỗ trợ.

Trong MVP, nhập thủ công là phương thức chính. Tích hợp thiết bị là tính năng mở rộng nếu đáp ứng được yêu cầu kỹ thuật.

## 3.6. Phân hệ Medication Management

### FR-MED-01: Thêm thuốc

Người dùng nhập:

- Tên thuốc.
- Thông tin liều dùng do người dùng cung cấp.
- Ghi chú.
- Thời gian bắt đầu và kết thúc (nếu có).

### FR-MED-02: Thiết lập lịch nhắc

Người dùng có thể thiết lập:

- Giờ nhắc uống thuốc.
- Ngày bắt đầu.
- Ngày kết thúc.
- Tần suất lặp lại.

### FR-MED-03: Xác nhận uống thuốc

Người dùng có thể đánh dấu:

- Đã uống.
- Đã bỏ qua.
- Chưa xác nhận.

### FR-MED-04: Lịch sử uống thuốc

Hệ thống lưu lại lịch sử các lần xác nhận uống thuốc.

### FR-MED-05: Quản lý thuốc

Người dùng có thể chỉnh sửa, tạm ngừng hoặc xóa lịch thuốc của mình.

## 3.7. Phân hệ Nutrition Tracking

### FR-NUT-01: Nhật ký bữa ăn

Người dùng có thể tạo nhật ký:

- Bữa sáng.
- Bữa trưa.
- Bữa tối.
- Bữa phụ.

### FR-NUT-02: Thêm món ăn

Người dùng có thể chọn món ăn từ danh sách có sẵn hoặc tự tạo món ăn.

### FR-NUT-03: Nhập khẩu phần

Người dùng nhập lượng thực phẩm sử dụng theo gram hoặc đơn vị được hỗ trợ.

### FR-NUT-04: Tính toán dinh dưỡng

Nếu dữ liệu thành phần dinh dưỡng đáng tin cậy tồn tại, hệ thống tính:

- Năng lượng (kcal).
- Protein.
- Carbohydrate.
- Chất béo.

### FR-NUT-05: Thống kê dinh dưỡng

Hiển thị tổng lượng dinh dưỡng theo ngày và lịch sử theo thời gian.

Lưu ý: dữ liệu dinh dưỡng phải thể hiện nguồn và mức độ tin cậy phù hợp. Không tự suy đoán giá trị dinh dưỡng khi không có dữ liệu.

## 3.8. Phân hệ Health Records

### FR-HEALTH-01: Xem hồ sơ sức khỏe

Người dùng có thể xem các bản ghi:

- Cân nặng.
- Chiều cao.
- Huyết áp.
- Nhịp tim.
- Các chỉ số khác do người dùng khai báo.

### FR-HEALTH-02: Thêm bản ghi

Người dùng nhập:

- Loại chỉ số.
- Giá trị.
- Đơn vị.
- Thời điểm đo.
- Nguồn dữ liệu.
- Ghi chú.

### FR-HEALTH-03: Đính kèm tệp

Người dùng có thể đính kèm tài liệu hoặc hình ảnh liên quan đến hồ sơ sức khỏe.

### FR-HEALTH-04: Lịch sử hồ sơ

Hiển thị các bản ghi theo thời gian và loại chỉ số.

### FR-HEALTH-05: Xuất dữ liệu

Cho phép người dùng xuất dữ liệu cá nhân theo định dạng được hỗ trợ, ví dụ CSV hoặc PDF.

## 3.9. Phân hệ Dashboard

### FR-DASH-01: Tổng quan sức khỏe

Dashboard hiển thị:

- Lượng nước đã uống.
- Thời lượng ngủ.
- Hoạt động trong ngày.
- Tổng quan dinh dưỡng.
- Lịch thuốc cần thực hiện.

### FR-DASH-02: Tiến độ mục tiêu

Hiển thị tiến độ hoàn thành các mục tiêu hằng ngày.

### FR-DASH-03: Điều hướng nhanh

Cho phép truy cập nhanh vào từng phân hệ từ Dashboard.

## 3.10. Phân hệ thông báo

### FR-NOTI-01: Nhắc uống nước

Gửi thông báo theo lịch người dùng cài đặt.

### FR-NOTI-02: Nhắc uống thuốc

Gửi thông báo theo lịch thuốc đã thiết lập.

### FR-NOTI-03: Nhắc ngủ

Hỗ trợ thông báo nhắc giờ ngủ theo thiết lập.

### FR-NOTI-04: Quản lý thông báo

Người dùng có thể bật/tắt từng loại thông báo.

---

# PHẦN IV. YÊU CẦU PHI CHỨC NĂNG

## 4.1. Hiệu năng

- Các thao tác thông thường cần phản hồi nhanh trong điều kiện mạng ổn định.
- API cần hỗ trợ phân trang đối với danh sách lịch sử.
- Dashboard cần tối ưu truy vấn tổng hợp.
- Ứng dụng cần có trạng thái loading, empty và error rõ ràng.

## 4.2. Bảo mật

- Giao tiếp giữa Mobile và Backend phải sử dụng HTTPS.
- Mật khẩu phải được băm bằng Argon2 hoặc bcrypt.
- Access Token có thời hạn sử dụng.
- Refresh Token phải được quản lý an toàn.
- Không lưu mật khẩu dạng văn bản thuần.
- Mọi truy vấn dữ liệu phải kiểm tra quyền sở hữu của người dùng.
- Tệp đính kèm phải được bảo vệ bằng cơ chế truy cập phù hợp.

## 4.3. Quyền riêng tư

- Chỉ thu thập dữ liệu cần thiết cho chức năng.
- Người dùng có quyền từ chối đồng bộ dữ liệu thiết bị.
- Người dùng có thể yêu cầu xuất dữ liệu và xóa tài khoản.
- Không sử dụng dữ liệu sức khỏe cho quảng cáo hoặc bán cho bên thứ ba.
- Việc chia sẻ dữ liệu cần có sự đồng ý rõ ràng của người dùng.

## 4.4. Khả năng tương thích

- Hỗ trợ thiết bị iOS và Android.
- Giao diện thích ứng với nhiều kích thước màn hình.
- Các tính năng phụ thuộc phần cứng phải có phương án thay thế bằng nhập thủ công.

## 4.5. Khả năng bảo trì

- Code được chia thành module rõ ràng.
- Có quy ước đặt tên và cấu trúc thư mục thống nhất.
- API có tài liệu mô tả.
- Database được quản lý bằng migration.
- Các chức năng quan trọng cần có kiểm thử.

## 4.6. Tính khả dụng

- Giao diện đơn giản, dễ sử dụng.
- Các thao tác ghi nhận nhanh cần hạn chế số bước.
- Thông báo lỗi cần dễ hiểu.
- Hỗ trợ trạng thái mất kết nối và lỗi đồng bộ.

---

# PHẦN V. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

## 5.1. Quy tắc tài khoản

| Mã         | Quy tắc                                                                         |
| ---------- | ------------------------------------------------------------------------------- |
| BR-AUTH-01 | Mỗi email chỉ được đăng ký một tài khoản.                                       |
| BR-AUTH-02 | Người dùng phải xác thực trước khi sử dụng dữ liệu cá nhân.                     |
| BR-AUTH-03 | Người dùng chỉ được truy cập dữ liệu thuộc tài khoản của mình.                  |
| BR-AUTH-04 | Mật khẩu không được lưu dưới dạng văn bản thuần.                                |
| BR-AUTH-05 | Khi xóa tài khoản, dữ liệu cá nhân phải được xử lý theo chính sách xóa dữ liệu. |

## 5.2. Quy tắc nước uống

| Mã          | Quy tắc                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------- |
| BR-WATER-01 | Mỗi bản ghi nước uống phải có lượng nước lớn hơn 0 ml.                                            |
| BR-WATER-02 | Lượng nước được lưu theo đơn vị ml.                                                               |
| BR-WATER-03 | Tổng lượng nước trong ngày bằng tổng các bản ghi thuộc ngày đó.                                   |
| BR-WATER-04 | Phần trăm hoàn thành = tổng lượng nước / mục tiêu × 100%.                                         |
| BR-WATER-05 | Nếu vượt mục tiêu, hệ thống vẫn ghi nhận lượng nước thực tế; tiến độ có thể hiển thị tối đa 100%. |
| BR-WATER-06 | Người dùng chỉ được sửa hoặc xóa bản ghi của mình.                                                |
| BR-WATER-07 | Khi thay đổi mục tiêu, lịch sử lượng nước đã uống không bị thay đổi.                              |

## 5.3. Quy tắc giấc ngủ

| Mã          | Quy tắc                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| BR-SLEEP-01 | Thời điểm kết thúc phải sau thời điểm bắt đầu xét theo thời gian thực.     |
| BR-SLEEP-02 | Nếu thời gian ngủ qua nửa đêm, hệ thống phải tính đúng ngày kết thúc.      |
| BR-SLEEP-03 | Thời lượng ngủ được tính bằng thời điểm kết thúc trừ thời điểm bắt đầu.    |
| BR-SLEEP-04 | Mỗi bản ghi phải thuộc về một người dùng.                                  |
| BR-SLEEP-05 | Không cho phép bản ghi có thời lượng bằng 0 hoặc âm.                       |
| BR-SLEEP-06 | Chất lượng giấc ngủ là thông tin đánh giá chủ quan do người dùng cung cấp. |

## 5.4. Quy tắc hoạt động

| Mã        | Quy tắc                                                         |
| --------- | --------------------------------------------------------------- |
| BR-ACT-01 | Mỗi bản ghi hoạt động phải có loại hoạt động.                   |
| BR-ACT-02 | Thời lượng hoạt động phải lớn hơn 0 nếu có nhập.                |
| BR-ACT-03 | Số bước chân không được âm.                                     |
| BR-ACT-04 | Dữ liệu đồng bộ phải lưu nguồn dữ liệu.                         |
| BR-ACT-05 | Bản ghi đồng bộ cần có cơ chế chống trùng lặp.                  |
| BR-ACT-06 | Không tự tạo dữ liệu bước chân nếu không có nguồn đáng tin cậy. |

## 5.5. Quy tắc quản lý thuốc

| Mã        | Quy tắc                                                                 |
| --------- | ----------------------------------------------------------------------- |
| BR-MED-01 | Tên thuốc không được để trống.                                          |
| BR-MED-02 | Thông tin liều dùng phải do người dùng nhập hoặc xác nhận.              |
| BR-MED-03 | Thời gian kết thúc không được trước thời gian bắt đầu.                  |
| BR-MED-04 | Lịch nhắc phải có ít nhất một thời điểm nhắc hợp lệ.                    |
| BR-MED-05 | Mỗi lần xác nhận uống thuốc phải gắn với lịch nhắc hoặc bản ghi hợp lệ. |
| BR-MED-06 | Trạng thái gồm: PENDING, TAKEN, SKIPPED.                                |
| BR-MED-07 | Không tự động đánh dấu đã uống khi người dùng chưa xác nhận.            |
| BR-MED-08 | Việc chỉnh sửa lịch thuốc không được làm mất lịch sử đã ghi nhận.       |
| BR-MED-09 | Hệ thống không tự ý đề xuất, kê đơn hoặc thay đổi liều dùng.            |

## 5.6. Quy tắc dinh dưỡng

| Mã        | Quy tắc                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| BR-NUT-01 | Mỗi nhật ký bữa ăn phải thuộc một người dùng.                                                                          |
| BR-NUT-02 | Loại bữa ăn gồm: BREAKFAST, LUNCH, DINNER, SNACK.                                                                      |
| BR-NUT-03 | Khẩu phần phải lớn hơn 0.                                                                                              |
| BR-NUT-04 | Giá trị dinh dưỡng chỉ được tính khi có dữ liệu thành phần phù hợp.                                                    |
| BR-NUT-05 | Dữ liệu dinh dưỡng đã ghi nhận phải được lưu thành snapshot để tránh thay đổi lịch sử khi danh mục thực phẩm cập nhật. |
| BR-NUT-06 | Thực phẩm do người dùng tự tạo phải được phân biệt với thực phẩm trong danh mục hệ thống.                              |
| BR-NUT-07 | Không được tự suy đoán thành phần dinh dưỡng khi thiếu dữ liệu.                                                        |

## 5.7. Quy tắc hồ sơ sức khỏe

| Mã           | Quy tắc                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------- |
| BR-HEALTH-01 | Mỗi bản ghi phải có loại chỉ số, giá trị và đơn vị phù hợp.                                         |
| BR-HEALTH-02 | Mỗi bản ghi phải có thời điểm ghi nhận.                                                             |
| BR-HEALTH-03 | Phải lưu nguồn dữ liệu: MANUAL, HEALTHKIT hoặc HEALTH_CONNECT.                                      |
| BR-HEALTH-04 | Không được tự tạo kết quả đo sức khỏe từ cảm biến điện thoại nếu không có khả năng đo đáng tin cậy. |
| BR-HEALTH-05 | Tệp đính kèm phải thuộc về hồ sơ của người dùng tương ứng.                                          |
| BR-HEALTH-06 | Khi chỉnh sửa hoặc xóa bản ghi, hệ thống phải đảm bảo quyền sở hữu.                                 |
| BR-HEALTH-07 | Giá trị và đơn vị phải phù hợp với loại chỉ số.                                                     |

## 5.8. Quy tắc mục tiêu và Dashboard

| Mã         | Quy tắc                                                                         |
| ---------- | ------------------------------------------------------------------------------- |
| BR-DASH-01 | Dashboard chỉ hiển thị dữ liệu của người dùng đang đăng nhập.                   |
| BR-DASH-02 | Dữ liệu tổng hợp phải dựa trên các bản ghi thực tế.                             |
| BR-DASH-03 | Không có dữ liệu thì hiển thị trạng thái chưa có dữ liệu, không tự tạo số liệu. |
| BR-DASH-04 | Tiến độ mục tiêu được tính theo dữ liệu thực tế và mục tiêu đang áp dụng.       |
| BR-DASH-05 | Thay đổi mục tiêu không làm thay đổi các bản ghi lịch sử.                       |

## 5.9. Quy tắc thời gian và dữ liệu

| Mã        | Quy tắc                                                          |
| --------- | ---------------------------------------------------------------- |
| BR-SYS-01 | Thời gian lưu trữ trên Backend thống nhất theo UTC.              |
| BR-SYS-02 | Thời gian hiển thị theo múi giờ thiết bị người dùng.             |
| BR-SYS-03 | Việc xác định ngày thống kê phải dựa trên múi giờ người dùng.    |
| BR-SYS-04 | Dữ liệu lịch sử không được tự động ghi đè bởi dữ liệu mới.       |
| BR-SYS-05 | Các thao tác xóa và cập nhật phải kiểm tra quyền sở hữu dữ liệu. |
| BR-SYS-06 | API phải xác thực dữ liệu đầu vào trước khi ghi vào Database.    |

## 5.10. Quy tắc thông báo

| Mã         | Quy tắc                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| BR-NOTI-01 | Chỉ gửi thông báo khi người dùng đã bật loại nhắc nhở tương ứng.             |
| BR-NOTI-02 | Người dùng có quyền thay đổi thời gian nhắc.                                 |
| BR-NOTI-03 | Khi tắt nhắc nhở, các thông báo tương ứng phải được hủy hoặc ngừng lên lịch. |
| BR-NOTI-04 | Thông báo không được tự ý thay đổi dữ liệu sức khỏe.                         |
| BR-NOTI-05 | Lịch nhắc phải được xử lý phù hợp khi múi giờ thiết bị thay đổi.             |

---

# PHẦN VI. YÊU CẦU GIAO DIỆN NGƯỜI DÙNG

## 6.1. Định hướng thiết kế

- Phong cách: Premium Wellness, hiện đại, tối giản.
- Màu chủ đạo: #166534.
- Màu nhấn: #22C55E.
- Màu nền: #F0FDF4.
- Màu chữ: #172033.
- Font chữ: Inter.
- Bo góc card: 14–20px.
- Hỗ trợ Light Mode và Dark Mode.

## 6.2. Cấu trúc điều hướng

Ứng dụng sử dụng thanh điều hướng 5 tab:

1. Home – Tổng quan.
2. Activity – Hoạt động.
3. Health – Hồ sơ sức khỏe.
4. Reminder – Nhắc nhở.
5. Profile – Cá nhân.

## 6.3. Danh sách màn hình chính

| Nhóm           | Màn hình                                           |
| -------------- | -------------------------------------------------- |
| Authentication | Splash, Onboarding, Login, Register                |
| Home           | Dashboard, Daily Summary                           |
| Water          | Water Dashboard, Add Water, Water History          |
| Sleep          | Sleep Dashboard, Add Sleep, Sleep History          |
| Activity       | Activity Overview, Add Activity                    |
| Medication     | Medication List, Add Medication, Schedule, History |
| Nutrition      | Food Diary, Add Meal, Food Detail                  |
| Health Records | Health Dashboard, Add Record, Record Detail        |
| Profile        | Personal Profile, Goals, Settings, Privacy         |

## 6.4. Trạng thái giao diện bắt buộc

Các màn hình có dữ liệu cần hỗ trợ:

- Loading: đang tải dữ liệu.
- Empty: chưa có dữ liệu.
- Success: thao tác thành công.
- Error: xảy ra lỗi.
- Offline: mất kết nối mạng.
- Permission Denied: người dùng chưa cấp quyền cần thiết.

---

# PHẦN VII. YÊU CẦU DỮ LIỆU VÀ TÍCH HỢP

## 7.1. Nhóm dữ liệu chính

| Bảng                     | Mục đích                 |
| ------------------------ | ------------------------ |
| users                    | Tài khoản người dùng     |
| health_profiles          | Hồ sơ cá nhân            |
| health_goals             | Mục tiêu sức khỏe        |
| water_logs               | Lịch sử uống nước        |
| sleep_logs               | Lịch sử giấc ngủ         |
| activity_logs            | Lịch sử hoạt động        |
| medications              | Danh sách thuốc          |
| medication_schedules     | Lịch nhắc thuốc          |
| medication_logs          | Lịch sử uống thuốc       |
| food_items               | Danh mục thực phẩm       |
| meal_logs                | Nhật ký bữa ăn           |
| meal_items               | Chi tiết món ăn          |
| health_records           | Hồ sơ và chỉ số sức khỏe |
| health_attachments       | Tệp đính kèm             |
| notification_preferences | Cấu hình thông báo       |

## 7.2. Quan hệ dữ liệu

- Một User có một Health Profile.
- Một User có nhiều Health Goals.
- Một User có nhiều Water Logs.
- Một User có nhiều Sleep Logs.
- Một User có nhiều Activity Logs.
- Một User có nhiều Medications.
- Một Medication có nhiều Medication Schedules.
- Một Medication Schedule có nhiều Medication Logs.
- Một User có nhiều Meal Logs.
- Một Meal Log có nhiều Meal Items.
- Một Food Item có thể xuất hiện trong nhiều Meal Items.
- Một User có nhiều Health Records.
- Một Health Record có thể có nhiều Health Attachments.

## 7.3. Tích hợp bên ngoài

### Apple HealthKit

Chỉ đọc những loại dữ liệu cần thiết khi người dùng cấp quyền.

### Android Health Connect

Chỉ yêu cầu các quyền dữ liệu cần thiết và được nền tảng hỗ trợ.

### Supabase Storage

Lưu trữ tệp đính kèm với cơ chế bảo vệ quyền truy cập.

---

# PHẦN VIII. PHẠM VI MVP VÀ NGOÀI PHẠM VI

## 8.1. Chức năng bắt buộc của MVP

- Đăng ký, đăng nhập, đăng xuất.
- Quản lý hồ sơ cá nhân.
- Dashboard tổng quan.
- Ghi nhận và thống kê nước uống.
- Ghi nhận và thống kê giấc ngủ.
- Ghi nhận hoạt động thủ công.
- Quản lý thuốc và lịch nhắc.
- Nhật ký dinh dưỡng cơ bản.
- Quản lý hồ sơ sức khỏe thủ công.
- Thông báo nhắc nhở.
- Cài đặt quyền riêng tư.
- Xuất và xóa dữ liệu theo phạm vi hỗ trợ.

## 8.2. Chức năng phiên bản sau

- AI phân tích thói quen sức khỏe.
- Quét mã vạch thực phẩm.
- Nhận diện thực phẩm bằng hình ảnh.
- Tích hợp sâu với thiết bị đeo.
- Phân tích sức khỏe nâng cao.
- Hệ thống gợi ý thói quen thông minh.
- Đồng bộ dữ liệu đa thiết bị nâng cao.

## 8.3. Ngoài phạm vi

- Chẩn đoán bệnh.
- Kê đơn thuốc.
- Tự động điều chỉnh liều thuốc.
- Thay thế tư vấn của bác sĩ.
- Đo huyết áp, đường huyết bằng camera điện thoại.
- Cung cấp kết luận y tế dựa trên dữ liệu không đáng tin cậy.

---

# PHẦN IX. TIÊU CHÍ NGHIỆM THU

## 9.1. Xác thực

- Người dùng đăng ký được tài khoản hợp lệ.
- Không cho phép đăng ký trùng email.
- Đăng nhập sai phải hiển thị thông báo phù hợp.
- Người chưa xác thực không thể truy cập API cá nhân.

## 9.2. Nước uống

- Có thể thêm, sửa và xóa bản ghi.
- Tổng lượng nước tính đúng.
- Thống kê theo ngày và tuần chính xác.
- Thay đổi mục tiêu không làm thay đổi dữ liệu cũ.

## 9.3. Giấc ngủ

- Tính đúng thời lượng ngủ qua nửa đêm.
- Không chấp nhận thời gian không hợp lệ.
- Lịch sử được hiển thị đúng ngày.

## 9.4. Hoạt động

- Có thể thêm và xem lịch sử hoạt động.
- Không chấp nhận số bước hoặc thời lượng âm.
- Dữ liệu đồng bộ không bị trùng lặp ngoài ý muốn.

## 9.5. Thuốc

- Có thể thêm thuốc và thiết lập lịch.
- Thông báo xuất hiện theo lịch khi thiết bị cho phép.
- Có thể đánh dấu đã uống hoặc bỏ qua.
- Lịch sử uống thuốc được lưu chính xác.

## 9.6. Dinh dưỡng

- Có thể tạo nhật ký bữa ăn.
- Có thể thêm thực phẩm.
- Tính toán dinh dưỡng đúng khi có dữ liệu nguồn.
- Dữ liệu lịch sử không bị thay đổi khi danh mục thực phẩm cập nhật.

## 9.7. Hồ sơ sức khỏe

- Có thể thêm, sửa và xem bản ghi.
- Giá trị và đơn vị hợp lệ.
- Tệp đính kèm được bảo vệ.
- Không thể truy cập hồ sơ của người dùng khác.

## 9.8. Bảo mật và quyền riêng tư

- API kiểm tra quyền sở hữu dữ liệu.
- Không trả về dữ liệu của tài khoản khác.
- Refresh Token được quản lý an toàn.
- Có cơ chế xuất và xóa dữ liệu.
- Người dùng có thể từ chối quyền HealthKit/Health Connect mà vẫn sử dụng các chức năng nhập thủ công.

---

# PHẦN X. GIẢ ĐỊNH VÀ RỦI RO

## 10.1. Giả định

- Người dùng có thiết bị chạy iOS hoặc Android được hỗ trợ.
- Người dùng có thể nhập dữ liệu sức khỏe thủ công.
- Backend có kết nối đến PostgreSQL.
- Người dùng tự chịu trách nhiệm về tính chính xác của dữ liệu tự nhập.
- Dữ liệu từ nền tảng sức khỏe bên ngoài phụ thuộc quyền và khả năng tương thích thiết bị.

## 10.2. Rủi ro

| Rủi ro                              | Hướng xử lý                                          |
| ----------------------------------- | ---------------------------------------------------- |
| Người dùng không cấp quyền sức khỏe | Cho phép nhập dữ liệu thủ công                       |
| Không có mạng                       | Hiển thị trạng thái offline và xử lý đồng bộ phù hợp |
| Thông báo không xuất hiện           | Kiểm tra quyền thông báo và lịch trên thiết bị       |
| Dữ liệu sức khỏe không chính xác    | Hiển thị nguồn dữ liệu và thời điểm ghi nhận         |
| Lộ dữ liệu cá nhân                  | Kiểm soát quyền truy cập, mã hóa và kiểm thử bảo mật |
| Tích hợp native mất thời gian       | Ưu tiên hoàn thành MVP thủ công trước                |

---

# KẾT THÚC TÀI LIỆU

**VitaCare – Your Health, Your Life.**

Tài liệu này là cơ sở đặc tả cho giai đoạn thiết kế hệ thống và phát triển MVP. Các thay đổi về chức năng, dữ liệu và quy tắc nghiệp vụ cần được cập nhật vào phiên bản tài liệu tương ứng trước khi triển khai.
