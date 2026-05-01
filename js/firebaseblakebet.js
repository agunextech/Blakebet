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
         onAuthStateChanged }                         from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc,
         updateDoc, collection, addDoc,
         query, orderBy, limit, onSnapshot,
         serverTimestamp }                            from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ── Initialise ────────────────────────────────────────────────────
let fbApp, fbAuth, fbDb, fbReady = false, chatUnsub = null;

try {
  fbApp  = initializeApp(FIREBASE_CONFIG);
  fbAuth = getAuth(fbApp);
  fbDb   = getFirestore(fbApp);
  fbReady = true;
  console.log('[Firebase] Connected ✓');
} catch(e) {
  console.warn('[Firebase] Not configured — running in local mode:', e.message);
}

// ── Expose to global scope so legacy functions can call them ──────
window.FB = {
  ready: () => fbReady,

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
    // Also save username lookup so referrals can find by email
    await setDoc(doc(fbDb, 'emails', em.replace(/\./g,'_')), { uid, email: em });
    // Apply referral if provided
    if (refCode) await FB.applyReferral(refCode, em, uid);
    return { uid, ud };
  },

  // ── LOGIN ───────────────────────────────────────────────────────
  login: async (em, pw) => {
    const cred = await signInWithEmailAndPassword(fbAuth, em, pw);
    const uid  = cred.user.uid;
    const snap = await getDoc(doc(fbDb, 'users', uid));
    if (!snap.exists()) throw new Error('User data not found');
    return { uid, ud: snap.data() };
  },

  // ── LOGOUT ──────────────────────────────────────────────────────
  logout: async () => { if (fbReady) await signOut(fbAuth); },

  // ── SAVE USER DATA ──────────────────────────────────────────────
  save: async (ud) => {
    if (!ud?.uid) return;
    const { createdAt, ...data } = ud; // don't overwrite server timestamp
    await updateDoc(doc(fbDb, 'users', ud.uid), {
      coins: Math.floor(ud.coins),
      bets: ud.bets || [],
      stats: ud.stats || {},
      refs: ud.refs || 0,
      refCoins: ud.refCoins || 0,
      phone: ud.phone || ''
    });
  },

  // ── APPLY REFERRAL ──────────────────────────────────────────────
  applyReferral: async (refCode, newEmail, newUid) => {
    // Find referrer by their generated code
    // genRefCode is defined in legacy JS — compute same hash
    const allUsers = collection(fbDb, 'users');
    // We store refCode on the user document when they register
    const q = query(allUsers, limit(200));
    const snap = await getFirestore._getDocs?.(q) || null;
    // Simplified: bonus applied client-side for now, same as before
  },

  // ── LIVE CHAT via Firestore ─────────────────────────────────────
  sendChat: async (name, email, msg) => {
    await addDoc(collection(fbDb, 'chat'), {
      name, email, msg,
      ts: serverTimestamp()
    });
  },

  listenChat: (callback) => {
    if (chatUnsub) chatUnsub();
    const q = query(collection(fbDb, 'chat'), orderBy('ts','asc'), limit(80));
    chatUnsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(msgs);
    });
  },

  stopChat: () => { if (chatUnsub) { chatUnsub(); chatUnsub = null; } },

  // ── LEADERBOARD — read/write all users scores ───────────────────
  saveLbScore: async ({ uid, name, email, coins, since }) => {
    await setDoc(doc(fbDb, 'leaderboard', uid), { name, email, coins, since, ts: serverTimestamp() });
  },

  getLbScores: async () => {
    const { getDocs, collection: col, query: q2, orderBy: ob, limit: lim } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const snap = await getDocs(q2(col(fbDb, 'leaderboard'), ob('coins','desc'), lim(100)));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  },

  // ── WINNERS FEED cross-device ───────────────────────────────────
  pushWinEntry: async (entry) => {
    await addDoc(collection(fbDb, 'wins'), { ...entry, ts: serverTimestamp() });
  },
  listenWinFeed: (callback) => {
    const q = query(collection(fbDb, 'wins'), orderBy('ts','desc'), limit(30));
    onSnapshot(q, snap => { callback(snap.docs.map(d=>d.data()).reverse()); });
  },

  // ── AUTO LOGIN on page load ─────────────────────────────────────
  onAuthChange: (callback) => {
    if (!fbReady) return;
    onAuthStateChanged(fbAuth, callback);
  }
};

// ── Auto-login when Firebase auth state restores on page load ─────
if (fbReady) {
  window.FB.onAuthChange(async user => {
    if (user && !window.CU) {
      try {
        const snap = await getDoc(doc(fbDb, 'users', user.uid));
        if (snap.exists()) {
          const ud = snap.data();
          window.loginUser(ud.email, { ...ud, uid: user.uid });
        }
      } catch(e) { console.warn('[Firebase] Auto-login failed:', e); }
    }
  });
}