function syncSeasonToCurrentTime() {
  const { mw: targetMW, season: globalSeason } = getGlobalMW();
  LEAGUES.forEach(lg => {
    const s = season[lg.id];
    if (!s) return;

    // If saved season is behind global season, reset quietly
    if ((s.seasonNum || 1) < globalSeason) {
      season[lg.id] = {
        mw: 0,
        weeks: buildSchedule(lg.teams.length),
        table: lg.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
        lastSimMW: -1,
        seasonNum: globalSeason
      };
      saveLeagueSeason(lg.id);
      return;
    }

    // Only simulate from lastSimMW up to targetMW — never go backwards
    while (s.lastSimMW < targetMW) {
      const mw = s.lastSimMW + 1;
      if (mw >= 38) {
        // Full season done during sync — reset quietly
        season[lg.id] = {
          mw: 0,
          weeks: buildSchedule(lg.teams.length),
          table: lg.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
          lastSimMW: -1,
          seasonNum: (s.seasonNum || 1) + 1
        };
        break;
      }
      (s.weeks[mw] || []).forEach((m, i) => {
        if (!m.played) {
          const sc = simScore(lg.id, m.home, m.away);
          applyResult(lg.id, mw, i, sc.h, sc.a, false);
        }
      });
      s.lastSimMW = mw;
      s.mw = Math.min(mw + 1, 37);
    }
    saveLeagueSeason(lg.id);
  });
}

// ── Division 2 catch-up sync (same pattern as Div1) ──
function simDiv2Score(d2Id, hi, ai) {
  const d2 = DIV2.find(d => d.id === d2Id);
  if (!d2) return { h: 0, a: 0 };
  const hs = d2.str[hi] + 7 + Math.random() * 6;
  const as = d2.str[ai] + Math.random() * 5;
  const hb = Math.random() < .15 ? 1.5 : 1;
  const ab = Math.random() < .15 ? 1.5 : 1;
  return { h: poisson(hs / 100 * 2.2 * hb), a: poisson(as / 100 * 1.8 * ab) };
}

function applyDiv2Result(d2Id, mwIdx, mIdx, hg, ag) {
  const s = d2season[d2Id];
  if (!s) return;
  const m = s.weeks[mwIdx]?.[mIdx];
  if (!m || m.played) return;
  m.hs = hg; m.as = ag; m.played = true;
  // Same find-by-index fix as Div1 — never use array position after sort
  const ht = s.table.find(t => t.i === m.home);
  const at = s.table.find(t => t.i === m.away);
  if (!ht || !at) return;
  // Safety cap — no team should ever exceed 38 games
  if (ht.p >= 38 || at.p >= 38) return;
  ht.p++; at.p++; ht.gf += hg; ht.ga += ag; ht.gd += hg - ag;
  at.gf += ag; at.ga += hg; at.gd += ag - hg;
  if (hg > ag) { ht.w++; ht.pts += 3; ht.form.push('W'); at.l++; at.form.push('L'); }
  else if (hg === ag) { ht.d++; ht.pts++; at.d++; at.pts++; ht.form.push('D'); at.form.push('D'); }
  else { at.w++; at.pts += 3; at.form.push('W'); ht.l++; ht.form.push('L'); }
  if (ht.form.length > 5) ht.form = ht.form.slice(-5);
  if (at.form.length > 5) at.form = at.form.slice(-5);
  s.table.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  // Add Div2 result to ticker (labelled so user can tell)
  const d2 = DIV2.find(d => d.id === d2Id);
  tickerResults.push({ home: d2.teams[m.home], away: d2.teams[m.away], hs: hg, as: ag, lg: d2.name, flag: d2.flag });
  if (tickerResults.length > 60) tickerResults.shift();
  // Save updated Div2 season
  localStorage.setItem(getDiv2Key(d2Id), JSON.stringify(s));
}

function syncDiv2ToCurrentTime() {
  const { mw: targetMW, season: globalSeason } = getGlobalMW();
  DIV2.forEach(d2 => {
    const s = d2season[d2.id];
    if (!s) return;
    // Reset if behind global season
    if ((s.seasonNum || 1) < globalSeason) {
      d2season[d2.id] = {
        mw: 0,
        weeks: buildSchedule(d2.teams.length),
        table: d2.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
        lastSimMW: -1,
        seasonNum: globalSeason
      };
      localStorage.setItem(getDiv2Key(d2.id), JSON.stringify(d2season[d2.id]));
      return;
    }
    while (s.lastSimMW < targetMW) {
      const mw = s.lastSimMW + 1;
      if (mw >= 38) {
        d2season[d2.id] = {
          mw: 0,
          weeks: buildSchedule(d2.teams.length),
          table: d2.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
          lastSimMW: -1,
          seasonNum: (s.seasonNum || 1) + 1
        };
        localStorage.setItem(getDiv2Key(d2.id), JSON.stringify(d2season[d2.id]));
        break;
      }
      (s.weeks[mw] || []).forEach((m, i) => {
        if (!m.played) {
          const sc = simDiv2Score(d2.id, m.home, m.away);
          applyDiv2Result(d2.id, mw, i, sc.h, sc.a);
        }
      });
      s.lastSimMW = mw;
      s.mw = Math.min(mw + 1, 37);
    }
    localStorage.setItem(getDiv2Key(d2.id), JSON.stringify(s));
  });
}

// ================================================================
// LIVE ENGINE — matches run continuously
// ================================================================
const LIVE_INTERVAL = 90000; // 90 seconds per match
const MATCH_GAP = 15000; // stagger between leagues

function stopAllTimers() {
  Object.keys(matchIntervals).forEach(k => {
    clearInterval(matchIntervals[k].iv);
    clearTimeout(matchIntervals[k].to);
  });
  matchIntervals = {};
  liveGames = {};
}

function startLiveEngine() {
  stopAllTimers();
  // Stagger each Div1 league start
  LEAGUES.forEach((lg, li) => {
    const delay = li * MATCH_GAP;
    const to = setTimeout(() => scheduleLiveMatch(lg.id), delay);
    matchIntervals[`init_${lg.id}`] = { to, iv: null };
  });
  // Stagger each Div2 league start — offset well after Div1 to reduce load
  DIV2.forEach((d2, di) => {
    const delay = 120000 + (di * 20000);
    const to = setTimeout(() => scheduleLiveDiv2(d2.id), delay);
    matchIntervals[`d2init_${d2.id}`] = { to, iv: null };
  });
  // Refresh ticker + live view every second — STORED so it gets cleared on logout
  const liveIv = setInterval(() => {
    if (Object.keys(liveGames).length > 0 || tickerResults.length > 0) {
      renderTicker();
    }
    if (document.getElementById('pg-sports')?.classList.contains('on') && sportView === 'live') {
      renderSportBody();
    }
  }, 1000);
  matchIntervals['_live_refresh'] = { iv: liveIv, to: null };
}

// ================================================================
// ROSTER PERSISTENCE — survives page refresh
// ================================================================
const ROSTER_KEY = 'bb5_roster_';

function saveRoster(id, isDiv2) {
  if (isDiv2) {
    const d2 = DIV2.find(d => d.id === id);
    if (d2) localStorage.setItem(ROSTER_KEY + id, JSON.stringify({ teams: [...d2.teams], str: [...d2.str] }));
  } else {
    const lg = LEAGUES.find(l => l.id === id);
    if (lg) localStorage.setItem(ROSTER_KEY + id, JSON.stringify({ teams: [...lg.teams], str: [...lg.str] }));
  }
}

function loadRosters() {
  LEAGUES.forEach(lg => {
    const saved = JSON.parse(localStorage.getItem(ROSTER_KEY + lg.id) || 'null');
    if (saved && saved.teams.length === lg.teams.length) {
      saved.teams.forEach((t, i) => { lg.teams[i] = t; });
      saved.str.forEach((s, i) => { lg.str[i] = s; });
    }
  });
  DIV2.forEach(d2 => {
    const saved = JSON.parse(localStorage.getItem(ROSTER_KEY + d2.id) || 'null');
    if (saved && saved.teams.length === d2.teams.length) {
      saved.teams.forEach((t, i) => { d2.teams[i] = t; });
      saved.str.forEach((s, i) => { d2.str[i] = s; });
    }
  });
}
// Apply saved rosters immediately at startup
loadRosters();

// ── One-time cleanup of corrupted season data ──────────────────
// Runs once per device. Clears any seasons where teams played 39+ games.
(function cleanupCorruptedSeasons() {
  const cleanKey = 'bb5_cleaned_v2';
  if (localStorage.getItem(cleanKey)) return; // already ran
  let cleaned = 0;
  LEAGUES.forEach(lg => {
    const key = getSeasonKey(lg.id);
    const s = JSON.parse(localStorage.getItem(key) || 'null');
    if (!s) return;
    const maxP = Math.max(...(s.table || []).map(t => t.p || 0));
    if (maxP > 38) {
      // Clear this league's season — it will be rebuilt fresh on login
      localStorage.removeItem(key);
      cleaned++;
    }
  });
  DIV2.forEach(d2 => {
    const key = getDiv2Key(d2.id);
    const s = JSON.parse(localStorage.getItem(key) || 'null');
    if (!s) return;
    const maxP = Math.max(...(s.table || []).map(t => t.p || 0));
    if (maxP > 38) {
      localStorage.removeItem(key);
      cleaned++;
    }
  });
  localStorage.setItem(cleanKey, '1');
  if (cleaned > 0) console.log(`[BlakeBet] Cleaned ${cleaned} corrupted season(s)`);
})();

// ================================================================
// SEASON CHAMPION ANNOUNCEMENT
// ================================================================
function announceChampion(lg, champion, sNum, table) {
  // Save to winners history (used by UEFA page)
  const winners = JSON.parse(localStorage.getItem('bb5_season_winners') || '[]');
  winners.unshift({
    flag: lg.flag, league: lg.name, champion, season: sNum,
    ucl: table.slice(0, 4).map(t => t.t),
    uel: table.slice(4, 6).map(t => t.t),
    relegated: table.slice(-3).map(t => t.t),
    ts: Date.now()
  });
  if (winners.length > 40) winners.pop();
  localStorage.setItem('bb5_season_winners', JSON.stringify(winners));
  // Push gold announcement into ticker
  tickerResults.push({ isAnnounce: true, text: `🏆 ${lg.flag} ${lg.name} S${sNum} Champion: ${champion}!` });
  if (tickerResults.length > 80) tickerResults.shift();
  renderTicker();
  toast(`🏆 ${lg.flag} ${lg.name} Season ${sNum} — ${champion} are Champions!`, 'g');
}

// ================================================================
// UEFA CHAMPIONS LEAGUE & EUROPA LEAGUE SIMULATION
// Runs after 4+ leagues complete a season
// ================================================================
const UEFA_KEY = 'bb5_uefa';

function checkRunUEFA(sNum) {
  // Prevent running twice for same season
  const ranKey = `bb5_uefa_ran_${sNum}`;
  if (localStorage.getItem(ranKey)) return;
  // Count how many leagues have saved qualifiers for this season
  const winners = JSON.parse(localStorage.getItem('bb5_season_winners') || '[]');
  const thisSeasonEntries = winners.filter(w => w.season === sNum);
  if (thisSeasonEntries.length < 4) return; // need at least 4 leagues
  // Mark as ran before executing (prevents double-run)
  localStorage.setItem(ranKey, '1');
  // Slight delay so season reset toasts clear first
  setTimeout(() => runUEFA(sNum, thisSeasonEntries), 5000);
}

function simMatch(strA, strB) {
  // Poisson-based match simulation using team strengths
  const avgA = (strA / 100) * 2.1;
  const avgB = (strB / 100) * 1.7;
  return { h: poisson(avgA), a: poisson(avgB) };
}

function simTwoLegs(teamA, teamB) {
  // Home leg
  const leg1 = simMatch(teamA.str, teamB.str);
  // Away leg
  const leg2 = simMatch(teamB.str, teamA.str);
  const totalA = leg1.h + leg2.a;
  const totalB = leg1.a + leg2.h;
  if (totalA > totalB) return teamA;
  if (totalB > totalA) return teamB;
  // Penalties (coin flip weighted by strength)
  return Math.random() < (teamA.str / (teamA.str + teamB.str)) ? teamA : teamB;
}

function runKnockout(teams) {
  // Shuffle for draw
  const pool = [...teams].sort(() => Math.random() - 0.5);
  // Pad to power of 2
  while (pool.length < 2 || (pool.length & (pool.length - 1)) !== 0) {
    // Give bye to extra teams by duplicating weakest — they'll lose first round
    const weakest = pool.reduce((a, b) => a.str < b.str ? a : b);
    pool.push({ ...weakest, bye: true });
    if (pool.length > 64) break; // safety cap
  }
  let remaining = pool;
  const rounds = [];
  while (remaining.length > 1) {
    const nextRound = [];
    const roundResults = [];
    for (let i = 0; i < remaining.length; i += 2) {
      const a = remaining[i], b = remaining[i + 1];
      if (!b || b.bye) { nextRound.push(a); continue; }
      if (a.bye) { nextRound.push(b); continue; }
      const winner = simTwoLegs(a, b);
      nextRound.push(winner);
      roundResults.push({ a: a.name, b: b.name, winner: winner.name, aStr: a.str, bStr: b.str });
    }
    rounds.push(roundResults);
    remaining = nextRound;
  }
  return { winner: remaining[0] || null, rounds };
}

function runUEFA(sNum, entries) {
  // Build UCL and UEL team pools
  const uclTeams = [], uelTeams = [];
  entries.forEach(entry => {
    const lg = LEAGUES.find(l => l.name === entry.league);
    if (!lg) return;
    // UCL: top 4 qualifiers
    (entry.ucl || []).forEach((name, i) => {
      const idx = lg.teams.indexOf(name);
      const str = idx >= 0 ? (lg.str[idx] || 70) : 70;
      uclTeams.push({ name, str, flag: entry.flag, lg: entry.league });
    });
    // UEL: 5th and 6th
    (entry.uel || []).forEach((name, i) => {
      const idx = lg.teams.indexOf(name);
      const str = idx >= 0 ? (lg.str[idx] || 62) : 62;
      uelTeams.push({ name, str, flag: entry.flag, lg: entry.league });
    });
  });

  // Run tournaments
  const uclResult = uclTeams.length >= 4 ? runKnockout(uclTeams) : null;
  const uelResult = uelTeams.length >= 4 ? runKnockout(uelTeams) : null;

  const uclWinner = uclResult?.winner || null;
  const uelWinner = uelResult?.winner || null;

  // Save results
  const uefaResults = JSON.parse(localStorage.getItem(UEFA_KEY) || '[]');
  uefaResults.unshift({
    season: sNum,
    uclWinner,
    uelWinner,
    uclRounds: uclResult?.rounds || [],
    uelRounds: uelResult?.rounds || [],
    ts: Date.now()
  });
  if (uefaResults.length > 20) uefaResults.pop();
  localStorage.setItem(UEFA_KEY, JSON.stringify(uefaResults));

  // Announce winners in ticker and toast
  if (uclWinner) {
    tickerResults.push({ isAnnounce: true, text: `🏆 UCL S${sNum}: ${uclWinner.flag} ${uclWinner.name} are CHAMPIONS OF EUROPE!` });
    setTimeout(() => toast(`🏆 UCL Season ${sNum} Winner: ${uclWinner.flag} ${uclWinner.name}!`, 'g'), 500);
  }
  if (uelWinner) {
    tickerResults.push({ isAnnounce: true, text: `🥈 UEL S${sNum}: ${uelWinner.flag} ${uelWinner.name} win Europa League!` });
    setTimeout(() => toast(`🥈 UEL Season ${sNum} Winner: ${uelWinner.flag} ${uelWinner.name}!`, 'g'), 2000);
  }
  if (tickerResults.length > 80) tickerResults.splice(0, tickerResults.length - 80);
  renderTicker();
}

// ================================================================
// PROMOTION & RELEGATION — persisted via saveRoster
// ================================================================
function doPromotionRelegation(lgId) {
  const lg = LEAGUES.find(l => l.id === lgId);
  const d2 = DIV2.find(d => d.div1 === lgId);
  if (!d2) return;
  const s1 = season[lgId];
  const s2 = d2season[d2.id];
  if (!s1 || !s2) return;

  // Sort both tables
  const div1Sorted = [...s1.table].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  const div2Sorted = [...s2.table].sort((a, b) => b.pts - a.pts || b.gd - a.gd);

  // Bottom 3 Div1 go down, top 3 Div2 come up
  const relegated = div1Sorted.slice(-3).map(t => ({ name: t.t, str: Math.max(40, (lg.str[t.i] || 55) - 4) }));
  const promoted  = div2Sorted.slice(0, 3).map(t => ({ name: t.t, str: Math.min(82, (d2.str[t.i] || 55) + 4) }));

  // Validate — need exactly 3 pairs
  if (relegated.length < 3 || promoted.length < 3) return;

  // Swap in live arrays
  relegated.forEach((rel, idx) => {
    const prom = promoted[idx];
    const d1Idx = lg.teams.indexOf(rel.name);
    const d2Idx = d2.teams.indexOf(prom.name);
    if (d1Idx < 0 || d2Idx < 0) return;
    lg.teams[d1Idx] = prom.name;  lg.str[d1Idx] = prom.str;
    d2.teams[d2Idx] = rel.name;   d2.str[d2Idx] = rel.str;
  });

  // Persist to localStorage — survives refresh
  saveRoster(lgId, false);
  saveRoster(d2.id, true);

  // Announce
  const promNames = promoted.map(p => p.name).join(', ');
  const relNames  = relegated.map(r => r.name).join(', ');
  setTimeout(() => toast(`⬆️ ${lg.flag} Promoted to ${lg.name}: ${promNames}`, 'g'), 500);
  setTimeout(() => toast(`⬇️ ${lg.flag} To ${d2.name}: ${relNames}`, 'l'), 2000);

  // Save history
  const hist = JSON.parse(localStorage.getItem('bb5_prom_hist') || '[]');
  hist.unshift({ season: s1.seasonNum, league: lg.name, flag: lg.flag, promoted: promNames, relegated: relNames, ts: Date.now() });
  if (hist.length > 40) hist.pop();
  localStorage.setItem('bb5_prom_hist', JSON.stringify(hist));
}

function resetLeagueSeason(lgId) {
  const lg = LEAGUES.find(l => l.id === lgId);
  const old = season[lgId];
  const oldTable = [...(old?.table || [])].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  const sNum = old?.seasonNum || 1;

  // Step 3 — announce champion before resetting
  if (oldTable.length > 0) {
    announceChampion(lg, oldTable[0].t, sNum, oldTable);
    // Step 5 — check if enough leagues finished to run UCL/UEL
    checkRunUEFA(sNum);
  }

  // Step 4 — swap promoted/relegated teams before building new schedule
  doPromotionRelegation(lgId);

  // Now start new season with updated team roster
  season[lgId] = {
    mw: 0,
    weeks: buildSchedule(lg.teams.length),
    table: lg.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
    lastSimMW: -1,
    seasonNum: sNum + 1
  };
  Object.keys(oddsCache).forEach(k => { if (k.startsWith(lgId)) delete oddsCache[k]; });
  saveLeagueSeason(lgId);
  setTimeout(() => toast(`🏆 ${lg.flag} ${lg.name} Season ${sNum + 1} has started!`, 'g'), 3500);
}

// ── Division 2 season reset ──
function resetDiv2Season(d2Id) {
  const d2 = DIV2.find(d => d.id === d2Id);
  if (!d2) return;
  const old = d2season[d2Id];
  const oldSorted = [...(old?.table || [])].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  const champion = oldSorted[0]?.t || '—';
  const sNum = old?.seasonNum || 1;
  // Announce Div2 champion in ticker
  tickerResults.push({ isAnnounce: true, text: `🏅 ${d2.flag} ${d2.name} S${sNum} Champion: ${champion}!` });
  if (tickerResults.length > 80) tickerResults.shift();
  renderTicker();
  d2season[d2Id] = {
    mw: 0,
    weeks: buildSchedule(d2.teams.length),
    table: d2.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
    lastSimMW: -1,
    seasonNum: sNum + 1
  };
  localStorage.setItem(getDiv2Key(d2Id), JSON.stringify(d2season[d2Id]));
  toast(`🏅 ${d2.flag} ${d2.name} S${sNum + 1} started! Champion was: ${champion}`, 'g');
}

// ── Division 2 scheduler — same gate logic as Div1 ──
function scheduleLiveDiv2(d2Id) {
  const s = d2season[d2Id];
  if (!s) return;
  const mw = Math.min(s.mw, 37);
  const matches = s.weeks[mw] || [];
  // Use d2_ prefix on keys so they never collide with Div1 liveGames
  const idx = matches.findIndex((m, i) => !m.played && !liveGames[`d2_${d2Id}_${mw}_${i}`]);
  if (idx === -1) {
    // Check all fully played before advancing matchweek
    const allDone = matches.every(m => m.played);
    if (!allDone) {
      const to = setTimeout(() => scheduleLiveDiv2(d2Id), 3000);
      matchIntervals[`d2wait_${d2Id}`] = { to, iv: null };
      return;
    }
    // Check if whole season done
    if (s.weeks.every(week => week.every(m => m.played))) {
      setTimeout(() => { resetDiv2Season(d2Id); scheduleLiveDiv2(d2Id); }, 5000);
      return;
    }
    if (s.mw < 37) {
      s.mw++;
      localStorage.setItem(getDiv2Key(d2Id), JSON.stringify(s));
    }
    const to = setTimeout(() => scheduleLiveDiv2(d2Id), 3000);
    matchIntervals[`d2retry_${d2Id}`] = { to, iv: null };
    return;
  }
  kickoffLiveDiv2(d2Id, mw, idx);
}

function kickoffLiveDiv2(d2Id, mwIdx, mIdx) {
  const d2 = DIV2.find(d => d.id === d2Id);
  const s = d2season[d2Id];
  if (!d2 || !s) return;
  const m = s.weeks[mwIdx][mIdx];
  if (!m || m.played) { scheduleLiveDiv2(d2Id); return; }
  const sc = simDiv2Score(d2Id, m.home, m.away);
  const key = `d2_${d2Id}_${mwIdx}_${mIdx}`; // d2_ prefix — no Div1 collision
  const evts = buildEvents(sc.h, sc.a);
  liveGames[key] = {
    lgId: d2Id, mwIdx, mIdx, isDiv2: true,
    home: d2.teams[m.home], away: d2.teams[m.away],
    hs: 0, as: 0, min: 0, evts, fh: sc.h, fa: sc.a,
    flag: d2.flag, lgName: d2.name
  };
  const iv = setInterval(() => {
    const g = liveGames[key];
    if (!g) { clearInterval(iv); return; }
    g.min++;
    g.evts.forEach(e => { if (e.min === g.min) { e.side === 'h' ? g.hs++ : g.as++; } });
    if (g.min >= 90) {
      clearInterval(iv);
      delete liveGames[key];
      delete matchIntervals[key];
      applyDiv2Result(d2Id, mwIdx, mIdx, sc.h, sc.a);
      const to = setTimeout(() => scheduleLiveDiv2(d2Id), 3000);
      matchIntervals[`d2next_${d2Id}`] = { to, iv: null };
      if (sportView === 'div2') renderSportBody();
    }
  }, 1000);
  matchIntervals[key] = { iv, to: null };
}

function scheduleLiveMatch(lgId) {
  const s = season?.[lgId];
  if (!s) return; // season not loaded yet or user logged out
  const mw = Math.min(s.mw, 37);
  const matches = s.weeks[mw] || [];

  // Find first unplayed match that is also not currently live
  const idx = matches.findIndex((m, i) => !m.played && !liveGames[`${lgId}_${mw}_${i}`]);

  if (idx === -1) {
    // No more unplayed matches to kick off in this matchweek
    // BUT only advance if ALL matches in this week are fully played (not just live)
    const allPlayedOrLive = matches.every((m, i) => m.played || liveGames[`${lgId}_${mw}_${i}`]);
    const allFullyPlayed = matches.every(m => m.played);

    if (!allFullyPlayed) {
      // Some matches still live — wait for them to finish before advancing
      const to = setTimeout(() => scheduleLiveMatch(lgId), 3000);
      matchIntervals[`wait_${lgId}`] = { to, iv: null };
      return;
    }

    // All matches in this matchweek are done
    // Check if whole season is done
    const allDone = s.weeks.every(week => week.every(m => m.played));
    if (allDone) {
      setTimeout(() => {
        resetLeagueSeason(lgId);
        scheduleLiveMatch(lgId);
      }, 5000);
      return;
    }

    // Safe to advance matchweek
    if (s.mw < 37) {
      s.mw++;
      saveLeagueSeason(lgId);
    }
    const to = setTimeout(() => scheduleLiveMatch(lgId), 3000);
    matchIntervals[`retry_${lgId}`] = { to, iv: null };
    return;
  }
  kickoffLive(lgId, mw, idx);
}

function kickoffLive(lgId, mwIdx, mIdx) {
  const lg = LEAGUES.find(l => l.id === lgId);
  const s = season?.[lgId];
  if (!lg || !s) return;
  const m = s.weeks[mwIdx]?.[mIdx];
  if (!m || m.played) { scheduleLiveMatch(lgId); return; }

  const sc = simScore(lgId, m.home, m.away);
  const key = `${lgId}_${mwIdx}_${mIdx}`;
  const evts = buildEvents(sc.h, sc.a);
  liveGames[key] = { lgId, mwIdx, mIdx, home: lg.teams[m.home], away: lg.teams[m.away], hs: 0, as: 0, min: 0, evts, fh: sc.h, fa: sc.a };

  const iv = setInterval(() => {
    const g = liveGames[key];
    if (!g) { clearInterval(iv); return; }
    g.min++;
    g.evts.forEach(e => { if (e.min === g.min) { e.side === 'h' ? g.hs++ : g.as++; } });
    if (document.getElementById('pg-sports')?.classList.contains('on') && sportView === 'live') renderSportBody();
    if (g.min >= 90) {
      clearInterval(iv);
      delete liveGames[key];
      delete matchIntervals[key];
      applyResult(lgId, mwIdx, mIdx, sc.h, sc.a, true);
      saveLeagueSeason(lgId);
      const to = setTimeout(() => scheduleLiveMatch(lgId), 3000);
      matchIntervals[`next_${lgId}`] = { to, iv: null };
      // Only re-render if user is on live tab — don't overwrite other tabs
      if (document.getElementById('pg-sports')?.classList.contains('on') && sportView === 'live') {
        renderSportBody();
      }
    }
  }, 1000);
  matchIntervals[key] = { iv, to: null };
  if (sportView === 'live') renderSportBody();
}

function buildEvents(hg, ag) {
  const mins = [...Array(90)].map((_, i) => i + 1).sort(() => Math.random() - .5);
  const evts = [];
  for (let i = 0; i < hg; i++) evts.push({ min: mins[i], side: 'h' });
  for (let i = 0; i < ag; i++) evts.push({ min: mins[hg + i], side: 'a' });
  return evts;
}

// ================================================================
// SIMULATION
// ================================================================
function poisson(l) { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }

function simScore(lgId, hi, ai) {
  const lg = LEAGUES.find(l => l.id === lgId);
  const hs = lg.str[hi] + 7 + Math.random() * 6, as = lg.str[ai] + Math.random() * 5;
  const hb = Math.random() < .15 ? 1.5 : 1, ab = Math.random() < .15 ? 1.5 : 1;
  return { h: poisson(hs / 100 * 2.2 * hb), a: poisson(as / 100 * 1.8 * ab) };
}

function applyResult(lgId, mwIdx, mIdx, hg, ag, settle) {
  const s = season?.[lgId];
  if (!s) return;
  const m = s.weeks[mwIdx]?.[mIdx];
  if (!m || m.played) return;
  m.hs = hg; m.as = ag; m.played = true;
  // CRITICAL: always find by team index .i, NOT by array position
  const ht = s.table.find(t => t.i === m.home);
  const at = s.table.find(t => t.i === m.away);
  if (!ht || !at) return;
  // Safety cap — no team should ever exceed 38 games in a 38-matchweek season
  if (ht.p >= 38 || at.p >= 38) return;
  ht.p++; at.p++; ht.gf += hg; ht.ga += ag; ht.gd += hg - ag; at.gf += ag; at.ga += hg; at.gd += ag - hg;
  if (hg > ag) { ht.w++; ht.pts += 3; ht.form.push('W'); at.l++; at.form.push('L'); }
  else if (hg === ag) { ht.d++; ht.pts++; at.d++; at.pts++; ht.form.push('D'); at.form.push('D'); }
  else { at.w++; at.pts += 3; at.form.push('W'); ht.l++; ht.form.push('L'); }
  if (ht.form.length > 5) ht.form = ht.form.slice(-5);
  if (at.form.length > 5) at.form = at.form.slice(-5);
  s.table.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  // Add to ticker
  const lg = LEAGUES.find(l => l.id === lgId);
  tickerResults.push({ home: lg.teams[m.home], away: lg.teams[m.away], hs: hg, as: ag, lg: lg.name, flag: lg.flag });
  if (tickerResults.length > 40) tickerResults.shift();
  renderTicker();
  if (settle) settleBets(lgId, mwIdx, mIdx, hg, ag);
}

// ================================================================
// TICKER
// ================================================================
function renderTicker() {
  const el = document.getElementById('ticker-inner');
  if (!el) return;
  const liveItems = Object.values(liveGames).map(g =>
    `<div class="t-item"><span class="t-live">LIVE</span><span style="color:var(--text)">${g.home}</span><span class="ts">${g.hs}–${g.as}</span><span style="color:var(--text)">${g.away}</span><span style="color:var(--t3);font-family:var(--mono);font-size:.62rem">${g.min}'</span></div>`
  );
  const ftItems = tickerResults.slice(-20).map(r => {
    if (r.isAnnounce) return `<div class="t-item" style="background:rgba(240,180,41,.1);"><span style="color:var(--gold);font-weight:700;font-family:var(--fc);letter-spacing:.3px;">${r.text}</span></div>`;
    const res = r.hs > r.as ? 'tw' : r.as > r.hs ? 'tl' : 'td';
    return `<div class="t-item"><span style="color:var(--t3)">${r.flag} FT</span><span style="color:var(--text)">${r.home}</span><span class="${res}">${r.hs}–${r.as}</span><span style="color:var(--text)">${r.away}</span></div>`;
  });
  const all = [...liveItems, ...ftItems];
  if (!all.length) {
    el.innerHTML = '<div class="t-item"><span style="color:var(--t3)">🔄 Matches loading...</span></div>'.repeat(4);
  } else {
    const html = all.join('');
    el.innerHTML = html + html;
  }
}

// ================================================================
// WINNERS FEED — shared across all users via localStorage
// ================================================================
function loadWinFeed() {
  try { winFeed = JSON.parse(localStorage.getItem(WIN_FEED_KEY) || '[]'); } catch(e) { winFeed = []; }
}

function pushWin(name, amount, source) {
  const firstName = (name || 'Someone').split(' ')[0];
  const entry = { n: firstName, a: amount, s: source, t: Date.now() };
  loadWinFeed();
  winFeed.push(entry);
  if (winFeed.length > WIN_FEED_MAX) winFeed = winFeed.slice(-WIN_FEED_MAX);
  localStorage.setItem(WIN_FEED_KEY, JSON.stringify(winFeed));
  if (window.FB?.ready()) window.FB?.pushWinEntry?.(entry).catch(()=>{});
  renderWinners();
}

function loadWinFeedFromFirebase() {
  if (!window.FB?.ready()) { loadWinFeed(); renderWinners(); return; }
  window.FB?.listenWinFeed?.((entries) => {
    if (entries && entries.length) {
      winFeed = entries;
      localStorage.setItem(WIN_FEED_KEY, JSON.stringify(winFeed));
    } else { loadWinFeed(); }
    renderWinners();
  });
}

function renderWinners() {
  const el = document.getElementById('winners-inner');
  if (!el) return;
  loadWinFeed();
  if (!winFeed.length) {
    el.innerHTML = '<div class="w-item"><span class="w-trophy">🏆</span><span class="w-src">Be the first to win big on BlakeBet!</span></div>'.repeat(3);
    return;
  }
  const items = winFeed.slice(-20).reverse().map(w =>
    `<div class="w-item"><span class="w-trophy">🏆</span><span class="w-name">${w.n}</span><span class="w-src"> won </span><span class="w-amt">🪙${Math.floor(w.a).toLocaleString()}</span><span class="w-src"> · ${w.s}</span></div>`
  ).join('');
  el.innerHTML = items + items; // duplicate for infinite scroll
}

// ================================================================
// ODDS
// ================================================================
function calcOdds(lgId, hi, ai) {
  const lg = LEAGUES.find(l => l.id === lgId);
  const hs = lg.str[hi] + 8, as = lg.str[ai], tot = hs + as + 28;
  const hp = hs / tot, dp = 28 / tot, ap = as / tot, mg = .065;
  const r = v => Math.round(Math.max(1.05, v) * 100) / 100;
  const j = () => .97 + Math.random() * .06;
  return {
    home: r((1 - mg) / hp * j()), draw: r((1 - mg) / dp * j()), away: r((1 - mg) / ap * j()),
    o25: r((1.62 + Math.random() * .3) * j()), u25: r((2.28 - Math.random() * .28) * j()),
    o15: r((1.26 + Math.random() * .14) * j()), u15: r((3.1 - Math.random() * .4) * j()),
    o35: r((2.45 + Math.random() * .4) * j()), u35: r((1.44 - Math.random() * .1) * j()),
    btty: r((1.70 + Math.random() * .22) * j()), bttn: r((2.00 - Math.random() * .18) * j()),
    dc1x: r((1 - mg) / (hp + dp) * j()), dc12: r((1 - mg) / (hp + ap) * j()), dcx2: r((1 - mg) / (dp + ap) * j()),
    hht: r((1 - mg) / hp * 1.35 * j()), dht: r((1 - mg) / dp * .88 * j()), aht: r((1 - mg) / ap * 1.35 * j())
  };
}
// Dynamic live odds — probability-based, score + time aware
// Correct formula: leading 3-0 = winner ~1.03, loser ~50+
function getLiveOdds(baseOdds, hScore, aScore, minute) {
  const scoreDiff = hScore - aScore;
  const timeLeft = Math.max(1, 90 - minute);
  const timeWeight = 1 - (timeLeft / 90); // 0 at kickoff, 1 at 90min
  const totalGoals = hScore + aScore;
  const margin = 0.065;
  const r = v => Math.round(Math.min(150, Math.max(1.02, v)) * 100) / 100;

  // Extract base probabilities
  const pHome0 = (1 - margin) / baseOdds.home;
  const pDraw0 = (1 - margin) / baseOdds.draw;
  const pAway0 = (1 - margin) / baseOdds.away;

  // Score+time impact
  const impact = scoreDiff * (0.4 + timeWeight * 1.2);
  const rawHome = pHome0 * Math.exp(impact);
  const rawDraw = pDraw0 * Math.exp(-Math.abs(scoreDiff) * (0.3 + timeWeight * 0.8));
  const rawAway = pAway0 * Math.exp(-impact);
  const tot = rawHome + rawDraw + rawAway;

  const homeWin = r(1 / (rawHome / tot));
  const drawOdds = r(1 / (rawDraw / tot));
  const awayWin = r(1 / (rawAway / tot));

  // ── GOALS & BTTS: use Poisson probability based on time remaining + goals needed ──
  // Average game has ~2.6 goals total. Rate = 2.6/90 goals per minute combined
  const GOAL_RATE = 2.6 / 90;
  const TEAM_RATE = 1.3 / 90; // per team per minute
  const r2 = v => Math.round(Math.min(99, Math.max(1.02, v)) * 100) / 100;

  // Poisson: P(X >= k goals in timeLeft minutes)
  function pAtLeast(k, lam) {
    if (lam <= 0) return 0;
    let pLess = 0;
    for (let i = 0; i < k; i++) {
      let term = Math.exp(-lam);
      for (let j = 0; j < i; j++) term *= lam / (j + 1);
      pLess += term;
    }
    return Math.max(0, Math.min(1, 1 - pLess));
  }

  // Over 2.5 — need (3 - totalGoals) more goals in timeLeft minutes
  let o25 = null, u25 = null;
  if (totalGoals < 3) {
    const needed = 3 - totalGoals;
    const expGoals = GOAL_RATE * timeLeft;
    const prob = pAtLeast(needed, expGoals);
    o25 = prob < 0.005 ? 99 : r2((1 / prob) * 1.065);
    u25 = r2((1 / Math.max(0.01, 1 - prob)) * 1.065);
  }

  // Over 3.5 — need (4 - totalGoals) more goals
  let o35 = null;
  if (totalGoals < 4) {
    if (totalGoals === 3) {
      // 3 goals already in — only need 1 more, fairly likely early but slim late
      const prob = pAtLeast(1, GOAL_RATE * timeLeft);
      o35 = prob < 0.005 ? 99 : r2((1 / prob) * 1.065);
    } else {
      const needed = 4 - totalGoals;
      const prob = pAtLeast(needed, GOAL_RATE * timeLeft);
      o35 = prob < 0.005 ? 99 : r2((1 / prob) * 1.065);
    }
  }

  // BTTS — probability both teams score at least once in remaining time
  const bttsDone = hScore > 0 && aScore > 0;
  let btty = null, bttn = null;
  if (!bttsDone) {
    let prob;
    if (hScore === 0 && aScore === 0) {
      // Both teams need to score
      const pH = 1 - Math.exp(-TEAM_RATE * timeLeft);
      const pA = 1 - Math.exp(-TEAM_RATE * timeLeft);
      prob = pH * pA;
    } else {
      // One team already scored, other needs to score
      prob = 1 - Math.exp(-TEAM_RATE * timeLeft);
    }
    btty = prob < 0.005 ? 99 : r2((1 / prob) * 1.065);
    // BTTS No — probability at least one team doesn't score
    bttn = r2((1 / Math.max(0.01, 1 - prob)) * 1.065);
  }

  return {
    home: homeWin, draw: drawOdds, away: awayWin,
    o25, u25, o35, btty, bttn,
    totalGoals, bttsDone
  };
}

function getOdds(lgId, hi, ai) {
  const k = `${lgId}_${hi}_${ai}`;
  if (!oddsCache[k]) oddsCache[k] = calcOdds(lgId, hi, ai);
  return oddsCache[k];
}

// ================================================================
// SPORT PAGE
// ================================================================
function setView(view, el) {
  sportView = view;
  document.querySelectorAll('.vtab').forEach(t => t.classList.remove('on'));
  if (el) el.classList.add('on');
  const body = document.getElementById('sport-body');
  if (!body || !season) return;
  if (sportView === 'live') body.innerHTML = buildLiveView();
  else if (sportView === 'next') body.innerHTML = buildUpcomingView(false);
  else if (sportView === 'table') body.innerHTML = buildTableView();
  else if (sportView === 'div2') body.innerHTML = buildDiv2View();
  else if (sportView === 'results') body.innerHTML = buildResultsView();
  else if (sportView === 'uefa') body.innerHTML = buildUEFAView();
  else if (sportView === 'predict') { renderPredictions(); }
  else if (sportView === 'mc') { renderMatchCentre(); }
}

let _rtm = null;
function renderSportBody() {
  const body = document.getElementById('sport-body');
  if (!body || !season) return;
  if (sportView === 'live') body.innerHTML = buildLiveView();
  else if (sportView === 'next') body.innerHTML = buildUpcomingView(false);
  else if (sportView === 'table') body.innerHTML = buildTableView();
  else if (sportView === 'div2') body.innerHTML = buildDiv2View();
  else if (sportView === 'results') body.innerHTML = buildResultsView();
  else if (sportView === 'uefa') body.innerHTML = buildUEFAView();
  else if (sportView === 'predict') { renderPredictions(); }
  else if (sportView === 'mc') { renderMatchCentre(); }
}

// Helper: builds live goals + btts odds buttons cleanly (avoids nested template literal issues)
function buildLiveOddsBtn(mid, g, od) {
  let html = '';
  const lgId = g.lgId, mwIdx = g.mwIdx, mIdx = g.mIdx;
  const match = g.home + ' v ' + g.away;

  // Over 2.5 — show settled if expired
  if (od.o25 !== null) {
    html += '<div class="ob ' + (isSel(mid,'o25')?'sel':'') + '" onclick="addSel(\'' + mid + '\',\'' + lgId + '\',' + mwIdx + ',' + mIdx + ',\'o25\',\'O2.5\',' + od.o25 + ',\'' + match + '\',\'Goals Live\')"><div class="ob-l">O2.5</div><div class="ob-o">' + od.o25 + '</div></div>';
  } else {
    html += '<div class="ob" style="opacity:.4;cursor:default;"><div class="ob-l">O2.5</div><div class="ob-o" style="color:var(--green);font-size:.58rem">✅ Won</div></div>';
  }

  // Over 3.5 — show only when available
  if (od.o35 !== null) {
    html += '<div class="ob ' + (isSel(mid,'o35')?'sel':'') + '" onclick="addSel(\'' + mid + '\',\'' + lgId + '\',' + mwIdx + ',' + mIdx + ',\'o35\',\'O3.5\',' + od.o35 + ',\'' + match + '\',\'Goals Live\')"><div class="ob-l">O3.5</div><div class="ob-o">' + od.o35 + '</div></div>';
  }

  // BTTS — show settled if expired
  if (od.btty !== null) {
    html += '<div class="ob ' + (isSel(mid,'btty')?'sel':'') + '" onclick="addSel(\'' + mid + '\',\'' + lgId + '\',' + mwIdx + ',' + mIdx + ',\'btty\',\'GG Yes\',' + od.btty + ',\'' + match + '\',\'BTTS Live\')"><div class="ob-l">GG</div><div class="ob-o">' + od.btty + '</div></div>';
  } else {
    html += '<div class="ob" style="opacity:.4;cursor:default;"><div class="ob-l">GG</div><div class="ob-o" style="color:var(--green);font-size:.58rem">✅ Done</div></div>';
  }

  return html;
}

function buildLiveView() {
  const lk = Object.keys(liveGames);
  // Only show Div1 games in live view — Div2 games have no betting odds
  const div1Keys = lk.filter(k => !k.startsWith('d2_'));
  let html = `<div class="live-section-hdr"><span class="ldot"></span>LIVE NOW (${div1Keys.length})</div>`;
  if (!div1Keys.length) html += '<div class="empty-st"><div class="empty-ico">⚽</div><div>Matches are loading...<br>Check ⏰ Upcoming for next fixtures</div></div>';
  else {
    html += '<div class="live-grid">';
    div1Keys.forEach(k => {
      const g = liveGames[k];
      const s = season?.[g.lgId];
      if (!s) return; // safety guard
      const m = s.weeks[g.mwIdx]?.[g.mIdx];
      if (!m) return; // safety guard
      const pct = Math.round((g.min / 90) * 100);
      const baseOd = getOdds(g.lgId, m.home, m.away);
      const od = getLiveOdds(baseOd, g.hs, g.as, g.min);
      const mid = `${g.lgId}__${g.mwIdx}__${g.mIdx}`;
      const lg = LEAGUES.find(l => l.id === g.lgId);
      if (!lg) return; // safety guard
      html += `<div class="lcard">
        <div class="lc-lg">${lg.flag} ${lg.name}</div>
        <div class="lc-t">${g.home}<br><span style="color:var(--t3);font-size:.72rem">vs</span><br>${g.away}</div>
        <div class="lc-s"><span class="lc-score">${g.hs}–${g.as}</span><span class="lc-min">${g.min}'</span></div>
        <div class="lc-prog"><div class="lc-bar" style="width:${pct}%"></div></div>
        <div style="font-size:.56rem;color:var(--red);font-family:var(--fc);letter-spacing:.5px;text-transform:uppercase;margin-top:4px;">🔴 Live — odds update every second</div>
        <div class="lc-odds">
          <div class="ob ${isSel(mid,'home')?'sel':''}" onclick="addSel('${mid}','${g.lgId}',${g.mwIdx},${g.mIdx},'home','1 (${g.home})',${od.home},'${g.home} v ${g.away}','1X2 Live')"><div class="ob-l">1</div><div class="ob-o">${od.home}</div></div>
          <div class="ob ${isSel(mid,'draw')?'sel':''}" onclick="addSel('${mid}','${g.lgId}',${g.mwIdx},${g.mIdx},'draw','X Draw',${od.draw},'${g.home} v ${g.away}','1X2 Live')"><div class="ob-l">X</div><div class="ob-o">${od.draw}</div></div>
          <div class="ob ${isSel(mid,'away')?'sel':''}" onclick="addSel('${mid}','${g.lgId}',${g.mwIdx},${g.mIdx},'away','2 (${g.away})',${od.away},'${g.home} v ${g.away}','1X2 Live')"><div class="ob-l">2</div><div class="ob-o">${od.away}</div></div>
          ${buildLiveOddsBtn(mid,g,od)}
        </div>
      </div>`;
    });
    html += '</div>';
  }
  html += `<div class="upcoming-hdr" style="margin-top:12px;">⏰ UPCOMING THIS MATCHWEEK</div>`;
  html += buildUpcomingView(true);
  return html;
}

function buildUpcomingView(inline) {
  let html = inline ? `<div class="upcoming-hdr">⏰ UPCOMING FIXTURES</div>` : '';
  let matchCount = 0;
  LEAGUES.forEach(lg => {
    const s = season[lg.id];
    const mw = Math.min(s.mw, 37);
    const allMatches = s.weeks[mw] || [];
    const unplayed = allMatches.map((m, i) => ({ m, i })).filter(({ m }) => !m.played);
    if (!unplayed.length) return;
    html += `<div class="league-block"><div class="lgh"><span class="lgh-f">${lg.flag}</span><span class="lgh-n">${lg.country} — ${lg.name}</span><span class="lgh-mw">MW${mw + 1}</span></div><div class="match-list">`;
    unplayed.forEach(({ m, i }) => {
      const od = getOdds(lg.id, m.home, m.away);
      const mid = `${lg.id}__${mw}__${i}`;
      const lm = liveGames[`${lg.id}_${mw}_${i}`];
      const cdLabel = lm ? `<span class="mr-cd hot">🔴 LIVE ${lm.min}'</span>` : `<span class="mr-cd blue">⏰ Soon</span>`;
      matchCount++;
      html += `<div class="mrow">
        <div class="mr-top" onclick="togExp('${mid}')">
          <div class="mr-teams">${lg.teams[m.home]} vs ${lg.teams[m.away]}</div>
          ${cdLabel}
        </div>
        <div class="mr-odds-row">
          <div class="ob ${isSel(mid,'home')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'home','1 (${lg.teams[m.home]})',${od.home},'${lg.teams[m.home]} v ${lg.teams[m.away]}','1X2')"><div class="ob-l">1</div><div class="ob-o">${od.home}</div></div>
          <div class="ob ${isSel(mid,'draw')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'draw','X Draw',${od.draw},'${lg.teams[m.home]} v ${lg.teams[m.away]}','1X2')"><div class="ob-l">X</div><div class="ob-o">${od.draw}</div></div>
          <div class="ob ${isSel(mid,'away')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'away','2 (${lg.teams[m.away]})',${od.away},'${lg.teams[m.home]} v ${lg.teams[m.away]}','1X2')"><div class="ob-l">2</div><div class="ob-o">${od.away}</div></div>
          <div class="ob ${isSel(mid,'o25')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'o25','O2.5',${od.o25},'${lg.teams[m.home]} v ${lg.teams[m.away]}','Goals')"><div class="ob-l">O2.5</div><div class="ob-o">${od.o25}</div></div>
          <div class="ob ${isSel(mid,'u25')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'u25','U2.5',${od.u25},'${lg.teams[m.home]} v ${lg.teams[m.away]}','Goals')"><div class="ob-l">U2.5</div><div class="ob-o">${od.u25}</div></div>
          <div class="ob ${isSel(mid,'btty')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'btty','GG',${od.btty},'${lg.teams[m.home]} v ${lg.teams[m.away]}','BTTS')"><div class="ob-l">GG</div><div class="ob-o">${od.btty}</div></div>
          <span class="more-btn" onclick="togExp('${mid}')">+More</span>
        </div>
        <div class="mr-mkts ${expandedMatch===mid?'open':''}" id="mkts_${mid}">
          <div class="mkt-sec"><div class="mkt-ttl">Double Chance</div><div class="mkt-grid">
            <div class="ob ${isSel(mid,'dc1x')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'dc1x','1X',${od.dc1x},'${lg.teams[m.home]} v ${lg.teams[m.away]}','DC')"><div class="ob-l">1X</div><div class="ob-o">${od.dc1x}</div></div>
            <div class="ob ${isSel(mid,'dc12')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'dc12','12',${od.dc12},'${lg.teams[m.home]} v ${lg.teams[m.away]}','DC')"><div class="ob-l">12</div><div class="ob-o">${od.dc12}</div></div>
            <div class="ob ${isSel(mid,'dcx2')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'dcx2','X2',${od.dcx2},'${lg.teams[m.home]} v ${lg.teams[m.away]}','DC')"><div class="ob-l">X2</div><div class="ob-o">${od.dcx2}</div></div>
          </div></div>
          <div class="mkt-sec"><div class="mkt-ttl">Total Goals</div><div class="mkt-grid">
            <div class="ob ${isSel(mid,'o15')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'o15','O1.5',${od.o15},'${lg.teams[m.home]} v ${lg.teams[m.away]}','Goals')"><div class="ob-l">O1.5</div><div class="ob-o">${od.o15}</div></div>
            <div class="ob ${isSel(mid,'u15')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'u15','U1.5',${od.u15},'${lg.teams[m.home]} v ${lg.teams[m.away]}','Goals')"><div class="ob-l">U1.5</div><div class="ob-o">${od.u15}</div></div>
            <div class="ob ${isSel(mid,'o25')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'o25','O2.5',${od.o25},'${lg.teams[m.home]} v ${lg.teams[m.away]}','Goals')"><div class="ob-l">O2.5</div><div class="ob-o">${od.o25}</div></div>
            <div class="ob ${isSel(mid,'u25')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'u25','U2.5',${od.u25},'${lg.teams[m.home]} v ${lg.teams[m.away]}','Goals')"><div class="ob-l">U2.5</div><div class="ob-o">${od.u25}</div></div>
            <div class="ob ${isSel(mid,'o35')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'o35','O3.5',${od.o35},'${lg.teams[m.home]} v ${lg.teams[m.away]}','Goals')"><div class="ob-l">O3.5</div><div class="ob-o">${od.o35}</div></div>
            <div class="ob ${isSel(mid,'u35')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'u35','U3.5',${od.u35},'${lg.teams[m.home]} v ${lg.teams[m.away]}','Goals')"><div class="ob-l">U3.5</div><div class="ob-o">${od.u35}</div></div>
          </div></div>
          <div class="mkt-sec"><div class="mkt-ttl">Both Teams to Score</div><div class="mkt-grid">
            <div class="ob ${isSel(mid,'btty')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'btty','GG Yes',${od.btty},'${lg.teams[m.home]} v ${lg.teams[m.away]}','BTTS')"><div class="ob-l">Yes</div><div class="ob-o">${od.btty}</div></div>
            <div class="ob ${isSel(mid,'bttn')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'bttn','GG No',${od.bttn},'${lg.teams[m.home]} v ${lg.teams[m.away]}','BTTS')"><div class="ob-l">No</div><div class="ob-o">${od.bttn}</div></div>
          </div></div>
          <div class="mkt-sec"><div class="mkt-ttl">Half-Time Result</div><div class="mkt-grid">
            <div class="ob ${isSel(mid,'hht')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'hht','HT 1',${od.hht},'${lg.teams[m.home]} v ${lg.teams[m.away]}','HT')"><div class="ob-l">HT1</div><div class="ob-o">${od.hht}</div></div>
            <div class="ob ${isSel(mid,'dht')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'dht','HT X',${od.dht},'${lg.teams[m.home]} v ${lg.teams[m.away]}','HT')"><div class="ob-l">HTX</div><div class="ob-o">${od.dht}</div></div>
            <div class="ob ${isSel(mid,'aht')?'sel':''}" onclick="addSel('${mid}','${lg.id}',${mw},${i},'aht','HT 2',${od.aht},'${lg.teams[m.home]} v ${lg.teams[m.away]}','HT')"><div class="ob-l">HT2</div><div class="ob-o">${od.aht}</div></div>
          </div></div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  });
  if (matchCount === 0) {
    html += `<div class="empty-st"><div class="empty-ico">⏰</div><div>All matches in progress or completed.<br>Check 🔴 Live for ongoing games.</div></div>`;
  }
  return html;
}

function buildTableView() {
  let tabs = `<div class="lg-tabs" id="d1-tabs-row">` + LEAGUES.map(lg => `<div class="ltab ${stTab===lg.id?'on':''}" onclick="stTab='${lg.id}';renderSportBody();setTimeout(()=>{const el=document.querySelector('#d1-tabs-row .ltab.on');if(el)el.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});},50)">${lg.flag} ${lg.country}</div>`).join('') + `</div>`;
  const lg = LEAGUES.find(l => l.id === stTab);
  const s = season[lg.id];
  const n = lg.teams.length;
  return tabs + `<div class="tbl-wrap"><div class="tbl-hdr">${lg.flag} ${lg.name} — MW ${s.mw + 1}/38</div>
    <div style="overflow-x:auto;"><table>
      <tr><th>#</th><th>Club</th><th class="c">P</th><th class="c">W</th><th class="c">D</th><th class="c">L</th><th class="c">GD</th><th class="c">Pts</th><th>Form</th></tr>
      ${s.table.map((t, i) => {
        const z = i<4?'z-ucl':i<6?'z-uel':i>=n-3?'z-rel':'z-mid';
        const b = t.t.split(' ').map(w => w[0]).join('').substring(0, 2);
        const c = TC[t.i % TC.length];
        const fm = t.form.slice(-5).map(f => `<div class="fd ${f==='W'?'fw':f==='D'?'fdraw':'fl'}">${f}</div>`).join('');
        return `<tr class="${z}"><td class="pos">${i+1}</td>
          <td><span class="tbadge" style="background:${c};color:#fff">${b}</span>${t.t}</td>
          <td class="c">${t.p}</td><td class="c">${t.w}</td><td class="c">${t.d}</td><td class="c">${t.l}</td>
          <td class="c" style="color:${t.gd>0?'var(--green)':t.gd<0?'var(--red)':'var(--t2)'}">${t.gd>0?'+':''}${t.gd}</td>
          <td class="c pts">${t.pts}</td>
          <td><div class="form-dots">${fm}</div></td>
        </tr>`;
      }).join('')}
    </table></div>
    <div style="display:flex;gap:10px;padding:6px 10px;font-size:.64rem;color:var(--t2);border-top:1px solid var(--border);flex-wrap:wrap;">
      <span><span style="color:var(--blue)">■</span> UCL</span><span><span style="color:var(--purple)">■</span> UEL</span><span><span style="color:var(--red)">■</span> To Div 2</span>
    </div>
  </div>`;
}

function buildDiv2View() {
  const tabsHtml = DIV2.map(d => `<div class="ltab ${d2Tab===d.id?'on':''}" onclick="switchD2Tab('${d.id}')">${d.flag} ${d.country}</div>`).join('');
  return `<div class="lg-tabs" id="d2-tabs-row">${tabsHtml}</div><div id="d2-table-body">${buildD2Table()}</div>`;
}

function buildD2Table() {
  const d2 = DIV2.find(d => d.id === d2Tab);
  if (!d2) return '<div class="empty-st"><div class="empty-ico">📊</div><div>No data</div></div>';
  const s = getOrCreateDiv2Season(d2.id);
  const sorted = [...s.table].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  return `<div class="tbl-wrap">
    <div class="tbl-hdr">${d2.flag} ${d2.name} — Division 2 — MW ${s.mw + 1}/38</div>
    <div style="overflow-x:auto;"><table>
      <tr><th>#</th><th>Club</th><th class="c">P</th><th class="c">W</th><th class="c">D</th><th class="c">L</th><th class="c">GD</th><th class="c">Pts</th><th>Form</th></tr>
      ${sorted.map((t, i) => {
        const promo = i < 3 ? 'z-ucl' : 'z-mid';
        const b = t.t.split(' ').map(w => w[0]).join('').substring(0, 2);
        const c = TC[t.i % TC.length];
        const fm = t.form.slice(-5).map(f => `<div class="fd ${f==='W'?'fw':f==='D'?'fdraw':'fl'}">${f}</div>`).join('');
        return `<tr class="${promo}"><td class="pos">${i+1}</td>
          <td><span class="tbadge" style="background:${c};color:#fff">${b}</span>${t.t}</td>
          <td class="c">${t.p}</td><td class="c">${t.w}</td><td class="c">${t.d}</td><td class="c">${t.l}</td>
          <td class="c" style="color:${t.gd>0?'var(--green)':t.gd<0?'var(--red)':'var(--t2)'}">${t.gd>0?'+':''}${t.gd}</td>
          <td class="c pts">${t.pts}</td>
          <td><div class="form-dots">${fm}</div></td>
        </tr>`;
      }).join('')}
    </table></div>
    <div style="display:flex;gap:10px;padding:6px 10px;font-size:.64rem;color:var(--t2);border-top:1px solid var(--border);flex-wrap:wrap;">
      <span><span style="color:var(--blue)">■</span> Promotion spots (Top 3)</span>
      <span style="color:var(--t3)">No relegation in Division 2</span>
    </div>
  </div>`;
}

function switchD2Tab(id) {
  d2Tab = id;
  // Update active class on tabs without rebuilding the strip
  document.querySelectorAll('#d2-tabs-row .ltab').forEach((el, i) => {
    el.classList.toggle('on', DIV2[i].id === id);
  });
  // Scroll selected tab into view
  const active = document.querySelector('#d2-tabs-row .ltab.on');
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  // Only replace table content — tab strip stays intact
  const tableBody = document.getElementById('d2-table-body');
  if (tableBody) tableBody.innerHTML = buildD2Table();
}

function buildUEFAView() {
  const uefaResults = JSON.parse(localStorage.getItem('bb5_uefa') || '[]');
  const seasonWinners = JSON.parse(localStorage.getItem('bb5_season_winners') || '[]');
  const promHist = JSON.parse(localStorage.getItem('bb5_prom_hist') || '[]');
  const roundNames = ['Round of 16', 'Quarter Finals', 'Semi Finals', 'Final'];

  function buildCompSection(ico, title, wins, roundsKey) {
    let h = `<div class="tbl-wrap" style="margin-bottom:10px;"><div class="tbl-hdr">${ico} ${title}</div>`;
    if (!wins.length) {
      h += `<div style="padding:16px;text-align:center;font-size:.76rem;color:var(--t3);">Simulation unlocks after 4+ leagues complete a season. Keep playing!</div>`;
    } else {
      // Most recent winner
      const latest = wins[0];
      const w = latest[roundsKey === 'uclRounds' ? 'uclWinner' : 'uelWinner'];
      if (w) {
        h += `<div style="padding:10px 12px;background:rgba(240,180,41,.08);border-bottom:1px solid var(--border);">
          <div style="font-size:.64rem;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">Season ${latest.season} Champion</div>
          <div style="font-weight:900;font-size:1rem;color:var(--gold);">${w.flag||''} ${w.name}</div>
          <div style="font-size:.62rem;color:var(--t3);">${w.lg||''}</div>
        </div>`;
      }
      // Show bracket rounds for latest season
      const rounds = latest[roundsKey] || [];
      if (rounds.length) {
        const startIdx = Math.max(0, roundNames.length - rounds.length);
        rounds.forEach((round, ri) => {
          const rName = roundNames[startIdx + ri] || `Round ${ri + 1}`;
          h += `<div style="padding:5px 12px;font-size:.62rem;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.5px;background:var(--card2);border-bottom:1px solid var(--border);">${rName}</div>`;
          round.forEach(m => {
            h += `<div class="admin-row" style="font-size:.72rem;">
              <div style="flex:1;text-align:right;font-weight:${m.winner===m.a?700:400};color:${m.winner===m.a?'var(--text)':'var(--t3)'};">${m.a}</div>
              <div style="padding:0 8px;font-weight:700;color:var(--gold);font-size:.68rem;">vs</div>
              <div style="flex:1;font-weight:${m.winner===m.b?700:400};color:${m.winner===m.b?'var(--text)':'var(--t3)'};">${m.b}</div>
            </div>`;
          });
        });
      }
      // Previous seasons list
      if (wins.length > 1) {
        h += `<div style="padding:6px 12px;font-size:.62rem;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.5px;background:var(--card2);border-top:1px solid var(--border);">Previous Winners</div>`;
        wins.slice(1).forEach(r => {
          const pw = r[roundsKey === 'uclRounds' ? 'uclWinner' : 'uelWinner'];
          if (!pw) return;
          h += `<div class="admin-row"><div><div style="font-weight:700;font-size:.78rem;">${pw.flag||''} ${pw.name}</div><div style="font-size:.6rem;color:var(--t3);">${pw.lg||''} · Season ${r.season}</div></div><div style="font-size:1.1rem;">${ico}</div></div>`;
        });
      }
    }
    h += `</div>`;
    return h;
  }

  let html = buildCompSection('🏆', 'UEFA Champions League', uefaResults.filter(r => r.uclWinner), 'uclRounds');
  html += buildCompSection('🥈', 'UEFA Europa League', uefaResults.filter(r => r.uelWinner), 'uelRounds');

  html += `<div class="tbl-wrap" style="margin-bottom:10px;"><div class="tbl-hdr">🥇 League Season Champions</div>`;
  if (!seasonWinners.length) {
    html += `<div style="padding:16px;text-align:center;font-size:.76rem;color:var(--t3);">Champions appear here after each season ends.</div>`;
  } else {
    seasonWinners.slice(0, 20).forEach(w => {
      html += `<div class="admin-row"><div><div style="font-weight:700;font-size:.82rem;">${w.flag} ${w.champion}</div><div style="font-size:.62rem;color:var(--t3);">${w.league} · Season ${w.season}</div></div><div style="font-size:1.1rem;">🥇</div></div>`;
    });
  }
  html += `</div>`;

  html += `<div class="tbl-wrap"><div class="tbl-hdr">⬆️⬇️ Promotion & Relegation History</div>`;
  if (!promHist.length) {
    html += `<div style="padding:16px;text-align:center;font-size:.76rem;color:var(--t3);">Promotion/relegation results appear here after each season.</div>`;
  } else {
    promHist.slice(0, 20).forEach(h2 => {
      html += `<div class="admin-row" style="flex-direction:column;align-items:flex-start;gap:3px;">
        <div style="font-weight:700;font-size:.78rem;">${h2.flag} ${h2.league} · Season ${h2.season}</div>
        <div style="font-size:.66rem;color:var(--green);">⬆️ ${h2.promoted}</div>
        <div style="font-size:.66rem;color:var(--red);">⬇️ ${h2.relegated}</div>
      </div>`;
    });
  }
  html += `</div>`;
  return html;
}

function buildResultsView() {
  let tabs = `<div class="lg-tabs" id="res-tabs-row">` + LEAGUES.map(lg => `<div class="ltab ${resTab===lg.id?'on':''}" onclick="resTab='${lg.id}';renderSportBody();setTimeout(()=>{const el=document.querySelector('#res-tabs-row .ltab.on');if(el)el.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});},50)">${lg.flag} ${lg.country}</div>`).join('') + `</div>`;
  const lg = LEAGUES.find(l => l.id === resTab);
  const s = season[lg.id];
  let html = tabs;
  let any = false;
  for (let mw = Math.min(s.mw, 37); mw >= 0; mw--) {
    const played = (s.weeks[mw] || []).filter(m => m.played);
    if (!played.length) continue;
    any = true;
    html += `<div class="tbl-wrap" style="margin-bottom:8px;"><div class="tbl-hdr">Matchweek ${mw + 1}</div>`;
    played.forEach(m => {
      const h = lg.teams[m.home], a = lg.teams[m.away], hw = m.hs > m.as, aw = m.as > m.hs;
      html += `<div class="res-item"><span style="flex:1;text-align:right;font-weight:${hw?700:400};color:${hw?'var(--text)':'var(--t2)'}">${h}</span><span class="res-score">${m.hs}–${m.as}</span><span style="flex:1;font-weight:${aw?700:400};color:${aw?'var(--text)':'var(--t2)'}">${a}</span></div>`;
    });
    html += `</div>`;
  }
  if (!any) html += '<div class="empty-st"><div class="empty-ico">📋</div><div>No results yet.</div></div>';
  return html;
}

function togExp(mid) { expandedMatch = expandedMatch === mid ? null : mid; renderSportBody(); }

// ================================================================
