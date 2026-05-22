# 🚀 Mochi Mood — Deployment & Monitoring Guide

Tài liệu này hướng dẫn cách đưa ứng dụng lên Production và cách đảm bảo ứng dụng luôn hoạt động ổn định.

## 📦 1. Triển khai (Deployment)

Mochi Mood là một ứng dụng PWA (Progressive Web App) thuần HTML/JS/CSS, do đó bạn có thể deploy lên bất kỳ static hosting nào:

- **Vercel / Netlify**: Chỉ cần kéo thả folder hoặc kết nối GitHub.
- **GitHub Pages**: Đảm bảo đường dẫn trong `manifest.json` và `sw.js` là đúng (thường là `./`).
- **Firebase Hosting**: Phù hợp nếu bạn muốn dùng thêm các dịch vụ của Google.

### Lưu ý quan trọng khi Deploy:
1. **HTTPS**: PWA bắt buộc phải chạy trên HTTPS để Service Worker hoạt động.
2. **Cấu hình Meta Tags**: Đảm bảo các thẻ `<meta name="sb-url">` và `<meta name="sb-key">` trong `index.html` đã được cập nhật đúng với môi trường Production.

## 🔍 2. Giám sát (Monitoring)

Để biết app có hoạt động tốt hay không ("Health Check"), bạn nên thiết lập các công cụ sau:

### A. Kiểm tra Uptime (Miễn phí)
Sử dụng [UptimeRobot](https://uptimerobot.com/) hoặc [Cron-job.org](https://cron-job.org/) để ping vào URL của bạn mỗi 5-15 phút. Nếu site bị sập (500, 404), bạn sẽ nhận được thông báo ngay.

### B. Giám sát lỗi (Error Tracking)
Tích hợp [Sentry](https://sentry.io/) (có gói miễn phí rất tốt). 
- Khi người dùng gặp lỗi JS mà bạn không thấy, Sentry sẽ báo cáo chính xác dòng code bị lỗi và thiết bị của người dùng.
- Cách cài đặt: Thêm script Sentry vào đầu file `index.html`.

### C. Hiệu năng (Performance)
Sử dụng **Google Lighthouse** (phím F12 -> tab Lighthouse) để đo các chỉ số:
- **LCP (Largest Contentful Paint)**: Thời gian load nội dung chính (< 2.5s là tốt).
- **CLS (Cumulative Layout Shift)**: Độ ổn định của giao diện (tránh nhảy khung hình).

## 🛡️ 3. Kiểm tra bảo mật (Security Check)

Trước khi công bố, hãy đảm bảo:
1. **RLS (Row Level Security)**: Đã chạy file `SUPABASE_POLICIES.sql` trên Supabase Dashboard.
2. **API Keys**: Không có key nào bị hardcode trong file JS (kiểm tra `config.js`).

---
*Chúc mừng bạn! Với các công cụ giám sát này, Mochi Mood của bạn sẽ luôn ở trạng thái 10/10.*
