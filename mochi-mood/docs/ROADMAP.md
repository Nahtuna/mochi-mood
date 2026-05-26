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

## 🧠 PHẦN 4: KẾT NỐI GEMINI AI & TRỢ LÝ CHỮA LÀNH (Gemini AI & Healing Companion)

Sử dụng **Google AI Studio (Gemini API)** để biến Mochi Mood từ một công cụ ghi chép thông thường thành một người bạn ảo thấu cảm và một chuyên gia hỗ trợ tinh thần đắc lực cho người dùng.

### 1. AI Journal Insights (Thấu cảm nhật ký)
*AI tự động lắng nghe và phân tích tâm sự của bạn, gửi lại một lá thư tay "Healing Note" mộc mạc dưới mỗi trang viết.*
*   **Trải nghiệm người dùng:** Sau khi lưu nhật ký, dưới chân bài viết sẽ xuất hiện một vùng Glassmorphism lấp lánh mờ ảo. Khi nhấn vào, một phong thư ảo sẽ mở ra chứa lời khuyên, sự thấu cảm và một câu nói khích lệ được cá nhân hóa hoàn hảo dựa trên nội dung bạn vừa viết.
*   **Cách triển khai:** 
    *   Gọi Gemini API (`gemini-2.5-flash`) sau khi bài viết được tạo/cập nhật thành công.
    *   Sử dụng System Prompt được tinh chỉnh chuyên sâu để AI đóng vai một nhà tham vấn tâm lý chữa lành đầy ấm áp, tinh tế, không phán xét.
    *   Yêu cầu API trả về cấu trúc JSON gồm: `emotions` (mảng các cảm xúc cốt lõi phát hiện được để tag thêm), `healing_note` (lá thư phản hồi), và `daily_quote` (câu châm ngôn truyền động lực).

### 2. Mochi AI Chat Companion (Bé Mochi ảo trò chuyện 24/7)
*Một góc nhỏ bình yên trong ứng dụng để người dùng trút bầu tâm sự trực tiếp với Bé Mochi ảo bất cứ khi nào cảm thấy cô đơn.*
*   **Trải nghiệm người dùng:** Một tab/nút trò chuyện dễ thương với hình ảnh động của chú Mochi. Giao diện chat bong bóng nước pastel mềm mại. Mochi nói chuyện cực kỳ ngọt ngào, dùng nhiều emoji dễ thương và thấu hiểu cảm xúc cực tốt.
*   **Cách triển khai:**
    *   Tạo module `src/modules/aichat.js` và giao diện chat tích hợp trong ứng dụng.
    *   Sử dụng chế độ Chat Session (`model.startChat({ history: [...] })`) của Gemini để lưu giữ mạch trò chuyện.
    *   Định hình tính cách AI qua System Instruction: *"Bạn là Mochi, một bé bánh mochi chữa lành cực kỳ ấm áp và đáng yêu. Bạn luôn lắng nghe, chia sẻ nỗi buồn, chúc mừng niềm vui và thấu cảm với mọi tâm sự của người dùng. Hãy sử dụng các hành động bằng emoji như `*(Mochi ôm bạn thật chặt)*` hoặc `*(Mochi vỗ đầu bạn)*` để tăng tính chân thật."*

### 3. Healing Recommendation Engine (Đề xuất hoạt động hồi phục)
*Thay vì để người dùng tự tìm cách vượt qua nỗi buồn, AI sẽ tự động phân tích biểu đồ tâm trạng tuần qua và đề xuất "đơn thuốc chữa lành" phù hợp nhất.*
*   **Trải nghiệm người dùng:** Trên trang Stats (Thống kê), bên cạnh các biểu đồ sẽ có thêm mục "Mochi khuyên bạn hôm nay". Nếu bạn buồn nhiều, AI sẽ gợi ý các hoạt động như thiền thở 3 phút, nghe một bản nhạc lofi piano cụ thể, hoặc tắt máy đi dạo.
*   **Cách triển khai:**
    *   Tổng hợp dữ liệu tâm trạng và hoạt động gần đây từ `state.entries` trong tuần qua.
    *   Gửi tóm tắt dữ liệu này sang Gemini API kèm prompt yêu cầu đề xuất 3 hoạt động chữa lành cụ thể kèm lý do ngắn gọn.
    *   Hiển thị dưới dạng các thẻ (cards) tương tác sinh động, cho phép người dùng click để bắt đầu hoạt động ngay.

---

## 🌸 PHẦN 5: CHÂN TRỜI ÂM THANH CHỮA LÀNH (Soundscapes & Ambient Mixer)

*Âm thanh là liều thuốc chữa lành nhanh nhất cho những tâm hồn đang xao động sau ngày dài mệt mỏi.*

*   **Ambient Sound Mixer (Tự mix âm thanh thiên nhiên):** 
    *   **Trải nghiệm người dùng:** Một trình phát nhạc tối giản được thiết kế dưới dạng Glassmorphism. Người dùng có thể kéo các thanh trượt để tự hòa trộn âm thanh nền của riêng mình: Tiếng mưa rơi tí tách trên mái ngói, tiếng lửa trại bập bùng ấm áp, tiếng sóng biển vỗ về đêm, tiếng dế kêu thanh bình trong vườn hay tiếng chuông gió rung rinh.
    *   **Cách triển khai:** Sử dụng thư viện Web Audio API chuẩn để điều khiển nhiều phần tử `<audio>` song song. Các tệp âm thanh gốc chất lượng cao được nén cực nhỏ dạng `.mp3` hoặc `.ogg` chạy lặp liên tục (`loop = true`), cho phép chỉnh âm lượng riêng biệt từng tệp để tạo ra bầu không khí độc nhất.
*   **Binaural Beats & Lofi Music:**
    *   Tích hợp nhạc sóng não giúp cân bằng tinh thần: Sóng Alpha (tập trung làm việc), Sóng Theta (thiền định sâu) và Sóng Delta (cho giấc ngủ ngon).
    *   Hợp tác hoặc tích hợp danh sách phát nhạc Lofi mộc mạc chạy mượt mà ngay cả khi khóa màn hình (Background Audio).

---

## 🧸 PHẦN 6: GÓC BÌNH YÊN — NUÔI DƯỠNG MOCHI (Cozy Room & Virtual Pet)

*Biến việc ghi chép nhật ký khô khan thành một trò chơi hóa (Gamification) chữa lành, thúc đẩy người dùng duy trì thói quen viết mỗi ngày.*

*   **Bé Mochi Ảo Đồng Hành:**
    *   **Trải nghiệm người dùng:** Chú Mochi tròn trịa đáng yêu sẽ sống trên màn hình của bạn. Tâm trạng của Bé Mochi sẽ đồng cảm sâu sắc với chủ nhân: Khi bạn hạnh phúc, Mochi sẽ nhảy múa tung tăng; khi bạn buồn, Mochi sẽ ngồi một góc ôm đầu hoặc gửi những hành động vỗ về ngọt ngào.
    *   **Hạt Sương Ngọt Ngào (Sweet Dews):** Mỗi ngày ghi chép nhật ký cảm xúc hoặc hoàn thành bài thiền thở, người dùng sẽ nhận được "hạt sương".
*   **Thiết Kế Căn Phòng Cozy Room:**
    *   Người dùng dùng hạt sương tích lũy để mở khóa các món đồ nhỏ xinh trang trí căn phòng của Mochi (như chậu sen đá xanh mát, chiếc gối ôm hình đám mây, hay khung cửa sổ ngắm mưa bay).
    *   **Cách triển khai:** Sử dụng ảnh vector SVG động chất lượng cao kết hợp CSS Keyframes để giữ hiệu năng siêu mượt 60fps trên di động, tránh sử dụng các file gif nặng nề làm chậm ứng dụng.

---

## 📅 PHẦN 7: THỬ THÁCH & NGHI THỨC TỰ YÊU BẢN THÂN (Self-Care Rituals & Challenges)

*Giúp người dùng chuyển đổi từ ghi chép tâm trạng thụ động sang chủ động thực hiện các hành động hồi phục sức khỏe tinh thần.*

*   **Self-Care Rituals (Nghi thức hàng ngày):**
    *   Người dùng có thể cài đặt checklist các nghi thức nhỏ buổi sáng/tối: *Uống một cốc nước ấm khi thức dậy, giãn cơ nhẹ nhàng 2 phút, viết 3 điều biết ơn hôm nay, gửi lời chúc ngủ ngon tới người yêu thương.*
    *   Giao diện checklist thiết kế tối giản, mỗi khi tích chọn sẽ có âm thanh lách cách vui tai và hiệu ứng bong bóng nước nổ nhẹ.
*   **Healing Challenges (Thử thách chữa lành theo chặng):**
    *   *Thử thách 7 ngày biết ơn (Gratitude Challenge):* Giúp trân trọng những điều bình dị quanh mình.
    *   *Thử thách 10 ngày kết nối thiên nhiên (Mindfulness in Nature):* Khuyến khích ra ngoài đi dạo và chụp lại một nhành cây nhỏ.
    *   **Cách triển khai:** Sử dụng Reactive Store (`state.js`) để theo dõi tiến trình thử thách, tự động lưu trữ trạng thái vào Supabase và kích hoạt trao tặng các Huy hiệu (Badges) danh giá trong trang Profile khi hoàn thành chặng.

---

## 📅 KẾ HOẠCH TRIỂN KHAI THỰC CHIẾN (Updated Execution Plan)

| Giai đoạn | Tính năng cốt lõi | Trạng thái | Độ ưu tiên |
|---|---|---|---|
| **Phase 1** | Mài giũa Camera (Filters hoài cổ, Khung Polaroid, Nén WebP Client) | ⏳ Sẵn sàng | 🔴 High |
| **Phase 2** | Kết nối Google AI Studio (Tích hợp API, Thấu cảm nhật ký AI) | ⏳ Sẵn sàng | 🔴 High |
| **Phase 3** | Bé Mochi AI Companion Chat (Hộp chat trút bầu tâm sự 24/7) | ⏳ Sẵn sàng | 🟡 Medium |
| **Phase 4** | Biểu đồ Mood Flow SVG mềm mại & Phân tích múi giờ nhạy cảm | ⏳ Sẵn sàng | 🟡 Medium |
| **Phase 5** | Chân trời âm thanh chữa lành (Soundscapes & Ambient Sound Mixer) | ⏳ Sẵn sàng | 🟡 Medium |
| **Phase 6** | Góc bình yên (Nuôi dưỡng Mochi ảo & Decor Cozy Room) | ⏳ Sẵn sàng | 🟢 Low |
| **Phase 7** | Thử thách & Thói quen tự yêu bản thân (Self-Care Rituals) | ✅ Hoàn thành | 🟢 Low |
| **Phase 8** | Mã PIN Lock Glassmorphism & Tích hợp FaceID/TouchID | ✅ Hoàn thành | 🟢 Low |

---

*“Một ứng dụng chữa lành không chỉ cần code chạy đúng, nó cần các chuyển động mượt mà, phản hồi tinh tế và cảm xúc ấm áp đằng sau từng lần chạm.”*

