# BUSINESS RULES (QUY TẮC NGHIỆP VỤ)
# VITACARE – YOUR HEALTH, YOUR LIFE

**Phiên bản:** 1.0  
**Tài liệu tham chiếu:** [SRS.md](file:///d:/HKDN_MOBLIEAPP/VitaCare%20–%20Your%20Health/docs/SRS.md)  
**Trích xuất từ:** Phần V. Quy tắc nghiệp vụ

---

## 5.1. Quy tắc tài khoản

| Mã | Quy tắc |
|---|---|
| BR-AUTH-01 | Mỗi email chỉ được đăng ký một tài khoản. |
| BR-AUTH-02 | Người dùng phải xác thực trước khi sử dụng dữ liệu cá nhân. |
| BR-AUTH-03 | Người dùng chỉ được truy cập dữ liệu thuộc tài khoản của mình. |
| BR-AUTH-04 | Mật khẩu không được lưu dưới dạng văn bản thuần. |
| BR-AUTH-05 | Khi xóa tài khoản, dữ liệu cá nhân phải được xử lý theo chính sách xóa dữ liệu. |

---

## 5.2. Quy tắc nước uống

| Mã | Quy tắc |
|---|---|
| BR-WATER-01 | Mỗi bản ghi nước uống phải có lượng nước lớn hơn 0 ml. |
| BR-WATER-02 | Lượng nước được lưu theo đơn vị ml. |
| BR-WATER-03 | Tổng lượng nước trong ngày bằng tổng các bản ghi thuộc ngày đó. |
| BR-WATER-04 | Phần trăm hoàn thành = tổng lượng nước / mục tiêu × 100%. |
| BR-WATER-05 | Nếu vượt mục tiêu, hệ thống vẫn ghi nhận lượng nước thực tế; tiến độ có thể hiển thị tối đa 100%. |
| BR-WATER-06 | Người dùng chỉ được sửa hoặc xóa bản ghi của mình. |
| BR-WATER-07 | Khi thay đổi mục tiêu, lịch sử lượng nước đã uống không bị thay đổi. |

---

## 5.3. Quy tắc giấc ngủ

| Mã | Quy tắc |
|---|---|
| BR-SLEEP-01 | Thời điểm kết thúc phải sau thời điểm bắt đầu xét theo thời gian thực. |
| BR-SLEEP-02 | Nếu thời gian ngủ qua nửa đêm, hệ thống phải tính đúng ngày kết thúc. |
| BR-SLEEP-03 | Thời lượng ngủ được tính bằng thời điểm kết thúc trừ thời điểm bắt đầu. |
| BR-SLEEP-04 | Mỗi bản ghi phải thuộc về một người dùng. |
| BR-SLEEP-05 | Không cho phép bản ghi có thời lượng bằng 0 hoặc âm. |
| BR-SLEEP-06 | Chất lượng giấc ngủ là thông tin đánh giá chủ quan do người dùng cung cấp. |

---

## 5.4. Quy tắc hoạt động

| Mã | Quy tắc |
|---|---|
| BR-ACT-01 | Mỗi bản ghi hoạt động phải có loại hoạt động. |
| BR-ACT-02 | Thời lượng hoạt động phải lớn hơn 0 nếu có nhập. |
| BR-ACT-03 | Số bước chân không được âm. |
| BR-ACT-04 | Dữ liệu đồng bộ phải lưu nguồn dữ liệu. |
| BR-ACT-05 | Bản ghi đồng bộ cần có cơ chế chống trùng lặp. |
| BR-ACT-06 | Không tự tạo dữ liệu bước chân nếu không có nguồn đáng tin cậy. |

---

## 5.5. Quy tắc quản lý thuốc

| Mã | Quy tắc |
|---|---|
| BR-MED-01 | Tên thuốc không được để trống. |
| BR-MED-02 | Thông tin liều dùng phải do người dùng nhập hoặc xác nhận. |
| BR-MED-03 | Thời gian kết thúc không được trước thời gian bắt đầu. |
| BR-MED-04 | Lịch nhắc phải có ít nhất một thời điểm nhắc hợp lệ. |
| BR-MED-05 | Mỗi lần xác nhận uống thuốc phải gắn với lịch nhắc hoặc bản ghi hợp lệ. |
| BR-MED-06 | Trạng thái gồm: PENDING, TAKEN, SKIPPED. |
| BR-MED-07 | Không tự động đánh dấu đã uống khi người dùng chưa xác nhận. |
| BR-MED-08 | Việc chỉnh sửa lịch thuốc không được làm mất lịch sử đã ghi nhận. |
| BR-MED-09 | Hệ thống không tự ý đề xuất, kê đơn hoặc thay đổi liều dùng. |

---

## 5.6. Quy tắc dinh dưỡng

| Mã | Quy tắc |
|---|---|
| BR-NUT-01 | Mỗi nhật ký bữa ăn phải thuộc một người dùng. |
| BR-NUT-02 | Loại bữa ăn gồm: BREAKFAST, LUNCH, DINNER, SNACK. |
| BR-NUT-03 | Khẩu phần phải lớn hơn 0. |
| BR-NUT-04 | Giá trị dinh dưỡng chỉ được tính khi có dữ liệu thành phần phù hợp. |
| BR-NUT-05 | Dữ liệu dinh dưỡng đã ghi nhận phải được lưu thành snapshot để tránh thay đổi lịch sử khi danh mục thực phẩm cập nhật. |
| BR-NUT-06 | Thực phẩm do người dùng tự tạo phải được phân biệt với thực phẩm trong danh mục hệ thống. |
| BR-NUT-07 | Không được tự suy đoán thành phần dinh dưỡng khi thiếu dữ liệu. |

---

## 5.7. Quy tắc hồ sơ sức khỏe

| Mã | Quy tắc |
|---|---|
| BR-HEALTH-01 | Mỗi bản ghi phải có loại chỉ số, giá trị và đơn vị phù hợp. |
| BR-HEALTH-02 | Mỗi bản ghi phải có thời điểm ghi nhận. |
| BR-HEALTH-03 | Phải lưu nguồn dữ liệu: MANUAL, HEALTHKIT hoặc HEALTH_CONNECT. |
| BR-HEALTH-04 | Không được tự tạo kết quả đo sức khỏe từ cảm biến điện thoại nếu không có khả năng đo đáng tin cậy. |
| BR-HEALTH-05 | Tệp đính kèm phải thuộc về hồ sơ của người dùng tương ứng. |
| BR-HEALTH-06 | Khi chỉnh sửa hoặc xóa bản ghi, hệ thống phải đảm bảo quyền sở hữu. |
| BR-HEALTH-07 | Giá trị và đơn vị phải phù hợp với loại chỉ số. |

---

## 5.8. Quy tắc mục tiêu và Dashboard

| Mã | Quy tắc |
|---|---|
| BR-DASH-01 | Dashboard chỉ hiển thị dữ liệu của người dùng đang đăng nhập. |
| BR-DASH-02 | Dữ liệu tổng hợp phải dựa trên các bản ghi thực tế. |
| BR-DASH-03 | Không có dữ liệu thì hiển thị trạng thái chưa có dữ liệu, không tự tạo số liệu. |
| BR-DASH-04 | Tiến độ mục tiêu được tính theo dữ liệu thực tế và mục tiêu đang áp dụng. |
| BR-DASH-05 | Thay đổi mục tiêu không làm thay đổi các bản ghi lịch sử. |

---

## 5.9. Quy tắc thời gian và dữ liệu

| Mã | Quy tắc |
|---|---|
| BR-SYS-01 | Thời gian lưu trữ trên Backend thống nhất theo UTC. |
| BR-SYS-02 | Thời gian hiển thị theo múi giờ thiết bị người dùng. |
| BR-SYS-03 | Việc xác định ngày thống kê phải dựa trên múi giờ người dùng. |
| BR-SYS-04 | Dữ liệu lịch sử không được tự động ghi đè bởi dữ liệu mới. |
| BR-SYS-05 | Các thao tác xóa và cập nhật phải kiểm tra quyền sở hữu dữ liệu. |
| BR-SYS-06 | API phải xác thực dữ liệu đầu vào trước khi ghi vào Database. |

---

## 5.10. Quy tắc thông báo

| Mã | Quy tắc |
|---|---|
| BR-NOTI-01 | Chỉ gửi thông báo khi người dùng đã bật loại nhắc nhở tương ứng. |
| BR-NOTI-02 | Người dùng có quyền thay đổi thời gian nhắc. |
| BR-NOTI-03 | Khi tắt nhắc nhở, các thông báo tương ứng phải được hủy hoặc ngừng lên lịch. |
| BR-NOTI-04 | Thông báo không được tự ý thay đổi dữ liệu sức khỏe. |
| BR-NOTI-05 | Lịch nhắc phải được xử lý phù hợp khi múi giờ thiết bị thay đổi. |

