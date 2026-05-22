# 🗺️ Mochi Mood — Lộ Trình Nâng Cấp (Future Roadmap)

Chào Tuấn Anh! Dưới đây là bản **Roadmap nâng cấp** chi tiết và thực chiến được thiết kế riêng cho **Mochi Mood**, tập trung mạnh mẽ vào việc mài giũa tính năng **Camera** – tính năng "ăn tiền" nhất của một ứng dụng nhật ký chữa lành – cùng với các nâng cấp giao diện khác để biến nó thành một ứng dụng thương mại hóa chuyên nghiệp.

---

## 📸 PHẦN 1: MÀI GIŨA CAMERA — TÍNH NĂNG "ĂN TIỀN" (Killer Feature)

Để biến Camera thường thành một Camera "chữa lành" mang phong cách Polaroid, Lomo và Vintage, dưới đây là các tính năng cụ thể cần bổ sung:

### 1. Retro & Pastel Filters (Bộ lọc màu Canvas)
*Tạo cảm giác hoài niệm, ấm áp ngay khi chụp ảnh bằng cách can thiệp vào pixel của Canvas.*
- **Polaroid Classic**: Tăng độ tương phản nhẹ, ngả vàng ấm.
- **Mochi Pink**: Phủ một lớp filter màu hồng pastel mờ ảo làm mịn da.
- **Cozy Forest**: Tông xanh lá cây dịu nhẹ, giảm độ bão hòa (desaturate).
- **Cách triển khai**: Sử dụng thuộc tính `ctx.filter` (ví dụ: `ctx.filter = "contrast(1.1) sepia(0.2) saturate(0.9)"`) hoặc tạo các lớp phủ gradient bán trong suốt màu hồng/vàng ấm lên trên canvas trước khi xuất file ảnh.

### 2. Cute Polaroid Frame Templates (Khung ảnh Mochi)
*Người dùng chụp xong ảnh sẽ tự động được lồng vào các khung ảnh xinh xắn.*
- **Khung Polaroid**: Khung viền trắng viền dày ở phía dưới để người dùng có thể viết chữ nhỏ lên đó.
- **Khung Sticker dễ thương**: Thêm các sticker Mochi (bánh ngọt, thỏ con, ngôi sao lấp lánh) ở 4 góc ảnh.
- **Cách triển khai**: Thiết kế sẵn 3-4 file khung ảnh dạng PNG trong suốt. Khi người dùng chụp ảnh xong, vẽ đè (draw) ảnh PNG này lên canvas trước khi chạy lệnh `canvas.toDataURL()`.

### 3. Nâng cấp Camera UX (Trải nghiệm cực mượt)
- **Haptic Feedback (Rung phản hồi)**: Khi nhấn nút chụp hoặc đổi camera trên điện thoại, kích hoạt bộ rung nhẹ của thiết bị bằng cách gọi `navigator.vibrate(15)` hoặc `navigator.vibrate([10, 30, 10])`. Cảm giác chụp sẽ chân thật và sướng tay như trên iPhone thật.
- **Shutter Sound (Âm thanh màn trập)**: Phát một tiếng "click" nhẹ ấm áp khi nhấn chụp. Sử dụng Web Audio API để tạo tiếng click tự nhiên mà không cần load file MP3 nặng nề.
- **Grid 3x3 (Khung căn tỷ lệ)**: Thêm nút bật/tắt lưới 3x3 mờ để người dùng dễ căn góc chụp ảnh "nghệ thuật" hơn.
- **Countdown Timer (Hẹn giờ chụp 3s/5s)**: Cho người dùng thời gian 3 giây để tạo dáng đẹp trước khi camera tự động chụp.

### 4. Client-side Image Compression (Tối ưu hóa dung lượng)
- Nén và chuyển đổi ảnh sang định dạng WebP trực tiếp trên trình duyệt của người dùng trước khi tải lên Supabase Storage. Điều này giúp:
  - Tốc độ tải ảnh lên mạng nhanh gấp 3 lần.
  - Tiết kiệm 70% dung lượng lưu trữ của Supabase (ảnh chụp gốc 3-4MB sẽ chỉ còn khoảng 150-250KB nhưng vẫn giữ được độ sắc nét).

---

## 📊 PHẦN 2: THỐNG KÊ CẢM XÚC (Insights & Statistics)
*(Đang tìm kiếm thêm nguồn tham khảo, dưới đây là các ý tưởng cốt lõi để chuẩn bị)*

- **Mood Flow (Dòng chảy cảm xúc)**: Thay vì biểu đồ cột khô khan, sử dụng Canvas API hoặc SVG tạo một đường sóng uốn lượn mượt mà nối các ngày trong tuần. Tự động đổi màu đường sóng dựa trên mood trung bình của ngày hôm đó (Xanh pastel khi bình yên, Hồng khi hạnh phúc).
- **Thống kê theo múi giờ**: Biểu đồ cho biết người dùng thường buồn vào thời điểm nào (ví dụ: "Bạn thường lo lắng nhất vào khoảng 22:00 - 24:00 đêm").
- **Tương quan Hoạt động & Cảm xúc**: Thống kê thông minh: "💼 Công việc là lý do khiến bạn mệt mỏi nhất (3 lần)" hoặc "🍜 Ăn uống giúp bạn hạnh phúc nhất (5 lần)".

---

## 🔒 PHẦN 3: BẢO MẬT & CHIA SẺ ĐÔI (Security & Partnering)

- **Mã PIN 4 số thật (Real PIN Lock)**:
  - Khi mở ứng dụng (nếu đã bật bảo mật), một màn hình che phủ (overlay) toàn trang sẽ hiện lên yêu cầu nhập 4 mã số.
  - Sử dụng CSS Glassmorphism siêu mờ để che giấu nội dung nhật ký bên dưới.
  - Cho phép người dùng chọn mở khóa bằng FaceID/TouchID thông qua thư viện `WebAuthn API` của trình duyệt.
- **Real-time Chat & Widget**:
  - Tối ưu hóa kênh Supabase Realtime để khi hai người gửi tim, hiệu ứng bắn Confetti tim bay phấp phới sẽ hiển thị trực tiếp trên điện thoại của đối phương chỉ trong 0.1 giây.

---

*“Một ứng dụng chữa lành không chỉ cần code chạy đúng, nó cần các chuyển động mượt mà, phản hồi tinh tế và cảm xúc đằng sau từng lần chạm.”*
