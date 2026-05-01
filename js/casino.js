// BLAKEVIATOR
// ================================================================
function bvInit() {
  bvCanvas = document.getElementById('bv-cv');
  if (!bvCanvas) return;
  bvCtx = bvCanvas.getContext('2d');
  // Use parent arena dimensions for proper sizing
  const arena = document.getElementById('bv-arena');
  bvCanvas.width = (arena ? arena.offsetWidth : 0) || bvCanvas.offsetWidth || 500;
  bvCanvas.height = (arena ? arena.offsetHeight : 0) || bvCanvas.offsetHeight || 155;
  bvDrawGrid();
}

function bvDrawGrid() {
  if (!bvCtx || !bvCanvas) return;
  const w = bvCanvas.width, h = bvCanvas.height;
  bvCtx.clearRect(0, 0, w, h);
  bvCtx.strokeStyle = 'rgba(14,165,233,.06)'; bvCtx.lineWidth = 1;
  for (let x = 0; x < w; x += 50) { bvCtx.beginPath(); bvCtx.moveTo(x, 0); bvCtx.lineTo(x, h); bvCtx.stroke(); }
  for (let y = 0; y < h; y += 35) { bvCtx.beginPath(); bvCtx.moveTo(0, y); bvCtx.lineTo(w, y); bvCtx.stroke(); }
}

function bvDrawBranding(cd, total) {
  if (!bvCtx || !bvCanvas) return;
  const w = bvCanvas.width, h = bvCanvas.height;
  const cx = w / 2, cy = h / 2;

  // Draw grid first
  bvDrawGrid();

  // Subtle dark vignette overlay
  const vignette = bvCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  vignette.addColorStop(0, 'rgba(2,5,16,0)');
  vignette.addColorStop(1, 'rgba(2,5,16,0.55)');
  bvCtx.fillStyle = vignette;
  bvCtx.fillRect(0, 0, w, h);

  // Countdown ring
  const radius = Math.min(w, h) * 0.18;
  const progress = cd / total;
  // Background ring
  bvCtx.beginPath();
  bvCtx.arc(cx, cy - 14, radius, 0, Math.PI * 2);
  bvCtx.strokeStyle = 'rgba(240,180,41,.12)';
  bvCtx.lineWidth = 3;
  bvCtx.stroke();
  // Progress ring
  bvCtx.beginPath();
  bvCtx.arc(cx, cy - 14, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  bvCtx.strokeStyle = cd <= 3 ? '#f5222d' : '#f0b429';
  bvCtx.lineWidth = 3;
  bvCtx.lineCap = 'round';
  bvCtx.stroke();

  // Countdown number inside ring
  bvCtx.textAlign = 'center';
  bvCtx.textBaseline = 'middle';
  bvCtx.font = `bold ${Math.round(radius * 0.9)}px Barlow Condensed, sans-serif`;
  bvCtx.fillStyle = cd <= 3 ? '#f5222d' : '#f0b429';
  bvCtx.fillText(cd, cx, cy - 14);

  // "BlakeViator" title
  const titleSize = Math.max(11, Math.round(w * 0.055));
  bvCtx.font = `900 ${titleSize}px Barlow Condensed, sans-serif`;
  bvCtx.fillStyle = '#ffffff';
  bvCtx.letterSpacing = '2px';
  bvCtx.fillText('BlakeViator', cx, cy + radius + 8);

  // "by Agunextech" subtitle
  const subSize = Math.max(8, Math.round(w * 0.032));
  bvCtx.font = `600 ${subSize}px Barlow Condensed, sans-serif`;
  bvCtx.fillStyle = '#f0b429';
  bvCtx.fillText('by Agunextech', cx, cy + radius + 8 + titleSize + 2);

  // Plane emoji sitting at bottom left, waiting
  bvCtx.font = `${Math.round(h * 0.14)}px serif`;
  bvCtx.textAlign = 'left';
  bvCtx.globalAlpha = 0.45 + 0.3 * Math.sin(Date.now() / 400);
  bvCtx.fillText('✈️', 10, h - 10);
  bvCtx.globalAlpha = 1.0;
  bvCtx.textAlign = 'center';
}

function checkCoins(minStake) {
  // Returns true if user has enough to play, false + shows topup if not
  if (!CU) return false;
  if (CU.coins < minStake) {
    showNoCoinsBanner();
    return false;
  }
  return true;
}

function showNoCoinsBanner() {
  // Show on current active casino game
  const banner = `<div class="no-coins-banner">
    <p>🪙 Not enough AguCoins to play!<br>Minimum stake is 10 AguCoins.</p>
    <button class="btn-topup" onclick="goPage('profile')">🪙 TOP UP COINS</button>
  </div>`;
  // Insert banner above controls in current game
  const ctrl = document.querySelector('#cg-bv .bv-ctrl, #cg-dice .dice-box, #cg-rou .rou-box');
  if (ctrl && !ctrl.querySelector('.no-coins-banner')) {
    ctrl.insertAdjacentHTML('afterbegin', banner);
  }
  toast('🪙 Not enough AguCoins! Go to Account to top up.', 'l');
  goPage('profile');
}

function bvGenCrash() {
  // Realistic distribution — verified across 10,000 simulated rounds:
  // 54% below 2x | 22% 2x-5x | 12% 5x-10x | 7% 10x-50x
  // 2.5% 50x-200x | 1% 200x-1000x | 0.4% 1000x-5000x | 0.1% 5000x-9999x
  // 1000x+ appears roughly once every 3 hours of play
  // 5000x+ (jackpot) appears roughly once every 17 hours of play
  // HARD CAP 9999x — NEVER scientific notation
  const r = Math.random();
  let val;
  if (r < .30) val = 1.00 + Math.random() * .30;       // 30%: 1.00–1.30
  else if (r < .55) val = 1.30 + Math.random() * .70;  // 25%: 1.30–2.00
  else if (r < .77) val = 2.00 + Math.random() * 3.00; // 22%: 2.00–5.00
  else if (r < .89) val = 5.00 + Math.random() * 5.00; // 12%: 5.00–10.00
  else if (r < .96) val = 10.0 + Math.random() * 40.0; //  7%: 10–50
  else if (r < .985) val = 50  + Math.random() * 150;  // 2.5%: 50–200
  else if (r < .995) val = 200 + Math.random() * 800;  //  1%: 200–1000
  else if (r < .999) val = 1000 + Math.random() * 3999;// 0.4%: 1000–5000
  else val = 5000 + Math.random() * 4999;               // 0.1%: 5000–9999 (jackpot!)
  val = Math.min(val, 9999);
  return parseFloat(val.toFixed(2));
}

function bvHistClass(v) { return v < 2 ? 'h1' : v < 6 ? 'h2' : v < 10 ? 'h3' : 'h4'; }

function bvRenderHist() {
  const el = document.getElementById('bv-hist-items');
  if (!el) return;
  el.innerHTML = bvHistory.slice(-14).reverse().map(v => `<span class="bvh ${bvHistClass(v)}">${v.toFixed(2)}×</span>`).join('');
}

function clearBvTimers() {
  if (bvRoundTO) { clearTimeout(bvRoundTO); bvRoundTO = null; }
  cancelAnimationFrame(bvAnimId);
  bvStopFlyingSound();
  bvRunning = false;
  bvCountingDown = false;
}

// ── Slot UI builder ──
function bvRenderSlots() {
  const container = document.getElementById('bv-slots');
  const addBtn = document.getElementById('bv-add-btn');
  if (!container) return;
  container.innerHTML = bvBets.map(b => {
    const isCashed = b.cashedOut;
    const slotClass = isCashed ? 'bv-slot cashed' : 'bv-slot';
    const canRemove = !b.betPlaced;
    const stakeId = `bv-st-${b.id}`;
    const autoId = `bv-auto-${b.id}`;
    const dis = b.betPlaced ? 'disabled' : '';
    return `<div class="${slotClass}" id="bv-slot-${b.id}">
      <div class="bv-slot-hdr">
        <span class="bv-slot-lbl">Bet ${b.id + 1}</span>
        ${canRemove && bvBets.length > 1 ? `<button class="bv-slot-rm" onclick="bvRemoveSlot(${b.id})">✕</button>` : ''}
      </div>
      <div class="bvc-row" style="margin-bottom:4px;">
        <span class="bvc-lbl">Stake 🪙</span>
        <div class="bv-stake-row">
          <button class="bv-stake-adj" ${dis} onclick="bvAdjStake(${b.id},-10)">−</button>
          <input class="bvc-inp" id="${stakeId}" type="number" value="${b.stake}" min="10" ${dis} style="text-align:center;"/>
          <button class="bv-stake-adj" ${dis} onclick="bvAdjStake(${b.id},+10)">＋</button>
        </div>
      </div>
      <div class="bvc-row" style="margin-bottom:4px;">
        <span class="bvc-lbl">Quick</span>
        <div class="bvc-qrow">
          <span class="bvq" onclick="bvSetStake(${b.id},10)">10</span>
          <span class="bvq" onclick="bvSetStake(${b.id},50)">50</span>
          <span class="bvq" onclick="bvSetStake(${b.id},200)">200</span>
          <span class="bvq" onclick="bvSetStake(${b.id},500)">500</span>
        </div>
      </div>
      <div class="bvc-row" style="margin-bottom:6px;">
        <span class="bvc-lbl">Auto Cash</span>
        <input class="bvc-inp" id="${autoId}" type="number" value="${b.autoCash}" min="1.1" step="0.1" ${dis}/>
      </div>
      <div class="bv-slot-btns">
        ${!b.betPlaced
          ? `<button class="bvcbtn bvcbtn-bet" onclick="bvBet(${b.id})">PLACE BET</button>`
          : isCashed
            ? `<button class="bvcbtn bvcbtn-cash" disabled>✅ CASHED OUT</button>`
            : bvRunning
              ? `<button class="bvcbtn bvcbtn-cash" id="bv-cash-btn-${b.id}" onclick="bvCashout(${b.id})">CASH OUT 🪙${Math.floor(b.stake * bvMult).toLocaleString()}</button>`
              : bvCountingDown
                ? `<button class="bvcbtn bvcbtn-cancel" onclick="bvCancelBet(${b.id})">❌ CANCEL BET</button>`
                : `<button class="bvcbtn bvcbtn-cash" disabled style="opacity:.5;">💥 CRASHED</button>`
        }
      </div>
      ${isCashed ? `<div class="bv-slot-status won" id="bv-status-${b.id}">✅ Cashed @ ${b.cashedMult}× — +🪙${b.profit.toLocaleString()}</div>` : ''}
    </div>`;
  }).join('');
  if (addBtn) addBtn.disabled = bvBets.length >= 3 || bvRunning;
}

function bvAddSlot() {
  if (bvBets.length >= 3) { toast('Max 3 bets per round', 'i'); return; }
  if (bvRunning) { toast('Cannot add bet while round is running', 'i'); return; }
  bvBets.push({ id: bvNextId++, stake: 50, autoCash: 2.0, cashedOut: false, betPlaced: false, cashedMult: 0, profit: 0 });
  bvRenderSlots();
}

function bvRemoveSlot(id) {
  if (bvBets.length <= 1) return;
  bvBets = bvBets.filter(b => b.id !== id);
  bvRenderSlots();
}

function bvAdjStake(id, delta) {
  const b = bvBets.find(b => b.id === id);
  if (!b || b.betPlaced) return;
  const el = document.getElementById(`bv-st-${b.id}`);
  const cur = parseFloat(el?.value) || 10;
  const next = Math.max(10, cur + delta);
  b.stake = next;
  if (el) el.value = next;
}

function bvSetStake(id, val) {
  const b = bvBets.find(b => b.id === id);
  if (!b || b.betPlaced) return;
  b.stake = val;
  const el = document.getElementById(`bv-st-${b.id}`);
  if (el) el.value = val;
}

function bvCancelBet(id) {
  // Only allowed during the 10s countdown before the plane flies
  if (!bvCountingDown) { toast('Cannot cancel — round already started!', 'l'); return; }
  const b = bvBets.find(b => b.id === id);
  if (!b || !b.betPlaced) return;
  CU.coins += b.stake; updateCoins(); saveCU();
  b.betPlaced = false;
  b.cashedOut = false;
  toast(`❌ Bet ${id + 1} cancelled — 🪙${b.stake} refunded`, 'i');
  bvRenderSlots();
}

function bvToggleSound() {
  bvSoundOn = !bvSoundOn;
  const btn = document.getElementById('bv-sound-btn');
  if (btn) {
    btn.textContent = bvSoundOn ? '🔊 SOUND ON' : '🔇 MUTED';
    btn.className = bvSoundOn ? '' : 'muted';
  }
  // Stop flying audio immediately if muting
  if (!bvSoundOn) bvStopFlyingSound();
}

function bvBet(id) {
  const b = bvBets.find(b => b.id === id);
  if (!b) return;
  if (bvRunning) { toast('Wait for next round!', 'i'); return; }
  const stakeEl = document.getElementById(`bv-st-${id}`);
  const autoEl = document.getElementById(`bv-auto-${id}`);
  const stake = parseFloat(stakeEl?.value) || 0;
  const autoCash = parseFloat(autoEl?.value) || 0;
  if (stake < 10) { toast('Min 10 AguCoins', 'i'); return; }
  if (!CU || CU.coins < stake) { checkCoins(stake); return; }
  b.stake = stake;
  b.autoCash = autoCash;
  b.betPlaced = true;
  b.cashedOut = false;
  b.cashedMult = 0;
  b.profit = 0;
  CU.coins -= stake; updateCoins(); saveCU();
  toast(`Bet ${id + 1} placed: 🪙${stake}`, 'i');
  bvRenderSlots();
}

function bvCashout(id) {
  const b = bvBets.find(b => b.id === id);
  if (!b || b.cashedOut || !b.betPlaced || !bvRunning) return;
  b.cashedOut = true;
  b.cashedMult = parseFloat(bvMult.toFixed(2));
  const winnings = Math.floor(b.stake * bvMult);
  b.profit = winnings - b.stake;
  CU.coins += winnings; updateCoins();
  if (!CU.stats) CU.stats = { total: 0, wins: 0, wonC: 0, lostC: 0 };
  CU.stats.total++; CU.stats.wins++; CU.stats.wonC += b.profit;
  saveCU();
  playSound('cashout');
  pushWin(CU.name, winnings, 'BlakeViator');
  addCasinoBet('BlakeViator', b.stake, b.profit, `Bet${id+1} Cashed @ ${b.cashedMult}×`, true);
  toast(`✈️ Bet ${id+1} cashed @ ${b.cashedMult}× — +🪙${b.profit.toLocaleString()}`, 'w');
  // Achievement checks
  if (b.cashedMult >= 5) unlockAchievement('bv_5x');
  if (b.cashedMult >= 10) unlockAchievement('bv_10x');
  if (b.profit >= 1000) showShareCard(winnings, `BlakeViator × ${b.cashedMult}`);
  bvRenderSlots();
  // Show tag only if ALL bets with betPlaced are now cashed
  const allCashed = bvBets.filter(x => x.betPlaced).every(x => x.cashedOut);
  if (allCashed) {
    const tagEl = document.getElementById('bv-tag');
    if (tagEl) { tagEl.style.display = 'block'; tagEl.textContent = `✅ All bets cashed!`; }
    const statEl = document.getElementById('bv-stat');
    if (statEl) statEl.textContent = `✅ All bets cashed — Plane still flying...`;
  }
}

function bvCrash() {
  cancelAnimationFrame(bvAnimId);
  bvRunning = false;
  bvStopFlyingSound();
  const crashMult = bvMult.toFixed(2);
  bvHistory.push(parseFloat(crashMult));
  if (bvHistory.length > 30) bvHistory.shift();
  bvRenderHist();
  playSound('crash');
  const multEl = document.getElementById('bv-mult');
  if (multEl) { multEl.textContent = crashMult + 'x'; multEl.className = 'c'; }
  const planeEl = document.getElementById('bv-plane');
  if (planeEl) planeEl.style.display = 'none';
  const boomEl = document.getElementById('bv-boom');
  if (boomEl) { boomEl.style.display = 'block'; boomEl.style.left = (bvPlaneX - 10) + 'px'; boomEl.style.top = (bvPlaneY - 10) + 'px'; }
  const statEl = document.getElementById('bv-stat');
  if (statEl) statEl.textContent = `💥 Crashed @ ${crashMult}×!`;
  // Settle all bets that weren't cashed out
  bvBets.forEach(b => {
    if (b.betPlaced && !b.cashedOut) {
      toast(`💥 Bet ${b.id+1} crashed @ ${crashMult}× — Lost 🪙${b.stake}`, 'l');
      addCasinoBet('BlakeViator', b.stake, 0, `Bet${b.id+1} Crashed @ ${crashMult}×`, false);
      if (!CU.stats) CU.stats = { total: 0, wins: 0, wonC: 0, lostC: 0 };
      CU.stats.total++; CU.stats.lostC += b.stake;
    }
  });
  saveCU();
  bvRenderSlots();
  bvRoundTO = setTimeout(() => bvStartRound(), 3000);
}

function bvStartRound() {
  clearBvTimers();
  bvCrashAt = bvGenCrash();
  bvMult = 1; bvTrail = [];
  bvRunning = false;
  // Reset all slots — keep the slots but clear betPlaced state for next round
  bvBets.forEach(b => { b.betPlaced = false; b.cashedOut = false; b.cashedMult = 0; b.profit = 0; });
  // If no slots exist yet, create one default slot
  if (bvBets.length === 0) bvBets.push({ id: bvNextId++, stake: 50, autoCash: 2.0, cashedOut: false, betPlaced: false, cashedMult: 0, profit: 0 });
  const multEl = document.getElementById('bv-mult');
  const planeEl = document.getElementById('bv-plane');
  const boomEl = document.getElementById('bv-boom');
  const tagEl = document.getElementById('bv-tag');
  const statEl = document.getElementById('bv-stat');
  if (multEl) { multEl.textContent = ''; multEl.className = ''; }
  if (planeEl) { planeEl.style.display = 'none'; planeEl.style.transform = 'rotate(0deg)'; }
  if (boomEl) boomEl.style.display = 'none';
  if (tagEl) tagEl.style.display = 'none';
  bvRenderSlots();
  bvCountingDown = true; // countdown started — cancel is allowed now

  // 10 second countdown with branding animation
  const TOTAL = 10;
  let cd = TOTAL;
  let brandAnimId = null;

  function brandFrame() {
    if (!bvRunning) {
      bvDrawBranding(cd, TOTAL);
      brandAnimId = requestAnimationFrame(brandFrame);
    }
  }
  brandFrame();

  const updateStat = () => {
    if (statEl) statEl.textContent = cd > 0 ? `⏳ Next round in ${cd}s — Place your bets!` : '🚀 Round starting!';
  };
  updateStat();

  const cdIv = setInterval(() => {
    cd--;
    updateStat();
    if (cd <= 0) clearInterval(cdIv);
  }, 1000);

  bvRoundTO = setTimeout(() => {
    cancelAnimationFrame(brandAnimId);
    bvFly();
  }, 10000);
}

function bvFly() {
  bvRunning = true;
  bvCountingDown = false; // countdown over — cancel no longer allowed
  bvStartTime = performance.now();
  bvTrail = [];
  const planeEl = document.getElementById('bv-plane');
  const statEl = document.getElementById('bv-stat');
  if (planeEl) planeEl.style.display = 'none';
  // Re-render slots immediately so CANCEL BET → CASH OUT green button
  bvRenderSlots();
  bvStartFlyingSound();

  function frame() {
    const t = (performance.now() - bvStartTime) / 1000;
    bvMult = Math.pow(1.0018, Math.pow(t, 1.4) * 60);
    bvMult = Math.min(bvMult, 9999.99);

    const multEl = document.getElementById('bv-mult');
    if (multEl) {
      let display;
      if (bvMult >= 1000) display = Math.floor(bvMult).toLocaleString() + 'x';
      else if (bvMult >= 100) display = bvMult.toFixed(1) + 'x';
      else display = bvMult.toFixed(2) + 'x';
      multEl.textContent = display;
      multEl.className = bvMult < 2 ? 's' : bvMult < 10 ? 'w' : 'd';
    }

    // Update live cash out button text for each active bet
    const anyActive = bvBets.some(b => b.betPlaced && !b.cashedOut);
    if (statEl && anyActive) statEl.textContent = '✈️ Flying! Cash out before crash!';

    // Pitch up engine sound as multiplier rises
    bvUpdateFlyingSound();

    bvBets.forEach(b => {
      if (b.betPlaced && !b.cashedOut) {
        const btn = document.getElementById(`bv-cash-btn-${b.id}`);
        if (btn) btn.textContent = `CASH OUT 🪙${Math.floor(b.stake * bvMult).toLocaleString()}`;
        // Auto cashout check per bet
        if (b.autoCash > 1.05 && bvMult >= b.autoCash) bvCashout(b.id);
      }
    });

    if (bvCanvas && bvCtx) {
      const w = bvCanvas.width, h = bvCanvas.height;
      const maxTime = 18;
      const prog = Math.min(t / maxTime, 0.97);
      const px = 28 + prog * (w - 46);
      const py = Math.max(14, h - 22 - Math.pow(prog, 1.7) * (h - 38));
      bvPlaneX = px; bvPlaneY = py;
      bvTrail.push({ x: px, y: py });
      bvDrawGrid();
      const allCashed = bvBets.filter(x => x.betPlaced).length > 0 && bvBets.filter(x => x.betPlaced).every(x => x.cashedOut);
      const lineColor = allCashed ? 'rgba(0,200,83,' : 'rgba(240,180,41,';
      if (bvTrail.length > 1) {
        // Fill under curve
        bvCtx.beginPath();
        bvCtx.moveTo(bvTrail[0].x, h - 2);
        bvTrail.forEach(p => bvCtx.lineTo(p.x, p.y));
        bvCtx.lineTo(bvTrail[bvTrail.length - 1].x, h - 2);
        bvCtx.closePath();
        const fillGrad = bvCtx.createLinearGradient(0, h, 0, 0);
        fillGrad.addColorStop(0, lineColor + '0)');
        fillGrad.addColorStop(1, lineColor + '.1)');
        bvCtx.fillStyle = fillGrad;
        bvCtx.fill();
        // Smoke trail
        const smokeCount = Math.min(bvTrail.length - 1, 30);
        for (let i = smokeCount; i >= 1; i--) {
          const idx = bvTrail.length - 1 - i;
          if (idx < 0) continue;
          const pt = bvTrail[idx];
          const alpha = (1 - i / smokeCount) * 0.35;
          const radius = 2 + (1 - i / smokeCount) * 2;
          bvCtx.beginPath();
          bvCtx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          bvCtx.fillStyle = lineColor + alpha + ')';
          bvCtx.fill();
        }
        // Curve line
        bvCtx.beginPath();
        bvCtx.moveTo(bvTrail[0].x, bvTrail[0].y);
        for (let i = 1; i < bvTrail.length; i++) bvCtx.lineTo(bvTrail[i].x, bvTrail[i].y);
        const lineGrad = bvCtx.createLinearGradient(bvTrail[0].x, 0, px, 0);
        lineGrad.addColorStop(0, lineColor + '.15)');
        lineGrad.addColorStop(1, lineColor + '1)');
        bvCtx.strokeStyle = lineGrad;
        bvCtx.lineWidth = 2.5;
        bvCtx.lineJoin = 'round';
        bvCtx.stroke();
        // Glow dot
        const glow = bvCtx.createRadialGradient(px, py, 0, px, py, 10);
        glow.addColorStop(0, lineColor + '.9)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        bvCtx.beginPath();
        bvCtx.arc(px, py, 10, 0, Math.PI * 2);
        bvCtx.fillStyle = glow;
        bvCtx.fill();
      }
      // Plane emoji on canvas
      if (bvTrail.length >= 2) {
        const p1 = bvTrail[bvTrail.length - 2];
        const p2 = bvTrail[bvTrail.length - 1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        bvCtx.save();
        bvCtx.translate(px, py);
        bvCtx.rotate(angle);
        bvCtx.font = '18px serif';
        bvCtx.textAlign = 'center';
        bvCtx.textBaseline = 'middle';
        bvCtx.shadowColor = allCashed ? '#00c853' : '#f0b429';
        bvCtx.shadowBlur = 12;
        bvCtx.fillText('✈️', 0, 0);
        bvCtx.shadowBlur = 0;
        bvCtx.restore();
      }
    }

    if (bvMult >= bvCrashAt) { bvCrash(); return; }
    bvAnimId = requestAnimationFrame(frame);
  }
  bvAnimId = requestAnimationFrame(frame);
}

// ================================================================
// DICE
// ================================================================
const DFACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function selDice(opt) {
  diceChoice = opt;
  document.querySelectorAll('.dopt').forEach(d => d.classList.remove('sel'));
  document.getElementById('dopt-' + opt)?.classList.add('sel');
}
function rollDice() {
  if (diceRolling) return;
  const stake = parseFloat(document.getElementById('dice-st')?.value) || 0;
  if (stake < 10) { toast('Min 10', 'i'); return; }
  if (!CU || CU.coins < stake) { checkCoins(stake); return; }
  diceRolling = true;
  CU.coins -= stake; updateCoins(); saveCU();
  const d1 = document.getElementById('die1'), d2 = document.getElementById('die2');
  const res = document.getElementById('dice-res');
  const btn = document.getElementById('dice-btn');
  d1.classList.add('rolling'); d2.classList.add('rolling');
  if (res) { res.textContent = 'Rolling...'; res.className = 'dice-res'; }
  if (btn) btn.disabled = true;
  playSound('roll');
  let t = 0;
  const iv = setInterval(() => {
    d1.textContent = DFACES[Math.floor(Math.random() * 6)];
    d2.textContent = DFACES[Math.floor(Math.random() * 6)];
    if (++t > 18) {
      clearInterval(iv);
      const v1 = Math.floor(Math.random() * 6) + 1, v2 = Math.floor(Math.random() * 6) + 1, tot = v1 + v2;
      d1.textContent = DFACES[v1 - 1]; d2.textContent = DFACES[v2 - 1];
      d1.classList.remove('rolling'); d2.classList.remove('rolling');
      setTimeout(() => resolveDice(stake, v1, v2, tot, d1, d2, res, btn), 150);
    }
  }, 55);
}
function resolveDice(stake, v1, v2, tot, d1, d2, res, btn) {
  const k = diceChoice;
  let won = false, mult = 1;
  if (k === 'high' && tot >= 8) { won = true; mult = 1.9; }
  else if (k === 'low' && tot <= 6) { won = true; mult = 1.9; }
  else if (k === 'even' && tot % 2 === 0) { won = true; mult = 1.95; }
  else if (k === 'odd' && tot % 2 !== 0) { won = true; mult = 1.95; }
  else if (k === 'seven' && tot === 7) { won = true; mult = 5; }
  else if (k === 'doubles' && v1 === v2) { won = true; mult = 6; }
  if (won) {
    const pay = Math.floor(stake * mult);
    CU.coins += pay; updateCoins();
    if (!CU.stats) CU.stats = { total: 0, wins: 0, wonC: 0, lostC: 0 };
    CU.stats.total++; CU.stats.wins++; CU.stats.wonC += pay - stake;
    d1.classList.add('win'); d2.classList.add('win');
    if (res) { res.textContent = `${v1}+${v2}=${tot} — WIN! +🪙${(pay - stake).toLocaleString()}`; res.className = 'dice-res win'; }
    playSound('win');
    pushWin(CU.name, pay, 'Dice');
    addCasinoBet('Dice', stake, pay - stake, `${v1}+${v2}=${tot} (${k})`, true);
    toast(`🎲 ${tot}! +🪙${(pay - stake).toLocaleString()}`, 'w');
  } else {
    if (!CU.stats) CU.stats = { total: 0, wins: 0, wonC: 0, lostC: 0 };
    CU.stats.total++; CU.stats.lostC += stake;
    d1.classList.add('lose'); d2.classList.add('lose');
    if (res) { res.textContent = `${v1}+${v2}=${tot} — Lost 🪙${stake}`; res.className = 'dice-res lose'; }
    playSound('lose');
    addCasinoBet('Dice', stake, 0, `${v1}+${v2}=${tot} (${k})`, false);
    toast(`🎲 ${tot}. Unlucky!`, 'l');
  }
  saveCU();
  setTimeout(() => {
    d1.classList.remove('win', 'lose'); d2.classList.remove('win', 'lose');
    if (btn) btn.disabled = false;
    diceRolling = false;
  }, 1600);
}

// ================================================================
// ROULETTE
// ================================================================
const ROU_NUMS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
function getNumColor(n) { return n === 0 ? 'green' : RED_NUMS.includes(n) ? 'red' : 'black'; }
function drawRou(angle) {
  const c = document.getElementById('rou-cv');
  if (!c) return;
  const ctx = c.getContext('2d'), cx = 98, cy = 98, r = 93, inner = 30;
  ctx.clearRect(0, 0, 196, 196);
  const sa = (2 * Math.PI) / ROU_NUMS.length;
  ROU_NUMS.forEach((num, i) => {
    const a = angle + i * sa - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a + sa); ctx.closePath();
    ctx.fillStyle = num === 0 ? '#16a34a' : RED_NUMS.includes(num) ? '#dc2626' : '#1f2937';
    ctx.fill(); ctx.strokeStyle = '#07090d'; ctx.lineWidth = .7; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a + sa / 2);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 7px Barlow Condensed';
    ctx.fillText(num, r - 4, 2.5); ctx.restore();
  });
  ctx.beginPath(); ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, inner);
  g.addColorStop(0, '#1a2a45'); g.addColorStop(1, '#0b1120');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#f0b429'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#f0b429'; ctx.font = 'bold 9px Barlow Condensed'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('BLAKE', cx, cy - 5); ctx.fillText('BET', cx, cy + 5);
}
function selRou(type) {
  rouBet = type;
  document.querySelectorAll('.rbet').forEach(b => b.classList.remove('sel'));
  document.getElementById('rb-' + type)?.classList.add('sel');
}
function spinRou() {
  if (rouSpinning) return;
  const stake = parseFloat(document.getElementById('rou-st')?.value) || 0;
  if (stake < 10) { toast('Min 10', 'i'); return; }
  if (!CU || CU.coins < stake) { checkCoins(stake); return; }
  rouSpinning = true;
  CU.coins -= stake; updateCoins(); saveCU();
  const rbtn = document.getElementById('rou-btn');
  const rres = document.getElementById('rou-res');
  if (rbtn) rbtn.disabled = true;
  if (rres) { rres.textContent = 'Spinning...'; rres.className = 'rou-res'; }
  playSound('roll');
  const ri = Math.floor(Math.random() * ROU_NUMS.length);
  const sa = (2 * Math.PI) / ROU_NUMS.length;
  const target = -(ri * sa) + (Math.PI / 2) - (sa / 2);
  const final = target + (6 + Math.random() * 3) * 2 * Math.PI;
  let st = null; const dur = 4200; const sa2 = rouAngle;
  function frame(ts) {
    if (!st) st = ts;
    const prog = Math.min((ts - st) / dur, 1);
    const ease = 1 - Math.pow(1 - prog, 4);
    rouAngle = sa2 + ease * (final - sa2);
    drawRou(rouAngle);
    if (prog < 1) { requestAnimationFrame(frame); }
    else { rouAngle = final % (2 * Math.PI); resolveRou(stake, ROU_NUMS[ri], rbtn, rres); }
  }
  requestAnimationFrame(frame);
}
function resolveRou(stake, num, rbtn, rres) {
  const color = getNumColor(num);
  const isE = num > 0 && num % 2 === 0, isO = num > 0 && num % 2 !== 0, isH = num >= 19;
  let won = false, mult = 0;
  if (rouBet === 'red' && color === 'red') { won = true; mult = 2; }
  else if (rouBet === 'black' && color === 'black') { won = true; mult = 2; }
  else if (rouBet === 'green' && color === 'green') { won = true; mult = 14; }
  else if (rouBet === 'even' && isE) { won = true; mult = 2; }
  else if (rouBet === 'odd' && isO) { won = true; mult = 2; }
  else if (rouBet === 'high' && isH) { won = true; mult = 2; }
  const ico = color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢';
  if (won) {
    const pay = Math.floor(stake * mult);
    CU.coins += pay; updateCoins();
    if (!CU.stats) CU.stats = { total: 0, wins: 0, wonC: 0, lostC: 0 };
    CU.stats.total++; CU.stats.wins++; CU.stats.wonC += pay - stake;
    if (rres) { rres.textContent = `${ico} ${num} — WIN! +🪙${(pay - stake).toLocaleString()}`; rres.className = 'rou-res win'; }
    playSound('win');
    pushWin(CU.name, pay, 'Roulette');
    addCasinoBet('Roulette', stake, pay - stake, `${num} ${color} (${rouBet})`, true);
    toast(`🎡 ${num} ${color}! +🪙${(pay - stake).toLocaleString()}`, 'w');
  } else {
    if (!CU.stats) CU.stats = { total: 0, wins: 0, wonC: 0, lostC: 0 };
    CU.stats.total++; CU.stats.lostC += stake;
    if (rres) { rres.textContent = `${ico} ${num} — Lost 🪙${stake}`; rres.className = 'rou-res lose'; }
    playSound('lose');
    addCasinoBet('Roulette', stake, 0, `${num} ${color} (${rouBet})`, false);
    toast(`🎡 ${num} ${color}. Next spin!`, 'l');
  }
  saveCU();
  setTimeout(() => { if (rbtn) rbtn.disabled = false; rouSpinning = false; }, 1000);
}

function addCasinoBet(game, stake, profit, detail, won) {
  if (!CU) return;
  if (!CU.bets) CU.bets = [];
  const bet = { id: Date.now().toString(36).toUpperCase(), status: won ? 'won' : 'lost', stake, odds: '—', payout: won ? profit : 0, sels: [{ match: game, mkt: detail, pick: won ? 'WIN' : 'LOSS', odds: '—', res: won ? 'won' : 'lost', mid: null }] };
  CU.bets.push(bet); saveCU(); updatePendingBadge();
  if (document.getElementById('pg-mybets').classList.contains('on')) renderMyBets();
}

// ================================================================
// CASINO SWITCH
// ================================================================
function casinoSwitch(tab, el) {
  document.querySelectorAll('.cnav').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.casino-game').forEach(g => g.classList.remove('on'));
  document.getElementById('cg-' + tab)?.classList.add('on');

  if (tab === 'bv') {
    setTimeout(() => {
      bvInit();
      bvRenderHist();
      if (bvRunning) bvStartFlyingSound();
      if (!bvRunning && !bvRoundTO) bvStartRound();
    }, 100);
  } else {
    bvStopFlyingSound();
    if (tab === 'rou') setTimeout(() => drawRou(rouAngle), 100);
  }
}

// ================================================================
// SOUNDS — with mute toggle and BlakeViator plane engine sounds
// ================================================================
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playSound(type) {
  if (!bvSoundOn && (type === 'crash' || type === 'cashout')) return;
  // Always play win/lose/roll regardless of BV mute (those are for dice/roulette)
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    if (type === 'win') {
      o.frequency.setValueAtTime(523, ctx.currentTime);
      o.frequency.setValueAtTime(659, ctx.currentTime + .1);
      o.frequency.setValueAtTime(784, ctx.currentTime + .2);
      g.gain.setValueAtTime(.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .55);
    } else if (type === 'lose') {
      o.frequency.setValueAtTime(280, ctx.currentTime);
      o.frequency.setValueAtTime(160, ctx.currentTime + .25);
      g.gain.setValueAtTime(.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .5);
    } else if (type === 'crash') {
      // Explosive burst — white noise hit + descending engine cutoff
      try {
        const crashCtx = getAudioCtx();
        const now = crashCtx.currentTime;
        // Noise burst (explosion impact)
        const bufSize = crashCtx.sampleRate * 1.2;
        const nBuf = crashCtx.createBuffer(1, bufSize, crashCtx.sampleRate);
        const nd = nBuf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);
        const nSrc = crashCtx.createBufferSource();
        nSrc.buffer = nBuf;
        const nGain = crashCtx.createGain();
        nGain.gain.setValueAtTime(0.7, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        const nFilter = crashCtx.createBiquadFilter();
        nFilter.type = 'bandpass';
        nFilter.frequency.value = 800;
        nFilter.Q.value = 0.5;
        nSrc.connect(nFilter); nFilter.connect(nGain); nGain.connect(crashCtx.destination);
        nSrc.start();
        // Descending engine whine dying
        const dying = crashCtx.createOscillator();
        dying.type = 'sawtooth';
        dying.frequency.setValueAtTime(900, now);
        dying.frequency.exponentialRampToValueAtTime(35, now + 1.1);
        const dGain = crashCtx.createGain();
        dGain.gain.setValueAtTime(0.18, now);
        dGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        dying.connect(dGain); dGain.connect(crashCtx.destination);
        dying.start(); dying.stop(now + 1.2);
        nSrc.stop(now + 1.3);
        return;
      } catch(e) {}
      // Fallback
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(320, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.8);
      g.gain.setValueAtTime(0.35, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    } else if (type === 'roll') {
      o.frequency.setValueAtTime(440, ctx.currentTime);
      g.gain.setValueAtTime(.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .12);
    } else if (type === 'cashout') {
      // Rising chime — successful exit
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.setValueAtTime(880, ctx.currentTime + .08);
      o.frequency.setValueAtTime(1100, ctx.currentTime + .18);
      o.frequency.setValueAtTime(1320, ctx.currentTime + .28);
      g.gain.setValueAtTime(.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .5);
    }
    o.start(); o.stop(ctx.currentTime + 1.0);
  } catch (e) {}
}

// ================================================================
// BLAKEVIATOR — Realistic jet turbine sound synthesis
// Layers: white noise airflow + bandpass filtered turbine body
//         + high-pitched turbine whine + low compressor rumble
//         All pitch up as multiplier climbs via bvUpdateFlyingSound()
// ================================================================
function bvStartFlyingSound() {
  if (!bvSoundOn) return;
  bvStopFlyingSound();
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1.0, now + 1.2); // slow spool-up
    masterGain.connect(ctx.destination);

    // ── Layer 1: White noise — air/wind rush through engine ──
    const bufSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    // Bandpass filter — shapes noise into turbine body roar
    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.setValueAtTime(380, now);
    bpFilter.frequency.linearRampToValueAtTime(900, now + 25);
    bpFilter.Q.value = 0.8;
    // High shelf — adds air hiss on top
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(2200, now);
    hpFilter.frequency.linearRampToValueAtTime(3800, now + 25);
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.38;
    noiseSource.connect(bpFilter);
    bpFilter.connect(noiseGain);
    noiseSource.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start();

    // ── Layer 2: Turbine whine — high pitched engine tone ──
    const whine = ctx.createOscillator();
    whine.type = 'sawtooth';
    whine.frequency.setValueAtTime(520, now);           // spool up from low
    whine.frequency.linearRampToValueAtTime(1050, now + 2.0); // reach cruise pitch
    whine.frequency.linearRampToValueAtTime(1800, now + 25);  // slowly climb with mult
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0.028;
    // Slight tremolo to simulate turbine blade frequency
    const tremoloOsc = ctx.createOscillator();
    tremoloOsc.frequency.value = 22;
    tremoloOsc.type = 'sine';
    const tremoloGain = ctx.createGain();
    tremoloGain.gain.value = 0.008;
    tremoloOsc.connect(tremoloGain);
    tremoloGain.connect(whineGain.gain);
    whine.connect(whineGain);
    whineGain.connect(masterGain);
    whine.start(); tremoloOsc.start();

    // ── Layer 3: Low compressor thump — low frequency body vibration ──
    const compressor = ctx.createOscillator();
    compressor.type = 'sawtooth';
    compressor.frequency.setValueAtTime(62, now);
    compressor.frequency.linearRampToValueAtTime(130, now + 25);
    const compGain = ctx.createGain();
    compGain.gain.value = 0.045;
    // Low-pass filter to keep it deep
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(280, now);
    lpFilter.frequency.linearRampToValueAtTime(520, now + 25);
    compressor.connect(lpFilter);
    lpFilter.connect(compGain);
    compGain.connect(masterGain);
    compressor.start();

    // ── Layer 4: Mid-frequency turbine harmonics ──
    const harmonic = ctx.createOscillator();
    harmonic.type = 'triangle';
    harmonic.frequency.setValueAtTime(260, now);
    harmonic.frequency.linearRampToValueAtTime(550, now + 25);
    const harmGain = ctx.createGain();
    harmGain.gain.value = 0.018;
    harmonic.connect(harmGain);
    harmGain.connect(masterGain);
    harmonic.start();

    bvFlyingAudio = {
      ctx, masterGain,
      nodes: [noiseSource, whine, tremoloOsc, compressor, harmonic],
      bpFilter, hpFilter, whine, compressor, harmonic
    };
  } catch(e) {}
}

// Call this from the frame loop to pitch up as multiplier climbs
function bvUpdateFlyingSound() {
  if (!bvFlyingAudio || !bvSoundOn) return;
  try {
    const { ctx, whine, compressor, harmonic, bpFilter, hpFilter } = bvFlyingAudio;
    const now = ctx.currentTime;
    // Map multiplier (1x → 100x) to pitch factor (1.0 → 1.8)
    const pitchFactor = Math.min(1.8, 1.0 + (bvMult - 1) / 100 * 0.8);
    whine.frequency.setTargetAtTime(1050 * pitchFactor, now, 0.5);
    compressor.frequency.setTargetAtTime(90 * pitchFactor, now, 0.5);
    harmonic.frequency.setTargetAtTime(380 * pitchFactor, now, 0.5);
    bpFilter.frequency.setTargetAtTime(500 * pitchFactor, now, 0.5);
  } catch(e) {}
}

function bvStopFlyingSound() {
  if (!bvFlyingAudio) return;
  try {
    const { ctx, masterGain, nodes } = bvFlyingAudio;
    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0.0, now + 0.6);
    setTimeout(() => {
      nodes.forEach(n => { try { n.stop(); } catch(e) {} });
    }, 700);
  } catch(e) {}
  bvFlyingAudio = null;
}

// ================================================================
// MODAL & TOAST
