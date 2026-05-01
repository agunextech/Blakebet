// BETSLIP
// ================================================================
function isSel(mid, mk) { return slip.some(s => s.mid === mid && s.mk === mk); }

function addSel(mid, lgId, mw, mi, mk, pick, odds, match, mkt) {
  // ── LIVE MARKET LOCK — block selections on already-decided markets ──
  const liveKey = `${lgId}_${mw}_${mi}`;
  const lg = liveGames[liveKey];
  if (lg) {
    const hs = lg.hs, as = lg.as, tot = hs + as;
    const bttsDone = hs > 0 && as > 0;
    // BTTS Yes — already happened, guaranteed win → block
    if (mk === 'btty' && bttsDone) { toast('⛔ BTTS already decided — both teams scored', 'l'); return; }
    // BTTS No — already impossible → block
    if (mk === 'bttn' && bttsDone) { toast('⛔ BTTS No already lost — both teams scored', 'l'); return; }
    // Over 1.5 — already 2+ goals → block
    if (mk === 'o15' && tot >= 2) { toast('⛔ Over 1.5 already guaranteed', 'l'); return; }
    // Under 1.5 — already 2+ goals → impossible, block
    if (mk === 'u15' && tot >= 2) { toast('⛔ Under 1.5 already lost — 2+ goals scored', 'l'); return; }
    // Over 2.5 — already 3+ goals → block
    if (mk === 'o25' && tot >= 3) { toast('⛔ Over 2.5 already guaranteed', 'l'); return; }
    // Under 2.5 — already 3+ goals → impossible
    if (mk === 'u25' && tot >= 3) { toast('⛔ Under 2.5 already lost — 3+ goals scored', 'l'); return; }
    // Over 3.5 — already 4+ goals → block
    if (mk === 'o35' && tot >= 4) { toast('⛔ Over 3.5 already guaranteed', 'l'); return; }
    // Under 3.5 — already 4+ goals → impossible
    if (mk === 'u35' && tot >= 4) { toast('⛔ Under 3.5 already lost — 4+ goals scored', 'l'); return; }
    // 1X2 — match already decided (80+ min with 2+ goal lead) → warn but allow
    if ((mk === 'home' || mk === 'draw' || mk === 'away') && lg.min >= 85 && Math.abs(hs - as) >= 3) {
      toast('⚠️ Match almost over — bet at your own risk', 'i');
    }
  }
  const ex = slip.findIndex(s => s.mid === mid && s.mk === mk);
  if (ex >= 0) { slip.splice(ex, 1); updateBsFloat(); renderSportBody(); renderBS(); return; }
  slip = slip.filter(s => !(s.mid === mid && MKTG[s.mk] === MKTG[mk]));
  if (slip.length >= MAX_SEL) { toast('Max 21 selections!', 'l'); return; }
  slip.push({ mid, lgId, mw, mi, mk, pick, odds, match, mkt });
  updateBsFloat();
  renderSportBody();
  openBS();
  renderBS();
}

function removeSel(i) { slip.splice(i, 1); updateBsFloat(); renderBS(); renderSportBody(); }
function clearSlip() { slip = []; updateBsFloat(); renderBS(); renderSportBody(); closeBS(); }
function setSt(v) { document.getElementById('bs-stake').value = v; renderBS(); }

function openBS() {
  document.getElementById('bs-overlay').classList.add('on');
  document.getElementById('bs-panel').classList.add('on');
  renderBS();
}

function closeBS() {
  document.getElementById('bs-overlay').classList.remove('on');
  document.getElementById('bs-panel').classList.remove('on');
}

function updateBsFloat() {
  const btn = document.getElementById('bs-float');
  const cnt = document.getElementById('bs-fcnt');
  const hcnt = document.getElementById('bs-cnt');
  cnt.textContent = slip.length;
  hcnt.textContent = slip.length;
  btn.classList.toggle('on', slip.length > 0);
  if (!slip.length) closeBS();
  updatePendingBadge();
}

function isMarketClosed(sel) {
  // Check if a selection's market has since closed due to live match events
  const liveKey = `${sel.lgId}_${sel.mw}_${sel.mi}`;
  const lg = liveGames[liveKey];
  if (!lg) return false; // match not live — market open
  const hs = lg.hs, as = lg.as, tot = hs + as;
  const btts = hs > 0 && as > 0;
  const k = sel.mk;
  if (k === 'btty' && btts) return true;       // GG already happened
  if (k === 'bttn' && btts) return true;       // GG No already lost
  if (k === 'o15' && tot >= 2) return true;    // O1.5 guaranteed
  if (k === 'u15' && tot >= 2) return true;    // U1.5 lost
  if (k === 'o25' && tot >= 3) return true;    // O2.5 guaranteed
  if (k === 'u25' && tot >= 3) return true;    // U2.5 lost
  if (k === 'o35' && tot >= 4) return true;    // O3.5 guaranteed
  if (k === 'u35' && tot >= 4) return true;    // U3.5 lost
  return false;
}

function renderBS() {
  const body = document.getElementById('bs-body');
  const foot = document.getElementById('bs-foot');

  // Auto-remove selections whose markets have closed while betslip was open
  const closedCount = slip.filter(s => isMarketClosed(s)).length;
  if (closedCount > 0) {
    slip = slip.filter(s => !isMarketClosed(s));
    if (closedCount > 0) toast(`⛔ ${closedCount} selection(s) removed — market closed`, 'l');
    updateBsFloat();
  }

  if (!slip.length) {
    body.innerHTML = '<div class="empty-st" style="height:80px;"><div class="empty-ico" style="font-size:1.5rem">🎯</div><div style="font-size:.78rem">Click odds to add selections</div></div>';
    foot.style.display = 'none'; return;
  }
  foot.style.display = 'block';
  const baseOdds = slip.reduce((a, s) => a * s.odds, 1);
  const boost = getAccaBoost(slip.length);
  const boostedOdds = parseFloat((baseOdds * (1 + boost)).toFixed(2));
  const stake = parseFloat(document.getElementById('bs-stake').value) || 0;
  const boostInfo = getAccaBoostLabel(slip.length);
  document.getElementById('bs-odds').textContent = boostedOdds.toFixed(2);
  document.getElementById('bs-sels').textContent = `${slip.length}/${MAX_SEL}`;
  document.getElementById('bs-win').textContent = `🪙 ${Math.floor(stake * boostedOdds).toLocaleString()}`;
  document.getElementById('bs-maxwarn').style.display = slip.length >= MAX_SEL ? 'block' : 'none';
  let boostHtml = '';
  if (boostInfo) {
    boostHtml = `<div class="acca-boost">
      <span class="acca-boost-ico">⚡</span>
      <span class="acca-boost-txt">${boostInfo.label}</span>
      <span class="acca-boost-val">×${boostedOdds.toFixed(2)}</span>
    </div>`;
  }
  body.innerHTML = boostHtml + slip.map((s, i) => `
    <div class="bsi">
      <div class="bsi-inf"><div class="bsi-m">${s.match}</div><div class="bsi-p">${s.pick}</div><div class="bsi-k">${s.mkt}</div></div>
      <div class="bsi-r"><div class="bsi-o">${s.odds}</div><button class="bsi-x" onclick="removeSel(${i})">✕</button></div>
    </div>`).join('');
}

function placeBet() {
  if (!slip.length || !CU) return;
  // Final check — remove any closed markets before placing
  const closed = slip.filter(s => isMarketClosed(s));
  if (closed.length) {
    slip = slip.filter(s => !isMarketClosed(s));
    toast(`⛔ ${closed.length} selection(s) removed — market closed. Review your slip.`, 'l');
    renderBS(); return;
  }
  const stake = parseFloat(document.getElementById('bs-stake').value) || 0;
  if (stake < 10) { toast('Min stake 10 AguCoins', 'i'); return; }
  if (stake > CU.coins) { checkCoins(stake); return; }
  const baseOdds = slip.reduce((a, s) => a * s.odds, 1);
  const boost = getAccaBoost(slip.length);
  const tot = parseFloat((baseOdds * (1 + boost)).toFixed(2));
  const payout = Math.floor(stake * tot);
  CU.coins -= stake; updateCoins();
  if (!CU.stats) CU.stats = { total: 0, wins: 0, wonC: 0, lostC: 0 };
  CU.stats.total++; CU.stats.lostC += stake;
  const bet = {
    id: Date.now().toString(36).toUpperCase(), status: 'pending', stake, odds: tot.toFixed(2), payout,
    sels: slip.map(s => ({ mid: s.mid, lgId: s.lgId, mw: s.mw, mi: s.mi, mk: s.mk, pick: s.pick, odds: s.odds, match: s.match, mkt: s.mkt, res: null }))
  };
  if (!CU.bets) CU.bets = [];
  CU.bets.push(bet); saveCU();
  toast(`✅ Bet placed! ${slip.length} sels @ ${tot}× — Win 🪙${payout.toLocaleString()}`, 'g');
  pushNotif('🎫', `Bet placed: ${slip.length} selections @ ${tot}× for 🪙${payout.toLocaleString()}`);
  // Achievement checks
  unlockAchievement('first_bet');
  if (slip.length >= 5) unlockAchievement('acca5');
  if (slip.length >= 10) unlockAchievement('acca10');
  clearSlip(); updatePendingBadge();
}

function updatePendingBadge() {
  const n = (CU?.bets || []).filter(b => b.status === 'pending').length;
  const badge = document.getElementById('pend-badge');
  if (badge) { badge.textContent = n; badge.style.display = n > 0 ? 'block' : 'none'; }
}

// ================================================================
// BET SETTLEMENT
// ================================================================
function settleBets(lgId, mwIdx, mIdx, hg, ag) {
  if (!CU?.bets) return;
  const btts = hg > 0 && ag > 0, tot = hg + ag;
  // Get the actual team names for this match — more reliable than index
  const lg = LEAGUES.find(l => l.id === lgId);
  const s = season?.[lgId];
  const m = s?.weeks[mwIdx]?.[mIdx];
  const homeTeam = m ? lg?.teams[m.home] : null;
  const awayTeam = m ? lg?.teams[m.away] : null;

  CU.bets.forEach(bet => {
    if (bet.status !== 'pending') return;
    bet.sels.forEach(sel => {
      if (sel.res) return; // already settled
      // Match by lgId + mw + mi (index) OR by team names in match string for robustness
      const matchByIndex = sel.lgId === lgId && sel.mw === mwIdx && sel.mi === mIdx;
      const matchByTeams = homeTeam && awayTeam && sel.match &&
        sel.match.includes(homeTeam) && sel.match.includes(awayTeam) &&
        sel.lgId === lgId;
      if (!matchByIndex && !matchByTeams) return;

      const k = sel.mk;
      let won = false;
      if (k === 'home') won = hg > ag; else if (k === 'draw') won = hg === ag; else if (k === 'away') won = ag > hg;
      else if (k === 'o25') won = tot > 2.5; else if (k === 'u25') won = tot < 2.5;
      else if (k === 'o15') won = tot > 1.5; else if (k === 'u15') won = tot < 1.5;
      else if (k === 'o35') won = tot > 3.5; else if (k === 'u35') won = tot < 3.5;
      else if (k === 'btty') won = btts; else if (k === 'bttn') won = !btts;
      else if (k === 'dc1x') won = hg >= ag; else if (k === 'dc12') won = hg !== ag; else if (k === 'dcx2') won = ag >= hg;
      else if (k === 'hht') won = hg > ag; else if (k === 'dht') won = hg === ag; else if (k === 'aht') won = ag > hg;
      sel.res = won ? 'won' : 'lost';
    });

    const hasLost = bet.sels.some(s => s.res === 'lost');
    if (hasLost && bet.status === 'pending') {
      bet.status = 'lost';
      // Mark remaining unsettled as N/A (not void — bet just lost)
      bet.sels.forEach(s => { if (!s.res) s.res = 'na'; });
      setTimeout(() => toast(`❌ Bet #${bet.id} LOST — a selection didn't win`, 'l'), 300);
    }
    if (!hasLost && bet.sels.every(s => s.res === 'won')) {
      bet.status = 'won';
      CU.coins += bet.payout; updateCoins();
      if (!CU.stats) CU.stats = { total: 0, wins: 0, wonC: 0, lostC: 0 };
      CU.stats.wins++; CU.stats.wonC += (bet.payout - bet.stake);
      pushWin(CU.name, bet.payout, 'Football');
      pushNotif('🏆', `Bet won! 🪙${bet.payout.toLocaleString()} at ${bet.odds}× odds`);
      unlockAchievement('first_win');
      if (bet.payout >= 1000) unlockAchievement('big_win');
      checkAchievements();
      setTimeout(() => {
        showModal(true, bet.payout, bet.sels.length, bet.odds);
        showShareCard(bet.payout, `Won at ${bet.odds}× odds`);
      }, 500);
    }
  });
  saveCU(); updatePendingBadge();
  if (document.getElementById('pg-mybets').classList.contains('on')) renderMyBets();
}

// ================================================================
// MY BETS
// ================================================================
function mbSwitch(tab, el) {
  mbCurTab = tab;
  document.querySelectorAll('.mbt').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  renderMyBets();
}

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
      const hg=pm.hs, ag=pm.as, tot=hg+ag, btts=hg>0&&ag>0, k=sel.mk;
      let won=false;
      if(k==='home')won=hg>ag; else if(k==='draw')won=hg===ag; else if(k==='away')won=ag>hg;
      else if(k==='o25')won=tot>2.5; else if(k==='u25')won=tot<2.5;
      else if(k==='o15')won=tot>1.5; else if(k==='u15')won=tot<1.5;
      else if(k==='o35')won=tot>3.5; else if(k==='u35')won=tot<3.5;
      else if(k==='btty')won=btts; else if(k==='bttn')won=!btts;
      else if(k==='dc1x')won=hg>=ag; else if(k==='dc12')won=hg!==ag; else if(k==='dcx2')won=ag>=hg;
      else if(k==='hht')won=hg>ag; else if(k==='dht')won=hg===ag; else if(k==='aht')won=ag>hg;
      sel.res=won?'won':'lost'; changed=true;
    });
    if (bet.status==='pending') {
      const hasLost=bet.sels.some(s=>s.res==='lost');
      const allDone=bet.sels.every(s=>s.res);
      if (hasLost) { bet.status='lost'; bet.sels.forEach(s=>{if(!s.res)s.res='na';}); changed=true; }
      else if (allDone && bet.sels.every(s=>s.res==='won')) {
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
  CU.bets = CU.bets.filter(b => b.id !== betId);
  saveCU(); updatePendingBadge(); toast('Bet removed','i'); renderMyBets();
}

function renderMyBets() {
  const body = document.getElementById('mb-body');
  if (!body || !CU) return;
  const list = (CU.bets || []).filter(b => b.status === mbCurTab).slice().reverse();
  if (!list.length) {
    const ico = { pending: '⏳', won: '🏆', lost: '😔' }[mbCurTab];
    const msg = { pending: 'No pending bets.\nGo to Sports or Casino to place a bet!', won: 'No won bets yet. Keep playing!', lost: 'No lost bets here.' }[mbCurTab];
    body.innerHTML = `<div class="empty-st"><div class="empty-ico">${ico}</div><div>${msg}</div></div>`;
    return;
  }
  body.innerHTML = list.map(b => {
    const sc = { pending: 'st-p', won: 'st-w', lost: 'st-l' }[b.status];
    const isPending = b.status === 'pending';
    return `<div class="bet-card">
      <div class="bet-hdr"><span class="bet-id">#${b.id}</span><span class="bet-st ${sc}">${b.status.toUpperCase()}</span>${isPending?`<button onclick="removeStuckBet('${b.id}')" style="background:none;border:1px solid var(--red);color:var(--red);border-radius:4px;padding:2px 7px;font-size:.62rem;cursor:pointer;font-family:var(--fc);font-weight:700;">🗑 Remove</button>`:''}
      </div>
      ${b.sels.map(s => `<div class="bet-sel">
        <div><div class="bs-match">${s.match}</div><div class="bs-det">${s.mkt} · <b>${s.pick}</b></div></div>
        <div style="text-align:right"><div class="bs-odds">${s.odds}</div><div class="bs-res ${s.res==='won'?'r-won':s.res==='lost'?'r-lost':s.res==='void'||s.res==='na'?'r-void':'r-pend'}">${s.res==='won'?'✅ Won':s.res==='lost'?'❌ Lost':s.res==='void'||s.res==='na'?'— N/A':'⏳'}</div></div>
      </div>`).join('')}
      <div class="bet-foot">
        <span class="bet-stake-info" style="font-size:.74rem;color:var(--t2)">🪙${b.stake} · <span style="color:var(--gold);font-family:var(--mono)">${b.odds}×</span></span>
        <span style="font-family:var(--mono);font-size:.84rem;font-weight:700;color:${b.status==='won'?'var(--green)':b.status==='lost'?'var(--red)':'var(--gold)'}">
          ${b.status==='won'?'Won':b.status==='lost'?'Lost':'To win'} 🪙${b.status==='won'?Math.floor(b.payout).toLocaleString():b.status==='lost'?b.stake:Math.floor(b.payout).toLocaleString()}
        </span>
      </div>
    </div>`;
  }).join('');
}

// ================================================================
// PROFILE
// ================================================================
function updateProfile() {
  if (!CU) return;
  const init = CU.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('p-av').textContent = init;
  document.getElementById('p-nm').textContent = CU.name;
  document.getElementById('p-em').textContent = CU.email;
  const phEl = document.getElementById('p-ph');
  if (phEl) phEl.textContent = CU.phone ? '📱 ' + CU.phone : '';
  document.getElementById('p-since').textContent = 'Member since ' + CU.since;
  updateCoins();
  const st = CU.stats || { total: 0, wins: 0, wonC: 0, lostC: 0 };
  document.getElementById('s-total').textContent = st.total || 0;
  document.getElementById('s-wr').textContent = st.total ? Math.round((st.wins / st.total) * 100) + '%' : '0%';
  document.getElementById('s-won').textContent = (st.wonC || 0).toLocaleString();
  document.getElementById('s-lost').textContent = (st.lostC || 0).toLocaleString();
  // Referral code
  const code = genRefCode(CU.email);
  const refEl = document.getElementById('p-refcode');
  if (refEl) refEl.textContent = code;
  const refsEl = document.getElementById('p-refs');
  if (refsEl) refsEl.textContent = CU.refs || 0;
  const refCoinsEl = document.getElementById('p-refcoins');
  if (refCoinsEl) refCoinsEl.textContent = (CU.refCoins || 0).toLocaleString();
  // Bonus streak
  const bd = getBonusData();
  const streakEl = document.getElementById('p-streak');
  if (streakEl) streakEl.textContent = bd ? `🔥 ${bd.streak} day streak · Total earned: 🪙${(bd.totalClaimed||0).toLocaleString()}` : 'Login daily to earn free AguCoins!';
  // Admin button — only for owner
  const adminWrap = document.getElementById('admin-btn-wrap');
  if (adminWrap) adminWrap.style.display = CU.email === OWNER_EMAIL_ADMIN ? 'block' : 'none';
  // Detailed stats dashboard
  renderStatsDash();
  // Achievements badge
  renderAchievements();
}

// ================================================================
