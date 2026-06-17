/* ═══════════════════════════════════════════════════════════
   ChatLocal v2 — Frontend App
   Powered by Firebase (Auth, Firestore, Storage)
   ════════════════════════════════════════════════════════════ */

// ── Notification sound ───────────────────────────────────────
const notifSound = new Audio('/notification.mp3');
notifSound.volume = 0.5;
notifSound.preload = 'auto';

let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  notifSound.play().then(() => { notifSound.pause(); notifSound.currentTime = 0; audioUnlocked = true; }).catch(() => {});
}
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('keydown', unlockAudio, { once: true });

function playNotif() {
  if (!audioUnlocked) return;
  notifSound.currentTime = 0;
  notifSound.play().catch(() => {});
}

// ── State ────────────────────────────────────────────────────
let state = {
  user: null,
  currentRoom: null,
  rooms: [],
  members: {},
  messages: {},
  reactions: {},
  typingUsers: {},
  typingTimer: null,
  voiceActive: false,
  muted: false,
  localStream: null,
  peerConnections: {},
  mediaRecorder: null,
  audioChunks: [],
  recording: false,
  editingMsgId: null,
  unsubscribers: [],
};

// ── DOM refs ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const splash = $('splash'), app = $('app'), loginSection = $('loginSection');
const googleLoginBtn = $('googleLoginBtn');
const logoutBtn = $('logoutBtn');
const roomList = $('roomList'), messagesArea = $('messagesArea'), emptyState = $('emptyState');
const msgInput = $('msgInput'), sendBtn = $('sendBtn'), audioRecordBtn = $('audioRecordBtn');
const emojiToggleBtn = $('emojiToggleBtn'), emojiPicker = $('emojiPicker');
const attachBtn = $('attachBtn'), fileInput = $('fileInput');
const typingIndicator = $('typingIndicator'), typingText = $('typingText');
const roomNameEl = $('roomName'), roomIconEl = $('roomIcon'), memberCountEl = $('memberCount');
const userAvatarEl = $('userAvatar'), userNameEl = $('userName');
const membersPanel = $('membersPanel'), membersList = $('membersList');
const membersBtn = $('membersBtn'), closeMembersBtn = $('closeMembersBtn');
const voiceBtn = $('voiceBtn'), muteBtn = $('muteBtn'), voiceStatus = $('voiceStatus');
const createRoomBtn = $('createRoomBtn'), createRoomModal = $('createRoomModal');
const cancelRoomBtn = $('cancelRoomBtn'), confirmRoomBtn = $('confirmRoomBtn');
const newRoomNameInput = $('newRoomName'), iconPicker = $('iconPicker');
const themeToggleBtn = $('themeToggleBtn');
const editModal = $('editModal'), editInput = $('editInput');
const cancelEditBtn = $('cancelEditBtn'), confirmEditBtn = $('confirmEditBtn');

// ── SVG Room Icons ─────────────────────────────────────────────
const ROOM_SVG_ICONS = {
  chat:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  gaming:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4"/><circle cx="17" cy="11" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/></svg>',
  music:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  hashtag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
  star:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  heart:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  bolt:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  globe:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  rocket:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  palette: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
  book:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  trophy:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H2v2c0 3.31 2.69 6 6 6s6-2.69 6-6V4H9"/><path d="M17 4h5v2c0 3.31-2.69 6-6 6s-6-2.69-6-6V4h1"/></svg>',
};

const FIXED_ROOMS = [
  { id: 'general',   name: 'General',   icon: 'chat',    fixed: true },
  { id: 'gaming',    name: 'Gaming',    icon: 'gaming',  fixed: true },
  { id: 'music',     name: 'Música',    icon: 'music',   fixed: true },
  { id: 'off-topic', name: 'Off-Topic', icon: 'hashtag', fixed: true },
];

function getRoomIcon(iconKey) { return ROOM_SVG_ICONS[iconKey] || ROOM_SVG_ICONS.chat; }

// ── THEME ─────────────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('cl-theme');
  if (saved === 'light') document.documentElement.classList.add('light');
})();

themeToggleBtn.addEventListener('click', () => {
  const isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('cl-theme', isLight ? 'light' : 'dark');
  toast(isLight ? '☀️ Modo claro activado' : '🌙 Modo oscuro activado', '');
});

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = '') {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const el = document.createElement('div'); el.className = 'toast ' + type;
  el.textContent = msg; container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── AUTH — Email/Password ────────────────────────────────────
const loginTab = $('loginTab');
const registerTab = $('registerTab');
const loginForm = $('loginForm');
const registerForm = $('registerForm');
const loginBtn = $('loginBtn');
const registerBtn = $('registerBtn');
const switchToRegister = $('switchToRegister');
const switchToLogin = $('switchToLogin');

loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

switchToRegister.addEventListener('click', e => {
  e.preventDefault();
  registerTab.click();
});

switchToLogin.addEventListener('click', e => {
  e.preventDefault();
  loginTab.click();
});

loginBtn.addEventListener('click', async () => {
  const email = $('loginEmail').value.trim();
  const pass = $('loginPass').value;
  if (!email || !pass) { toast('Completa todos los campos', 'danger'); return; }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    toast('Error: ' + err.message.replace('Firebase: ', '').replace(/\(.*\)/, ''), 'danger');
  }
});

registerBtn.addEventListener('click', async () => {
  const name = $('regName').value.trim();
  const email = $('regEmail').value.trim();
  const pass = $('regPass').value;
  if (!name || !email || !pass) { toast('Completa todos los campos', 'danger'); return; }
  if (pass.length < 6) { toast('La contraseña debe tener al menos 6 caracteres', 'danger'); return; }
  try {
    const result = await auth.createUserWithEmailAndPassword(email, pass);
    // Update profile with display name
    await result.user.updateProfile({ displayName: name });
  } catch (err) {
    toast('Error: ' + err.message.replace('Firebase: ', '').replace(/\(.*\)/, ''), 'danger');
  }
});

// Allow Enter key to submit
$('loginEmail').addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
$('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
$('regName').addEventListener('keydown', e => { if (e.key === 'Enter') registerBtn.click(); });
$('regEmail').addEventListener('keydown', e => { if (e.key === 'Enter') registerBtn.click(); });
$('regPass').addEventListener('keydown', e => { if (e.key === 'Enter') registerBtn.click(); });

logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
  console.log('Auth state changed. User:', user ? user.displayName : 'null');
  if (user) {
    state.user = { uid: user.uid, name: user.displayName, email: user.email, photo: user.photoURL };
    userAvatarEl.src = user.photoURL || '';
    userAvatarEl.alt = user.displayName?.[0] || '?';
    userNameEl.textContent = user.displayName || 'Anónimo';

    splash.style.animation = 'fadeOut .3s ease forwards';
    setTimeout(() => { splash.style.display = 'none'; app.classList.remove('hidden'); }, 280);

    seedFixedRooms();
    listenRooms();
    joinRoom('general');
  } else {
    state.user = null;
    state.currentRoom = null;
    splash.style.display = 'flex'; splash.style.animation = ''; splash.style.opacity = '';
    app.classList.add('hidden');
    unsubscribeAll();
    state.rooms = [];
    state.messages = {};
  }
});

// ── FIRESTORE HELPERS ──────────────────────────────────────────
function unsubscribeAll() {
  state.unsubscribers.forEach(u => u());
  state.unsubscribers = [];
}

async function seedFixedRooms() {
  for (const r of FIXED_ROOMS) {
    await db.collection('rooms').doc(r.id).set({ ...r, createdAt: Date.now() }, { merge: true });
  }
}

function listenRooms() {
  const unsub = db.collection('rooms').orderBy('createdAt').onSnapshot(snap => {
    const rooms = [];
    snap.forEach(doc => { const r = doc.data(); rooms.push({ id: doc.id, ...r, members: 0 }); });
    state.rooms = rooms;
    renderRoomList();
  }, err => toast('Error al cargar salas: ' + err.message, 'danger'));
  state.unsubscribers.push(unsub);
}

function listenMembers(roomId) {
  const unsub = db.collection('rooms').doc(roomId).collection('members')
    .onSnapshot(snap => {
      const members = {};
      snap.forEach(doc => { members[doc.id] = doc.data(); });
      state.members[roomId] = members;
      updateMemberCount();
      if (!membersPanel.classList.contains('hidden')) renderMembersList();
    });
  state.unsubscribers.push(unsub);
}

function updatePresence(roomId, join) {
  if (!state.user) return;
  const ref = db.collection('rooms').doc(roomId).collection('members').doc(state.user.uid);
  if (join) {
    ref.set({
      uid: state.user.uid,
      name: state.user.name,
      photo: state.user.photo,
      online: true,
      lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    ref.delete();
  }
}

// ── ROOMS ─────────────────────────────────────────────────────
function renderRoomList() {
  roomList.innerHTML = '';
  state.rooms.forEach(room => {
    const li = document.createElement('li');
    li.className = 'room-item' + (room.id === state.currentRoom ? ' active' : '');
    li.dataset.id = room.id;
    li.innerHTML = '<span class="room-list-icon">' + getRoomIcon(room.icon) + '</span>' +
      '<span class="room-name-text">' + escHtml(room.name) + '</span>' +
      '<span class="badge">' + (Object.keys(state.members[room.id] || {}).length) + '</span>';

    if (!room.fixed) {
      const delBtn = document.createElement('span');
      delBtn.className = 'room-del-btn';
      delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>';
      delBtn.title = 'Borrar sala';
      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('¿Borrar la sala "' + room.name + '"?')) deleteRoom(room.id);
      });
      li.appendChild(delBtn);
    }

    li.addEventListener('click', () => joinRoom(room.id));
    roomList.appendChild(li);
  });
}

async function joinRoom(roomId) {
  if (roomId === state.currentRoom) return;

  if (state.currentRoom) {
    updatePresence(state.currentRoom, false);
    if (state.messagesUnsub) state.messagesUnsub();
  }

  state.currentRoom = roomId;
  state.messages[roomId] = [];
  messagesArea.innerHTML = '';
  emptyState.style.display = 'none';

  const room = state.rooms.find(r => r.id === roomId);
  roomNameEl.textContent = room?.name || 'Sala';
  renderRoomList();

  updatePresence(roomId, true);
  listenMembers(roomId);

  msgInput.disabled = false; sendBtn.disabled = false; audioRecordBtn.disabled = false;

  state.messagesUnsub = db.collection('rooms').doc(roomId).collection('messages')
    .orderBy('timestamp', 'asc')
    .limit(200)
    .onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        const msg = { id: change.doc.id, ...change.doc.data() };
        if (change.type === 'added' || change.type === 'modified') {
          const existing = state.messages[roomId].findIndex(m => m.id === msg.id);
          if (existing >= 0) {
            state.messages[roomId][existing] = msg;
            const el = document.querySelector('[data-msg-id="' + msg.id + '"] .bubble');
            if (el && msg.type === 'text') el.innerHTML = parseText(msg.content);
          } else {
            state.messages[roomId].push(msg);
            appendMessage(msg);
            scrollToBottom();
            if (msg.userId !== state.user?.uid && msg.type !== 'system') playNotif();
          }
        } else if (change.type === 'removed') {
          state.messages[roomId] = state.messages[roomId].filter(m => m.id !== msg.id);
          const wrapper = document.querySelector('[data-msg-id="' + msg.id + '"]');
          if (wrapper) wrapper.remove();
        }
      });
    }, err => toast('Error al cargar mensajes: ' + err.message, 'danger'));
}

async function deleteRoom(roomId) {
  try {
    await db.collection('rooms').doc(roomId).delete();
    toast('Sala eliminada', 'success');
    if (state.currentRoom === roomId) joinRoom('general');
  } catch (err) { toast('Error: ' + err.message, 'danger'); }
}

// ── MESSAGES ──────────────────────────────────────────────────
async function sendMessage(content, type, extra) {
  type = type || 'text'; extra = extra || {};
  if (!content || !state.currentRoom || !state.user) return;
  const msg = {
    userId: state.user.uid,
    username: state.user.name,
    userPhoto: state.user.photo,
    type: type,
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    reactions: {},
    edited: false
  };
  Object.assign(msg, extra);
  try {
    await db.collection('rooms').doc(state.currentRoom).collection('messages').add(msg);
    msgInput.value = ''; msgInput.style.height = 'auto';
  } catch (err) { toast('Error al enviar: ' + err.message, 'danger'); }
}

sendBtn.addEventListener('click', () => sendMessage(msgInput.value.trim()));
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(msgInput.value.trim()); }
});
msgInput.addEventListener('input', () => {
  msgInput.style.height = 'auto'; msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
});

function appendMessage(msg) {
  const container = messagesArea;
  if (msg.type === 'system') {
    const el = document.createElement('div'); el.className = 'msg-system'; el.textContent = msg.content;
    container.appendChild(el); return;
  }
  const isOwn = msg.userId === state.user?.uid;
  const wrapper = document.createElement('div'); wrapper.className = 'msg-row' + (isOwn ? ' own' : '');
  wrapper.dataset.msgId = msg.id;

  const avatarEl = document.createElement('img');
  avatarEl.className = 'msg-avatar'; avatarEl.src = msg.userPhoto || ''; avatarEl.alt = (msg.username || '?')[0];
  avatarEl.style.background = msg.userPhoto ? 'transparent' : '#555';

  const bodyEl = document.createElement('div'); bodyEl.className = 'msg-body';
  const metaEl = document.createElement('div'); metaEl.className = 'msg-meta';
  const editedHtml = msg.edited ? '<span style="font-size:.68rem;color:var(--text-3)">(editado)</span>' : '';
  metaEl.innerHTML = '<span class="msg-username">' + escHtml(msg.username || 'Anónimo') + '</span>' +
    '<span class="msg-time">' + (msg.timestamp?.toDate ? formatTime(msg.timestamp.toDate()) : '') + '</span>' + editedHtml;

  const bubbleEl = document.createElement('div'); bubbleEl.className = 'bubble';

  if (msg.type === 'image') {
    bubbleEl.innerHTML = '<img src="' + msg.content + '" alt="Imagen" style="max-width:300px;max-height:300px;border-radius:var(--radius-md);display:block;cursor:pointer" onclick="window.open(this.src,\'_blank\')" />';
  } else if (msg.type === 'audio') {
    bubbleEl.innerHTML = buildAudioPlayer(msg);
    setTimeout(() => attachAudioPlayer(bubbleEl, msg), 0);
  } else if (msg.type === 'file') {
    bubbleEl.innerHTML = '<a href="' + msg.content + '" target="_blank" style="color:var(--accent2);display:flex;align-items:center;gap:8px">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
      escHtml(msg.fileName || 'Archivo adjunto') + '</a>';
  } else {
    bubbleEl.innerHTML = parseText(msg.content);
  }

  const actionsEl = document.createElement('div'); actionsEl.className = 'bubble-actions';
  '👍❤️😂😮👎'.split('').forEach(emoji => {
    const btn = document.createElement('button'); btn.className = 'bubble-action-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', e => { e.stopPropagation(); reactToMessage(msg.id, emoji); });
    actionsEl.appendChild(btn);
  });
  if (isOwn) {
    const editBtn = document.createElement('button'); editBtn.className = 'bubble-action-btn';
    editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    editBtn.title = 'Editar';
    editBtn.addEventListener('click', e => { e.stopPropagation(); editMessage(msg); });
    actionsEl.appendChild(editBtn);

    const delMsgBtn = document.createElement('button'); delMsgBtn.className = 'bubble-action-btn';
    delMsgBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    delMsgBtn.title = 'Eliminar';
    delMsgBtn.addEventListener('click', e => { e.stopPropagation(); deleteMessage(msg.id); });
    actionsEl.appendChild(delMsgBtn);
  }
  bubbleEl.appendChild(actionsEl);

  const reactionsEl = document.createElement('div'); reactionsEl.className = 'reactions';
  reactionsEl.id = 'reactions-' + msg.id;

  bodyEl.appendChild(metaEl); bodyEl.appendChild(bubbleEl); bodyEl.appendChild(reactionsEl);
  wrapper.appendChild(avatarEl); wrapper.appendChild(bodyEl);
  container.appendChild(wrapper);

  if (msg.reactions && Object.keys(msg.reactions).length > 0) renderReactions(msg.id, msg.reactions);
}

// ── EDIT/DELETE ────────────────────────────────────────────
async function editMessage(msg) {
  state.editingMsgId = msg.id;
  editInput.value = msg.content;
  editModal.classList.remove('hidden');
  editInput.focus();
}

confirmEditBtn.addEventListener('click', async () => {
  const content = editInput.value.trim();
  if (!content || !state.editingMsgId) return;
  try {
    await db.collection('rooms').doc(state.currentRoom).collection('messages').doc(state.editingMsgId)
      .update({ content: content, edited: true, editedAt: firebase.firestore.FieldValue.serverTimestamp() });
    editModal.classList.add('hidden');
    state.editingMsgId = null;
  } catch (err) { toast('Error: ' + err.message, 'danger'); }
});

cancelEditBtn.addEventListener('click', () => { editModal.classList.add('hidden'); state.editingMsgId = null; });

async function deleteMessage(msgId) {
  if (!confirm('¿Eliminar este mensaje?')) return;
  try {
    await db.collection('rooms').doc(state.currentRoom).collection('messages').doc(msgId).delete();
  } catch (err) { toast('Error: ' + err.message, 'danger'); }
}

// ── REACTIONS ────────────────────────────────────────────────
async function reactToMessage(msgId, emoji) {
  if (!state.user) return;
  const msgRef = db.collection('rooms').doc(state.currentRoom).collection('messages').doc(msgId);
  const userId = state.user.uid;
  try {
    const doc = await msgRef.get();
    const data = doc.data();
    const reactions = data.reactions || {};
    const users = reactions[emoji] || [];
    if (users.includes(userId)) {
      await msgRef.update({ ['reactions.' + emoji]: firebase.firestore.FieldValue.arrayRemove(userId) });
    } else {
      await msgRef.update({ ['reactions.' + emoji]: firebase.firestore.FieldValue.arrayUnion(userId) });
    }
  } catch (err) { /* ignore */ }
}

function renderReactions(msgId, reactions) {
  const el = document.getElementById('reactions-' + msgId);
  if (!el) return;
  el.innerHTML = '';
  Object.entries(reactions || {}).forEach(([emoji, users]) => {
    if (!users || users.length === 0) return;
    const chip = document.createElement('span');
    chip.className = 'reaction-chip' + (users.includes(state.user?.uid) ? ' mine' : '');
    chip.textContent = emoji + ' ' + users.length;
    chip.title = users.join(', ');
    chip.addEventListener('click', () => reactToMessage(msgId, emoji));
    el.appendChild(chip);
  });
}

// ── FILE UPLOAD ───────────────────────────────────────────────
attachBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const files = fileInput.files;
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) { toast('Archivo demasiado grande (máx 10MB)', 'danger'); continue; }
    const isImage = file.type.startsWith('image/');
    try {
      const ref = storage.ref('chat/' + state.currentRoom + '/' + Date.now() + '_' + file.name);
      const snap = await ref.put(file);
      const url = await snap.ref.getDownloadURL();
      if (isImage) {
        await sendMessage(url, 'image');
      } else {
        await sendMessage(url, 'file', { fileName: file.name });
      }
      toast('📎 ' + file.name + ' subido', 'success');
    } catch (err) { toast('Error al subir: ' + err.message, 'danger'); }
  }
  fileInput.value = '';
});

// ── AUDIO RECORDING ───────────────────────────────────────────
audioRecordBtn.addEventListener('click', async () => {
  if (state.recording) stopRecording();
  else await startRecording();
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mediaRecorder = new MediaRecorder(stream);
    state.audioChunks = []; state.recording = true;
    audioRecordBtn.classList.add('recording'); audioRecordBtn.title = 'Detener grabación';

    state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);
    state.mediaRecorder.onstop = async () => {
      const blob = new Blob(state.audioChunks, { type: 'audio/webm' });
      try {
        const ref = storage.ref('chat/' + state.currentRoom + '/audio_' + Date.now() + '.webm');
        const snap = await ref.put(blob);
        const url = await snap.ref.getDownloadURL();
        await sendMessage(url, 'audio', { duration: formatDuration(state.recordingDuration) });
      } catch (err) { toast('Error al subir audio: ' + err.message, 'danger'); }
      stream.getTracks().forEach(t => t.stop());
      audioRecordBtn.classList.remove('recording'); audioRecordBtn.title = 'Grabar audio';
      state.recording = false;
    };
    state.recordingStart = Date.now();
    state.mediaRecorder.start();
    toast('🔴 Grabando…', '');
  } catch { toast('Sin permiso de micrófono', 'danger'); }
}

function stopRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.recordingDuration = (Date.now() - state.recordingStart) / 1000;
    state.mediaRecorder.stop();
  }
}

function buildAudioPlayer(msg) {
  var bars = '';
  for (var i = 0; i < 20; i++) {
    var h = 4 + Math.floor(Math.random() * 20);
    bars += '<div class="audio-bar" style="height:' + h + 'px"></div>';
  }
  return '<div class="audio-player" id="ap-' + msg.id + '">' +
    '<span class="audio-play-btn">▶</span>' +
    '<div class="audio-waveform">' + bars + '</div>' +
    '<span class="audio-duration">' + (msg.duration || '0:00') + '</span></div>';
}

function attachAudioPlayer(bubbleEl, msg) {
  var player = bubbleEl.querySelector('#ap-' + msg.id);
  if (!player || !msg.content) return;
  var audio = null;
  player.addEventListener('click', function() {
    if (!audio) {
      try {
        audio = new Audio(msg.content);
      } catch (e) {
        toast('Error al cargar audio', 'danger');
        return;
      }
      audio.addEventListener('error', function() {
        toast('Error al reproducir audio', 'danger');
        player.classList.remove('playing');
        player.querySelector('.audio-play-btn').textContent = '▶';
      });
      audio.addEventListener('ended', function() { player.classList.remove('playing'); player.querySelector('.audio-play-btn').textContent = '▶'; });
    }
    if (audio.paused) {
      audio.play().catch(function() {
        toast('Error al reproducir audio', 'danger');
        player.classList.remove('playing');
        player.querySelector('.audio-play-btn').textContent = '▶';
      });
      player.classList.add('playing');
      player.querySelector('.audio-play-btn').textContent = '⏸';
    }
    else {
      audio.pause();
      player.classList.remove('playing');
      player.querySelector('.audio-play-btn').textContent = '▶';
    }
  });
}

// ── EMOJI PICKER ──────────────────────────────────────────────
var EMOJI_CATEGORIES = {
  '😊': ['😀','😂','🥹','😅','😇','🥰','😍','🤩','😘','😏','😒','😔','😢','😭','😤','😡','🤬','😱','😨','🫡','🤔','🫢','🤐','😴','🤢','🤮','🤧','🥵','🥶','😵','🥴'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✌️','🤞','🫶','👍','👎','👏','🙌','🤜','🤛'],
  '🎉': ['🎉','🎊','🎈','🎁','🎂','🍰','🥂','🍾','🥳','✨','🌟','⭐','💫','🔥','💥','🎯','🏆','🥇','🎖️','🏅','🎗️','🎀','🎁','🎭','🎪','🎠','🎡','🎢'],
  '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🦄'],
  '🍕': ['🍕','🍔','🌮','🌯','🥗','🍜','🍣','🍱','🍙','🍚','🍛','🍝','🍠','🍢','🧆','🥙','🥪','🥨','🥐','🍞','🥖','🥞','🧇','🥓','🥩','🍗','🍖','🌭'],
  '⚽': ['⚽','🏀','🏈','⚾','🥎','🏐','🏉','🥏','🎾','🏸','🏒','🥍','🏏','🪃','🏹','🥊','🥋','🎽','🛹','🛷','⛸️','🥌','🎿','🏂','🪂','🏋️','🤸','🏊'],
};

var currentEmojiCategory = '😊'; var emojiOpen = false;
emojiToggleBtn.addEventListener('click', function() { emojiOpen = !emojiOpen; emojiPicker.classList.toggle('hidden', !emojiOpen); if (emojiOpen) buildEmojiPicker(); });
document.addEventListener('click', function(e) { if (emojiOpen && !emojiPicker.contains(e.target) && e.target !== emojiToggleBtn) { emojiOpen = false; emojiPicker.classList.add('hidden'); } });

function buildEmojiPicker() {
  emojiPicker.innerHTML = '';
  var tabsEl = document.createElement('div'); tabsEl.className = 'emoji-tabs';
  Object.keys(EMOJI_CATEGORIES).forEach(function(cat) {
    var tab = document.createElement('span'); tab.className = 'emoji-tab' + (cat === currentEmojiCategory ? ' active' : '');
    tab.textContent = cat; tab.addEventListener('click', function() { currentEmojiCategory = cat; buildEmojiPicker(); });
    tabsEl.appendChild(tab);
  });
  emojiPicker.appendChild(tabsEl);
  (EMOJI_CATEGORIES[currentEmojiCategory] || []).forEach(function(emoji) {
    var btn = document.createElement('button'); btn.className = 'emoji-btn';
    btn.textContent = emoji; btn.addEventListener('click', function() { insertAtCursor(msgInput, emoji); msgInput.focus(); });
    emojiPicker.appendChild(btn);
  });
}

function insertAtCursor(el, text) {
  var start = el.selectionStart, end = el.selectionEnd;
  el.value = el.value.slice(0, start) + text + el.value.slice(end);
  el.selectionStart = el.selectionEnd = start + text.length;
}

// ── MEMBERS ───────────────────────────────────────────────────
membersBtn.addEventListener('click', function() {
  membersPanel.classList.toggle('hidden');
  app.classList.toggle('members-open', !membersPanel.classList.contains('hidden'));
  membersBtn.classList.toggle('active', !membersPanel.classList.contains('hidden'));
  if (!membersPanel.classList.contains('hidden')) renderMembersList();
});
closeMembersBtn.addEventListener('click', function() { membersPanel.classList.add('hidden'); app.classList.remove('members-open'); membersBtn.classList.remove('active'); });

function renderMembersList() {
  membersList.innerHTML = '';
  var members = state.members[state.currentRoom] || {};
  Object.values(members).forEach(function(m) {
    var li = document.createElement('li'); li.className = 'member-item';
    li.innerHTML = '<img class="member-avatar" src="' + (m.photo || '') + '" alt="' + (m.name || '?')[0] + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;background:#555" />' +
      '<span class="member-name">' + escHtml(m.name || 'Anónimo') + '</span>' +
      '<span class="member-status">' + (m.uid === state.user?.uid ? '(tú)' : '🟢') + '</span>';
    membersList.appendChild(li);
  });
}

function updateMemberCount() {
  var count = Object.keys(state.members[state.currentRoom] || {}).length;
  memberCountEl.textContent = count + ' participante' + (count !== 1 ? 's' : '');
}

// ── CREATE ROOM ────────────────────────────────────────────────
var selectedIcon = 'chat';
(function buildIconPicker() {
  iconPicker.innerHTML = '';
  Object.entries(ROOM_SVG_ICONS).forEach(function(entry) {
    var key = entry[0], svg = entry[1];
    var span = document.createElement('span'); span.dataset.icon = key; span.innerHTML = svg;
    span.className = key === selectedIcon ? 'selected' : '';
    span.addEventListener('click', function() { selectedIcon = key; iconPicker.querySelectorAll('span').forEach(function(x) { x.classList.remove('selected'); }); span.classList.add('selected'); });
    iconPicker.appendChild(span);
  });
})();

createRoomBtn.addEventListener('click', function() {
  createRoomModal.classList.remove('hidden'); newRoomNameInput.value = ''; newRoomNameInput.focus();
  selectedIcon = 'chat'; iconPicker.querySelectorAll('span').forEach(function(s) { s.classList.toggle('selected', s.dataset.icon === selectedIcon); });
});
cancelRoomBtn.addEventListener('click', function() { createRoomModal.classList.add('hidden'); });
createRoomModal.addEventListener('click', function(e) { if (e.target === createRoomModal) createRoomModal.classList.add('hidden'); });

confirmRoomBtn.addEventListener('click', async function() {
  var name = newRoomNameInput.value.trim();
  if (!name) { newRoomNameInput.focus(); return; }
  var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await db.collection('rooms').doc(id).set({ id: id, name: name, icon: selectedIcon, fixed: false, createdBy: state.user?.uid, createdAt: Date.now() });
  createRoomModal.classList.add('hidden');
  joinRoom(id);
});

newRoomNameInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') confirmRoomBtn.click(); });

// ── VOICE CHAT (WebRTC) ───────────────────────────────────────
var ICE_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

voiceBtn.addEventListener('click', async function() { if (!state.voiceActive) await joinVoice(); else leaveVoice(); });

muteBtn.addEventListener('click', function() {
  state.muted = !state.muted;
  if (state.localStream) state.localStream.getAudioTracks().forEach(function(t) { t.enabled = !state.muted; });
  var dot = voiceStatus.querySelector('.dot'); dot.className = 'dot ' + (state.muted ? 'dot--muted' : 'dot--on');
  toast(state.muted ? 'Micrófono silenciado' : 'Micrófono activado', '');
});

async function joinVoice() {
  try {
    state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.voiceActive = true;
    voiceBtn.classList.add('active'); muteBtn.classList.remove('hidden');
    voiceStatus.innerHTML = '<span class="dot dot--on"></span><span>En canal de voz</span>';
    toast('Conectado al canal de voz', 'success');
  } catch { toast('Sin acceso al micrófono', 'danger'); }
}

function leaveVoice() {
  if (state.localStream) { state.localStream.getTracks().forEach(function(t) { t.stop(); }); state.localStream = null; }
  Object.values(state.peerConnections).forEach(function(pc) { pc.close(); });
  state.peerConnections = {}; state.voiceActive = false; state.muted = false;
  voiceBtn.classList.remove('active'); muteBtn.classList.add('hidden');
  voiceStatus.innerHTML = '<span class="dot dot--off"></span><span>Voz desconectada</span>';
  toast('Saliste del canal de voz', '');
}

// ── HELPERS ───────────────────────────────────────────────────
function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}
function formatDuration(secs) {
  var m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}
function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function parseText(text) {
  var html = escHtml(text);
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--accent2);text-decoration:underline">$1</a>');
  html = html.replace(/`([^`]+)`/g, '<code style="background:var(--bg-hover);padding:2px 6px;border-radius:4px;font-size:.85em">$1</code>');
  return html;
}
function scrollToBottom() { requestAnimationFrame(function() { messagesArea.scrollTop = messagesArea.scrollHeight; }); }

// ── Splash fadeout keyframe ───────────────────────────────────
var style = document.createElement('style');
style.textContent = '@keyframes fadeOut { to { opacity:0; pointer-events:none; } }';
document.head.appendChild(style);

// ── Google Button Styles ──────────────────────────────────────
var gStyle = document.createElement('style');
gStyle.textContent = '.google-btn { display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;background:#fff;color:#444;border:1px solid #ddd;border-radius:var(--radius-md);font-size:.95rem;font-weight:600;cursor:pointer;transition:box-shadow .2s,transform .15s; } .google-btn:hover { box-shadow:0 4px 16px rgba(0,0,0,.15);transform:translateY(-1px); } :root.light .google-btn { border-color:#ccc; } :root.light .google-btn:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); }';
document.head.appendChild(gStyle);