-- ==========================================
-- MOCHI MOOD: SUPABASE RLS POLICIES
-- Chạy script này trong SQL Editor của Supabase để bảo mật dữ liệu.
-- ==========================================

-- 1. Kích hoạt RLS cho tất cả các bảng
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============ BẢNG USERS ============
-- Người dùng có thể xem hồ sơ của mình và hồ sơ của đối phương (nếu đã kết nối)
CREATE POLICY "Users can view own or partner profile" 
ON users FOR SELECT 
USING (
  auth.uid() = id OR 
  auth.uid() IN (SELECT partner_id FROM users WHERE id = users.id)
);

-- Người dùng chỉ có thể cập nhật hồ sơ của chính mình
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- ============ BẢNG MOOD_ENTRIES ============
-- Người dùng xem nhật ký của mình và nhật ký của partner (nếu shared = true)
CREATE POLICY "Users can view own or shared partner entries" 
ON mood_entries FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (shared = true AND auth.uid() IN (SELECT partner_id FROM users WHERE id = mood_entries.user_id))
);

-- Người dùng chỉ có thể CRUD nhật ký của mình
CREATE POLICY "Users can manage own entries" 
ON mood_entries FOR ALL 
USING (auth.uid() = user_id);

-- ============ BẢNG CUSTOM_EVENTS ============
-- Người dùng chỉ xem/quản lý sự kiện của mình
CREATE POLICY "Users can manage own events" 
ON custom_events FOR ALL 
USING (auth.uid() = user_id);

-- ============ BẢNG MESSAGES ============
-- Người dùng xem tin nhắn mình gửi hoặc nhận
CREATE POLICY "Users can view own messages" 
ON messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Người dùng chỉ có thể gửi tin nhắn từ chính mình
CREATE POLICY "Users can send messages" 
ON messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- ============ BẢNG STORAGE (MOCHI-MOOD BUCKET) ============
-- (Chính sách này cần được cấu hình trong phần Storage của Supabase)
-- SELECT: (auth.uid() IS NOT NULL)
-- INSERT: (auth.uid() = (storage.foldername(name))[1]) -- Giả sử folder name là userId
