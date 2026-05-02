// BlakeBet | firebase.js | v1
// ── PASTE YOUR FIREBASE CONFIG HERE ──────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCFT_icLUTcwp7Q5RIOa-3gUM58eX_Mnd8",
  authDomain:        "blakebet-27095.firebaseapp.com",
  projectId:         "blakebet-27095",
  storageBucket:     "blakebet-27095.firebasestorage.app",
  messagingSenderId: "663498148764",
  appId:             "1:663498148764:web:67e768372d2cad33f41659"
};
// ─────────────────────────────────────────────────────────────────

import { initializeApp }                              from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, signOut,
         onAuthStateChanged, sendEmailVerification,
         sendPasswordResetEmail }                     from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc,
         updateDoc, collection, addDoc, getDocs,
         query, where, orderBy, limit, onSnapshot,
         serverTimestamp }                            from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let fbApp, fbAuth, fbDb, fbReady = false, chatUnsub = null;

try {
  fbApp  = initializeApp(FIREBASE_CONFIG);
  fbAuth = getAuth(fbApp);
  fbDb   = getFirestore(fbApp);
  fbReady = true;
  console.log('[Firebase] Connected');
} catch(e) {
  console.warn('[Firebase] Not configured:', e.message);
}

window.FB = {
  ready: () => fbReady,

  // ── CHECK PHONE UNIQUENESS ─────────────────────────────────────
  checkPhone: async (phone) => {
    const q = query(collection(fbDb, 'users'), where('phone', '==', phone), limit(1));
    const snap = await getDocs(q);
    return !snap.empty;
  },

  // ── REGISTER ───────────────────────────────────────────────────
  register: async (em, pw, name, phone, startCoins, refCode) => {
    const cred = await createUserWithEmailAndPassword(fbAuth, em, pw);
    const uid  = cred.user.uid;
    const ud   = {
      name, email: em, phone, coins: startCoins,
      bets: [], since: new Date().toLocaleDateString('en-KE'),
      stats: { total:0, wins:0, wonC:0, lostC:0 },
      refs: 0, refCoins: 0, uid,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(fbDb, 'users', uid), ud);
    await sendEmailVerification(cred.user);
    if (refCode) await window.FB.applyReferral(refCode, em, uid);
    // Sign out immediately so user must verify before logging in
    await signOut(fbAuth);
    return { uid, ud };
  },

  // ── RESEND VERIFICATION ─────────────────────────────────────────
  resendVerification: async (em, pw) => {
    const cred = await signInWithEmailAndPassword(fbAuth, em, pw);
    if (!cred.user.emailVerified) {
      await sendEmailVerification(cred.user);
      await signOut(fbAuth);
    }
  },

  // ── LOGIN ───────────────────────────────────────────────────────
  login: async (em, pw) => {
    const cred = await signInWithEmailAndPassword(fbAuth, em, pw);
    const user = cred.user;
    if (!user.emailVerified) {
      await signOut(fbAuth);
      const err = new Error('email-not-verified');
      err.code  = 'auth/email-not-verified';
      throw err;
    }
    const uid  = user.uid;
    const snap = await getDoc(doc(fbDb, 'users', uid));
    if (!snap.exists()) throw new Error('User data not found.');
    return { uid, ud: snap.data() };
  },

  // ── FORGOT PASSWORD ─────────────────────────────────────────────
  resetPassword: async (email) => {
    await sendPasswordResetEmail(fbAuth, email);
  },

  // ── LOGOUT ─────────────────────────────────────────────────────
  logout: async () => { if (fbReady) await signOut(fbAuth); },

  // ── SAVE USER DATA ──────────────────────────────────────────────
  save: async (ud) => {
    if (!ud?.uid) return;
    await updateDoc(doc(fbDb, 'users', ud.uid), {
      coins: Math.floor(ud.coins),
      bets: ud.bets || [],
      stats: ud.stats || {},
      refs: ud.refs || 0,
      refCoins: ud.refCoins || 0,
      phone: ud.phone || ''
    });
  },

  // ── REFERRAL ────────────────────────────────────────────────────
  applyReferral: async (refCode, newEmail, newUid) => {
    // handled client-side in ui.js
  },

  // ── LIVE CHAT ───────────────────────────────────────────────────
  sendChat: async (name, email, msg) => {
    await addDoc(collection(fbDb, 'chat'), { name, email, msg, ts: serverTimestamp() });
  },

  listenChat: (callback) => {
    if (chatUnsub) chatUnsub();
    const q = query(collection(fbDb, 'chat'), orderBy('ts','asc'), limit(80));
    chatUnsub = onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  stopChat: () => { if (chatUnsub) { chatUnsub(); chatUnsub = null; } },

  // ── LEADERBOARD ─────────────────────────────────────────────────
  saveLbScore: async ({ uid, name, email, coins, since }) => {
    await setDoc(doc(fbDb, 'leaderboard', uid), { name, email, coins, since, ts: serverTimestamp() });
  },

  getLbScores: async () => {
    const snap = await getDocs(query(collection(fbDb, 'leaderboard'), orderBy('coins','desc'), limit(100)));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  },

  // ── WIN FEED ────────────────────────────────────────────────────
  pushWinEntry: async (entry) => {
    await addDoc(collection(fbDb, 'wins'), { ...entry, ts: serverTimestamp() });
  },

  listenWinFeed: (callback) => {
    const q = query(collection(fbDb, 'wins'), orderBy('ts','desc'), limit(30));
    onSnapshot(q, snap => { callback(snap.docs.map(d => d.data()).reverse()); });
  },

  // ── AUTO LOGIN ON PAGE LOAD ──────────────────────────────────────
  onAuthChange: (callback) => {
    if (!fbReady) return;
    onAuthStateChanged(fbAuth, callback);
  }
};

// Auto-restore session if email is verified
if (fbReady) {
  window.FB.onAuthChange(async user => {
    if (user && !window.CU) {
      if (!user.emailVerified) return;
      try {
        const snap = await getDoc(doc(fbDb, 'users', user.uid));
        if (snap.exists()) {
          const ud = snap.data();
          if (typeof window.loginUser === 'function') {
            window.loginUser(ud.email, { ...ud, uid: user.uid });
          }
        }
      } catch(e) { console.warn('[Firebase] Auto-login failed:', e); }
    }
  });
}
