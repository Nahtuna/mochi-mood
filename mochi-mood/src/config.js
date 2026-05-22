// ============ SUPABASE CONFIG ============
export const SUPABASE_URL = document.querySelector('meta[name="sb-url"]')?.content || '';
export const SUPABASE_KEY = document.querySelector('meta[name="sb-key"]')?.content || '';

// ============ DATA CONSTANTS ============
export const MOODS = {
  // Tích cực
  love:      { emoji:'🥰', color:'#ffb3cc', label:'Yêu',       score:5 },
  happy:     { emoji:'😄', color:'#ffeaa7', label:'Hào hứng',  score:5 },
  excited:   { emoji:'🤩', color:'#ff9f43', label:'Phấn khích', score:5 },
  grateful:  { emoji:'🥹', color:'#ffd6e7', label:'Biết ơn',   score:5 },
  proud:     { emoji:'🥳', color:'#a29bfe', label:'Tự hào',    score:5 },
  hopeful:   { emoji:'🌟', color:'#ffe6a0', label:'Hy vọng',   score:4 },
  confident: { emoji:'😎', color:'#fff3a0', label:'Tự tin',    score:5 },
  creative:  { emoji:'🎨', color:'#ffd6a5', label:'Sáng tạo',  score:5 },
  energetic: { emoji:'⚡', color:'#fff5b0', label:'Năng lượng', score:5 },
  // Trung tính
  peaceful:  { emoji:'😌', color:'#c8e6f5', label:'Bình yên',  score:4 },
  content:   { emoji:'😋', color:'#fff3a0', label:'Ngon',      score:4 },
  surprise:  { emoji:'😲', color:'#a8d8ff', label:'Bất ngờ',   score:4 },
  confused:  { emoji:'😕', color:'#b2f0d0', label:'Bối rối',   score:3 },
  shy:       { emoji:'😳', color:'#ffd6a5', label:'Ngại',      score:3 },
  anxious:   { emoji:'😰', color:'#fdcfe8', label:'Lo lắng',   score:2 },
  bored:     { emoji:'😑', color:'#cbd5e0', label:'Chán',      score:3 },
  focus:     { emoji:'🎯', color:'#a8d4ee', label:'Tập trung',  score:4 },
  productive:{ emoji:'📈', color:'#b2f0d0', label:'Hiệu quả',   score:5 },
  // Tiêu cực
  nostalgic: { emoji:'🥺', color:'#d8e2ff', label:'Hoài niệm', score:3 },
  lonely:    { emoji:'😢', color:'#bee3f8', label:'Cô đơn',    score:2 },
  sad:       { emoji:'😟', color:'#9fc5e8', label:'Buồn',      score:2 },
  tired:     { emoji:'😩', color:'#d4b8a0', label:'Mệt mỏi',   score:2 },
  sleepy:    { emoji:'😴', color:'#dda8f5', label:'Buồn ngủ',  score:1 },
  angry:     { emoji:'😡', color:'#ffb3b3', label:'Tức giận',  score:1 },
  sick:      { emoji:'🤒', color:'#cbd5e0', label:'Ốm',        score:1 },
  stressed:  { emoji:'😫', color:'#f9a8d4', label:'Căng thẳng', score:1 },
};

export const DEFAULT_ACTIVITIES = ['💼 Công việc', '🏠 Gia đình', '💕 Hẹn hò', '🏃 Thể dục', '🍜 Ăn uống', '✈️ Du lịch'];

export const AVATAR_EMOJIS = [
  '🐰','🐻','🐱','🐶','🐼','🦊','🐸',
  '🐨','🐯','🦁','🐮','🐷','🐙','🦋',
  '🌸','🌈','⭐','🍑','🧁','🍓','🎀',
];

export const TOUR_STEPS = [
  { targetId:'fabBtn',        mascot:'🧁', text:'Xin chào! Mình là Mochi 🌸\nBấm nút ➕ này để bắt đầu ghi lại cảm xúc nhé!', tooltipPos:'top' },
  { targetId:'partnerWidget', mascot:'💞', text:'Widget người đồng hành!\nXem cảm xúc của họ và gửi tim ngay tại đây 💕', tooltipPos:'bottom' },
  { targetId:'nav-stats',     mascot:'📊', text:'Tab Stats – nhìn lại hành trình cảm xúc của bạn theo tuần và tháng ✨', tooltipPos:'top' },
  { targetId:'nav-journal',   mascot:'📝', text:'Tất cả nhật ký được lưu ở đây!\nTìm kiếm và lọc theo cảm xúc 🔍', tooltipPos:'top' },
  { targetId:null,            mascot:'🌟', text:'Vậy là xong! Chúc bạn nhiều khoảnh khắc đẹp để lưu giữ 🌸', tooltipPos:'center' },
];
