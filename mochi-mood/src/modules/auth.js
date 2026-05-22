import { signUp, signIn, getSession, signOut, signInWithGoogle } from '../api.js';
import { showToast } from '../utils.js';
import { state } from '../state.js';

let currentAuthTab = 'login';

export function switchAuthTab(tab) {
  currentAuthTab = tab;
  const loginBtn = document.getElementById('auth-tab-login');
  const regBtn = document.getElementById('auth-tab-register');
  const submitBtn = document.getElementById('auth-submit-btn');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const authScreen = document.getElementById('screen-auth');
  
  const usernameContainer = document.getElementById('auth-username-container');
  const confirmContainer = document.getElementById('auth-confirm-container');
  const loginExtras = document.getElementById('auth-login-extras');

  if (tab === 'login') {
    if (loginBtn) {
      loginBtn.style.background = 'white';
      loginBtn.style.color = '#b583f5';
      loginBtn.style.boxShadow = '0 6px 15px rgba(181,131,245,0.15)';
    }
    if (regBtn) {
      regBtn.style.background = 'transparent';
      regBtn.style.color = '#718096';
      regBtn.style.boxShadow = 'none';
    }
    
    if (authTitle) authTitle.textContent = 'Mừng bạn trở lại! 👋';
    if (authSubtitle) authSubtitle.textContent = '✨ Ghi lại cảm xúc hôm nay để ngày mai thêm trọn vẹn.';
    if (submitBtn) submitBtn.textContent = 'Khám phá ngay ✨';
    if (authScreen) authScreen.style.background = 'linear-gradient(135deg, #fceaff 0%, #e8f5ff 100%)';

    if (usernameContainer) usernameContainer.classList.remove('visible');
    if (confirmContainer) confirmContainer.classList.remove('visible');
    if (loginExtras) loginExtras.style.display = 'flex';
  } else {
    if (regBtn) {
      regBtn.style.background = 'white';
      regBtn.style.color = '#b583f5';
      regBtn.style.boxShadow = '0 6px 15px rgba(181,131,245,0.15)';
    }
    if (loginBtn) {
      loginBtn.style.background = 'transparent';
      loginBtn.style.color = '#718096';
      loginBtn.style.boxShadow = 'none';
    }

    if (authTitle) authTitle.textContent = 'Tạo tài khoản mới 🌸';
    if (authSubtitle) authSubtitle.textContent = '✨ Bắt đầu hành trình yêu thương bản thân cùng Mochi.';
    if (submitBtn) submitBtn.textContent = 'Bắt đầu hành trình 🚀';
    if (authScreen) authScreen.style.background = 'linear-gradient(135deg, #e8f5ff 0%, #fceaff 100%)';

    if (usernameContainer) usernameContainer.classList.add('visible');
    if (confirmContainer) confirmContainer.classList.add('visible');
    if (loginExtras) loginExtras.style.display = 'none';
  }
}

export function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

export async function handleAuthSubmit() {
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const usernameInput = document.getElementById('auth-username');
  const confirmPasswordInput = document.getElementById('auth-confirm-password');
  const submitBtn = document.getElementById('auth-submit-btn');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const username = usernameInput ? usernameInput.value.trim() : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

  if (!email || !password) {
    showToast('⚠️ Vui lòng nhập email và mật khẩu!');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('📧 Email không đúng định dạng!');
    return;
  }

  if (currentAuthTab === 'register') {
    if (!username) {
      showToast('👤 Vui lòng nhập tên hiển thị!');
      return;
    }
    if (password.length < 8) {
      showToast('🔑 Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }
    if (password !== confirmPassword) {
      showToast('❌ Mật khẩu xác nhận không khớp!');
      return;
    }
  }

  const originalBtnText = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang xử lý...';
  }
  
  try {
    let result;
    if (currentAuthTab === 'login') {
      result = await signIn(email, password);
    } else {
      result = await signUp(email, password, { 
        data: { display_name: username } 
      });
    }

    if (result.error) {
      let msg = result.error.message;
      if (msg.includes('User already registered')) msg = '📧 Email này đã được đăng ký rồi!';
      if (msg.includes('Invalid login credentials')) msg = '❌ Sai email hoặc mật khẩu!';
      if (msg.includes('Email not confirmed')) msg = '📧 Vui lòng xác nhận email trước khi đăng nhập!';
      showToast(msg);
    } else {
      if (currentAuthTab === 'login') {
        showToast('🎉 Chào mừng bạn quay trở lại!');
        if (result.data.user) {
          state.userId = result.data.user.id;
          setTimeout(() => location.reload(), 800); 
        }
      } else {
        showToast('✅ Đăng ký thành công! Hãy kiểm tra email để xác nhận.');
        setTimeout(() => switchAuthTab('login'), 1500);
      }
    }
  } catch (err) {
    showToast('❌ Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.');
    console.error(err);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

export async function handleGoogleLogin() {
  showToast('⏳ Đang chuyển hướng đến Google...');
  const { error } = await signInWithGoogle();
  if (error) {
    showToast('❌ Lỗi: ' + error.message);
  }
}

export async function checkAuth() {
  const session = await getSession();
  if (session && session.user) {
    state.userId = session.user.id;
    const authScreen = document.getElementById('screen-auth');
    const homeScreen = document.getElementById('screen-home');
    const nav = document.querySelector('nav');

    if (authScreen) authScreen.classList.remove('active');
    if (homeScreen) homeScreen.classList.add('active');
    if (nav) nav.style.display = 'flex';
    return true;
  } else {
    const authScreen = document.getElementById('screen-auth');
    const screens = document.querySelectorAll('.screen:not(#screen-auth)');
    const nav = document.querySelector('nav');

    if (authScreen) authScreen.classList.add('active');
    screens.forEach(s => s.classList.remove('active'));
    if (nav) nav.style.display = 'none';
    return false;
  }
}

export async function logout() {
  await signOut();
  location.reload();
}
