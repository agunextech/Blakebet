// ================================================================
// AUTH
// ================================================================
function aTab(tab, el) {
  document.getElementById('a-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('a-reg').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.a-tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
}

async function doRegister() {
  const nm  = document.getElementById('rg-nm').value.trim();
  const em  = document.getElementById('rg-em').value.trim().toLowerCase();
  const pfx = (document.getElementById('rg-pfx').value.trim() || '+254');
  const ph  = document.getElementById('rg-ph').value.trim().replace(/\s+/g,'');
  const pw  = document.getElementById('rg-pw').value;
  const pw2 = document.getElementById('rg-pw2').value;
  const err = document.getElementById('rg-err');
  const btn = document.querySelector('.a-btn');

  if (!nm)  { err.textContent = 'Full name is required.'; return; }
  if (!em)  { err.textContent = 'Email address is required.'; return; }
  if (!ph)  { err.textContent = 'Phone number is required.'; return; }
  if (!pw)  { err.textContent = 'Password is required.'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em)) { err.textContent = 'Enter a valid email address.'; return; }
  if (!/^\d{7,12}$/.test(ph)) { err.textContent = 'Enter a valid phone number (7–12 digits).'; return; }
  if (pw.length < 6)  { err.textContent = 'Password must be at least 6 characters.'; return; }
  if (pw !== pw2) { err.textContent = 'Passwords do not match.'; return; }

  const fullPhone = pfx + ph;
  const OWNER_EMAIL = 'melbinance15@gmail.com';
  const startCoins = (em === OWNER_EMAIL) ? 1000000 : 2000;
  const refCode = document.getElementById('rg-ref')?.value.trim().toUpperCase() || '';

  // ── Firebase path ─────────────────────────────────────────────
  if (window.FB?.ready()) {
    if (btn) { btn.disabled = true; btn.textContent = 'Creating account...'; }
    err.textContent = '';
    try {
      const { uid, ud } = await window.FB.register(em, pw, nm, fullPhone, startCoins, refCode);
      if (btn) { btn.disabled = false; btn.textContent = 'CREATE ACCOUNT'; }
      loginUser(em, { ...ud, uid });
    } catch(e) {
      if (btn) { btn.disabled = false; btn.textContent = 'CREATE ACCOUNT'; }
      if (e.code === 'auth/email-already-in-use') err.textContent = 'This email is already registered. Please log in.';
      else if (e.code === 'auth/weak-password') err.textContent = 'Password must be at least 6 characters.';
      else err.textContent = 'Registration failed: ' + (e.message || e);
    }
    return;
  }

  // ── localStorage fallback (no Firebase config yet) ────────────
  const users = JSON.parse(localStorage.getItem('bb5_users') || '{}');
  if (users[em]) { err.textContent = 'This email is already registered. Please log in.'; return; }
  const phoneTaken = Object.values(users).some(u => u.phone === fullPhone);
  if (phoneTaken) { err.textContent = 'This phone number is already registered.'; return; }
  users[em] = { pw, phone: fullPhone };
  localStorage.setItem('bb5_users', JSON.stringify(users));
  const ud = { name: nm, email: em, phone: fullPhone, coins: startCoins, bets: [], since: new Date().toLocaleDateString('en-KE'), stats: { total:0, wins:0, wonC:0, lostC:0 }, refs:0, refCoins:0 };
  localStorage.setItem('bb5_ud_' + em, JSON.stringify(ud));
  if (refCode) applyReferral(refCode, em);
  err.textContent = '';
  loginUser(em, ud);
}

async function doLogin() {
  const em  = document.getElementById('li-em').value.trim().toLowerCase();
  const pw  = document.getElementById('li-pw').value;
  const err = document.getElementById('li-err');
  const btn = document.querySelector('#a-login .a-btn');

  // ── Firebase path ─────────────────────────────────────────────
  if (window.FB?.ready()) {
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }
    err.textContent = '';
    try {
      const { uid, ud } = await window.FB.login(em, pw);
      if (btn) { btn.disabled = false; btn.textContent = 'LOGIN'; }
      loginUser(em, { ...ud, uid });
    } catch(e) {
      if (btn) { btn.disabled = false; btn.textContent = 'LOGIN'; }
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        err.textContent = 'Incorrect email or password.';
      } else {
        err.textContent = 'Login failed: ' + (e.message || e);
      }
    }
    return;
  }

  // ── localStorage fallback ─────────────────────────────────────
  const users = JSON.parse(localStorage.getItem('bb5_users') || '{}');
  if (!users[em] || users[em].pw !== pw) { err.textContent = 'Incorrect email or password.'; return; }
  const ud = JSON.parse(localStorage.getItem('bb5_ud_' + em) || 'null');
  if (!ud) { err.textContent = 'Account not found.'; return; }
  err.textContent = '';
  loginUser(em, ud);
}

function loginUser(em, ud) {
  CU = { ...ud, email: em };
  // Store uid if provided from Firebase
  if (ud.uid) CU.uid = ud.uid;
  localStorage.setItem('bb5_lastuser', em);
  // Always cache locally for offline speed
  localStorage.setItem('bb5_ud_' + em, JSON.stringify(ud));
  document.getElementById('auth').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('h-user').textContent = CU.name.split(' ')[0];
  updateCoins();
  season = loadGlobalSeason();
  DIV2.forEach(d2 => { d2season[d2.id] = getOrCreateDiv2Season(d2.id); });
  syncSeasonToCurrentTime();
  syncDiv2ToCurrentTime();
  startLiveEngine();
  goPage('sports');
  updatePendingBadge();
  loadWinFeedFromFirebase();
  renderWinners();
  toast(`Welcome, ${CU.name.split(' ')[0]}! 🪙 ${Math.floor(CU.coins).toLocaleString()} AguCoins`, 'g');
  setTimeout(() => sweepPendingBets(), 1500);
  setTimeout(() => checkDailyBonus(), 2500);
  document.getElementById('chat-btn')?.classList.add('on');
  updateNotifDot();
  setTimeout(() => checkAchievements(), 1000);
  // Firebase: update chat status dot + start background badge listener
  setTimeout(() => {
    if (window.FB?.ready()) {
      const dot = document.getElementById('chat-status-dot');
      if (dot) { dot.textContent = '· 🟢 live across all users'; dot.style.color = 'var(--green)'; }
      window.FB.listenChat(() => {
        if (!chatOpen) { const b=document.getElementById('chat-badge'); if(b)b.classList.add('on'); }
      });
    }
  }, 2000);
}

async function doLogout() {
  saveCU();
  if (window.FB?.ready()) await window.FB.logout();
  localStorage.removeItem('bb5_lastuser');
  CU = null;
  stopAllTimers();
  clearBvTimers();
  window.FB?.stopChat?.();
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth').style.display = 'flex';
  document.getElementById('chat-btn')?.classList.remove('on');
  slip = [];
}

function saveCU() {
  if (!CU) return;
  const data = { name: CU.name, email: CU.email, phone: CU.phone || '', coins: CU.coins, bets: CU.bets, since: CU.since, stats: CU.stats, refs: CU.refs||0, refCoins: CU.refCoins||0 };
  // Always save locally for speed
  localStorage.setItem('bb5_ud_' + CU.email, JSON.stringify(data));
  localStorage.setItem('bb5_lastuser', CU.email);
  lbSaveMyScore();
  // Also sync to Firebase if available (non-blocking)
  if (window.FB?.ready() && CU.uid) {
    window.FB.save({ ...data, uid: CU.uid }).catch(e => console.warn('[Firebase] Save failed:', e));
  }
}

function updateCoins() {
  if (!CU) return;
  const v = Math.floor(CU.coins).toLocaleString();
  document.getElementById('hcv').textContent = v;
  const pc = document.getElementById('p-coins');
  if (pc) pc.textContent = v;
}

function buyCoin(amount, price) {
  if (!CU) return;
  CU.coins += amount; updateCoins(); saveCU();
  toast(`+${amount.toLocaleString()} AguCoins! (${price} — M-PESA soon)`, 'g');
}

// ================================================================
// GLOBAL SEASON SYNC
