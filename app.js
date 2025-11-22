/* 3-in-1 Calendar PWA with events, reminders, dark mode + Farming (Sahiwal, Punjabi months) */

/* ===== Utilities ===== */
function pad(n){ return n<10 ? "0"+n : ""+n; }
function cloneDate(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d, delta){ const x = cloneDate(d); x.setDate(x.getDate()+delta); return x; }
function startOfWeek(d, weekStartsOn=1){ // Monday
  const x = cloneDate(d);
  const day = (x.getDay()+6)%7; // Mon=0..Sun=6
  x.setDate(x.getDate()-day);
  return x;
}
function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
function ymd(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

/* ===== Gregorian <-> JD ===== */
function gregorianToJD(y,m,d){
  const a = Math.floor((14 - m)/12);
  const y2 = y + 4800 - a;
  const m2 = m + 12*a - 3;
  return d + Math.floor((153*m2 + 2)/5) + 365*y2 + Math.floor(y2/4) - Math.floor(y2/100) + Math.floor(y2/400) - 32045;
}
function jdToGregorian(jd){
  let a = jd + 32044;
  let b = Math.floor((4*a + 3)/146097);
  let c = a - Math.floor((146097*b)/4);
  let d = Math.floor((4*c + 3)/1461);
  let e = c - Math.floor(1461*d/4);
  let m = Math.floor((5*e + 2)/153);
  let day = e - Math.floor((153*m + 2)/5) + 1;
  let month = m + 3 - 12*Math.floor(m/10);
  let year = 100*b + d - 4800 + Math.floor(m/10);
  return {year, month, day};
}

/* ===== Islamic (tabular/civil) conversion ===== */
const ISLAMIC_EPOCH = 1948439;
function islamicToJD(y,m,d){
  return d + Math.ceil(29.5*(m-1)) + (y-1)*354 + Math.floor((3 + 11*y)/30) + ISLAMIC_EPOCH - 1;
}
function jdToIslamic(jd){
  const y = Math.floor((30*(jd - ISLAMIC_EPOCH) + 10646)/10631);
  let m = Math.min(12, Math.ceil((jd - islamicToJD(y,1,1) + 1)/29.5));
  const d = jd - islamicToJD(y,m,1) + 1;
  return {year:y, month:m, day:d};
}
const ISLAMIC_MONTHS = ["Muharram","Safar","Rabiʿ I","Rabiʿ II","Jumada I","Jumada II","Rajab","Shaʿban","Ramadan","Shawwal","Dhu al-Qidah","Dhu al-Hijjah"];

/* ===== Punjabi fixed months ===== */
const PUNJABI_MONTHS = ["Chet","Vaisakh","Jeth","Harh","Sawan","Bhadon","Assu","Katak","Maghar","Poh","Magh","Phagun"];
function punjabiInfoFromGregorian(gd){
  const y = gd.getFullYear();
  const boundaries = [];
  function pushBoundary(year, m, d, idx){ boundaries.push({date:new Date(year, m-1, d), idx}); }
  // build from (y-1) Mar to (y+1) Feb
  const seq = [
    (Y)=>pushBoundary(Y,3,14,0), (Y)=>pushBoundary(Y,4,14,1), (Y)=>pushBoundary(Y,5,15,2),
    (Y)=>pushBoundary(Y,6,15,3), (Y)=>pushBoundary(Y,7,16,4), (Y)=>pushBoundary(Y,8,16,5),
    (Y)=>pushBoundary(Y,9,15,6), (Y)=>pushBoundary(Y,10,15,7), (Y)=>pushBoundary(Y,11,14,8),
    (Y)=>pushBoundary(Y,12,14,9), (Y)=>pushBoundary(Y+1,1,13,10), (Y)=>pushBoundary(Y+1,2,12,11)
  ];
  seq.forEach(f=>f(y-1)); seq.forEach(f=>f(y)); 
  boundaries.sort((a,b)=>a.date - b.date);
  let idxFound=-1; for(let i=0;i<boundaries.length;i++){ if(boundaries[i].date<=gd) idxFound=i; else break; }
  if(idxFound<0) idxFound=0;
  const currentStart = boundaries[idxFound];
  const nextStart = boundaries[idxFound+1] || {date:new Date(gd.getFullYear()+1,2,14), idx:0};
  const dayNo = Math.floor((gd - currentStart.date)/(24*3600*1000)) + 1;
  const monthName = PUNJABI_MONTHS[currentStart.idx];
  const system = document.querySelector("#punjabiSystem")?.value || "vs";
  const gMarch14 = new Date(gd.getFullYear(), 2, 14);
  let yearVal = (system==="vs")
    ? ((gd >= gMarch14) ? gd.getFullYear()+57 : gd.getFullYear()+56)
    : ((gd >= gMarch14) ? gd.getFullYear()-1468 : gd.getFullYear()-1469);
  const daysInThisPunjabiMonth = Math.floor((nextStart.date - currentStart.date)/(24*3600*1000));
  return { idx: currentStart.idx, monthName, day: dayNo, year: yearVal, daysInMonth: daysInThisPunjabiMonth };
}

/* ===== Farming DB (Sahiwal, bilingual: EN + Shahmukhi) ===== */
const FARMING_DB = [
  { // Chet
    title_en: "Chet — Mid Mar to Mid Apr",
    title_ur: "چیت — مارچ 14 سے اپریل 14",
    summary_en: "Wheat last irrigation; sugarcane ratoon; start cotton prep.",
    summary_ur: "گندم کی آخری آبپاشی، گنے کی کھیت صفائی و کھاد، کپاس کی تیاری شروع۔",
    details_en: [
      "Wheat: final irrigation (last pani); heading begins.",
      "Sugarcane (ratoon): cleaning + fertilizer.",
      "Sunflower harvest; sow fodder (maize/elephant grass).",
      "Start field prep for cotton."
    ],
    details_ur: [
      "گندم: آخری پانی، بالی نکلنا شروع۔",
      "گنا (پرانی فصل): صفائی اور کھاد۔",
      "سورج مکھی کی برداشت؛ چارہ (مکئی/نیلا گھاس) بوائی۔",
      "کپاس کے لیے زمین کی تیاری شروع۔"
    ]
  },
  { // Vaisakh
    title_en: "Vaisakh — Mid Apr to Mid May",
    title_ur: "وساکھ — اپریل 14 سے مئی 14",
    summary_en: "Wheat harvest starts; begin cotton sowing; first irrigation.",
    summary_ur: "گندم کی کٹائی شروع؛ کپاس کی بوائی اور پہلا پانی۔",
    details_en: [
      "Wheat: harvesting & threshing begins.",
      "Cotton: sowing; first irrigation; early weeding.",
      "Maize (2nd season) possible; okra/bitter gourd planting.",
      "Hot winds (loo): livestock care + orchard watering."
    ],
    details_ur: [
      "گندم: کٹائی اور گہائی شروع۔",
      "کپاس: بیج بونا، پہلا پانی، ابتدائی گوڈی۔",
      "مکئی کی دوسری فصل ممکن؛ بھنڈی/کریلا کی کاشت۔",
      "لو چلتی ہے: مویشی اور باغات کی خصوصی دیکھ بھال۔"
    ]
  },
  { // Jeth
    title_en: "Jeth — Mid May to Mid Jun",
    title_ur: "جیٹھ — مئی 15 سے جون 15",
    summary_en: "Wheat threshing; cotton weeding; rice nursery prep.",
    summary_ur: "گندم کی گہائی؛ کپاس کی گوڈی؛ دھان کی نرسری۔",
    details_en: [
      "Wheat: threshing/stacking.",
      "Cotton: weeding + insect scouting.",
      "Rice: nursery preparation; maize fodder sowing.",
      "Heatwave: irrigate orchards to prevent stress."
    ],
    details_ur: [
      "گندم: گہائی اور بھوسہ گٹھڑی۔",
      "کپاس: گوڈی اور کیڑے کی نگرانی۔",
      "چاول: نرسری کی تیاری؛ چارہ مکئی کی کاشت۔",
      "گرمی کی شدت: باغات کو مناسب پانی۔"
    ]
  },
  { // Harh
    title_en: "Harh — Mid Jun to Mid Jul",
    title_ur: "ہاڑ — جون 15 سے جولائی 15",
    summary_en: "Rice transplanting; cotton pest control; sugarcane earthing.",
    summary_ur: "دھان کی پنیری؛ کپاس میں کیڑے کا کنٹرول؛ گنے کی مٹی چڑھائی۔",
    details_en: [
      "Rice: transplanting + first flood irrigation.",
      "Cotton: monitor whitefly/bollworm; timely sprays.",
      "Sugarcane: fertilizer + earthing up."
    ],
    details_ur: [
      "چاول: پنیری لگانا اور پہلا پانی۔",
      "کپاس: وائٹ فلائی/بال ورم پر کنٹرول؛ بروقت اسپرے۔",
      "گنا: کھاد اور مٹی چڑھائی۔"
    ]
  },
  { // Sawan
    title_en: "Sawan — Mid Jul to Mid Aug",
    title_ur: "ساون — جولائی 16 سے اگست 16",
    summary_en: "Monsoon support; rice growth; cotton flower care.",
    summary_ur: "برسات؛ دھان کی بڑھوتری؛ کپاس میں پھول گرنے کا کنٹرول۔",
    details_en: [
      "Monsoon: leverage rains; ensure drainage in low fields.",
      "Rice: active tillering; maintain standing water carefully.",
      "Cotton: manage flower drop; balanced nutrition.",
      "Maize (summer): harvest; vegetables thrive."
    ],
    details_ur: [
      "مون سون سے فائدہ؛ نشیبی جگہوں میں نکاسی آب ضروری۔",
      "چاول: بڑھوتری/ٹوئلرننگ؛ پانی کا مناسب لیول رکھیں۔",
      "کپاس: پھول گرنے کی روک تھام؛ متوازن کھاد۔",
      "گرمیوں کی مکئی کی برداشت؛ سبزیاں اچھی رہتی ہیں۔"
    ]
  },
  { // Bhadon
    title_en: "Bhadon — Mid Aug to Mid Sep",
    title_ur: "بھادوں — اگست 16 سے ستمبر 15",
    summary_en: "Rice booting; cotton bolls; fodder sowing (jantar).",
    summary_ur: "چاول بال آنا؛ کپاس میں بیل بننا؛ جنتر/گوار جیسے چارے کی بوائی۔",
    details_en: [
      "Rice: booting/panicle; monitor pests/disease.",
      "Cotton: boll formation; protect from late pests.",
      "Fodder: sow jantar/cluster bean; late maize possible.",
      "Early sugarcane for jaggery in some areas."
    ],
    details_ur: [
      "چاول: بال آنا؛ کیڑوں/بیماری پر نظر۔",
      "کپاس: ڈوڈی بننا؛ دیرینہ کیڑوں سے تحفظ۔",
      "چارے: جنتر/گوار کی کاشت؛ دیر سے مکئی ممکن۔",
      "کچھ علاقوں میں گنے سے گڑ کی ابتدائی تیاری۔"
    ]
  },
  { // Assu
    title_en: "Assu — Mid Sep to Mid Oct",
    title_ur: "اسّو — ستمبر 15 سے اکتوبر 15",
    summary_en: "Rice harvest begin; cotton 1st picking; wheat land prep.",
    summary_ur: "چاول کی کٹائی شروع؛ کپاس کی پہلی چنائی؛ گندم کی زمین کی تیاری۔",
    details_en: [
      "Rice: harvesting begins.",
      "Cotton: first picking; keep fields clean.",
      "Wheat: land prep; mustard sowing starts end of month."
    ],
    details_ur: [
      "چاول: کٹائی شروع۔",
      "کپاس: پہلی چنائی؛ کھیت صاف رکھیں۔",
      "گندم: زمین کی تیاری؛ آخر میں سرسوں کی کاشت۔"
    ]
  },
  { // Katak
    title_en: "Katak — Mid Oct to Mid Nov",
    title_ur: "کتک — اکتوبر 15 سے نومبر 15",
    summary_en: "Peak wheat sowing; cotton later pickings; sugarcane harvest.",
    summary_ur: "گندم کی بڑی کاشت؛ کپاس کی دوسری/تیسری چنائی؛ گنے کی برداشت شروع۔",
    details_en: [
      "Wheat: sowing peak window.",
      "Cotton: 2nd/3rd pickings as ready.",
      "Sugarcane: harvesting season begins.",
      "Gram/peas/linseed sowing."
    ],
    details_ur: [
      "گندم: کاشت کا بہترین وقت۔",
      "کپاس: دوسری/تیسری چنائی۔",
      "گنا: برداشت کا آغاز۔",
      "چنا، مٹر، السی کی کاشت۔"
    ]
  },
  { // Maghar
    title_en: "Maghar — Mid Nov to Mid Dec",
    title_ur: "مگھر — نومبر 15 سے دسمبر 14",
    summary_en: "Wheat in full swing; potato early digging; fog risk.",
    summary_ur: "گندم کی فصل رواں؛ آلو کی ابتدائی کھدائی؛ دھند و نزلہ زکام کا خدشہ۔",
    details_en: [
      "Wheat: steady growth.",
      "Potato: early crop digging; mustard flowering.",
      "Gram sprouting; watch for frost/fog; cattle pneumonia risk."
    ],
    details_ur: [
      "گندم: متوازن بڑھوتری۔",
      "آلو: ابتدائی فصل کی کھدائی؛ سرسوں میں پھول۔",
      "چنے کی اگاؤ؛ کہر/دھند سے بچاؤ؛ مویشیوں کی نگہداشت۔"
    ]
  },
  { // Poh
    title_en: "Poh — Mid Dec to Mid Jan",
    title_ur: "پوہ — دسمبر 14 سے جنوری 13",
    summary_en: "Heavy fog; wheat tillering; potato main harvest.",
    summary_ur: "تیز دھند؛ گندم ٹیلرنگ؛ آلو کی مرکزی برداشت۔",
    details_en: [
      "Fog season: limit sprays; protect workers/livestock.",
      "Wheat: tillering; maintain moisture, avoid waterlogging.",
      "Potato: major harvesting window; mustard pod formation."
    ],
    details_ur: [
      "دھند کا موسم: اسپرے محدود رکھیں؛ مزدور/مویشی کا تحفظ۔",
      "گندم: ٹیلرنگ؛ نمی برقرار رکھیں، پانی کھڑا نہ ہونے دیں۔",
      "آلو: بڑی برداشت؛ سرسوں میں پھلیاں بننا۔"
    ]
  },
  { // Magh
    title_en: "Magh — Mid Jan to Mid Feb",
    title_ur: "ما گھ — جنوری 13 سے فروری 12",
    summary_en: "Wheat 2nd irrigation; gram pods; mustard harvest begins.",
    summary_ur: "گندم کا دوسرا پانی؛ چنے میں پھلیاں؛ سرسوں کی کٹائی شروع۔",
    details_en: [
      "Wheat: 2nd irrigation; manage weeds.",
      "Gram: pod formation; protect from pod borer.",
      "Mustard: harvest toward end; vegetables improve."
    ],
    details_ur: [
      "گندم: دوسرا پانی؛ جڑی بوٹیوں کا کنٹرول۔",
      "چنا: پھلیاں؛ پھلی چھیدو سے بچاؤ۔",
      "سرسوں: آخر میں کٹائی؛ سبزیوں کی حالت بہتر۔"
    ]
  },
  { // Phagun
    title_en: "Phagun — Mid Feb to Mid Mar",
    title_ur: "فگن — فروری 12 سے مارچ 14",
    summary_en: "Wheat milk stage; mustard/potato harvest; sugarcane planting.",
    summary_ur: "گندم دودھیا دانہ؛ سرسوں/آلو کی برداشت؛ گنے کی کاشت۔",
    details_en: [
      "Wheat: milk stage; avoid stress; timely irrigation.",
      "Mustard: final harvest; potato late crop harvest.",
      "Sugarcane: planting begins; deep ploughing for cotton."
    ],
    details_ur: [
      "گندم: دودھیا دانہ؛ تناؤ سے بچائیں؛ بروقت آبپاشی۔",
      "سرسوں: آخری برداشت؛ آلو کی دیرینہ فصل کی برداشت۔",
      "گنا: نئی کاشت شروع؛ کپاس کے لیے گہری جوت۔"
    ]
  }
];

/* ===== Formatters ===== */
function fmtGregorian(d){ return d.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" }); }
function englishShort(d){ return `${d.getDate()} ${d.toLocaleString(undefined,{month:"short"})} ${d.getFullYear()}`; }
function hijriOf(d, offsetDays){
  const base = cloneDate(d);
  if (offsetDays) base.setDate(base.getDate() + Number(offsetDays));
  const jd = gregorianToJD(base.getFullYear(), base.getMonth()+1, base.getDate());
  const ih = jdToIslamic(jd);
  const name = ISLAMIC_MONTHS[ih.month-1];
  return { ...ih, name };
}

/* ===== Local storage for reminders ===== */
const LS_KEY = "tri_calendar_reminders_v1";
function loadReminders(){
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch(e){ return {}; }
}
function saveReminders(obj){ localStorage.setItem(LS_KEY, JSON.stringify(obj)); }
function addReminder(dateStr, title, notes){
  const db = loadReminders();
  db[dateStr] = db[dateStr] || [];
  db[dateStr].push({ title, notes, created: Date.now() });
  saveReminders(db);
}
function deleteReminder(dateStr, idx){
  const db = loadReminders();
  if (db[dateStr]){ db[dateStr].splice(idx,1); if(db[dateStr].length===0) delete db[dateStr]; saveReminders(db); }
}

/* ===== Special events (auto) ===== */
function specialEventsForDate(d, hijriOffset){
  const events = [];
  const h = hijriOf(d, hijriOffset);
  const p = punjabiInfoFromGregorian(d);
  const m = d.getMonth()+1, day = d.getDate();

  // Islamic
  if (h.month===9 && h.day===1) events.push({kind:"islamic", name:"Ramadan begins"});
  if (h.month===9 && [21,23,25,27,29].includes(h.day)) events.push({kind:"islamic", name:`Laylat al-Qadr (odd night)`});
  if (h.month===10 && h.day===1) events.push({kind:"islamic", name:"Eid al-Fitr"});
  if (h.month===12 && h.day===10) events.push({kind:"islamic", name:"Eid al-Adha"});
  if (h.month===1 && h.day===1) events.push({kind:"islamic", name:"Islamic New Year"});
  if (h.month===1 && h.day===10) events.push({kind:"islamic", name:"Ashura (10 Muharram)"});
  if (h.month===3 && h.day===12) events.push({kind:"islamic", name:"Mawlid (12 Rabiʿ I)"});
  if (h.month===7 && h.day===27) events.push({kind:"islamic", name:"Shab-e-Mi'raj"});
  if (h.month===8 && h.day===15) events.push({kind:"islamic", name:"Shab-e-Barat"});

  // English / civic
  if (m===1 && day===1) events.push({kind:"english", name:"New Year’s Day"});
  if (m===2 && day===14) events.push({kind:"english", name:"Valentine’s Day"});
  if (m===5 && day===1) events.push({kind:"english", name:"Labour Day"});
  if (m===8 && day===14) events.push({kind:"english", name:"Pakistan Independence Day"});
  if (m===10 && day===3) events.push({kind:"english", name:"German Unity Day"});
  if (m===12 && day===25) events.push({kind:"english", name:"Christmas Day"});

  // Punjabi / Desi (fixed markers)
  if (m===1 && day===13) events.push({kind:"punjabi", name:"Lohri"});
  if (m===1 && day===14) events.push({kind:"punjabi", name:"Maghi"});
  if (m===3 && day===14) events.push({kind:"punjabi", name:"Chet starts (Desi New Year)"});
  if (m===4 && day===14) events.push({kind:"punjabi", name:"Vaisakhi"});

  return events;
}

/* ===== DOM hooks ===== */
const content = document.getElementById("content");
const datePicker = document.getElementById("datePicker");
const todayBtn = document.getElementById("todayBtn");
const hijriOffsetInput = document.getElementById("hijriOffset");
const reminderDialog = document.getElementById("reminderDialog");
const reminderDateEl = document.getElementById("reminderDate");
const remTitle = document.getElementById("remTitle");
const remNotes = document.getElementById("remNotes");
const addReminderBtn = document.getElementById("addReminderBtn");
const darkToggle = document.getElementById("darkToggle");

/* ===== Dark mode ===== */
(function initTheme(){
  const stored = localStorage.getItem("tri_theme");
  if (stored) document.documentElement.classList.toggle("dark", stored==="dark");
  darkToggle.addEventListener("click", ()=>{
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("tri_theme", isDark ? "dark" : "light");
  });
})();

/* ===== Helpers ===== */
function setBaseDate(d){ datePicker.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function getBaseDate(){
  const val = datePicker.value;
  if (!val){ return new Date(); }
  const [y,m,d] = val.split("-").map(Number);
  return new Date(y, m-1, d);
}
function isToday(d){
  const t=new Date(); return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
}

/* ===== Farming render helpers ===== */
function farmingForPunjabiMonthIdx(idx){
  return FARMING_DB[idx];
}
function farmingSummaryHTML(idx){
  const f = farmingForPunjabiMonthIdx(idx);
  if (!f) return "";
  return `<div class="card">
    <h3>Farming Guide — ${PUNJABI_MONTHS[idx]}</h3>
    <div class="dual">
      <div class="en"><strong>${f.title_en}</strong> — ${f.summary_en}</div>
      <div class="ur"><strong>${f.title_ur}</strong> — ${f.summary_ur}</div>
    </div>
  </div>`;
}
function farmingDetailsHTML(idx){
  const f = farmingForPunjabiMonthIdx(idx);
  if (!f) return "";
  const listEn = f.details_en.map(it=>`<li>${it}</li>`).join("");
  const listUr = f.details_ur.map(it=>`<li>${it}</li>`).join("");
  return `<div class="card">
    <h3>Farming Guide — ${PUNJABI_MONTHS[idx]}</h3>
    <div class="dual">
      <div class="en"><strong>${f.title_en}</strong></div>
      <ul class="en">${listEn}</ul>
      <div class="ur"><strong>${f.title_ur}</strong></div>
      <ul class="ur">${listUr}</ul>
    </div>
  </div>`;
}

/* ===== Rendering ===== */
function renderDay(d){
  const hijri = hijriOf(d, hijriOffsetInput.value);
  const pun = punjabiInfoFromGregorian(d);
  const dateStr = ymd(d);
  const myRems = loadReminders()[dateStr] || [];
  const autos = specialEventsForDate(d, hijriOffsetInput.value);
  const allEvents = [
    ...myRems.map(r=>({kind:"custom", name:r.title, notes:r.notes})),
    ...autos
  ];
  let eventsHtml = "";
  if (allEvents.length){
    eventsHtml = `<ul>` + allEvents.map((e,i)=>{
      let badge = e.kind;
      return `<li><span class="badge">${badge}</span> ${e.name || ""}${e.notes?` — <span class="muted">${e.notes}</span>`:""}
        ${e.kind==="custom"?`<button class="ghost small" data-del="${i}">Delete</button>`:""}
      </li>`;
    }).join("") + `</ul>`;
  } else {
    eventsHtml = `<p class="muted">No events.</p>`;
  }

  const hBadge = `<span class="badge">offset ${Number(hijriOffsetInput.value)}</span>`;
  const pBadge = `<span class="badge">${pun.daysInMonth}-day month</span>`;

  content.innerHTML = `
    <div class="card">
      <h2>${fmtGregorian(d)} ${isToday(d)?'<span class="badge">today</span>':''}</h2>
      <div class="rowline">English (Gregorian): <strong>${englishShort(d)}</strong></div>
      <div class="rowline">Islamic (Hijri): <strong>${hijri.day} ${hijri.name} ${hijri.year}</strong> ${hBadge}</div>
      <div class="rowline">Punjabi (Desi): <strong>${pun.day} ${pun.monthName} ${pun.year}</strong> ${pBadge}</div>
    </div>
    ${farmingDetailsHTML(pun.idx)}
    <div class="card">
      <h3>Events & Reminders</h3>
      ${eventsHtml}
    </div>
  `;
  // Wire delete buttons
  content.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.dataset.del);
      const db = loadReminders();
      const list = db[dateStr] || [];
      if (idx>=0 && idx<list.length){
        deleteReminder(dateStr, idx);
        render(); // refresh
      }
    });
  });
}

function renderWeek(d){
  const start = startOfWeek(d);
  const end = addDays(start, 6);
  let html = `<div class="card"><h2>Week of ${englishShort(start)} → ${englishShort(end)}</h2>`;
  for(let i=0;i<7;i++){
    const cur = addDays(start, i);
    const hijri = hijriOf(cur, hijriOffsetInput.value);
    const pun = punjabiInfoFromGregorian(cur);
    const dateStr = ymd(cur);
    const myRems = loadReminders()[dateStr] || [];
    const autos = specialEventsForDate(cur, hijriOffsetInput.value);
    const summaries = [...autos.map(e=>e.name), ...myRems.map(r=>`🔔 ${r.title}`)].slice(0,3).join(" • ");
    html += `
      <div class="card smallcard" data-goto="${dateStr}">
        <div><strong>${fmtGregorian(cur)}${isToday(cur)?' <span class="badge">today</span>':''}</strong></div>
        <div class="rowline">I: ${hijri.day} ${hijri.name} ${hijri.year} · P: ${pun.day} ${pun.monthName} ${pun.year}</div>
        <div class="rowline">${summaries || '<span class="muted">No events</span>'}</div>
      </div>
    `;
  }
  html += `</div>`;
  content.innerHTML = html;
  // click to jump to day
  content.querySelectorAll("[data-goto]").forEach(card=>{
    card.addEventListener("click", ()=>{
      const [yy,mm,dd] = card.dataset.goto.split("-").map(Number);
      setBaseDate(new Date(yy,mm-1,dd));
      document.querySelector('.segmented [data-view="day"]').click();
    });
  });
}

function renderMonth(d){
  const y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y, m, 1);
  const days = daysInMonth(y,m);
  const firstWeekStart = startOfWeek(first);
  const last = new Date(y, m, days);
  const lastWeekEnd = addDays(startOfWeek(last), 6);

  let cur = cloneDate(firstWeekStart);
  let html = `
    <div class="card">
      <div class="month-header">
        <h2>${first.toLocaleString(undefined,{month:"long"})} ${y}</h2>
        <div class="nav-buttons">
          <button id="prevMonth">◀</button>
          <button id="thisMonth">This month</button>
          <button id="nextMonth">▶</button>
        </div>
      </div>
      ${farmingSummaryHTML(punjabiInfoFromGregorian(first).idx)}
      <div class="calendar-grid">
        <div class="cell"><strong>Mon</strong></div>
        <div class="cell"><strong>Tue</strong></div>
        <div class="cell"><strong>Wed</strong></div>
        <div class="cell"><strong>Thu</strong></div>
        <div class="cell"><strong>Fri</strong></div>
        <div class="cell"><strong>Sat</strong></div>
        <div class="cell"><strong>Sun</strong></div>
  `;
  while(cur <= lastWeekEnd){
    const inMonth = (cur.getMonth() === m);
    const hijri = hijriOf(cur, hijriOffsetInput.value);
    const pun = punjabiInfoFromGregorian(cur);
    const dateStr = ymd(cur);
    const myRems = loadReminders()[dateStr] || [];
    const autos = specialEventsForDate(cur, hijriOffsetInput.value);
    const hasEvent = (myRems.length + autos.length) > 0;
    html += `
      <div class="cell ${isToday(cur)?'today':''}" data-goto="${dateStr}" style="opacity:${inMonth?1:0.45}">
        <div class="gdate">
          <span>${cur.getDate()}</span>
          ${hasEvent?'<span class="badge">•</span>':''}
        </div>
        <div class="sub">I: ${hijri.day} ${hijri.name.slice(0,3)}</div>
        <div class="sub">P: ${pun.day} ${pun.monthName.slice(0,3)}</div>
      </div>
    `;
    cur = addDays(cur, 1);
  }
  html += `</div></div>`;
  content.innerHTML = html;

  document.getElementById("prevMonth").onclick = ()=>{ const base = getBaseDate(); base.setMonth(base.getMonth()-1); setBaseDate(base); render(); };
  document.getElementById("thisMonth").onclick = ()=>{ const now = new Date(); now.setDate(1); setBaseDate(now); render(); };
  document.getElementById("nextMonth").onclick = ()=>{ const base = getBaseDate(); base.setMonth(base.getMonth()+1); setBaseDate(base); render(); };

  content.querySelectorAll("[data-goto]").forEach(cell=>{
    cell.addEventListener("click", ()=>{
      const [yy,mm,dd] = cell.dataset.goto.split("-").map(Number);
      setBaseDate(new Date(yy,mm-1,dd));
      document.querySelector('.segmented [data-view="day"]').click();
    });
  });
}

function renderYear(d){
  const y = d.getFullYear();
  let html = `<div class="year-grid">`;
  for(let m=0;m<12;m++){
    const first = new Date(y, m, 1);
    const days = daysInMonth(y,m);
    let inner = `<div class="calendar-grid">`;
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(w=> inner += `<div class="cell"><strong>${w}</strong></div>`);
    let cur = startOfWeek(first);
    const last = new Date(y, m, days);
    const lastEnd = addDays(startOfWeek(last),6);
    while(cur <= lastEnd){
      const inMonth = (cur.getMonth() === m);
      const hijri = hijriOf(cur, hijriOffsetInput.value);
      const pun = punjabiInfoFromGregorian(cur);
      inner += `
        <div class="cell ${isToday(cur)?'today':''}" style="opacity:${inMonth?1:0.45}">
          <div class="gdate">${cur.getDate()}</div>
          <div class="sub">I: ${hijri.day} ${hijri.name.slice(0,3)}</div>
          <div class="sub">P: ${pun.day} ${pun.monthName.slice(0,3)}</div>
        </div>
      `;
      cur = addDays(cur,1);
    }
    inner += `</div>`;
    html += `<div class="month-card"><h3>${first.toLocaleString(undefined,{month:"long"})}</h3>${inner}</div>`;
  }
  html += `</div>`;
  content.innerHTML = html;
}

function render(){
  const d = getBaseDate();
  const active = document.querySelector(".segmented button.active")?.dataset.view || "day";
  if (active === "day") renderDay(d);
  else if (active === "week") renderWeek(d);
  else if (active === "month") renderMonth(d);
  else renderYear(d);
}

/* ===== Init & Events ===== */
(function init(){
  // default date
  const now = new Date();
  setBaseDate(now);
  render();

  datePicker.addEventListener("change", render);
  todayBtn.addEventListener("click", ()=>{ setBaseDate(new Date()); render(); });
  hijriOffsetInput.addEventListener("change", render);
  document.getElementById("punjabiSystem").addEventListener("change", render);

  document.querySelectorAll(".segmented button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".segmented button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  // Reminder modal
  addReminderBtn.addEventListener("click", ()=>{
    const d = getBaseDate();
    reminderDateEl.textContent = fmtGregorian(d);
    remTitle.value = "";
    remNotes.value = "";
    reminderDialog.showModal();
  });
  document.getElementById("saveReminder").addEventListener("click", (e)=>{
    e.preventDefault();
    const d = getBaseDate();
    const dateStr = ymd(d);
    if (remTitle.value.trim().length === 0){ return; }
    addReminder(dateStr, remTitle.value.trim(), remNotes.value.trim());
    reminderDialog.close();
    render();
  });
})();
