// ================================================================
// LEAGUES — 10 leagues
// ================================================================
const LEAGUES=[
  {id:'epl',name:'Premier League',country:'England',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
   teams:['Arsenal','Man City','Liverpool','Chelsea','Man Utd','Spurs','Newcastle','Aston Villa','Brighton','West Ham','Wolves','Brentford','Fulham','Crystal Palace','Everton','Nott\'m Forest','Burnley','Sheffield Utd','Luton','Bournemouth'],
   str:[92,95,90,82,78,80,79,81,76,74,70,72,68,66,60,64,55,52,48,62]},
  {id:'laliga',name:'La Liga',country:'Spain',flag:'🇪🇸',
   teams:['Real Madrid','Barcelona','Atletico','Sevilla','Real Sociedad','Villarreal','Athletic Club','Real Betis','Valencia','Osasuna','Getafe','Rayo','Mallorca','Las Palmas','Alaves','Girona','Cadiz','Granada','Almeria','Celta Vigo'],
   str:[96,94,88,78,80,79,77,75,70,68,62,65,60,58,56,72,50,48,46,64]},
  {id:'seriea',name:'Serie A',country:'Italy',flag:'🇮🇹',
   teams:['Inter Milan','AC Milan','Juventus','Napoli','Roma','Lazio','Atalanta','Fiorentina','Bologna','Torino','Monza','Genoa','Lecce','Frosinone','Udinese','Cagliari','Empoli','Verona','Salernitana','Sassuolo'],
   str:[91,89,88,86,82,80,84,76,74,70,68,65,60,55,58,54,52,50,44,42]},
  {id:'bund',name:'Bundesliga',country:'Germany',flag:'🇩🇪',
   teams:['Bayern','Dortmund','RB Leipzig','Leverkusen','Union Berlin','Frankfurt','Freiburg','Wolfsburg','Gladbach','Mainz','Cologne','Augsburg','Werder','Hoffenheim','Stuttgart','Heidenheim','Darmstadt','Bochum','Hansa Rostock','Kaiserslautern'],
   str:[97,88,87,90,76,78,74,72,70,68,64,62,60,66,75,54,48,50,44,46]},
  {id:'ligue1',name:'Ligue 1',country:'France',flag:'🇫🇷',
   teams:['PSG','Monaco','Lens','Lille','Lyon','Marseille','Nice','Rennes','Strasbourg','Montpellier','Toulouse','Nantes','Reims','Brest','Metz','Lorient','Le Havre','Clermont','Ajaccio','Auxerre'],
   str:[97,84,82,81,80,79,78,76,68,65,66,62,60,58,54,52,50,48,44,46]},
  {id:'erediv',name:'Eredivisie',country:'Netherlands',flag:'🇳🇱',
   teams:['Ajax','PSV','Feyenoord','AZ Alkmaar','Twente','Utrecht','Vitesse','Groningen','Heerenveen','Sparta Rotterdam','NEC','Fortuna Sittard','Heracles','Go Ahead','Cambuur','RKC','Excelsior','PEC Zwolle','Almere','Volendam'],
   str:[90,92,88,82,78,74,70,62,64,66,60,56,54,52,48,50,46,44,58,42]},
  {id:'liganos',name:'Liga Portugal',country:'Portugal',flag:'🇵🇹',
   teams:['Benfica','Porto','Sporting CP','Braga','Vitoria','Casa Pia','Famalicao','Arouca','Portimonense','Estoril','Rio Ave','Vizela','Boavista','Gil Vicente','Maritimo','Chaves','Estrela','Farense','Desportivo Aves','Penafiel'],
   str:[91,90,89,82,75,68,65,62,60,58,56,54,52,50,48,44,46,42,40,38]},
  {id:'superlig',name:'Süper Lig',country:'Turkey',flag:'🇹🇷',
   teams:['Galatasaray','Fenerbahce','Besiktas','Trabzonspor','Adana Demirspor','Sivasspor','Kayserispor','Konyaspor','Antalyaspor','Alanyaspor','Gaziantep','Hatayspor','Giresunspor','Istanbulspor','Kasimpasa','Ankaragücü','Pendikspor','Rizespor','Karagumruk','Umraniyespor'],
   str:[90,89,86,80,76,72,65,64,62,68,60,58,56,50,54,52,48,46,44,42]},
  {id:'proleague',name:'Pro League',country:'Belgium',flag:'🇧🇪',
   teams:['Club Brugge','Anderlecht','Genk','Standard','Gent','Antwerp','Union SG','Charleroi','Mechelen','Eupen','Kortrijk','Cercle Brugge','Oostende','OHL Leuven','Zulte','Seraing','Beerschot','Westerlo','Rwdm','Dender'],
   str:[88,85,82,78,80,84,83,70,66,60,58,56,52,54,48,44,42,50,46,40]},
  {id:'kpl',name:'Premier League',country:'Kenya',flag:'🇰🇪',
   teams:['Gor Mahia','AFC Leopards','Tusker FC','Bandari','KCB FC','Mathare Utd','Sofapaka','Ulinzi Stars','Wazito FC','Kariobangi Sharks','Kakamega HB','Nzoia Sugar','Western Stima','Posta Rangers','Chemelil','Shabana FC','Kisumu All Stars','FC Talanta','APS Bomet','Muranga Seal'],
   str:[82,80,78,74,72,65,68,66,60,70,64,55,52,50,48,58,46,54,42,44]},
];
const TC=['#e63946','#2196f3','#4caf50','#ff9800','#9c27b0','#00bcd4','#f44336','#3f51b5','#8bc34a','#ff5722','#607d8b','#795548','#e91e63','#009688','#ffc107','#673ab7','#03a9f4','#cddc39','#c0392b','#1b5e20'];

// ================================================================
// DIVISION 2 — display only in Step 1 (no live engine yet)
// ================================================================
const DIV2=[
  {id:'epl2',name:'Championship',country:'England',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',div1:'epl',
   teams:['Leeds Utd','Leicester','Middlesbrough','Sunderland','Coventry','Preston','QPR','Millwall','Hull City','Swansea','Norwich','Blackburn','Watford','Cardiff','Stoke','Wigan','Birmingham','Reading','Rotherham','Plymouth'],
   str:[72,75,65,64,62,60,58,56,54,52,50,55,53,51,57,48,46,44,42,60]},
  {id:'laliga2',name:'La Liga 2',country:'Spain',flag:'🇪🇸',div1:'laliga',
   teams:['Eibar','Sporting Gijón','Levante','Zaragoza','Oviedo','Huesca','Albacete','Lugo','Ponferradina','Fuenlabrada','Amorebieta','Burgos','Tenerife','Eldense','Mirandes','Alcorcon','Leganes','Vallecano','Andorra','Racing'],
   str:[66,65,63,62,60,58,57,55,53,51,49,50,52,47,56,45,44,48,43,61]},
  {id:'serieb',name:'Serie B',country:'Italy',flag:'🇮🇹',div1:'seriea',
   teams:['Palermo','Bari','Reggiana','Sampdoria','Cosenza','Catanzaro','Pisa','Spezia','Modena','Venezia','Parma','Ternana','Ascoli','Cremonese','Feralpisalò','Lecco','Sudtirol','Cittadella','Brescia','Como'],
   str:[68,67,65,64,62,61,59,58,56,55,53,52,50,49,47,46,55,44,60,66]},
  {id:'bund2',name:'2. Bundesliga',country:'Germany',flag:'🇩🇪',div1:'bund',
   teams:['Hertha','Hamburger SV','Schalke','Hannover','Fortuna Düsseldorf','Karlsruhe','Nürnberg','Greuther Fürth','Paderborn','Magdeburg','Regensburg','Elversberg','Braunschweig','Kiel','Wehen','Osnabrück','Rostock','Münster','Ulm','Preußen'],
   str:[70,72,68,65,63,62,60,58,56,54,52,50,49,48,47,46,55,44,43,42]},
  {id:'ligue2',name:'Ligue 2',country:'France',flag:'🇫🇷',div1:'ligue1',
   teams:['Pau FC','Troyes','Angers','Guingamp','Laval','Valenciennes','Caen','Grenoble','Rodez','Saint-Étienne','Quevilly','Amiens','Bordeaux','Dunkerque','Sochaux','Niort','Concarneau','Bastia','Martigues','Hac Rouen'],
   str:[64,68,66,63,61,59,58,56,55,53,51,50,52,48,47,46,45,54,43,69]},
  {id:'eerste',name:'Eerste Divisie',country:'Netherlands',flag:'🇳🇱',div1:'erediv',
   teams:['Jong Ajax','Jong PSV','Jong AZ','Jong Feyenoord','Willem II','MVV','Roda JC','FC Den Bosch','Telstar','Emmen','NAC Breda','De Graafschap','Dordrecht','Jong Utrecht','VVV','TOP Oss','Helmond Sport','Eindhoven','Almere B','Jong FC Twente'],
   str:[62,64,63,60,58,56,54,52,50,55,53,51,49,48,47,46,45,44,43,61]},
  {id:'ligab',name:'Liga Portugal B',country:'Portugal',flag:'🇵🇹',div1:'liganos',
   teams:['Académica','Leixões','Moreirense','Paços de Ferreira','Nacional','Feirense','Oliveirense','Tondela','FC Vizela B','Varzim','Sporting B','Porto B','Benfica B','Cova da Piedade','UD Vilafranquense','Penafiel B','Amarante','Anadia','Mafra','Felgueiras'],
   str:[60,62,61,59,58,56,55,53,51,50,52,54,57,48,47,46,45,44,43,42]},
  {id:'lig1',name:'1. Lig',country:'Turkey',flag:'🇹🇷',div1:'superlig',
   teams:['Manisa FK','Göztepe','Sakaryaspor','Eyüpspor','Bodrumspor','Çorum FK','Amed SK','Kocaelispor','Boluspor','Altay','Tarsus IY','Samsunspor','Bandırmaspor','Keçiörengücü','Altınordu','Başakşehir B','Erzurumspor','Nazilli','Ofspor','Denizlispor'],
   str:[62,65,63,61,60,58,57,55,53,51,50,52,49,48,47,46,45,44,43,56]},
  {id:'pro2',name:'Challenger Pro League',country:'Belgium',flag:'🇧🇪',div1:'proleague',
   teams:['OH Leuven B','Lommel','Lierse','Virton','KMSK Deinze','Patro','Thes Sport','Dender B','Liège','RFC Seraing','Francs Borains','Mandel','AS Eupen B','Crossing','Sleswig','Rupel Boom','Red Star','Mandel B','Maasmechelen','Olympic'],
   str:[58,60,59,57,56,54,53,51,50,48,47,46,55,44,43,42,41,52,40,61]},
  {id:'kpl2',name:'NSL Kenya',country:'Kenya',flag:'🇰🇪',div1:'kpl',
   teams:['Vihiga Utd','Muhoroni Youth','Kenya Police','Bidco Utd','Fortune Sacco','Equity FC','Kibera Black Stars','Nairobi Stima','Mara Sugar','Ushuru FC','Mombasa FC','Western Stima B','Gusii FC','Talanta B','Kisumu Hot Stars','Green Commandos','Nyali FC','Coastal FC','Molo Youth','Mt Kenya FC'],
   str:[60,58,56,54,53,52,50,48,47,46,55,44,43,42,41,40,39,38,57,45]},
];

// ================================================================
// GLOBAL SHARED SEASON — stored per-device, same for everyone
// Each season is time-based: 1 matchweek per real 5 minutes
// ================================================================
const SEASON_TICK = 5 * 60 * 1000; // 5 minutes per matchweek
const MATCH_DURATION = 90; // seconds per match

function getGlobalMW() {
  const epoch = 1700000000000;
  const elapsed = Date.now() - epoch;
  const totalMW = Math.floor(elapsed / SEASON_TICK);
  return {
    mw: totalMW % 38,
    season: Math.floor(totalMW / 38) + 1 // global season number
  };
}

function getSeasonKey(lgId) { return `bb5_s_${lgId}`; }

// Recount a table from scratch using only played matches
// This repairs any corruption caused by double-counting
function rebuildTable(lgId, weeks, teamCount) {
  const lg = LEAGUES.find(l => l.id === lgId);
  const table = lg.teams.map((t, i) => ({
    t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: []
  }));
  weeks.forEach(week => {
    (week || []).forEach(m => {
      if (!m.played || m.hs == null || m.as == null) return;
      const ht = table.find(t => t.i === m.home);
      const at = table.find(t => t.i === m.away);
      if (!ht || !at) return;
      ht.p++; at.p++;
      ht.gf += m.hs; ht.ga += m.as; ht.gd += m.hs - m.as;
      at.gf += m.as; at.ga += m.hs; at.gd += m.as - m.hs;
      if (m.hs > m.as) { ht.w++; ht.pts += 3; ht.form.push('W'); at.l++; at.form.push('L'); }
      else if (m.hs === m.as) { ht.d++; ht.pts++; at.d++; at.pts++; ht.form.push('D'); at.form.push('D'); }
      else { at.w++; at.pts += 3; at.form.push('W'); ht.l++; ht.form.push('L'); }
    });
  });
  // Trim form to last 5
  table.forEach(t => { if (t.form.length > 5) t.form = t.form.slice(-5); });
  table.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  return table;
}

function loadGlobalSeason() {
  const s_obj = {};
  const { mw: currentMW, season: currentSeason } = getGlobalMW();
  LEAGUES.forEach(lg => {
    const key = getSeasonKey(lg.id);
    let s = JSON.parse(localStorage.getItem(key) || 'null');
    if (!s) {
      s = {
        mw: 0,
        weeks: buildSchedule(lg.teams.length),
        table: lg.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
        lastSimMW: -1,
        seasonNum: currentSeason
      };
      localStorage.setItem(key, JSON.stringify(s));
    } else {
      // Detect if we're in a new global season but saved data is from old season
      const savedSeason = s.seasonNum || 1;
      if (savedSeason < currentSeason) {
        // New season started — reset cleanly
        s = {
          mw: 0,
          weeks: buildSchedule(lg.teams.length),
          table: lg.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
          lastSimMW: -1,
          seasonNum: currentSeason
        };
        localStorage.setItem(key, JSON.stringify(s));
      } else {
        // Repair corrupted table by rebuilding from match results
        const maxP = Math.max(...s.table.map(t => t.p || 0));
        const playedCount = s.weeks.flat().filter(m => m.played).length;
        const expectedMax = (s.lastSimMW + 1) * 10; // 20 teams / 2 = 10 matches per MW
        if (maxP > 38 || (playedCount > 0 && maxP > playedCount * 2 / lg.teams.length + 2)) {
          // Table is corrupted — rebuild from match data
          s.table = rebuildTable(lg.id, s.weeks, lg.teams.length);
          localStorage.setItem(key, JSON.stringify(s));
        }
      }
    }
    s_obj[lg.id] = s;
  });
  return s_obj;
}

function saveLeagueSeason(lgId) {
  localStorage.setItem(getSeasonKey(lgId), JSON.stringify(season[lgId]));
}

// ── Division 2 season — load/save only, engine added in Step 2 ──
function getDiv2Key(d2Id) { return `bb5_d2_${d2Id}`; }

function getOrCreateDiv2Season(d2Id) {
  const d2 = DIV2.find(d => d.id === d2Id);
  if (!d2) return null;
  let s = JSON.parse(localStorage.getItem(getDiv2Key(d2Id)) || 'null');
  if (!s) {
    s = {
      mw: 0,
      weeks: buildSchedule(d2.teams.length),
      table: d2.teams.map((t, i) => ({ t, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })),
      lastSimMW: -1,
      seasonNum: 1
    };
    localStorage.setItem(getDiv2Key(d2Id), JSON.stringify(s));
  }
  return s;
}

function buildSchedule(n) {
  // Standard Berger round-robin for n=20 teams = 19 rounds × 2 legs = 38 matchweeks
  // Each team plays exactly 38 matches total (19 home + 19 away)
  const teams = Array.from({ length: n }, (_, i) => i);
  const rounds = [];
  const fixed = teams[0];
  const rotating = teams.slice(1);
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    const circle = [fixed, ...rotating];
    for (let i = 0; i < n / 2; i++) {
      round.push({ home: circle[i], away: circle[n - 1 - i], hs: null, as: null, played: false });
    }
    rotating.push(rotating.shift());
    rounds.push(round);
  }
  // Second leg: swap home/away for every fixture
  const secondLeg = rounds.map(r => r.map(m => ({ home: m.away, away: m.home, hs: null, as: null, played: false })));
  return [...rounds, ...secondLeg]; // exactly 38 matchweeks
}

// ================================================================
// STATE
// ================================================================
let CU = null;
let season = null;
let d2season = {};       // Division 2 seasons — keyed by d2Id
let oddsCache = {};
let liveGames = {};
let matchIntervals = {};
let expandedMatch = null;
let sportView = 'live';
let stTab = LEAGUES[0].id;
let resTab = LEAGUES[0].id;
let d2Tab = DIV2[0].id;
let mbCurTab = 'pending';
let slip = [];
const MAX_SEL = 21;
const MKTG = { home:'1x2',draw:'1x2',away:'1x2',dc1x:'dc',dc12:'dc',dcx2:'dc',o15:'tot',u15:'tot',o25:'tot',u25:'tot',o35:'tot',u35:'tot',btty:'btts',bttn:'btts',hht:'ht',dht:'ht',aht:'ht' };
let diceChoice = 'high', diceRolling = false;
let rouBet = 'red', rouSpinning = false, rouAngle = 0;
// BlakeViator — multi-bet system (up to 3 independent bets per round)
let bvRunning = false, bvCrashAt = 1, bvAnimId = null;
let bvCountingDown = false;
let bvTrail = [], bvStartTime = null;
let bvPlaneX = 0, bvPlaneY = 0, bvMult = 1, bvHistory = [];
let bvRoundTO = null, bvCanvas = null, bvCtx = null;
// bvBets: array of { id, stake, autoCash, cashedOut, betPlaced }
let bvBets = [];
let bvNextId = 0;
let bvSoundOn = true;       // sound toggle
let bvFlyingAudio = null;   // continuous flying engine sound node
let tickerResults = [];
let tickerTimeout = null;
let winFeed = [];
const WIN_FEED_KEY = 'bb5_winfeed';
const WIN_FEED_MAX = 30;
