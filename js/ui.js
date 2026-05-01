// ================================================================
function showModal(won, amount, sels, odds) {
  document.getElementById('m-ico').textContent = won ? '🏆' : '😔';
  document.getElementById('m-ttl').className = 'mttl ' + (won ? 'won' : 'lost');
  document.getElementById('m-ttl').textContent = won ? 'YOU WON!' : 'BET LOST';
  document.getElementById('m-amt').className = 'mamt ' + (won ? 'won' : 'lost');
  document.getElementById('m-amt').textContent = (won ? '+' : '-') + '🪙 ' + Math.floor(amount).toLocaleString();
  document.getElementById('m-det').textContent = won ? `${sels} selections at ${odds}× — Winnings added to AguCoins!` : `Your ${sels}-fold bet didn't win this time. Try again!`;
  document.getElementById('modal').classList.add('on');
}
function closeModal() { document.getElementById('modal').classList.remove('on'); }

function toast(msg, type) {
  const w = document.getElementById('toastwrap');
  const d = document.createElement('div');
  d.className = 'tmsg ' + (type === 'g' ? 'tg' : type === 'l' ? 'tl' : type === 'w' ? 'tw' : 'ti');
  d.textContent = msg; w.appendChild(d);
  setTimeout(() => { d.style.transition = 'opacity .3s'; d.style.opacity = '0'; setTimeout(() => d.remove(), 300); }, 3200);
}

// ================================================================
// LEADERBOARD
// ================================================================
const LB_KEY = 'bb5_leaderboard';
const REDEEM_THRESHOLD = 50000;
const REDEEM_KSH = 1000;

function lbSaveMyScore() {
  if (!CU) return;
  try {
    // Always save locally
    const lb = JSON.parse(localStorage.getItem(LB_KEY) || '{}');
    lb[CU.email] = { name: CU.name, coins: Math.floor(CU.coins), since: CU.since, ts: Date.now() };
    localStorage.setItem(LB_KEY, JSON.stringify(lb));
    // Also save to Firestore leaderboard collection so all users are visible
    if (window.FB?.ready() && CU.uid) {
      window.FB?.saveLbScore?.({ uid: CU.uid, name: CU.name, email: CU.email, coins: Math.floor(CU.coins), since: CU.since });
    }
  } catch(e) {}
}

function renderLeaderboard() {
  const body = document.getElementById('lb-body');
  const seasonLbl = document.getElementById('lb-season-lbl');
  if (!body) return;
  lbSaveMyScore();
  const s = season ? season[LEAGUES[0].id] : null;
  if (seasonLbl && s) seasonLbl.textContent = `Season ${s.seasonNum || 1} · Matchweek ${(s.mw || 0) + 1}/38`;

  // Show loading state
  body.innerHTML = '<div class="lb-empty">Loading leaderboard...</div>';

  // Use Firestore if available for cross-device leaderboard
  if (window.FB?.ready()) {
    window.FB?.getLbScores?.().then(entries => {
      if (!entries || !entries.length) {
        // Fallback to local
        renderLeaderboardFromData(body, getLocalLbEntries());
      } else {
        renderLeaderboardFromData(body, entries);
      }
    }).catch(() => renderLeaderboardFromData(body, getLocalLbEntries()));
  } else {
    renderLeaderboardFromData(body, getLocalLbEntries());
  }
}

function getLocalLbEntries() {
  const lb = JSON.parse(localStorage.getItem(LB_KEY) || '{}');
  return Object.entries(lb).map(([email, d]) => ({ email, ...d })).sort((a,b) => b.coins - a.coins);
}

function renderLeaderboardFromData(body, entries) {
  if (!entries.length) {
    body.innerHTML = '<div class="lb-empty">No players yet. Be the first to play!</div>';
    return;
  }
  const sorted = [...entries].sort((a,b) => b.coins - a.coins);
  const rankIco = ['🥇','🥈','🥉'];
  const rankClass = ['r1','r2','r3'];
  const rowClass = ['top1','top2','top3'];
  body.innerHTML = sorted.map((e, i) => {
    const isMe = CU && (e.email === CU.email || e.uid === CU.uid);
    const rank = i + 1;
    const initials = (e.name||'?').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    const coins = Math.floor(e.coins || 0);
    const redeemable = Math.floor(coins / REDEEM_THRESHOLD);
    const canRedeem = isMe && redeemable >= 1;
    const kshValue = redeemable * REDEEM_KSH;
    const progress = Math.min(100, Math.round((coins % REDEEM_THRESHOLD) / REDEEM_THRESHOLD * 100));
    const coinsToNext = REDEEM_THRESHOLD - (coins % REDEEM_THRESHOLD);
    const rc = rank <= 3 ? rankClass[i] : 'rn';
    const ric = rank <= 3 ? rankIco[i] : rank;
    const rowc = rank <= 3 ? rowClass[i] : '';
    return `<div class="lb-row ${rowc} ${isMe ? 'me' : ''}">
      <div class="lb-rank ${rc}">${ric}</div>
      <div class="lb-av">${initials}</div>
      <div class="lb-info">
        <div class="lb-name">${e.name||'Player'}${isMe ? ' <span style="color:var(--gold);font-size:.58rem">(You)</span>' : ''}</div>
        <div class="lb-detail">Member since ${e.since || '—'}</div>
        ${isMe ? `
        <div style="margin-top:5px;">
          <div style="display:flex;justify-content:space-between;font-size:.58rem;color:var(--t3);margin-bottom:2px;">
            <span>${coins >= REDEEM_THRESHOLD ? `🏦 KSh ${kshValue.toLocaleString()} redeemable` : `🪙 ${coinsToNext.toLocaleString()} to KSh ${REDEEM_KSH}`}</span>
            <span>${progress}%</span>
          </div>
          <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${progress}%;background:${canRedeem ? 'var(--green)' : 'var(--gold)'};border-radius:2px;transition:width .4s;"></div>
          </div>
        </div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div class="lb-coins">🪙${coins.toLocaleString()}</div>
        ${canRedeem
          ? `<button class="lb-redeem-btn" onclick="lbRedeem(${redeemable},${kshValue})">💰 KSh ${kshValue.toLocaleString()}</button>`
          : isMe ? `<div style="font-size:.58rem;color:var(--t3);text-align:right;">Next: KSh ${REDEEM_KSH.toLocaleString()}</div>` : ''
        }
      </div>
    </div>`;
  }).join('');
}

function lbRedeem(redeemable, kshValue) {
  if (!CU || CU.coins < REDEEM_THRESHOLD) { toast('You need 50,000+ AguCoins to redeem', 'l'); return; }
  const coinsToRedeem = redeemable * REDEEM_THRESHOLD;
  toast(`💰 Redemption of KSh ${kshValue.toLocaleString()} requested! Agunextech will send to ${CU.phone || CU.email}`, 'g');
  const req = JSON.parse(localStorage.getItem('bb5_redeem_reqs') || '[]');
  req.push({
    name: CU.name,
    email: CU.email,
    phone: CU.phone,
    coins: coinsToRedeem,
    ksh: kshValue,
    rate: `${REDEEM_THRESHOLD} coins = KSh ${REDEEM_KSH}`,
    ts: new Date().toISOString()
  });
  localStorage.setItem('bb5_redeem_reqs', JSON.stringify(req));
}

// ================================================================
// M-PESA PAYMENT
// ================================================================
let mpesaPack = { coins: 0, price: '', amount: 0 };

function openMpesa(coins, price, amount) {
  mpesaPack = { coins, price, amount };
  document.getElementById('mp-coins').textContent = coins.toLocaleString() + ' 🪙';
  document.getElementById('mp-price').textContent = price;
  // Pre-fill with registered phone
  const phone = CU?.phone || '';
  document.getElementById('mp-phone').value = phone.replace('+254','0');
  const st = document.getElementById('mp-status');
  st.style.display = 'none'; st.className = 'mpesa-status';
  st.textContent = '';
  const btn = document.getElementById('mp-btn');
  btn.disabled = false; btn.textContent = '📲 SEND STK PUSH';
  document.getElementById('mpesa-modal').classList.add('on');
}

function closeMpesa() {
  document.getElementById('mpesa-modal').classList.remove('on');
}

function mpesaSubmit() {
  const phone = document.getElementById('mp-phone').value.trim();
  const st = document.getElementById('mp-status');
  const btn = document.getElementById('mp-btn');
  // Basic phone validation
  if (!/^(07|01|2547|2541|\+2547|\+2541)\d{7,8}$/.test(phone.replace(/\s/g,''))) {
    st.style.display = 'block'; st.className = 'mpesa-status error';
    st.textContent = '⚠️ Enter a valid Kenyan phone number (e.g. 0708692155)';
    return;
  }
  // Show pending state
  btn.disabled = true; btn.textContent = '⏳ Sending prompt...';
  st.style.display = 'block'; st.className = 'mpesa-status pending';
  st.textContent = `📲 STK Push sent to ${phone} — Check your phone and enter your M-PESA PIN`;
  // Simulate STK push — in production this calls your backend /mpesa/stkpush endpoint
  // Backend receives: phone, amount, accountRef (user email), coins to credit
  // On callback confirmation, backend adds coins to bb5_ud_{email}
  setTimeout(() => {
    st.className = 'mpesa-status pending';
    st.textContent = `⏳ Waiting for payment confirmation... (${mpesaPack.price})`;
    btn.textContent = '⏳ Awaiting PIN...';
    // Simulate 8 second confirmation window
    setTimeout(() => {
      st.className = 'mpesa-status success';
      st.textContent = `✅ Payment received! ${mpesaPack.coins.toLocaleString()} AguCoins will be credited shortly.`;
      btn.textContent = '✅ PAYMENT SENT';
      // NOTE: In production, DO NOT credit here — wait for real M-PESA callback
      // This is UI-only demo. Remove the line below when backend is connected:
      toast(`📲 M-PESA prompt sent for ${mpesaPack.price}. Coins credited after confirmation.`, 'g');
      setTimeout(() => closeMpesa(), 3000);
    }, 8000);
  }, 2000);
}

// ================================================================
// DAILY LOGIN BONUS
// ================================================================
const BONUS_SCHEDULE = [100, 150, 200, 250, 300, 400, 500]; // coins per day
const BONUS_KEY = 'bb5_bonus';

function getBonusData() {
  try { return JSON.parse(localStorage.getItem(BONUS_KEY + '_' + (CU?.email || '')) || 'null'); }
  catch(e) { return null; }
}
function saveBonusData(d) {
  localStorage.setItem(BONUS_KEY + '_' + CU.email, JSON.stringify(d));
}

function checkDailyBonus() {
  if (!CU) return;
  const today = new Date().toDateString();
  let bd = getBonusData();
  if (!bd) bd = { streak: 0, lastClaim: null, totalClaimed: 0 };
  // Already claimed today
  if (bd.lastClaim === today) return;
  // Streak broken if missed a day
  if (bd.lastClaim) {
    const last = new Date(bd.lastClaim);
    const diff = Math.floor((new Date() - last) / 86400000);
    if (diff > 1) bd.streak = 0; // reset streak
  }
  // Show bonus modal after short delay
  setTimeout(() => showBonusModal(), 1200);
}

function showBonusModal() {
  if (!CU) return;
  const today = new Date().toDateString();
  let bd = getBonusData();
  if (!bd) bd = { streak: 0, lastClaim: null, totalClaimed: 0 };
  const dayIdx = bd.streak % 7; // which day in the 7-day cycle
  const todayAmt = BONUS_SCHEDULE[dayIdx];
  const alreadyClaimed = bd.lastClaim === today;

  // Build days row
  const daysHtml = BONUS_SCHEDULE.map((amt, i) => {
    let cls = 'bday future';
    if (i < dayIdx) cls = 'bday done';
    if (i === dayIdx) cls = 'bday today';
    return `<div class="${cls}"><div class="bday-n">Day ${i+1}</div><div class="bday-c">${amt}</div></div>`;
  }).join('');
  document.getElementById('bonus-days-row').innerHTML = daysHtml;
  document.getElementById('bonus-streak-txt').textContent = `Day ${dayIdx+1} of 7 — Streak: ${bd.streak} days`;
  document.getElementById('bonus-today-amt').textContent = `🪙 ${todayAmt.toLocaleString()}`;
  const btn = document.getElementById('bonus-claim-btn');
  if (alreadyClaimed) {
    btn.textContent = '✅ Already claimed today';
    btn.disabled = true;
    btn.style.opacity = '0.5';
  } else {
    btn.textContent = `🎁 CLAIM 🪙${todayAmt.toLocaleString()}`;
    btn.disabled = false;
    btn.style.opacity = '1';
  }
  document.getElementById('bonus-modal').classList.add('on');
}

function claimBonus() {
  if (!CU) return;
  const today = new Date().toDateString();
  let bd = getBonusData();
  if (!bd) bd = { streak: 0, lastClaim: null, totalClaimed: 0 };
  if (bd.lastClaim === today) { toast('Already claimed today!', 'i'); return; }
  const dayIdx = bd.streak % 7;
  const amt = BONUS_SCHEDULE[dayIdx];
  bd.streak++;
  bd.lastClaim = today;
  bd.totalClaimed = (bd.totalClaimed || 0) + amt;
  saveBonusData(bd);
  CU.coins += amt; updateCoins(); saveCU();
  toast(`🎁 Day ${dayIdx+1} bonus! +🪙${amt.toLocaleString()} — Streak: ${bd.streak} days`, 'g');
  closeBonusModal();
}

function closeBonusModal() {
  document.getElementById('bonus-modal').classList.remove('on');
}

// ================================================================
// REFERRAL SYSTEM
// ================================================================
const REF_BONUS = 500; // coins both referrer and referee get

function genRefCode(email) {
  // Deterministic code from email — always same for same user
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = ((hash << 5) - hash) + email.charCodeAt(i);
  return 'BLK' + Math.abs(hash).toString(36).toUpperCase().substring(0, 5);
}

function copyRefCode() {
  const code = document.getElementById('p-refcode')?.textContent;
  if (!code || code === '—') return;
  navigator.clipboard?.writeText(code).then(() => toast('📋 Referral code copied!', 'g')).catch(() => {
    // Fallback for browsers without clipboard API
    const el = document.createElement('textarea');
    el.value = code; document.body.appendChild(el); el.select();
    document.execCommand('copy'); document.body.removeChild(el);
    toast('📋 Referral code copied!', 'g');
  });
}

function applyReferral(refCode, newUserEmail) {
  if (!refCode) return;
  // Find referrer by their code
  const users = JSON.parse(localStorage.getItem('bb5_users') || '{}');
  const referrerEmail = Object.keys(users).find(em => genRefCode(em) === refCode.toUpperCase());
  if (!referrerEmail || referrerEmail === newUserEmail) return;
  // Credit referrer
  const refUd = JSON.parse(localStorage.getItem('bb5_ud_' + referrerEmail) || 'null');
  if (refUd) {
    refUd.coins = (refUd.coins || 0) + REF_BONUS;
    refUd.refs = (refUd.refs || 0) + 1;
    refUd.refCoins = (refUd.refCoins || 0) + REF_BONUS;
    localStorage.setItem('bb5_ud_' + referrerEmail, JSON.stringify(refUd));
    toast(`👥 Referral bonus! +🪙${REF_BONUS} for your referrer`, 'g');
  }
  // Credit new user (already given 2000, add bonus on top)
  const newUd = JSON.parse(localStorage.getItem('bb5_ud_' + newUserEmail) || 'null');
  if (newUd) {
    newUd.coins = (newUd.coins || 0) + REF_BONUS;
    localStorage.setItem('bb5_ud_' + newUserEmail, JSON.stringify(newUd));
  }
}

// ================================================================
// ACCA BOOST — bonus multiplier for 5+ and 10+ selections
// ================================================================
function getAccaBoost(selCount) {
  if (selCount >= 10) return 0.10; // 10% boost
  if (selCount >= 5)  return 0.05; //  5% boost
  return 0;
}

function getAccaBoostLabel(selCount) {
  if (selCount >= 10) return { pct: '10%', label: 'MEGA ACCA BOOST (+10%)', color: '#8b5cf6' };
  if (selCount >= 5)  return { pct: '5%',  label: 'ACCA BOOST (+5%)',      color: '#8b5cf6' };
  return null;
}

// ================================================================
// ADMIN DASHBOARD
// ================================================================
const OWNER_EMAIL_ADMIN = 'melbinance15@gmail.com';

function renderAdmin() {
  if (!CU || CU.email !== OWNER_EMAIL_ADMIN) { goPage('profile'); return; }
  // Stats
  const users = JSON.parse(localStorage.getItem('bb5_users') || '{}');
  const allEmails = Object.keys(users);
  let totalBets = 0, totalCoins = 0, totalWins = 0;
  allEmails.forEach(em => {
    const ud = JSON.parse(localStorage.getItem('bb5_ud_' + em) || 'null');
    if (ud) {
      totalCoins += Math.floor(ud.coins || 0);
      totalBets += (ud.stats?.total || 0);
      totalWins += (ud.stats?.wins || 0);
    }
  });
  const winRate = totalBets ? Math.round(totalWins / totalBets * 100) : 0;
  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-card"><div class="admin-lbl">Total Users</div><div class="admin-val blue">${allEmails.length}</div></div>
    <div class="admin-card"><div class="admin-lbl">Coins in Circulation</div><div class="admin-val">${totalCoins.toLocaleString()}</div></div>
    <div class="admin-card"><div class="admin-lbl">Total Bets Placed</div><div class="admin-val blue">${totalBets.toLocaleString()}</div></div>
    <div class="admin-card"><div class="admin-lbl">Overall Win Rate</div><div class="admin-val green">${winRate}%</div></div>
  `;
  // Redemption requests
  const reqs = JSON.parse(localStorage.getItem('bb5_redeem_reqs') || '[]');
  const redeemBody = document.getElementById('admin-redeem-body');
  if (!reqs.length) {
    redeemBody.innerHTML = '<div style="padding:12px;font-size:.74rem;color:var(--t3);text-align:center;">No redemption requests yet</div>';
  } else {
    redeemBody.innerHTML = reqs.slice().reverse().map(r => `
      <div class="redeem-req">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="redeem-req-name">${r.name}</div>
          <div class="redeem-req-ksh">KSh ${(r.ksh || 0).toLocaleString()}</div>
        </div>
        <div class="redeem-req-detail">📱 ${r.phone || r.email} · 🪙${(r.coins || 0).toLocaleString()} coins · ${new Date(r.ts).toLocaleDateString('en-KE')}</div>
      </div>`).join('');
  }
  // Users list
  const usersBody = document.getElementById('admin-users-body');
  usersBody.innerHTML = allEmails.map(em => {
    const ud = JSON.parse(localStorage.getItem('bb5_ud_' + em) || 'null');
    if (!ud) return '';
    return `<div class="admin-row">
      <div>
        <div class="admin-row-lbl">${ud.name}</div>
        <div style="font-size:.62rem;color:var(--t3);">${em} · ${ud.phone || '—'}</div>
      </div>
      <div style="text-align:right;">
        <div class="admin-row-val">🪙${Math.floor(ud.coins || 0).toLocaleString()}</div>
        <div style="font-size:.62rem;color:var(--t3);">${ud.stats?.total || 0} bets</div>
      </div>
    </div>`;
  }).join('') || '<div style="padding:12px;font-size:.74rem;color:var(--t3);text-align:center;">No users yet</div>';
}

// ================================================================
// NAVIGATION
// ================================================================
function goPage(page) {
  const wasCasino = document.getElementById('pg-casino')?.classList.contains('on');
  if (wasCasino && page !== 'casino') bvStopFlyingSound();

  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.bni').forEach(b => b.classList.remove('on'));
  document.getElementById('pg-' + page)?.classList.add('on');
  document.getElementById('bni-' + page)?.classList.add('on');

  if (page === 'sports') renderSportBody();
  else if (page === 'mybets') { sweepPendingBets(); renderMyBets(); }
  else if (page === 'about' || page === 'terms' || page === 'contact') { /* static */ }
  else if (page === 'profile') updateProfile();
  else if (page === 'leaderboard') renderLeaderboard();
  else if (page === 'admin') renderAdmin();
  else if (page === 'predict') renderPredictions();
  else if (page === 'achievements') renderAchievements();
  else if (page === 'about' || page === 'terms' || page === 'contact') { /* static */ }
  else if (page === 'casino') {
    setTimeout(() => {
      bvInit();
      bvRenderHist();
      drawRou(rouAngle);
      if (!bvRunning && !bvRoundTO) bvStartRound();
    }, 100);
  }
}

// ================================================================
// FEATURE 1: FREE DAILY SPIN
// ================================================================
const SPIN_KEY = 'bb5_spin';
const SPIN_PRIZES = [50,100,150,200,100,300,50,500,100,150,200,1000];
const SPIN_COLORS = ['#e63946','#f4a261','#2a9d8f','#e9c46a','#264653','#e76f51','#457b9d','#f1faee','#a8dadc','#1d3557','#6a4c93','#f72585'];

function openSpinModal() {
  if (!CU) return;
  const today = new Date().toDateString();
  const sd = JSON.parse(localStorage.getItem(SPIN_KEY + '_' + CU.email) || 'null') || {};
  const btn = document.getElementById('spin-btn');
  const sub = document.getElementById('spin-sub');
  if (sd.last === today) {
    btn.disabled = true; btn.textContent = '✅ Come back tomorrow!';
    sub.textContent = 'You already spun today.';
  } else {
    btn.disabled = false; btn.textContent = '🎡 SPIN NOW';
    sub.textContent = 'Spin once per day for free AguCoins!';
  }
  document.getElementById('spin-result').textContent = '';
  drawSpinWheel(0);
  document.getElementById('spin-modal').classList.add('on');
}
function closeSpinModal() { document.getElementById('spin-modal').classList.remove('on'); }

function drawSpinWheel(angle) {
  const canvas = document.getElementById('spin-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, r = 95;
  const slices = SPIN_PRIZES.length;
  const arc = (Math.PI * 2) / slices;
  ctx.clearRect(0, 0, 200, 200);
  for (let i = 0; i < slices; i++) {
    const start = angle + i * arc;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + arc);
    ctx.fillStyle = SPIN_COLORS[i]; ctx.fill();
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`🪙${SPIN_PRIZES[i]}`, r - 8, 4);
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI*2);
  ctx.fillStyle = '#0d1117'; ctx.fill();
}

function doSpin() {
  if (!CU) return;
  const today = new Date().toDateString();
  const sd = JSON.parse(localStorage.getItem(SPIN_KEY + '_' + CU.email) || '{}');
  if (sd.last === today) { toast('Already spun today!', 'i'); return; }
  const btn = document.getElementById('spin-btn');
  btn.disabled = true; btn.textContent = '⏳ Spinning...';
  const slices = SPIN_PRIZES.length;
  const arc = (Math.PI * 2) / slices;
  const prizeIdx = Math.floor(Math.random() * slices);

  // Pointer is at top (−π/2). We rotate the wheel so slice prizeIdx
  // lands under the pointer. The wheel starts slice 0 at angle 0 (right).
  // To bring slice prizeIdx under the top pointer we need:
  // finalAngle = -π/2 − (prizeIdx * arc + arc/2)
  // Then add full rotations (8×2π) so it spins visibly.
  const fullRotations = Math.PI * 2 * 8;
  const finalAngle = fullRotations - (Math.PI / 2) - (prizeIdx * arc) - (arc / 2);

  let current = 0, duration = 3500, start = null;
  function animate(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4); // slightly stronger ease-out
    current = finalAngle * ease;
    drawSpinWheel(current);
    if (progress < 1) { requestAnimationFrame(animate); return; }
    // Ensure final position is exact
    drawSpinWheel(finalAngle);
    const prize = SPIN_PRIZES[prizeIdx];
    CU.coins += prize; updateCoins(); saveCU();
    sd.last = today; sd.total = (sd.total || 0) + prize;
    localStorage.setItem(SPIN_KEY + '_' + CU.email, JSON.stringify(sd));
    document.getElementById('spin-result').textContent = `🎉 You won 🪙${prize.toLocaleString()} AguCoins!`;
    btn.textContent = '✅ Come back tomorrow!';
    toast(`🎡 Free Spin: +🪙${prize.toLocaleString()} AguCoins!`, 'g');
    pushNotif('🎡', `Free spin won you 🪙${prize.toLocaleString()} AguCoins!`);
  }
  requestAnimationFrame(animate);
}

// ================================================================
// FEATURE 2: LIVE CHAT
// ================================================================
const CHAT_KEY = 'bb5_chat';
const CHAT_MAX = 80;
let chatOpen = false;

function openChat() {
  chatOpen = true;
  document.getElementById('chat-modal').classList.add('on');
  document.getElementById('chat-badge').classList.remove('on');
  // Use Firebase real-time listener if available
  if (window.FB?.ready()) {
    window.FB.listenChat(msgs => {
      const el = document.getElementById('chat-msgs');
      if (!el) return;
      const wasBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
      if (!msgs.length) { el.innerHTML = '<div style="text-align:center;font-size:.72rem;color:var(--t3);padding:20px;">No messages yet. Say hello! 👋</div>'; return; }
      el.innerHTML = msgs.map(m => {
        const isMe = CU && m.email === CU.email;
        const ts = m.ts?.toDate ? m.ts.toDate() : new Date(m.ts || Date.now());
        const time = ts.toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'});
        return `<div class="chat-msg ${isMe?'chat-msg-me':''}">
          <span class="chat-msg-name">${m.name}</span><span style="color:var(--text)">${m.msg}</span>
          <span class="chat-msg-time">${time}</span>
        </div>`;
      }).join('');
      if (wasBottom) el.scrollTop = el.scrollHeight;
    });
  } else {
    renderChat();
    setTimeout(() => { const msgs = document.getElementById('chat-msgs'); if (msgs) msgs.scrollTop = msgs.scrollHeight; }, 50);
  }
}
function closeChat() {
  chatOpen = false;
  document.getElementById('chat-modal').classList.remove('on');
  // Don't stop Firebase listener on close — keep it fresh for badge updates
}

async function sendChat() {
  if (!CU) return;
  const inp = document.getElementById('chat-inp');
  const txt = inp.value.trim();
  if (!txt) return;
  inp.value = '';
  if (window.FB?.ready()) {
    try { await window.FB.sendChat(CU.name.split(' ')[0], CU.email, txt); }
    catch(e) { toast('Could not send message', 'l'); }
  } else {
    // localStorage fallback
    const msgs = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    msgs.push({ name: CU.name.split(' ')[0], email: CU.email, msg: txt, ts: Date.now() });
    if (msgs.length > CHAT_MAX) msgs.shift();
    localStorage.setItem(CHAT_KEY, JSON.stringify(msgs));
    renderChat();
    const el = document.getElementById('chat-msgs');
    if (el) el.scrollTop = el.scrollHeight;
  }
}

function renderChat() {
  const el = document.getElementById('chat-msgs');
  if (!el) return;
  const msgs = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
  if (!msgs.length) { el.innerHTML = '<div style="text-align:center;font-size:.72rem;color:var(--t3);padding:20px;">No messages yet. Say hello! 👋</div>'; return; }
  el.innerHTML = msgs.map(m => {
    const isMe = CU && m.email === CU.email;
    const time = new Date(m.ts).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'});
    return `<div class="chat-msg ${isMe?'chat-msg-me':''}">
      <span class="chat-msg-name">${m.name}</span><span style="color:var(--text)">${m.msg}</span>
      <span class="chat-msg-time">${time}</span>
    </div>`;
  }).join('');
}

// Poll for new chat messages every 3s
setInterval(() => {
  if (!chatOpen) return;
  renderChat();
  const el = document.getElementById('chat-msgs');
  if (el) el.scrollTop = el.scrollHeight;
}, 3000);

// ================================================================
// FEATURE 3: ACHIEVEMENTS
// ================================================================
const ACHIEVEMENTS = [
  { id:'first_bet', ico:'🎯', name:'First Bet', desc:'Place your first bet' },
  { id:'first_win', ico:'🏆', name:'First Win', desc:'Win your first bet' },
  { id:'streak3', ico:'🔥', name:'On Fire', desc:'3-day login streak' },
  { id:'streak7', ico:'💎', name:'Diamond Streak', desc:'7-day login streak' },
  { id:'acca5', ico:'🎰', name:'Acca King', desc:'Place a 5+ selection bet' },
  { id:'acca10', ico:'👑', name:'Mega Acca', desc:'Place a 10+ selection bet' },
  { id:'bv_5x', ico:'✈️', name:'High Flyer', desc:'Cash out BlakeViator at 5×+' },
  { id:'bv_10x', ico:'🚀', name:'Moon Shot', desc:'Cash out BlakeViator at 10×+' },
  { id:'big_win', ico:'💰', name:'Big Winner', desc:'Win 1,000+ coins on one bet' },
  { id:'referral', ico:'👥', name:'Recruiter', desc:'Refer a friend successfully' },
  { id:'spin_win', ico:'🎡', name:'Spinner', desc:'Win on the free spin' },
  { id:'leaderboard', ico:'📊', name:'Top Player', desc:'Reach 50,000 AguCoins' },
];

function getAchievements() {
  if (!CU) return {};
  return JSON.parse(localStorage.getItem('bb5_ach_' + CU.email) || '{}');
}

function unlockAchievement(id) {
  if (!CU) return;
  const achs = getAchievements();
  if (achs[id]) return; // already unlocked
  achs[id] = Date.now();
  localStorage.setItem('bb5_ach_' + CU.email, JSON.stringify(achs));
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (ach) {
    toast(`🏅 Achievement unlocked: ${ach.ico} ${ach.name}!`, 'g');
    pushNotif('🏅', `Achievement unlocked: ${ach.name}!`);
  }
}

function checkAchievements() {
  if (!CU) return;
  const st = CU.stats || {};
  if (st.total >= 1) unlockAchievement('first_bet');
  if (st.wins >= 1) unlockAchievement('first_win');
  if (CU.coins >= 50000) unlockAchievement('leaderboard');
  if ((CU.refs || 0) >= 1) unlockAchievement('referral');
  const bd = JSON.parse(localStorage.getItem('bb5_bonus_' + CU.email) || '{}');
  if ((bd.streak || 0) >= 3) unlockAchievement('streak3');
  if ((bd.streak || 0) >= 7) unlockAchievement('streak7');
}

function renderAchievements() {
  const grid = document.getElementById('ach-grid');
  const countEl = document.getElementById('ach-count');
  const totalEl = document.getElementById('ach-total');
  if (!grid) return;
  const achs = getAchievements();
  const unlocked = Object.keys(achs).length;
  if (countEl) countEl.textContent = unlocked;
  if (totalEl) totalEl.textContent = ACHIEVEMENTS.length;
  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const done = !!achs[a.id];
    return `<div class="ach-card ${done?'unlocked':'locked'}">
      <div class="ach-ico">${a.ico}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
      ${done ? `<div class="ach-badge">✓ Unlocked</div>` : ''}
    </div>`;
  }).join('');
  const profileBadge = document.getElementById('ach-profile-badge');
  if (profileBadge) profileBadge.textContent = `${unlocked}/${ACHIEVEMENTS.length} unlocked`;
}

// ================================================================
// FEATURE 4: NOTIFICATIONS
// ================================================================
const NOTIF_KEY = 'bb5_notifs';

function pushNotif(ico, txt) {
  const notifs = JSON.parse(localStorage.getItem(NOTIF_KEY + '_' + (CU?.email||'')) || '[]');
  notifs.unshift({ ico, txt, ts: Date.now(), read: false });
  if (notifs.length > 30) notifs.pop();
  localStorage.setItem(NOTIF_KEY + '_' + (CU?.email||''), JSON.stringify(notifs));
  updateNotifDot();
}

function updateNotifDot() {
  const notifs = JSON.parse(localStorage.getItem(NOTIF_KEY + '_' + (CU?.email||'')) || '[]');
  const dot = document.getElementById('notif-dot');
  if (dot) dot.classList.toggle('on', notifs.some(n => !n.read));
}

function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  const isOpen = panel.classList.toggle('on');
  if (isOpen) {
    renderNotifs();
    // Mark all as read
    const notifs = JSON.parse(localStorage.getItem(NOTIF_KEY + '_' + (CU?.email||'')) || '[]');
    notifs.forEach(n => n.read = true);
    localStorage.setItem(NOTIF_KEY + '_' + (CU?.email||''), JSON.stringify(notifs));
    updateNotifDot();
  }
}

function renderNotifs() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  const notifs = JSON.parse(localStorage.getItem(NOTIF_KEY + '_' + (CU?.email||'')) || '[]');
  if (!notifs.length) { list.innerHTML = '<div style="padding:14px;text-align:center;font-size:.74rem;color:var(--t3);">No notifications yet</div>'; return; }
  list.innerHTML = notifs.slice(0,20).map(n => {
    const time = new Date(n.ts).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'});
    return `<div class="notif-item ${n.read?'':'unread'}">
      <div class="notif-ico">${n.ico}</div>
      <div class="notif-txt">${n.txt}</div>
      <div class="notif-time">${time}</div>
    </div>`;
  }).join('');
}

function clearNotifs() {
  localStorage.setItem(NOTIF_KEY + '_' + (CU?.email||''), '[]');
  renderNotifs(); updateNotifDot();
  document.getElementById('notif-panel').classList.remove('on');
}

// Close notif panel when clicking elsewhere
document.addEventListener('click', e => {
  const panel = document.getElementById('notif-panel');
  const btn = document.getElementById('notif-btn');
  if (panel?.classList.contains('on') && !panel.contains(e.target) && !btn?.contains(e.target)) {
    panel.classList.remove('on');
  }
});

// ================================================================
// FEATURE 5: PERSONAL STATS DASHBOARD
// ================================================================
function renderStatsDash() {
  const el = document.getElementById('stats-dash');
  if (!el || !CU) return;
  const bets = CU.bets || [];
  const st = CU.stats || { total:0, wins:0, wonC:0, lostC:0 };
  // Best odds won
  const winBets = bets.filter(b => b.result === 'won');
  const bestOdds = winBets.length ? Math.max(...winBets.map(b => b.odds||1)).toFixed(2) : '—';
  // Biggest win
  const bigWin = winBets.length ? Math.max(...winBets.map(b => b.payout||0)) : 0;
  // Leagues most bet
  const lgCount = {};
  bets.forEach(b => (b.sels||[]).forEach(s => { const lg = s.mid?.split('__')[0]||''; lgCount[lg]=(lgCount[lg]||0)+1; }));
  const topLg = Object.entries(lgCount).sort((a,b)=>b[1]-a[1])[0];
  const topLgName = topLg ? (LEAGUES.find(l=>l.id===topLg[0])?.name||topLg[0]) : '—';
  el.innerHTML = `
    <div class="sd-card"><div class="sd-lbl">Total Staked</div><div class="sd-val">🪙${(st.wonC+st.lostC||0).toLocaleString()}</div></div>
    <div class="sd-card"><div class="sd-lbl">Best Odds Won</div><div class="sd-val">${bestOdds}×</div></div>
    <div class="sd-card"><div class="sd-lbl">Biggest Win</div><div class="sd-val">🪙${bigWin.toLocaleString()}</div></div>
    <div class="sd-card"><div class="sd-lbl">Fav League</div><div class="sd-val" style="font-size:.72rem;">${topLgName}</div></div>
  `;
}

// ================================================================
// FEATURE 6: DARK / LIGHT MODE
// ================================================================
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('bb5_theme', isLight ? 'light' : 'dark');
}
// Apply saved theme on load
(function() {
  if (localStorage.getItem('bb5_theme') === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = '☀️';
  }
})();

// ================================================================
// FEATURE 7: SHARE WIN CARD
// ================================================================
function showShareCard(amount, label) {
  document.getElementById('share-amt').textContent = `🪙 ${Math.floor(amount).toLocaleString()}`;
  document.getElementById('share-lbl').textContent = label || 'AguCoins Won';
  document.getElementById('share-modal').classList.add('on');
}
function closeShareModal() { document.getElementById('share-modal').classList.remove('on'); }

// ================================================================
// FEATURE 8: BLAKE SLOTS
// ================================================================
const SLOT_SYMS = ['🍒','🍋','🍊','🍇','⭐','💎'];
const SLOT_MULT = { '🍒':3,'🍋':4,'🍊':5,'🍇':6,'⭐':10,'💎':25 };
let slotsSpinning = false;

function spinSlots() {
  if (!CU || slotsSpinning) return;
  const stake = parseFloat(document.getElementById('slots-st').value) || 0;
  if (stake < 10) { toast('Min stake 10 AguCoins', 'i'); return; }
  if (stake > CU.coins) { toast('Not enough AguCoins', 'l'); return; }
  CU.coins -= stake; updateCoins(); saveCU();
  slotsSpinning = true;
  const btn = document.getElementById('slots-btn');
  btn.disabled = true; btn.textContent = '🎰 Spinning...';
  document.getElementById('slots-res').textContent = '';
  // Spin animation
  const reels = ['reel1','reel2','reel3'];
  const finals = reels.map(() => SLOT_SYMS[Math.floor(Math.random()*SLOT_SYMS.length)]);
  let ticks = 0;
  const iv = setInterval(() => {
    ticks++;
    reels.forEach((id,ri) => {
      const el = document.getElementById(id);
      if (ticks < 15 + ri*5) {
        el.textContent = SLOT_SYMS[Math.floor(Math.random()*SLOT_SYMS.length)];
        el.classList.add('spinning');
      } else {
        el.textContent = finals[ri];
        el.classList.remove('spinning');
      }
    });
    if (ticks >= 25) {
      clearInterval(iv);
      slotsSpinning = false;
      btn.disabled = false; btn.textContent = '🎰 SPIN';
      // Calculate win
      const [a,b,c] = finals;
      let mult = 0, resultTxt = '';
      if (a===b && b===c) { mult = SLOT_MULT[a]; resultTxt = `🎉 THREE ${a}! ×${mult}`; }
      else if (a===b || b===c || a===c) { mult = 1.5; resultTxt = `✅ Two match! ×1.5`; }
      else { resultTxt = '❌ No match — Try again!'; }
      if (mult > 0) {
        const win = Math.floor(stake * mult);
        CU.coins += win; updateCoins(); saveCU();
        document.getElementById('slots-res').textContent = `${resultTxt} — +🪙${win.toLocaleString()}`;
        toast(`🎰 Slots: ${resultTxt} +🪙${win.toLocaleString()}`, 'g');
        pushWin(CU.name.split(' ')[0], win, 'Slots');
        if (mult >= 10) unlockAchievement('bv_10x');
        showShareCard(win, 'Won on BlakeSlots');
      } else {
        document.getElementById('slots-res').textContent = resultTxt;
      }
    }
  }, 80);
}

// ================================================================
// FEATURE 9: FREE PREDICTIONS
// ================================================================
const PRED_KEY = 'bb5_pred';

function renderPredictions() {
  // Render into sport-body if viewing from sports tab, else pred-body page
  const sportBody = document.getElementById('sport-body');
  const predPage = document.getElementById('pred-body');
  const body = (sportView === 'predict' && sportBody) ? sportBody : predPage;
  if (!body || !season) return;
  const mwKey = `${new Date().toDateString()}`;
  const saved = JSON.parse(localStorage.getItem(PRED_KEY + '_' + (CU?.email||'')) || '{}');
  const myPreds = saved[mwKey] || {};
  let total = parseInt(localStorage.getItem(PRED_KEY + '_pts_' + (CU?.email||'')) || '0');
  const ptsEl = document.getElementById('pred-pts-total');
  if (ptsEl) ptsEl.textContent = total;
  let html = `<div style="background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);border-radius:6px;padding:8px 12px;margin-bottom:10px;text-align:center;">
    <div style="font-family:var(--fc);font-weight:800;font-size:.88rem;color:#8b5cf6;letter-spacing:.5px;">🎯 FREE PREDICTIONS</div>
    <div style="font-size:.66rem;color:var(--t3);margin-top:2px;">No coins needed · Correct result = 1pt · Correct score = 3pts</div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
    <div style="font-size:.72rem;color:var(--t2);">Points: <span style="color:var(--gold);font-weight:700;">${total}</span></div>
    <button style="padding:5px 12px;font-family:var(--fc);font-weight:700;font-size:.7rem;border:none;border-radius:4px;background:var(--blue);color:#fff;cursor:pointer;" onclick="submitPredictions()">📨 SUBMIT</button>
  </div>`;
  let count = 0;
  LEAGUES.slice(0,5).forEach(lg => {
    const s = season[lg.id];
    if (!s) return;
    const mw = Math.min(s.mw, 37);
    const matches = (s.weeks[mw]||[]).filter(m => !m.played).slice(0,2);
    matches.forEach((m,i) => {
      const mid = `${lg.id}_${mw}_${i}`;
      const pred = myPreds[mid];
      const ht = lg.teams[m.home], at = lg.teams[m.away];
      html += `<div class="pred-card">
        <div style="font-size:.62rem;color:var(--t3);">${lg.flag} ${lg.name}</div>
        <div class="pred-match">${ht} vs ${at}</div>
        <div class="pred-btns">
          <div class="pred-btn ${pred==='1'?'sel':''}" onclick="setPred('${mid}','1','${mwKey}')">1 ${ht.split(' ')[0]}</div>
          <div class="pred-btn ${pred==='X'?'sel':''}" onclick="setPred('${mid}','X','${mwKey}')">X Draw</div>
          <div class="pred-btn ${pred==='2'?'sel':''}" onclick="setPred('${mid}','2','${mwKey}')">2 ${at.split(' ')[0]}</div>
        </div>
      </div>`;
      count++;
    });
  });
  if (!count) html += '<div class="empty-st"><div class="empty-ico">🎯</div><div>No upcoming matches right now.<br>Check back soon!</div></div>';
  body.innerHTML = html;
}

function setPred(mid, pick, mwKey) {
  if (!CU) return;
  const saved = JSON.parse(localStorage.getItem(PRED_KEY + '_' + CU.email) || '{}');
  if (!saved[mwKey]) saved[mwKey] = {};
  saved[mwKey][mid] = pick;
  localStorage.setItem(PRED_KEY + '_' + CU.email, JSON.stringify(saved));
  renderPredictions();
}

function sendContactMsg() {
  const name = document.getElementById('contact-name')?.value.trim();
  const subject = document.getElementById('contact-subject')?.value.trim();
  const msg = document.getElementById('contact-msg')?.value.trim();
  if (!name || !msg) { toast('Please fill in your name and message','l'); return; }
  const req = JSON.parse(localStorage.getItem('bb5_contact') || '[]');
  req.push({ name, subject, msg, email: CU?.email||'guest', ts: new Date().toISOString() });
  localStorage.setItem('bb5_contact', JSON.stringify(req));
  ['contact-name','contact-subject','contact-msg'].forEach(id => { const el=document.getElementById(id); if(el)el.value=''; });
  toast("✅ Message sent! We'll get back to you within 24 hours.",'g');
  pushNotif('📨','Your message to Agunextech has been sent!');
}

function sendContactMsg() {
  const name=document.getElementById('contact-name')?.value.trim();
  const subject=document.getElementById('contact-subject')?.value.trim();
  const msg=document.getElementById('contact-msg')?.value.trim();
  if(!name||!msg){toast('Please fill in your name and message','l');return;}
  const req=JSON.parse(localStorage.getItem('bb5_contact')||'[]');
  req.push({name,subject,msg,email:CU?.email||'guest',ts:new Date().toISOString()});
  localStorage.setItem('bb5_contact',JSON.stringify(req));
  ['contact-name','contact-subject','contact-msg'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  toast("✅ Message sent! We'll get back to you within 24 hours.",'g');
  pushNotif('📨','Your message to Agunextech has been sent!');
}
function submitPredictions() {
  if (!CU) return;
  toast('🎯 Predictions saved! Results checked when matches finish.', 'g');
  pushNotif('🎯', 'Your predictions have been submitted!');
}

// ================================================================
// FEATURE 10: MATCH STATS (injected into expanded match view)
// ================================================================
function buildMatchStats(lgId, hi, ai) {
  const lg = LEAGUES.find(l => l.id === lgId);
  if (!lg) return '';
  const hs = lg.str[hi], as = lg.str[ai];
  const tot = hs + as;
  // Simulated stats based on strength
  const possH = Math.round(hs / tot * 100);
  const possA = 100 - possH;
  const shotsH = Math.round(hs/100*14 + Math.random()*4);
  const shotsA = Math.round(as/100*12 + Math.random()*4);
  const sotH = Math.round(shotsH*0.4);
  const sotA = Math.round(shotsA*0.4);
  const cornH = Math.round(hs/100*7 + Math.random()*3);
  const cornA = Math.round(as/100*6 + Math.random()*3);
  function statRow(lbl, hv, av, isPercent) {
    const hPct = isPercent ? hv : Math.round(hv/(hv+av||1)*100);
    const aPct = isPercent ? av : Math.round(av/(hv+av||1)*100);
    return `<div class="mstat-row">
      <div class="mstat-val mstat-hval">${isPercent?hv+'%':hv}</div>
      <div class="mstat-lbl">${lbl}</div>
      <div class="mstat-bar-wrap"><div class="mstat-bar-h" style="width:${hPct}%"></div><div class="mstat-bar-a" style="width:${aPct}%"></div></div>
      <div class="mstat-val mstat-aval">${isPercent?av+'%':av}</div>
    </div>`;
  }
  return `<div style="padding:8px 0;border-top:1px solid var(--border);margin-top:6px;">
    <div style="font-size:.62rem;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-family:var(--fc);font-weight:700;">📊 Match Stats (Simulated)</div>
    ${statRow('Possession',possH,possA,true)}
    ${statRow('Shots',shotsH,shotsA,false)}
    ${statRow('On Target',sotH,sotA,false)}
    ${statRow('Corners',cornH,cornA,false)}
  </div>`;
}

// ================================================================
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { bvStopFlyingSound(); }
  else {
    const onBV = document.getElementById('cg-bv')?.classList.contains('on');
    const onCasino = document.getElementById('pg-casino')?.classList.contains('on');
    if (onCasino && onBV && bvRunning && bvSoundOn) bvStartFlyingSound();
  }
});
// ================================================================
// SWEEP PENDING BETS
// ================================================================
function sweepPendingBets() {
  if (!CU?.bets || !season) return;
  let changed = false;
  CU.bets.forEach(bet => {
    if (bet.status !== 'pending') return;
    bet.sels.forEach(sel => {
      if (sel.res) return;
      const s = season?.[sel.lgId]; if (!s) return;
      const week = s.weeks?.[sel.mw]; if (!week) return;
      let pm = week[sel.mi];
      if (!pm?.played) {
        const lg = LEAGUES.find(l => l.id === sel.lgId);
        pm = week.find(m => m.played && lg && sel.match?.includes(lg.teams[m.home]) && sel.match?.includes(lg.teams[m.away]));
      }
      if (!pm?.played || pm.hs == null) return;
      const hg=pm.hs,ag=pm.as,tot=hg+ag,btts=hg>0&&ag>0,k=sel.mk;
      let won=false;
      if(k==='home')won=hg>ag;else if(k==='draw')won=hg===ag;else if(k==='away')won=ag>hg;
      else if(k==='o25')won=tot>2.5;else if(k==='u25')won=tot<2.5;
      else if(k==='o15')won=tot>1.5;else if(k==='u15')won=tot<1.5;
      else if(k==='o35')won=tot>3.5;else if(k==='u35')won=tot<3.5;
      else if(k==='btty')won=btts;else if(k==='bttn')won=!btts;
      else if(k==='dc1x')won=hg>=ag;else if(k==='dc12')won=hg!==ag;else if(k==='dcx2')won=ag>=hg;
      else if(k==='hht')won=hg>ag;else if(k==='dht')won=hg===ag;else if(k==='aht')won=ag>hg;
      sel.res=won?'won':'lost'; changed=true;
    });
    if (bet.status==='pending') {
      const hasLost=bet.sels.some(s=>s.res==='lost');
      if (hasLost) { bet.status='lost'; bet.sels.forEach(s=>{if(!s.res)s.res='na';}); changed=true; }
      else if (bet.sels.every(s=>s.res==='won')) {
        bet.status='won'; CU.coins+=bet.payout; updateCoins();
        if(!CU.stats)CU.stats={total:0,wins:0,wonC:0,lostC:0};
        CU.stats.wins++; CU.stats.wonC+=(bet.payout-bet.stake);
        pushWin(CU.name,bet.payout,'Football'); changed=true;
      }
    }
  });
  if (changed) { saveCU(); updatePendingBadge(); }
}

function removeStuckBet(betId) {
  if (!CU?.bets) return;
  if (!confirm('Remove this pending bet? Stake will NOT be refunded.')) return;
  CU.bets=CU.bets.filter(b=>b.id!==betId);
  saveCU(); updatePendingBadge(); toast('Bet removed','i'); renderMyBets();
}

function sendContactMsg() {
  const name=document.getElementById('contact-name')?.value.trim();
  const subject=document.getElementById('contact-subject')?.value.trim();
  const msg=document.getElementById('contact-msg')?.value.trim();
  if (!name||!msg) { toast('Please fill in your name and message','l'); return; }
  const req=JSON.parse(localStorage.getItem('bb5_contact')||'[]');
  req.push({name,subject,msg,email:CU?.email||'guest',ts:new Date().toISOString()});
  localStorage.setItem('bb5_contact',JSON.stringify(req));
  ['contact-name','contact-subject','contact-msg'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  toast("Message sent! We will get back to you within 24 hours.",'g');
  pushNotif('📨','Your message to Agunextech has been sent!');
}

// BV sound stops when user switches apps
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { bvStopFlyingSound(); }
  else {
    const onBV=document.getElementById('cg-bv')?.classList.contains('on');
    if (document.getElementById('pg-casino')?.classList.contains('on')&&onBV&&bvRunning&&bvSoundOn) bvStartFlyingSound();
  }
});

window.addEventListener('resize', () => {
  if (bvCanvas && bvCtx) {
    const arena = document.getElementById('bv-arena');
    bvCanvas.width = (arena ? arena.offsetWidth : 0) || bvCanvas.offsetWidth || 500;
    bvCanvas.height = (arena ? arena.offsetHeight : 0) || bvCanvas.offsetHeight || 155;
    bvDrawGrid();
  }
});

// ================================================================
// MATCH CENTRE
// ================================================================
let mcSelectedKey = null;
let mcCommentary = {};
const SHIRT_CLR = ['#e63946','#0ea5e9','#2a9d8f','#e9c46a','#264653','#f4a261','#6a4c93','#457b9d'];
function pickR(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function mcGames() {
  return Object.entries(liveGames).filter(([k])=>!k.startsWith('d2_'))
    .map(([k,g])=>({key:k,...g})).sort((a,b)=>(b.hs+b.as)-(a.hs+a.as)||b.min-a.min);
}
function mcInitComm(key,g) {
  if (!mcCommentary[key]) mcCommentary[key]=[{min:0,txt:g.home+' vs '+g.away+' — Kick-off! Match underway.',goal:false}];
}
function mcUpdateComm(key,g) {
  const lines=mcCommentary[key]||[];
  const lastMin=lines.length?lines[lines.length-1].min:-1;
  if (g.min<=lastMin) return;
  g.evts.forEach(e=>{
    if (e.min===g.min) {
      const team=e.side==='h'?g.home:g.away;
      lines.push({min:g.min,txt:pickR(['GOAL! '+team+' score! The crowd erupts!','GOAL! '+g.min+"' — Stunning finish by "+team+'!',team+' are ahead! '+g.hs+'–'+g.as]),goal:true});
    }
  });
  if (g.min>0&&g.min%6===0) {
    const r=Math.random(),txts=['Corner to '+(Math.random()>.5?g.home:g.away)+'.',
      'Shot from '+g.away+' — just wide!',g.home+' dominating possession now.',
      'Yellow card shown by the referee!','Brilliant save to deny a certain goal!',
      g.away+' counter-attacking — '+g.home+' scrambling back.'];
    if (r<0.7) lines.push({min:g.min,txt:pickR(txts),goal:false});
  }
  if (g.min===45) lines.push({min:45,txt:'Half-time: '+g.home+' '+g.hs+'–'+g.as+' '+g.away,goal:false});
  mcCommentary[key]=lines.slice(-22);
}
function mcBallPos(g) {
  const ge=g.evts.find(e=>e.min===g.min);
  if (ge) return {x:ge.side==='h'?90:10,y:50};
  return {x:Math.max(8,Math.min(92,50+Math.sin(g.min*.8)*28+(g.hs>g.as?8:g.as>g.hs?-8:0))),
          y:Math.max(12,Math.min(88,50+Math.cos(g.min*1.1)*28))};
}
function mcPitchStats(g) {
  const lg=LEAGUES.find(l=>l.id===g.lgId),s=season&&season[g.lgId];
  const m=s&&s.weeks&&s.weeks[g.mwIdx]&&s.weeks[g.mwIdx][g.mIdx];
  if (!lg||!m) return {possH:50,shotsH:3,shotsA:2,cornH:2,cornA:1};
  const hs=lg.str[m.home]+8,as2=lg.str[m.away],tot=hs+as2||1;
  return {possH:Math.round(hs/tot*100),shotsH:(g.fh||0)*3+Math.round(hs/tot*8),
    shotsA:(g.fa||0)*3+Math.round(as2/tot*6),cornH:(g.fh||0)*2+2,cornA:(g.fa||0)*2+1};
}
function renderMatchCentre() {
  const body=document.getElementById('sport-body');
  if (!body) return;
  const games=mcGames();
  if (!games.length) {
    body.innerHTML='<div style="text-align:center;padding:36px 16px;color:var(--t3)"><div style="font-size:2.4rem;margin-bottom:8px;">📺</div><div style="font-family:var(--fc);font-weight:800;font-size:.95rem;color:var(--text);margin-bottom:6px;">Match Centre</div><div>No live matches right now.</div><div style="margin-top:5px;font-size:.64rem;">Matches run every 90 seconds — check the Live tab for kick-offs.</div></div>';
    return;
  }
  if (!mcSelectedKey||!liveGames[mcSelectedKey]) mcSelectedKey=games[0].key;
  const g=liveGames[mcSelectedKey];
  if (!g){mcSelectedKey=games[0].key;renderMatchCentre();return;}
  mcInitComm(mcSelectedKey,g); mcUpdateComm(mcSelectedKey,g);
  const lg=LEAGUES.find(l=>l.id===g.lgId),stats=mcPitchStats(g),pos=mcBallPos(g);
  const pct=Math.round(g.min/90*100);
  const comm=(mcCommentary[mcSelectedKey]||[]).slice().reverse();
  const shH=SHIRT_CLR[(g.lgId||'').charCodeAt(0)%SHIRT_CLR.length]||'#0ea5e9';
  const shA=SHIRT_CLR[((g.lgId||'').charCodeAt(1)||3)%SHIRT_CLR.length]||'#e63946';
  const pitchSVG='<svg class="mc-pitch-svg" viewBox="0 0 200 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'
    +'<circle cx="100" cy="65" r="20" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1"/>'
    +'<line x1="100" y1="0" x2="100" y2="130" stroke="rgba(255,255,255,.15)" stroke-width="1"/>'
    +'<rect x="2" y="2" width="196" height="126" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>'
    +'<rect x="2" y="35" width="30" height="60" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>'
    +'<rect x="168" y="35" width="30" height="60" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>'
    +'<rect x="2" y="47" width="10" height="36" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>'
    +'<rect x="188" y="47" width="10" height="36" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>'
    +'<rect x="2" y="2" width="'+Math.round(stats.possH*1.96)+'" height="126" fill="rgba(14,165,233,.07)"/>'
    +'</svg>';
  const statRows=[['Possession',stats.possH+'%',(100-stats.possH)+'%',stats.possH,100-stats.possH],
    ['Shots',stats.shotsH,stats.shotsA,stats.shotsH,stats.shotsA],
    ['Goals',g.hs,g.as,g.hs*20,g.as*20],['Corners',stats.cornH,stats.cornA,stats.cornH,stats.cornA]]
    .map(function(r){const t=r[3]+r[4]||1,h2=Math.round(r[3]/t*100),a2=Math.round(r[4]/t*100);
      return '<div class="mc-stat-row"><div class="mc-stat-h">'+r[1]+'</div><div class="mc-stat-bar-wrap"><div class="mc-bar-h" style="width:'+h2+'%"></div><div class="mc-bar-a" style="width:'+a2+'%"></div></div><div class="mc-stat-a">'+r[2]+'</div></div>';}).join('');
  const commHtml=comm.map(function(c){return '<div class="mc-comm-item'+(c.goal?' goal':'')+'"><div class="mc-comm-min">'+c.min+"'</div><div class='mc-comm-txt'>"+c.txt+'</div></div>';}).join('');
  const others=games.filter(function(gg){return gg.key!==mcSelectedKey;});
  const othersHtml=others.length?'<div style="font-family:var(--fc);font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--t3);margin:8px 0 6px;">Other Live Matches</div><div class="mc-others-grid">'+others.slice(0,6).map(function(gg){const lgg=LEAGUES.find(function(l){return l.id===gg.lgId;});return '<div class="mc-mini" onclick="mcSelect(\''+gg.key+'\')"><div class="mc-mini-lg">'+(lgg?lgg.flag+' '+lgg.name:gg.lgId)+'</div><div class="mc-mini-teams">'+gg.home+'<br><span style="color:var(--t3);font-size:.6rem">vs</span> '+gg.away+'</div><div><span class="mc-mini-score">'+gg.hs+'–'+gg.as+'</span><span class="mc-mini-min">'+gg.min+"'</span></div></div>";}).join('')+'</div>':'';
  body.innerHTML='<div id="mc-wrap">'
    +'<div class="mc-featured">'
    +'<div class="mc-top-bar"><span class="mc-league-name">'+(lg?lg.flag+' '+lg.name:g.lgId)+'</span><span class="mc-live-badge">🔴 LIVE</span></div>'
    +'<div class="mc-scoreboard"><div class="mc-team"><div class="mc-team-badge" style="border-color:'+shH+'">'+g.home[0]+'</div><div class="mc-team-name">'+g.home+'</div></div>'
    +'<div class="mc-score-wrap"><div class="mc-score">'+g.hs+' – '+g.as+'</div><div class="mc-min">'+g.min+"'</div></div>"
    +'<div class="mc-team"><div class="mc-team-badge" style="border-color:'+shA+'">'+g.away[0]+'</div><div class="mc-team-name">'+g.away+'</div></div></div>'
    +'<div class="mc-pitch-wrap">'+pitchSVG+'<div class="mc-ball" style="left:'+pos.x+'%;top:'+pos.y+'%"></div>'
    +'<div class="mc-progress-bar"><div class="mc-progress-fill" style="width:'+pct+'%"></div></div></div>'
    +statRows
    +'<div class="mc-commentary">'+commHtml+'</div></div>'
    +othersHtml+'</div>';
}
function mcSelect(key){mcSelectedKey=key;renderMatchCentre();}

document.addEventListener('DOMContentLoaded', () => {
  // Update Firebase status indicator after a short delay (Firebase module loads async)
  setTimeout(() => {
    const status = document.getElementById('fb-status');
    if (!status) return;
    if (window.FB?.ready()) {
      status.style.background = 'rgba(0,200,83,.1)';
      status.style.color = '#00c853';
      status.style.borderColor = 'rgba(0,200,83,.2)';
      status.textContent = '🌐 Connected — login works on any device';
      // Firebase handles auto-login via onAuthStateChanged in the module
    } else {
      // Local auto-login fallback
      const last = localStorage.getItem('bb5_lastuser');
      if (last) {
        const ud = JSON.parse(localStorage.getItem('bb5_ud_' + last) || 'null');
        const users = JSON.parse(localStorage.getItem('bb5_users') || '{}');
        if (ud && users[last]) loginUser(last, ud);
      }
    }
  }, 1500);

  // Always try local auto-login immediately as fast path
  if (!window.FB?.ready()) {
    const last = localStorage.getItem('bb5_lastuser');
    if (last) {
      const ud = JSON.parse(localStorage.getItem('bb5_ud_' + last) || 'null');
      const users = JSON.parse(localStorage.getItem('bb5_users') || '{}');
      if (ud && users[last]) loginUser(last, ud);
    }
  }
  renderTicker();
});