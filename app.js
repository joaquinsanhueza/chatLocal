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
  mediaRecorder: null,
  audioChunks: [],
  recording: false,
  editingMsgId: null,
  unsubscribers: [],
};

// ── DOM refs ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const splash = $('splash'), app = $('app'), loginSection = $('loginSection');
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

// ── AVATAR HELPERS ───────────────────────────────────────────
const AVATAR_COLORS = [
  '#00873E','#005A2B','#0033A0','#CC2229','#C9A84C',
  '#1565C0','#00695C','#6A1B9A','#E65100','#558B2F'
];
function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
// Crea un elemento <img> o <div> según si hay foto o no
function makeAvatarEl(photo, name, className) {
  const initial = (name || '?')[0].toUpperCase();
  if (photo) {
    const img = document.createElement('img');
    img.className = className;
    img.src = photo;
    img.alt = initial;
    img.style.objectFit = 'cover';
    img.onerror = () => {
      // Fallback a div con inicial cuando la imagen falla
      const div = document.createElement('div');
      div.className = className;
      div.textContent = initial;
      div.style.background = getAvatarColor(name);
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.style.color = '#fff';
      div.style.fontWeight = '800';
      div.style.fontSize = '.75rem';
      img.replaceWith(div);
    };
    return img;
  } else {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = initial;
    div.style.background = getAvatarColor(name);
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.color = '#fff';
    div.style.fontWeight = '800';
    div.style.fontSize = '.75rem';
    return div;
  }
}

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
    // Update profile with display name BEFORE auth state change fires
    await result.user.updateProfile({ displayName: name });
    // Reload user to make sure displayName is updated in the auth object
    await result.user.reload();
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

auth.onAuthStateChanged(async user => {
  console.log('Auth state changed. User:', user ? user.displayName : 'null');
  if (user) {
    // Si displayName aún no está disponible (recién registrado), recargar el usuario
    if (!user.displayName) {
      try { await user.reload(); user = auth.currentUser; } catch(e) {}
    }

    const displayName = user.displayName || user.email?.split('@')[0] || 'Usuario';
    state.user = { uid: user.uid, name: displayName, email: user.email, photo: user.photoURL };

    // Avatar del sidebar
    const initial = displayName[0].toUpperCase();
    userAvatarEl.textContent = '';
    userAvatarEl.style.backgroundImage = '';
    userAvatarEl.style.backgroundSize = 'cover';
    userAvatarEl.style.backgroundPosition = 'center';
    if (user.photoURL) {
      // Verificar si la imagen carga bien antes de usarla
      const testImg = new Image();
      testImg.onload = () => {
        userAvatarEl.style.backgroundImage = 'url(' + user.photoURL + ')';
        userAvatarEl.textContent = '';
        userAvatarEl.style.background = 'url(' + user.photoURL + ') center/cover no-repeat';
      };
      testImg.onerror = () => {
        userAvatarEl.style.backgroundImage = 'none';
        userAvatarEl.style.background = getAvatarColor(displayName);
        userAvatarEl.textContent = initial;
      };
      testImg.src = user.photoURL;
      // Mostrar inicial mientras carga
      userAvatarEl.style.background = getAvatarColor(displayName);
      userAvatarEl.textContent = initial;
    } else {
      userAvatarEl.style.background = getAvatarColor(displayName);
      userAvatarEl.textContent = initial;
    }
    userNameEl.textContent = displayName;

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
  // Asegurar que el nombre nunca sea null/undefined
  const username = state.user.name || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuario';
  const msg = {
    userId: state.user.uid,
    username: username,
    userPhoto: state.user.photo || null,
    type: type,
    content: content,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    edited: false
  };
  Object.assign(msg, extra);
  try {
    await db.collection('rooms').doc(state.currentRoom).collection('messages').add(msg);
    if (type === 'text') { msgInput.value = ''; msgInput.style.height = 'auto'; }
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

  const avatarEl = makeAvatarEl(msg.userPhoto, msg.username || 'Anónimo', 'msg-avatar');
  avatarEl.style.width = '32px';
  avatarEl.style.height = '32px';
  avatarEl.style.borderRadius = '50%';
  avatarEl.style.flexShrink = '0';
  avatarEl.style.alignSelf = 'flex-end';
  avatarEl.style.border = '2px solid var(--bg-surface)';
  if (msg.userPhoto && avatarEl.tagName === 'IMG') {
    avatarEl.style.objectFit = 'cover';
  }

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

  bodyEl.appendChild(metaEl); bodyEl.appendChild(bubbleEl);
  wrapper.appendChild(avatarEl); wrapper.appendChild(bodyEl);
  container.appendChild(wrapper);
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
// Estado: 'idle' | 'recording' | 'sending'
let _recState = 'idle';
let _recStream = null;
let _recRecorder = null;
let _recChunks = [];
let _recStartTime = 0;
let _recTimerInterval = null;
let _recTimerEl = null;

function _recGetTimerEl() {
  if (!_recTimerEl) {
    _recTimerEl = document.createElement('span');
    _recTimerEl.style.cssText = 'position:absolute;bottom:115%;left:50%;transform:translateX(-50%);background:#e52d27;color:#fff;font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap;pointer-events:none;z-index:99;';
    audioRecordBtn.style.position = 'relative';
    audioRecordBtn.appendChild(_recTimerEl);
  }
  return _recTimerEl;
}

function _recFullReset() {
  clearInterval(_recTimerInterval); _recTimerInterval = null;
  if (_recTimerEl) _recTimerEl.style.display = 'none';
  if (_recStream) { _recStream.getTracks().forEach(t => t.stop()); _recStream = null; }
  _recChunks = []; _recRecorder = null; _recState = 'idle'; _recStartTime = 0;
  audioRecordBtn.classList.remove('recording');
  audioRecordBtn.disabled = false;
}

audioRecordBtn.addEventListener('click', async () => {
  if (_recState === 'sending') return;
  if (_recState === 'recording') {
    _recStopAndSend();
  } else {
    await _recBeginRecording();
  }
});

async function _recBeginRecording() {
  if (!state.currentRoom) { toast('Selecciona una sala primero', 'danger'); return; }

  try {
    _recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    toast('Sin permiso de micrófono: ' + err.message, 'danger');
    return;
  }

  const mimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', ''];
  const mimeType = mimes.find(m => !m || MediaRecorder.isTypeSupported(m)) || '';

  try {
    _recRecorder = new MediaRecorder(_recStream, mimeType ? { mimeType } : {});
  } catch (err) {
    toast('Error al iniciar grabación: ' + err.message, 'danger');
    _recStream.getTracks().forEach(t => t.stop()); _recStream = null;
    return;
  }

  _recChunks = [];
  _recStartTime = Date.now();
  _recState = 'recording';
  audioRecordBtn.classList.add('recording');

  _recRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) _recChunks.push(e.data); };
  _recRecorder.onerror = () => { toast('Error al grabar, intenta de nuevo', 'danger'); _recFullReset(); };

  const timerEl = _recGetTimerEl();
  timerEl.textContent = '0:00';
  timerEl.style.display = 'block';
  _recTimerInterval = setInterval(() => {
    const secs = Math.floor((Date.now() - _recStartTime) / 1000);
    timerEl.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    if (secs >= 180) _recStopAndSend(); // auto-stop a los 3 min
  }, 500);

  _recRecorder.start(250); // timeslice 250ms → datos llegan progresivamente
  toast('🔴 Grabando… presiona de nuevo para enviar', '');
}

function _recStopAndSend() {
  if (_recState !== 'recording') return;
  _recState = 'sending';

  clearInterval(_recTimerInterval); _recTimerInterval = null;
  if (_recTimerEl) _recTimerEl.style.display = 'none';
  audioRecordBtn.classList.remove('recording');
  audioRecordBtn.disabled = true;

  const capturedMime = (_recRecorder && _recRecorder.mimeType) || 'audio/webm';
  const durationSecs = _recStartTime ? (Date.now() - _recStartTime) / 1000 : 1;

  if (_recRecorder && _recRecorder.state !== 'inactive') {
    // Asignar onstop justo antes de stop() — sin condición de carrera
    _recRecorder.onstop = () => {
      if (_recStream) { _recStream.getTracks().forEach(t => t.stop()); _recStream = null; }
      _recDoSendAudio(_recChunks.slice(), capturedMime, durationSecs);
    };
    _recRecorder.stop();
  } else {
    if (_recStream) { _recStream.getTracks().forEach(t => t.stop()); _recStream = null; }
    _recDoSendAudio(_recChunks.slice(), capturedMime, durationSecs);
  }
}

async function _recDoSendAudio(chunks, mime, durationSecs) {
  try {
    if (!chunks || chunks.length === 0) {
      toast('No se capturó audio, intenta de nuevo', 'danger'); return;
    }

    const blob = new Blob(chunks, { type: mime });

    if (blob.size < 100 || durationSecs < 0.3) {
      toast('Audio muy corto, intenta de nuevo', 'danger'); return;
    }

    // Firestore límite ~1MB. 600KB blob → ~800KB base64 = seguro
    if (blob.size > 600 * 1024) {
      toast('Audio demasiado largo (máx ~3 min)', 'danger'); return;
    }

    // Convertir a base64 data URL — sin Firebase Storage, funciona en GitHub Pages
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error al leer el audio'));
      reader.readAsDataURL(blob);
    });

    const durationStr = Math.floor(durationSecs / 60) + ':' + String(Math.floor(durationSecs % 60)).padStart(2, '0');
    await sendMessage(dataUrl, 'audio', { duration: durationStr, mimeType: mime });
    toast('🎤 Audio enviado', 'success');
  } catch (err) {
    console.error('Audio error:', err);
    toast('Error al enviar audio: ' + err.message, 'danger');
  } finally {
    _recFullReset(); // SIEMPRE se ejecuta — reactiva el botón
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
    const li = document.createElement('li'); li.className = 'member-item';
    const av = makeAvatarEl(m.photo, m.name, 'member-avatar');
    av.style.width = '34px'; av.style.height = '34px'; av.style.borderRadius = '50%'; av.style.flexShrink = '0';
    if (m.photo && av.tagName === 'IMG') av.style.objectFit = 'cover';
    const nameSpan = document.createElement('span'); nameSpan.className = 'member-name'; nameSpan.textContent = escHtml(m.name || 'Anónimo');
    const statusSpan = document.createElement('span'); statusSpan.className = 'member-status'; statusSpan.textContent = m.uid === state.user?.uid ? '(tú)' : '🟢';
    li.appendChild(av); li.appendChild(nameSpan); li.appendChild(statusSpan);
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

// ═══════════════════════════════════════════════════════════
//  PROFILE EDIT
// ═══════════════════════════════════════════════════════════
const profileModal       = $('profileModal');
const profileAvatarWrap  = $('profileAvatarWrap');
const profileAvatarPrev  = $('profileAvatarPreview');
const profilePhotoInput  = $('profilePhotoInput');
const profileNameInput   = $('profileNameInput');
const profileUploadStatus = $('profileUploadStatus');
const saveProfileBtn     = $('saveProfileBtn');
const cancelProfileBtn   = $('cancelProfileBtn');
const userPill           = $('userPill');

let profileNewPhotoURL = null; // URL de la nueva foto (si se sube)

// Abrir modal al hacer clic en el user pill
userPill.addEventListener('click', openProfileModal);

function openProfileModal() {
  if (!state.user) return;
  profileNewPhotoURL = null;
  profileNameInput.value = state.user.name || '';
  profileUploadStatus.className = 'profile-upload-status hidden';
  profileUploadStatus.textContent = '';
  renderProfilePreview(state.user.photo, state.user.name);
  profileModal.classList.remove('hidden');
  setTimeout(() => profileNameInput.focus(), 100);
}

// Renderiza el preview del avatar en el modal
function renderProfilePreview(photoURL, name) {
  const initial = (name || '?')[0].toUpperCase();
  profileAvatarPrev.textContent = '';
  profileAvatarPrev.style.backgroundImage = '';
  if (photoURL) {
    profileAvatarPrev.style.background = getAvatarColor(name) + ' center/cover no-repeat';
    profileAvatarPrev.textContent = initial;
    const testImg = new Image();
    testImg.onload = () => {
      profileAvatarPrev.style.background = 'url(' + photoURL + ') center/cover no-repeat';
      profileAvatarPrev.textContent = '';
    };
    testImg.onerror = () => {
      profileAvatarPrev.style.background = getAvatarColor(name);
      profileAvatarPrev.textContent = initial;
    };
    testImg.src = photoURL;
  } else {
    profileAvatarPrev.style.background = getAvatarColor(name);
    profileAvatarPrev.textContent = initial;
  }
}

// Clic en avatar del modal → abrir selector de archivo
profileAvatarWrap.addEventListener('click', () => profilePhotoInput.click());

// Cuando se elige una foto
profilePhotoInput.addEventListener('change', async () => {
  const file = profilePhotoInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showUploadStatus('La foto debe pesar menos de 5MB', 'error');
    return;
  }

  // Preview local inmediato con FileReader
  const reader = new FileReader();
  reader.onload = (e) => {
    profileAvatarPrev.style.background = 'url(' + e.target.result + ') center/cover no-repeat';
    profileAvatarPrev.textContent = '';
  };
  reader.readAsDataURL(file);

  // Subir a Firebase Storage
  showUploadStatus('Subiendo foto…');
  try {
    const ref = storage.ref('avatars/' + state.user.uid + '_' + Date.now() + '.' + file.name.split('.').pop());
    const snap = await ref.put(file);
    profileNewPhotoURL = await snap.ref.getDownloadURL();
    showUploadStatus('Foto lista ✓', 'done');
  } catch (err) {
    showUploadStatus('Error al subir: ' + err.message, 'error');
    profileNewPhotoURL = null;
  }
  profilePhotoInput.value = '';
});

// Guardar cambios
saveProfileBtn.addEventListener('click', async () => {
  const newName = profileNameInput.value.trim();
  if (!newName) {
    profileNameInput.focus();
    toast('El nombre no puede estar vacío', 'danger');
    return;
  }

  saveProfileBtn.disabled = true;
  saveProfileBtn.textContent = 'Guardando…';

  try {
    const updates = { displayName: newName };
    if (profileNewPhotoURL) updates.photoURL = profileNewPhotoURL;

    await auth.currentUser.updateProfile(updates);

    // Actualizar state local
    state.user.name = newName;
    if (profileNewPhotoURL) state.user.photo = profileNewPhotoURL;

    // Actualizar sidebar avatar
    const initial = newName[0].toUpperCase();
    userNameEl.textContent = newName;
    if (state.user.photo) {
      userAvatarEl.style.background = 'url(' + state.user.photo + ') center/cover no-repeat';
      userAvatarEl.textContent = '';
    } else {
      userAvatarEl.style.background = getAvatarColor(newName);
      userAvatarEl.textContent = initial;
    }

    profileModal.classList.add('hidden');
    toast('✅ Perfil actualizado', 'success');
  } catch (err) {
    toast('Error: ' + err.message, 'danger');
  } finally {
    saveProfileBtn.disabled = false;
    saveProfileBtn.textContent = 'Guardar cambios';
  }
});

// Cancelar
cancelProfileBtn.addEventListener('click', () => {
  profileModal.classList.add('hidden');
  profileNewPhotoURL = null;
});
profileModal.addEventListener('click', (e) => {
  if (e.target === profileModal) {
    profileModal.classList.add('hidden');
    profileNewPhotoURL = null;
  }
});

function showUploadStatus(msg, type = '') {
  profileUploadStatus.textContent = msg;
  profileUploadStatus.className = 'profile-upload-status' + (type ? ' ' + type : '');
}

// ── Google Button Styles ──────────────────────────────────────
var gStyle = document.createElement('style');
gStyle.textContent = '.google-btn { display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;background:#fff;color:#444;border:1px solid #ddd;border-radius:var(--radius-md);font-size:.95rem;font-weight:600;cursor:pointer;transition:box-shadow .2s,transform .15s; } .google-btn:hover { box-shadow:0 4px 16px rgba(0,0,0,.15);transform:translateY(-1px); }';
document.head.appendChild(gStyle);