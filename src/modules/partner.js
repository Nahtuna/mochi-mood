import { MOODS } from '../config.js';
import { state } from '../state.js';
import { showToast, formatDate, formatTime, launchConfetti } from '../utils.js';
import { supabaseClient } from '../api.js';
import { saveMessageToDB, loadChatHistoryFromDB } from '../api.js';

let presenceChannel = null;

export async function copyMyId() {
  try {
    await navigator.clipboard.writeText(state.userId);
    showToast('📋 Đã sao chép mã của bạn!');
  } catch (err) {}
}

export async function connectPartner() {
  const pId = document.getElementById('partnerIdInput')?.value.trim();
  if (!pId) return showToast('⚠️ Hãy nhập mã người thương nhé!');
  if (pId === state.userId) return showToast('⚠️ Bạn không thể kết nối với chính mình!');
  
  showToast('🔍 Đang tìm người thương...');
  const { data: partner, error } = await supabaseClient.from('users').select('*').eq('id', pId).single();
  if (error || !partner) return showToast('❌ Không tìm thấy mã này!');

  const { error: upError } = await supabaseClient.from('users').update({ partner_id: pId }).eq('id', state.userId);
  if (upError) return showToast('❌ Lỗi kết nối: ' + upError.message);

  showToast('💕 Đã kết nối thành công!');
  await loadPartnerData(pId);
}

export async function loadPartnerData(pId) {
  if (!pId) return;
  const { data: pProfile } = await supabaseClient.from('users').select('*').eq('id', pId).single();
  if (pProfile) {
    state.partnerProfile = pProfile;
    const statusEl = document.getElementById('partnerStatus');
    if (statusEl) {
      if (pProfile.partner_id === state.userId) {
        statusEl.textContent = `✅ Đã kết nối với ${pProfile.name}`;
        statusEl.style.color = '#48bb78';
      } else {
        statusEl.textContent = `⏳ Đang chờ ${pProfile.name} kết nối lại...`;
        statusEl.style.color = '#ecc94b';
      }
    }
  }

  const { data: pEntries } = await supabaseClient.from('mood_entries')
    .select('*').eq('user_id', pId).eq('shared', true)
    .order('date', { ascending: false }).order('time', { ascending: false }).limit(1);
    
  if (pEntries && pEntries.length > 0) {
    state.partnerLatestEntry = pEntries[0];
  }
  
  renderPartnerWidget();
  renderPartnerInMe();
  setupPartnerRealtime(pId);
  setupPresence(pId);
}

export function renderPartnerWidget() {
  const widget = document.getElementById('partnerWidget');
  if (!widget) return;
  
  if (!state.partnerProfile) {
    widget.innerHTML = `
      <div class="partner-widget-left"><div class="partner-avatar-sm">❓</div></div>
      <div class="partner-widget-info">
        <div class="partner-widget-name">Chưa kết nối</div>
        <div class="partner-widget-mood">Chạm để kết nối với người thương</div>
      </div>`;
    widget.onclick = () => window.navigateTo('me');
    return;
  }

  const m = state.partnerLatestEntry ? (MOODS[state.partnerLatestEntry.mood] || MOODS.peaceful) : null;
  const statusHtml = m ? `Đang cảm thấy ${m.label} ${m.emoji}` : 'Chưa có nhật ký hôm nay';
  const avatarHtml = state.partnerProfile.avatar_url 
    ? `<img src="${state.partnerProfile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : (state.partnerProfile.avatar_emoji || '🐰');

  widget.innerHTML = `
    <div class="partner-widget-left">
      <div class="partner-avatar-sm ${state.partnerProfile.avatar_frame || 'none'}">${avatarHtml}</div>
      <div class="partner-dot" id="partnerPresenceDot"></div>
    </div>
    <div class="partner-widget-info">
      <div class="partner-widget-name">${state.partnerProfile.name}</div>
      <div class="partner-widget-mood">${statusHtml}</div>
    </div>
    <div class="partner-widget-react" onclick="event.stopPropagation(); window.sendHeartToPartner()">🤍</div>
  `;
  
  widget.onclick = () => showPartnerModal();
}

export function renderPartnerInMe() {
  const partnerCard = document.getElementById('partnerCard');
  const disconnectedView = document.getElementById('partnerDisconnectedView');
  const myIdDisplay = document.getElementById('myIdDisplay');
  
  if (myIdDisplay) {
    myIdDisplay.textContent = state.userId ? state.userId.slice(0, 8).toUpperCase() : 'CHƯA CÓ MÃ';
  }

  if (!state.partnerProfile) {
    if (partnerCard) partnerCard.style.display = 'none';
    if (disconnectedView) disconnectedView.style.display = 'block';
    return;
  }

  if (partnerCard) partnerCard.style.display = 'block';
  if (disconnectedView) disconnectedView.style.display = 'none';

  const pairThem = document.querySelector('.pair-avatar.them');
  if (pairThem) {
    pairThem.className = 'pair-avatar them ' + (state.partnerProfile.avatar_frame || 'none');
    if (state.partnerProfile.avatar_url) {
      pairThem.style.overflow = 'hidden';
      pairThem.innerHTML = `<img src="${state.partnerProfile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      pairThem.innerHTML = ''; pairThem.textContent = state.partnerProfile.avatar_emoji || '🐰';
    }
  }
  
  const nameEl = document.querySelector('.partner-name-big'); if (nameEl) nameEl.textContent = state.partnerProfile.name;
  const inputEl = document.getElementById('partnerIdInput'); if (inputEl) inputEl.value = state.partnerProfile.id;
}

export function setupPartnerRealtime(pId) {
  if (!pId) return;
  supabaseClient.channel(`partner-${pId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_entries', filter: `user_id=eq.${pId}` }, payload => {
      if (payload.new.shared) {
        state.partnerLatestEntry = payload.new;
        showToast(`💕 ${state.partnerProfile.name} vừa viết nhật ký mới!`);
        renderPartnerWidget();
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${pId}` }, payload => {
      state.partnerProfile = payload.new;
      renderPartnerWidget();
      renderPartnerInMe();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${state.userId}` }, payload => {
      const msg = payload.new;
      if (msg.sender_id === pId) {
        if (state.chatHistory.some(m => m.id === msg.id)) return;
        
        const chatMsg = { 
          id: msg.id, 
          from: 'them', 
          text: msg.text, 
          time: formatTime(msg.created_at), 
          type: msg.type 
        };
        state.chatHistory.push(chatMsg);
        
        if (msg.type === 'react') {
          showToast(`${state.partnerProfile.name} vừa gửi: ${msg.text}`);
        } else {
          showToast(`💬 Tin nhắn mới từ ${state.partnerProfile.name}`);
        }
        
        if (document.getElementById('partnerChatModal').classList.contains('open')) {
          renderChat();
          scrollChatToBottom();
        }
      }
    })
    .subscribe();
}

export function setupPresence(pId) {
  if (!pId) return;
  if (presenceChannel) presenceChannel.unsubscribe();

  presenceChannel = supabaseClient.channel('presence-room', {
    config: { presence: { key: state.userId } }
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const pState = presenceChannel.presenceState();
      const isOnline = !!pState[pId];
      const dot = document.getElementById('partnerPresenceDot');
      if (dot) {
        dot.className = 'partner-dot ' + (isOnline ? 'online' : 'offline');
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ online_at: new Date().toISOString() });
      }
    });
}

export async function showSharedTimeline(tab = 'both') {
  if (!state.partnerProfile) return window.navigateTo('me');
  
  let query = supabaseClient.from('mood_entries').select('*').eq('shared', true).order('date', { ascending: false }).order('time', { ascending: false }).limit(40);
  
  if (tab === 'me') {
    query = query.eq('user_id', state.userId);
  } else if (tab === 'partner') {
    query = query.eq('user_id', state.partnerProfile.id);
  } else {
    query = query.in('user_id', [state.userId, state.partnerProfile.id]);
  }

  const { data: entriesData } = await query;
    
  const content = document.getElementById('sharedTimelineContent');
  if (!content) return;
  if (!entriesData || entriesData.length === 0) {
    content.innerHTML = `<div style="text-align:center;padding:40px;color:#a0aec0">Chưa có nhật ký nào được chia sẻ 🌸</div>`;
  } else {
    content.innerHTML = entriesData.map(e => {
      const m = MOODS[e.mood] || MOODS.peaceful;
      const isMe = e.user_id === state.userId;
      const owner = isMe ? { name: 'Tôi', avatar_emoji: '🐰' } : state.partnerProfile;
      const avatarHtml = owner.avatar_url 
        ? `<img src="${owner.avatar_url}" style="width:32px;height:32px;border-radius:50%;object-fit:cover">`
        : `<span style="font-size:20px">${owner.avatar_emoji || (isMe ? '🐰' : '🐻')}</span>`;

      return `
        <div class="shared-entry">
          <div class="shared-entry-who">${avatarHtml}</div>
          <div class="shared-entry-card">
            <div class="shared-entry-header">
              <span class="shared-entry-name" style="color:${isMe ? '#5b9bd5' : '#e4649a'}">${owner.name}</span>
              <span class="shared-entry-time">${formatDate(e.date)} ${e.time}</span>
            </div>
            <div style="font-size:16px;margin-bottom:4px">${m.emoji} ${m.label}</div>
            <div class="shared-entry-text">${e.text || ''}</div>
            <div class="shared-entry-react-row">
              <button class="react-btn" onclick="window.sendQuickReact('❤️')">❤️</button>
              <button class="react-btn" onclick="window.sendQuickReact('🤗')">🤗</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }
  document.getElementById('sharedTimelineModal')?.classList.add('open');
}

export function switchSharedTab(tab, btn) {
  document.querySelectorAll('.shared-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  showSharedTimeline(tab);
}

export async function sendHeartToPartner() {
  if (!state.partnerProfile) return showToast('⚠️ Hãy kết nối với người thương trước nhé!');
  
  const btn = document.getElementById('partnerHeartBtn');
  if (btn) {
    btn.textContent = '❤️';
    btn.style.transform = 'scale(1.4)';
    setTimeout(() => { btn.textContent = '🤍'; btn.style.transform = 'scale(1)'; }, 1000);
  }
  
  showToast('❤️ Đã gửi tim đến người thương!');
  await saveMessageToDB({
    sender_id: state.userId,
    receiver_id: state.partnerProfile.id,
    text: '❤️',
    type: 'react'
  });
}

export async function joinWithCode() {
  const code = document.getElementById('joinCodeInput')?.value.trim();
  if (!code || code.length < 5) { showToast('⚠️ Mã không hợp lệ!'); return; }
  
  showToast('🔗 Đang kết nối...');
  const { data: partner, error } = await supabaseClient.from('users').select('*').eq('id', code).single();
  if (error || !partner) return showToast('❌ Không tìm thấy mã này!');

  const { error: upError } = await supabaseClient.from('users').update({ partner_id: code }).eq('id', state.userId);
  if (upError) return showToast('❌ Lỗi kết nối: ' + upError.message);

  showToast('💑 Kết nối thành công!');
  document.getElementById('joinModal')?.classList.remove('open');
  launchConfetti();
  loadPartnerData(code);
}

export function shareViaApp(app) {
  const code = state.userId;
  showToast(`📤 Đã chia sẻ mã ${code} qua ${app.toUpperCase()}!`);
}

export async function showPartnerChat() {
  if (!state.partnerProfile) return showToast('⚠️ Hãy kết nối với người thương trước nhé!');
  
  document.getElementById('partnerChatModal')?.classList.add('open');
  
  const { data, error } = await loadChatHistoryFromDB(state.userId, state.partnerProfile.id);
  if (!error && data) {
    const formatted = data.map(m => ({
      id: m.id,
      from: m.sender_id === state.userId ? 'me' : 'them',
      text: m.text,
      time: formatTime(m.created_at),
      type: m.type,
      status: 'sent'
    }));
    state.chatHistory = formatted;
  }
  
  renderChat();
  scrollChatToBottom();
}

export function renderChat() {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  
  msgs.innerHTML = state.chatHistory.map(msg => {
    const isMe = msg.from === 'me';
    const isReact = msg.type === 'react';
    const statusIcon = isMe ? (msg.status === 'sending' ? '⏳' : msg.status === 'error' ? '❌' : '✓') : '';
    
    return `
      <div style="display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'};margin-bottom:8px">
        <div class="chat-msg ${msg.from}" style="${isReact ? 'background:none;font-size:32px;padding:0' : ''}">
          ${msg.text}
          ${isMe && !isReact ? `<span class="chat-status">${statusIcon}</span>` : ''}
        </div>
        <div class="chat-msg-time" style="text-align:${isMe ? 'right' : 'left'};padding:0 12px;font-size:10px;opacity:0.6">
          ${msg.time}
        </div>
      </div>`;
  }).join('');
}

export async function sendChatMsg() {
  if (!state.partnerProfile) return;
  const input = document.getElementById('chatInput');
  const text = input?.value.trim();
  if (!text) return;
  
  const tempId = Date.now().toString();
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  const optMsg = { tempId, from: 'me', text, time, type: 'text', status: 'sending' };
  state.chatHistory.push(optMsg);
  if (input) input.value = '';
  renderChat();
  scrollChatToBottom();
  
  try {
    const { data, error } = await saveMessageToDB({
      sender_id: state.userId,
      receiver_id: state.partnerProfile.id,
      text: text,
      type: 'text'
    });
    
    if (error) throw error;
    
    const msg = state.chatHistory.find(m => m.tempId === tempId);
    if (msg) {
      msg.status = 'sent';
      msg.id = data[0].id;
    }
    renderChat();
  } catch (err) {
    const msg = state.chatHistory.find(m => m.tempId === tempId);
    if (msg) msg.status = 'error';
    renderChat();
    showToast('❌ Lỗi gửi tin nhắn');
  }
}

export async function sendQuickReact(emoji) {
  if (!state.partnerProfile) return;
  const tempId = Date.now().toString();
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  state.chatHistory.push({ tempId, from: 'me', text: emoji, time, type: 'react', status: 'sending' });
  renderChat();
  scrollChatToBottom();
  
  try {
    const { data, error } = await saveMessageToDB({
      sender_id: state.userId,
      receiver_id: state.partnerProfile.id,
      text: emoji,
      type: 'react'
    });
    if (error) throw error;
    const msg = state.chatHistory.find(m => m.tempId === tempId);
    if (msg) {
      msg.status = 'sent';
      msg.id = data[0].id;
    }
  } catch (err) {
    const msg = state.chatHistory.find(m => m.tempId === tempId);
    if (msg) msg.status = 'error';
    renderChat();
  }
}

function scrollChatToBottom() {
  const msgs = document.getElementById('chatMessages');
  if (msgs) setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 50);
}

export function showPartnerModal() {
  const m = state.partnerLatestEntry ? (MOODS[state.partnerLatestEntry.mood] || MOODS.peaceful) : null;
  const pModalAv = document.getElementById('pModalAvatar');
  if (pModalAv) {
    if (state.partnerProfile.avatar_url) {
      pModalAv.innerHTML = `<img src="${state.partnerProfile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      pModalAv.innerHTML = ''; pModalAv.textContent = state.partnerProfile.avatar_emoji || '🐰';
    }
  }
  const nameEl = document.getElementById('pModalName'); if (nameEl) nameEl.textContent = state.partnerProfile.name;
  const moodEl = document.getElementById('pModalMood'); if (moodEl) moodEl.textContent = m ? `Cảm xúc: ${m.emoji} ${m.label}` : 'Chưa có nhật ký hôm nay';
  const timeEl = document.getElementById('pModalTime'); if (timeEl) timeEl.textContent = state.partnerLatestEntry ? `Cập nhật lúc ${state.partnerLatestEntry.time}` : '';
  
  document.getElementById('partnerModal')?.classList.add('open');
}

export function showInviteModal() {
  const codeEl = document.getElementById('inviteCode'); if (codeEl) codeEl.textContent = state.userId;
  document.getElementById('inviteModal')?.classList.add('open');
}

export function showJoinModal() {
  document.getElementById('joinModal')?.classList.add('open');
}

export function copyInviteCode() {
  navigator.clipboard?.writeText(state.userId).then(() => showToast('📋 Đã sao chép mã mời!'));
}

export async function disconnectPartner() {
  if (!confirm('Bạn có chắc muốn ngắt kết nối không?')) return;
  
  try {
    const { error } = await supabaseClient
      .from('users')
      .update({ partner_id: null })
      .eq('id', state.userId);
    
    if (error) throw error;
    
    if (presenceChannel) {
      presenceChannel.unsubscribe();
      presenceChannel = null;
    }
    
    state.partnerProfile = null;
    state.partnerLatestEntry = null;
    renderPartnerInMe();
    renderPartnerWidget();
    showToast('🔌 Đã ngắt kết nối');
  } catch (err) {
    showToast('❌ Lỗi khi ngắt kết nối: ' + err.message);
  }
}
