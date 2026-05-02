// BlakeBet | auth.js | v1
// ================================================================
// AUTH
// ================================================================

// ── Tab switcher ─────────────────────────────────────────────────
function aTab(tab, el) {
  document.getElementById('a-login').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('a-reg').style.display      = tab === 'register' ? 'block' : 'none';
  document.getElementById('a-success').style.display  = 'none';
  document.getElementById('a-forgot').style.display   = 'none';
  document.querySelectorAll('.a-tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
}

// ── Show forgot password panel ────────────────────────────────────
function showForgot() {
  document.getElementById('a-login').style.display   = 'none';
  document.getElementById('a-reg').style.display     = 'none';
  document.getElementById('a-success').style.display = 'none';
  document.getElementById('a-forgot').style.display  = 'block';
  document.getElementById('fp-err').textContent      = '';
  document.getElementById('fp-em').value             = '';
}

// ── Toggle password visibility ────────────────────────────────────
function togglePw(inputId, iconEl) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    iconEl.textContent = '🙈';
  } else {
    inp.type = 'password';
    iconEl.textContent = '👁';
  }
}

// ── REGISTER ─────────────────────────────────────────────────────
async function doRegister() {
  const nm  = document.getElementById('rg-nm').value.trim();
  const em  = document.getElementById('rg-em').value.trim().toLowerCase();
  const pfx = document.getElementById('rg-pfx').value.trim() || '+254';
  const ph  = document.getElementById('rg-ph').value.trim().replace(/\s+/g,'');
  const pw  = document.getElementById('rg-pw').value;
  const pw2 = document.getElementById('rg-pw2').value;
  const err = document.getElementById('rg-err');
  const btn = document.getElementById('rg-btn');

  err.textContent = '';

  // ── Validation ──────────────────────────────────────────────────
  if (!nm)  { err.textContent = 'Full name is required.'; return; }
  if (!em)  { err.textContent = 'Email address is required.'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em)) { err.textContent = 'Enter a valid email address.'; return; }
  if (!ph)  { err.textContent = 'Phone number is required.'; return; }
  if (!/^\d{7,12}$/.test(ph)) { err.textContent = 'Enter a valid phone number (digits only, 7-12 digits).'; return; }
  if (pw.length < 6)  { err.textContent = 'Password must be at least 6 characters.'; return; }
  if (pw !== pw2) { err.textContent = 'Passwords do not match.'; return; }

  const fullPhone  = pfx + ph;
  const OWNER      = 'melbinance15@gmail.com';
  const startCoins = (em === OWNER) ? 1000000 : 2000;
  const refCode    = (document.getElementById('rg-ref')?.value.trim().toUpperCase()) || '';

  // ── Firebase path ────────────────────────────────────────────────
  if (window.FB?.ready()) {
    btn.disabled = true; btn.textContent = 'Creating account...';
    try {
      // Check phone uniqueness first
      const phoneTaken = await window.FB.checkPhone(fullPhone);
      if (phoneTaken) {
        err.textContent = 'This phone number is already registered. Please log in.';
        btn.disabled = false; btn.textContent = 'CREATE ACCOUNT';
        return;
      }
      await window.FB.register(em, pw, nm, fullPhone, startCoins, refCode);
      btn.disabled = false; btn.textContent = 'CREATE ACCOUNT';
      // Show success screen
      showRegSuccess(em);
    } catch(e) {
      btn.disabled = false; btn.textContent = 'CREATE ACCOUNT';
      if (e.code === 'auth/email-already-in-use') {
        err.textContent = 'This email is already registered. Please log in.';
      } else if (e.code === 'auth/weak-password') {
        err.textContent = 'Password must be at least 6 characters.';
      } else {
        err.textContent = e.message || 'Registration failed. Please try again.';
      }
    }
    return;
  }

  // ── localStorage fallback ────────────────────────────────────────
  const users = JSON.parse(localStorage.getItem('bb5_users') || '{}');
  if (users[em]) { err.textContent = 'This email is already registered. Please log in.'; return; }
  const phoneTaken = Object.values(users).some(u => u.phone === fullPhone);
  if (phoneTaken)  { err.textContent = 'This phone number is already registered.'; return; }
  users[em] = { pw, phone: fullPhone };
  localStorage.setItem('bb5_users', JSON.stringify(users));
  const ud = {
    name: nm, email: em, phone: fullPhone, coins: startCoins,
    bets: [], since: new Date().toLocaleDateString('en-KE'),
    stats: { total:0, wins:0, wonC:0, lostC:0 }, refs:0, refCoins:0
  };
  localStorage.setItem('bb5_ud_' + em, JSON.stringify(ud));
  if (refCode) applyReferral(refCode, em);
  showRegSuccess(em);
}

// ── Show registration success screen ─────────────────────────────
function showRegSuccess(email) {
  document.getElementById('a-reg').style.display     = 'none';
  document.getElementById('a-login').style.display   = 'none';
  document.getElementById('a-forgot').style.display  = 'none';
  document.getElementById('a-success').style.display = 'block';
  const emailSpan = document.getElementById('success-email');
  if (emailSpan) emailSpan.textContent = email;
}

// ── Go to login after success screen ─────────────────────────────
function goToLogin() {
  document.getElementById('a-success').style.display = 'none';
  document.getElementById('a-forgot').style.display  = 'none';
  document.getElementById('a-reg').style.display     = 'none';
  document.getElementById('a-login').style.display   = 'block';
  document.querySelectorAll('.a-tab').forEach(t => t.classList.remove('on'));
  document.querySelector('.a-tab[onclick*="login"]')?.classList.add('on');
}

// ── LOGIN ─────────────────────────────────────────────────────────
async function doLogin() {
  const em  = document.getElementById('li-em').value.trim().toLowerCase();
  const pw  = document.getElementById('li-pw').value;
  const err = document.getElementById('li-err');
  const btn = document.getElementById('li-btn');

  err.textContent = '';

  if (!em) { err.textContent = 'Please enter your email.'; return; }
  if (!pw) { err.textContent = 'Please enter your password.'; return; }

  // ── Firebase path ────────────────────────────────────────────────
  if (window.FB?.ready()) {
    btn.disabled = true; btn.textContent = 'Signing in...';
    try {
      const { uid, ud } = await window.FB.login(em, pw);
      btn.disabled = false; btn.textContent = 'LOGIN';
      loginUser(em, { ...ud, uid });
    } catch(e) {
      btn.disabled = false; btn.textContent = 'LOGIN';
      if (e.code === 'auth/email-not-verified') {
        err.innerHTML = 'Please verify your email first. Check your inbox.<br><a href="#" onclick="resendVerif(\'' + em + '\')" style="color:var(--gold);font-size:.8rem;">Resend verification email</a>';
      } else if (
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/invalid-credential'
      ) {
        err.textContent = 'Incorrect email or password.';
      } else {
        err.textContent = e.message || 'Login failed. Please try again.';
      }
    }
    return;
  }

  // ── localStorage fallback ────────────────────────────────────────
  const users = JSON.parse(localStorage.getItem('bb5_users') || '{}');
  if (!users[em] || users[em].pw !== pw) { err.textContent = 'Incorrect email or password.'; return; }
  const ud = JSON.parse(localStorage.getItem('bb5_ud_' + em) || 'null');
  if (!ud) { err.textContent = 'Account not found.'; return; }
  loginUser(em, ud);
}

// ── Resend verification email ─────────────────────────────────────
async function resendVerif(email) {
  const pw = document.getElementById('li-pw').value;
  const err = document.getElementById('li-err');
  try {
    await window.FB.resendVerification(email, pw);
    err.textContent = 'Verification email resent! Check your inbox.';
    err.style.color = 'var(--green)';
  } catch(e) {
    err.textContent = 'Could not resend. Try again in a moment.';
    err.style.color = 'var(--red)';
  }
}

// ── FORGOT PASSWORD ───────────────────────────────────────────────
async function doResetPassword() {
  const em  = document.getElementById('fp-em').value.trim().toLowerCase();
  const err = document.getElementById('fp-err');
  const btn = document.getElementById('fp-btn');

  err.textContent = '';
  if (!em) { err.textContent = 'Please enter your email address.'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em)) { err.textContent = 'Enter a valid email address.'; return; }

  if (window.FB?.ready()) {
    btn.disabled = true; btn.textContent = 'Sending...';
    try {
      await window.FB.resetPassword(em);
      btn.disabled = false; btn.textContent = 'SEND RESET LINK';
      err.style.color = 'var(--green)';
      err.textContent = 'Password reset email sent! Check your inbox then log in.';
    } catch(e) {
      btn.disabled = false; btn.textContent = 'SEND RESET LINK';
      err.style.color = 'var(--red)';
      if (e.code === 'auth/user-not-found') {
        err.textContent = 'No account found with that email.';
      } else {
        err.textContent = e.message || 'Could not send reset email. Try again.';
      }
    }
  } else {
    err.style.color = 'var(--green)';
    err.textContent = 'If that email exists, a reset link has been sent.';
  }
}

// ── LOGIN USER (sets CU and starts the app) ───────────────────────
function loginUser(em, ud) {
  CU = { ...ud, email: em };
  if (ud.uid) CU.uid = ud.uid;
  localStorage.setItem('bb5_lastuser', em);
  localStorage.setItem('bb5_ud_' + em, JSON.stringify(ud));
  document.getElementById('auth').style.display = 'none';
  document.getElementById('app').style.display  = 'flex';
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
  setTimeout(() => {
    if (window.FB?.ready()) {
      const dot = document.getElementById('chat-status-dot');
      if (dot) { dot.textContent = '· 🟢 live across all users'; dot.style.color = 'var(--green)'; }
      window.FB.listenChat(() => {
        if (!chatOpen) { const b = document.getElementById('chat-badge'); if (b) b.classList.add('on'); }
      });
    }
  }, 2000);
}

// ── LOGOUT ────────────────────────────────────────────────────────
async function doLogout() {
  saveCU();
  if (window.FB?.ready()) await window.FB.logout();
  localStorage.removeItem('bb5_lastuser');
  CU = null;
  stopAllTimers();
  clearBvTimers();
  window.FB?.stopChat?.();
  document.getElementById('app').style.display  = 'none';
  document.getElementById('auth').style.display = 'flex';
  document.getElementById('chat-btn')?.classList.remove('on');
  slip = [];
}

// ── SAVE CURRENT USER ─────────────────────────────────────────────
function saveCU() {
  if (!CU) return;
  const data = {
    name: CU.name, email: CU.email, phone: CU.phone || '',
    coins: CU.coins, bets: CU.bets, since: CU.since,
    stats: CU.stats, refs: CU.refs||0, refCoins: CU.refCoins||0
  };
  localStorage.setItem('bb5_ud_' + CU.email, JSON.stringify(data));
  localStorage.setItem('bb5_lastuser', CU.email);
  lbSaveMyScore();
  if (window.FB?.ready() && CU.uid) {
    window.FB.save({ ...data, uid: CU.uid }).catch(e => console.warn('[Firebase] Save failed:', e));
  }
}

// ── COIN DISPLAY ──────────────────────────────────────────────────
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
