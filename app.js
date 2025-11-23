/* ---------- Utilities ---------- */
function pad(n){return n<10?"0"+n:""+n;}
function cloneDate(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function addDays(d,delta){const x=cloneDate(d);x.setDate(x.getDate()+delta);return x;}
function startOfWeek(d){const x=cloneDate(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x;}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function ymd(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function fmtGregorian(d){return d.toLocaleDateString(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"});}
function short(d){return `${d.getDate()} ${d.toLocaleString(undefined,{month:"short"})}`;}

/* ---------- Theme (light/dark/system) ---------- */
const themeMode=document.getElementById('themeMode');
(function initTheme(){
  const saved=localStorage.getItem('tri_theme_mode')||'system';
  themeMode.value=saved;
  applyTheme(saved);
  themeMode.addEventListener('change',()=>{
    localStorage.setItem('tri_theme_mode', themeMode.value);
    applyTheme(themeMode.value);
  });
})();
function applyTheme(mode){
  const root=document.documentElement;
  root.classList.remove('light','dark','system');
  root.classList.add(mode);
}

/* ---------- Hijri (tabular) ---------- */
function gregorianToJD(y,m,d){const a=Math.floor((14-m)/12);const y2=y+4800-a;const m2=m+12*a-3;return d+Math.floor((153*m2+2)/5)+365*y2+Math.floor(y2/4)-Math.floor(y2/100)+Math.floor(y2/400)-32045;}
const ISLAMIC_EPOCH=1948439;
function islamicToJD(y,m,d){return d+Math.ceil(29.5*(m-1))+(y-1)*354+Math.floor((3+11*y)/30)+ISLAMIC_EPOCH-1;}
function jdToIslamic(jd){const y=Math.floor((30*(jd-ISLAMIC_EPOCH)+10646)/10631);let m=Math.min(12,Math.ceil((jd-islamicToJD(y,1,1)+1)/29.5));const d=jd-islamicToJD(y,m,1)+1;return{year:y,month:m,day:d};}
const ISLAMIC_MONTHS=["Muharram","Safar","Rabiʿ I","Rabiʿ II","Jumada I","Jumada II","Rajab","Shaʿban","Ramadan","Shawwal","Dhu al-Qidah","Dhu al-Hijjah"];
function hijriOf(d, off){const base=new Date(d);if(off)base.setDate(base.getDate()+Number(off));const jd=gregorianToJD(base.getFullYear(),base.getMonth()+1,base.getDate());const ih=jdToIslamic(jd);ih.name=ISLAMIC_MONTHS[ih.month-1];return ih;}

/* ---------- Punjabi fixed solar months ---------- */
const PUNJABI_MONTHS=["Chet","Vaisakh","Jeth","Harh","Sawan","Bhadon","Assu","Katak","Maghar","Poh","Magh","Phagun"];
function punjabiInfoFromGregorian(gd){
  const y=gd.getFullYear();const b=[];
  function add(year,m,d,idx){b.push({date:new Date(year,m-1,d),idx});}
  const seq=[Y=>add(Y,3,14,0),Y=>add(Y,4,14,1),Y=>add(Y,5,15,2),Y=>add(Y,6,15,3),Y=>add(Y,7,16,4),Y=>add(Y,8,16,5),Y=>add(Y,9,15,6),Y=>add(Y,10,15,7),Y=>add(Y,11,14,8),Y=>add(Y,12,14,9),Y=>add(Y+1,1,13,10),Y=>add(Y+1,2,12,11)];
  seq.forEach(f=>f(y-1));seq.forEach(f=>f(y));b.sort((a,b)=>a.date-b.date);
  let idx=-1;for(let i=0;i<b.length;i++){if(b[i].date<=gd)idx=i;else break;}
  if(idx<0)idx=0;const cur=b[idx];const next=b[idx+1]||{date:new Date(gd.getFullYear()+1,2,14),idx:0};
  const dayNo=Math.floor((gd-cur.date)/(24*3600*1000))+1;const daysInThis=Math.floor((next.date-cur.date)/(24*3600*1000));
  const sys=document.querySelector('#punjabiSystem')?.value||'vs';const march14=new Date(gd.getFullYear(),2,14);
  let yearVal=(sys==='vs')?((gd>=march14)?gd.getFullYear()+57:gd.getFullYear()+56):((gd>=march14)?gd.getFullYear()-1468:gd.getFullYear()-1469);
  return{idx:cur.idx,monthName:PUNJABI_MONTHS[cur.idx],day:dayNo,year:yearVal,daysInMonth:daysInThis};
}

/* ---------- Holiday packs ---------- */
function easterDate(year){ // Anonymous Gregorian algorithm
  const f=year=>{let a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,g=Math.floor((8*b+13)/25),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+19*l)/433),n=Math.floor((h+l-7*m+90)/25),p=(h+l-7*m+33*n+19)%32;return{month:n,day:p};};
  const r=f(year);return new Date(year,r.month-1,r.day);
}
function addHoliday(list, date, name, kind="english"){list.push({date:ymd(date), name, kind});}
function germanHolidays(year){ // National + Bavaria
  const L=[];
  addHoliday(L,new Date(year,0,1),"Neujahr"); // Jan 1
  addHoliday(L,new Date(year,4,1),"Tag der Arbeit");
  addHoliday(L,new Date(year,9,3),"Tag der Deutschen Einheit");
  addHoliday(L,new Date(year,11,25),"Weihnachtstag");
  addHoliday(L,new Date(year,11,26),"Zweiter Weihnachtstag");
  const e=easterDate(year);
  addHoliday(L,addDays(e,-2),"Karfreitag");
  addHoliday(L,addDays(e,1),"Ostermontag");
  addHoliday(L,addDays(e,39),"Christi Himmelfahrt");
  addHoliday(L,addDays(e,50),"Pfingstmontag");
  addHoliday(L,addDays(e,60),"Fronleichnam"); // Bavaria
  // Bavaria specific
  addHoliday(L,new Date(year,7,15),"Mariä Himmelfahrt");
  addHoliday(L,new Date(year,10,1),"Allerheiligen");
  return L;
}
function pakistanHolidays(year){
  const L=[];
  addHoliday(L,new Date(year,1,5),"Kashmir Solidarity Day");
  addHoliday(L,new Date(year,2,23),"Pakistan Day");
  addHoliday(L,new Date(year,4,1),"Labour Day");
  addHoliday(L,new Date(year,7,14),"Independence Day");
  addHoliday(L,new Date(year,8,6),"Defence Day");
  addHoliday(L,new Date(year,10,9),"Iqbal Day");
  addHoliday(L,new Date(year,11,25),"Quaid‑e‑Azam Day / Christmas");
  return L;
}

/* ---------- Islamic & Punjabi/Desi events ---------- */
function islamicEvents(d,off){
  const h=hijriOf(d,off);const E=[];
  if(h.month===9 && h.day===1)E.push({name:"Ramadan begins",kind:"islamic"});
  if(h.month===9 && [21,23,25,27,29].includes(h.day))E.push({name:"Laylat al‑Qadr (odd night)",kind:"islamic"});
  if(h.month===10 && [1,2,3].includes(h.day))E.push({name:"Eid al‑Fitr",kind:"islamic"});
  if(h.month===12 && [10,11,12,13].includes(h.day))E.push({name:"Eid al‑Adha",kind:"islamic"});
  if(h.month===1 && h.day===1)E.push({name:"Islamic New Year",kind:"islamic"});
  if(h.month===1 && h.day===10)E.push({name:"ʿAshura (10 Muharram)",kind:"islamic"});
  if(h.month===3 && h.day===12)E.push({name:"Mawlid (12 Rabiʿ I)",kind:"islamic"});
  if(h.month===7 && h.day===27)E.push({name:"Shab‑e‑Miʿraj",kind:"islamic"});
  if(h.month===8 && h.day===15)E.push({name:"Shab‑e‑Barat",kind:"islamic"});
  return E;
}
function punjabiDesiEvents(g){
  const m=g.getMonth()+1, d=g.getDate(); const E=[];
  if(m===1 && d===13)E.push({name:"Lohri",kind:"punjabi"});
  if(m===1 && d===14)E.push({name:"Maghi",kind:"punjabi"});
  if(m===4 && d===14)E.push({name:"Vaisakhi",kind:"punjabi"});
  return E;
}

/* ---------- Reminders (localStorage) ---------- */
const LS_KEY="tri_calendar_reminders_v2";
function loadReminders(){try{return JSON.parse(localStorage.getItem(LS_KEY))||{};}catch{return{};}}
function saveReminders(obj){localStorage.setItem(LS_KEY,JSON.stringify(obj));}
function addReminder(dateStr,title,notes){const db=loadReminders();db[dateStr]=db[dateStr]||[];db[dateStr].push({title,notes,created:Date.now()});saveReminders(db);}
function deleteReminder(dateStr,idx){const db=loadReminders();if(db[dateStr]){db[dateStr].splice(idx,1);if(db[dateStr].length===0)delete db[dateStr];saveReminders(db);}}

/* Export / Import */
const exportBtn=document.getElementById('exportBtn');
const importFile=document.getElementById('importFile');
exportBtn.addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(loadReminders(),null,2)],{type:"application/json"});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download="tri-reminders.json";a.click();
});
importFile.addEventListener('change',(e)=>{
  const f=e.target.files?.[0]; if(!f) return;
  const reader=new FileReader(); reader.onload=()=>{
    try{const data=JSON.parse(reader.result); if(typeof data==='object'){const cur=loadReminders(); saveReminders(Object.assign(cur,data)); alert("Imported reminders."); render();}}
    catch(err){alert("Import failed: "+err);}
  }; reader.readAsText(f);
});

/* ---------- Weather & Spray Alerts (Sahiwal) ---------- */
const weatherBox=document.getElementById('weatherBox');
const refreshWeatherBtn=document.getElementById('refreshWeather');
const WEATHER_CACHE_KEY='tri_weather_cache_v1';
async function fetchWeather(){
  const lat=30.666, lon=73.10;
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m&timezone=auto`;
  try{
    const res=await fetch(url); const json=await res.json();
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ts:Date.now(),json}));
    return json;
  }catch(e){
    const cached=localStorage.getItem(WEATHER_CACHE_KEY);
    if(cached){return JSON.parse(cached).json;}
    throw e;
  }
}
function analyzeSpray(json){
  try{
    const h=json.hourly; const nowIdx=0; // simple summary based on min of today
    // compute recommended windows: wind < 15, gust < 25, RH 40-85, temp < 32
    let okHours=[];
    for(let i=0;i<h.time.length && i<24;i++){
      const t=h.temperature_2m[i], rh=h.relative_humidity_2m[i], w=h.wind_speed_10m[i], g=h.wind_gusts_10m[i];
      if(w<15 && g<25 && rh>=40 && rh<=85 && t<32) okHours.push(i);
    }
    if(okHours.length){
      const first=okHours[0]; const last=okHours[okHours.length-1];
      return `✔️ Spray window likely ${h.time[first].slice(11,16)}–${h.time[last].slice(11,16)} (wind <15 km/h, RH 40–85%).`;
    }else{
      return `⚠️ No ideal spray window today (wind/RH/temp outside range).`;
    }
  }catch{return "Weather unavailable.";}
}
async function refreshWeatherUI(){
  weatherBox.textContent="Loading weather…";
  try{
    const json=await fetchWeather();
    const tip=analyzeSpray(json);
    const w0=json.hourly.wind_speed_10m[0], g0=json.hourly.wind_gusts_10m[0];
    weatherBox.textContent=`Wind now ~${Math.round(w0)} km/h (gust ${Math.round(g0)}). ${tip}`;
  }catch(e){
    weatherBox.textContent="Offline and no cached weather.";
  }
}
refreshWeatherBtn.addEventListener('click', refreshWeatherUI);

/* ---------- Settings refs ---------- */
const content=document.getElementById('content');
const datePicker=document.getElementById('datePicker');
const todayBtn=document.getElementById('todayBtn');
const hijriOffsetInput=document.getElementById('hijriOffset');
const addReminderBtn=document.getElementById('addReminderBtn');
const reminderDialog=document.getElementById('reminderDialog');
const reminderDateEl=document.getElementById('reminderDate');
const remTitle=document.getElementById('remTitle');
const remNotes=document.getElementById('remNotes');
const pkHolidays=document.getElementById('pkHolidays');
const deHolidays=document.getElementById('deHolidays');

/* ---------- Rendering ---------- */
function setBaseDate(d){datePicker.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function getBaseDate(){const v=datePicker.value;if(!v)return new Date();const [y,m,d]=v.split('-').map(Number);return new Date(y,m-1,d);}
function isToday(d){const t=new Date();return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate();}

function allEventsForDate(d){
  let arr=[];
  const off=Number(hijriOffsetInput.value||0);
  arr=arr.concat(islamicEvents(d,off));
  arr=arr.concat(punjabiDesiEvents(d));
  // national packs
  if(pkHolidays.checked) arr=arr.concat(pakistanHolidays(d.getFullYear()).filter(x=>x.date===ymd(d)).map(x=>({name:x.name,kind:'english'})));
  if(deHolidays.checked) arr=arr.concat(germanHolidays(d.getFullYear()).filter(x=>x.date===ymd(d)).map(x=>({name:x.name,kind:'english'})));
  // user reminders
  const db=loadReminders(); const key=ymd(d); if(db[key]) arr=arr.concat(db[key].map(r=>({name:r.title,notes:r.notes,kind:'custom'})));
  return arr;
}

function renderDay(d){
  const hijri=hijriOf(d,hijriOffsetInput.value), pun=punjabiInfoFromGregorian(d);
  const hBadge=`<span class="badge">offset ${Number(hijriOffsetInput.value)}</span>`;
  const pBadge=`<span class="badge">${pun.daysInMonth}-day month</span>`;
  const ev=allEventsForDate(d);
  const list = ev.length?("<ul>"+ev.map((e,i)=>`<li><span class="badge">${e.kind}</span> ${e.name||""}${e.notes?` — <span class="muted">${e.notes}</span>`:""} ${e.kind==="custom"?`<button class="ghost small" data-del="${i}">Delete</button>`:""}</li>`).join("")+"</ul>"):"<p class='muted'>No events.</p>";
  content.innerHTML=`
  <div class="card">
    <h2>${fmtGregorian(d)} ${isToday(d)?'<span class="badge">today</span>':''}</h2>
    <div>English: <strong>${short(d)} ${d.getFullYear()}</strong></div>
    <div>Islamic: <strong>${hijri.day} ${hijri.name} ${hijri.year}</strong> ${hBadge}</div>
    <div>Panjabi: <strong>${pun.day} ${pun.monthName} ${pun.year}</strong> ${pBadge}</div>
  </div>
  ${farmingDetailsHTML(pun.idx)}
  <div class="card"><h3>Events & Reminders</h3>${list}</div>`;
  // delete handlers
  const key=ymd(d); const myRems=loadReminders()[key]||[];
  content.querySelectorAll("[data-del]").forEach((btn,ix)=>btn.addEventListener('click',()=>{deleteReminder(key,ix);render();}));
}

function renderWeek(d){
  const start=startOfWeek(d); const end=addDays(start,6);
  let html=`<div class="card"><h2>Week of ${short(start)} → ${short(end)} ${end.getFullYear()}</h2>`;
  for(let i=0;i<7;i++){
    const cur=addDays(start,i); const hijri=hijriOf(cur,hijriOffsetInput.value); const pun=punjabiInfoFromGregorian(cur);
    const ev=allEventsForDate(cur).map(e=>e.name).slice(0,3).join(" • ");
    html+=`<div class="card" data-goto="${ymd(cur)}">
      <div><strong>${fmtGregorian(cur)} ${isToday(cur)?'<span class="badge">today</span>':''}</strong></div>
      <div class="muted small">I: ${hijri.day} ${hijri.name} · P: ${pun.day} ${pun.monthName}</div>
      <div class="small">${ev||'No events'}</div>
    </div>`;
  }
  html+="</div>"; content.innerHTML=html;
  content.querySelectorAll("[data-goto]").forEach(el=>el.addEventListener('click',()=>{
    const [y,m,dd]=el.dataset.goto.split('-').map(Number); setBaseDate(new Date(y,m-1,dd)); setActiveView('day'); render();
  }));
}

function renderMonth(d){
  const y=d.getFullYear(), m=d.getMonth(); const first=new Date(y,m,1); const dim=daysInMonth(y,m);
  const firstStart=startOfWeek(first); const last=new Date(y,m,dim); const lastEnd=addDays(startOfWeek(last),6);
  let cur=new Date(firstStart);
  let html=`<div class="card"><div class="month-header"><h2>${first.toLocaleString(undefined,{month:'long'})} ${y}</h2>
  <div class="nav-buttons"><button id="prevMonth">◀</button><button id="todayMonth">This month</button><button id="nextMonth">▶</button></div></div>
  <div class="calendar-grid">
    <div class="cell"><strong>Mon</strong></div><div class="cell"><strong>Tue</strong></div><div class="cell"><strong>Wed</strong></div><div class="cell"><strong>Thu</strong></div><div class="cell"><strong>Fri</strong></div><div class="cell"><strong>Sat</strong></div><div class="cell"><strong>Sun</strong></div>`;
  while(cur<=lastEnd){
    const inMonth=(cur.getMonth()===m);
    const hijri=hijriOf(cur,hijriOffsetInput.value); const pun=punjabiInfoFromGregorian(cur);
    const hasEvt=allEventsForDate(cur).length>0;
    html+=`<div class="cell ${isToday(cur)?'today':''}" data-goto="${ymd(cur)}" style="opacity:${inMonth?1:.45}">
      <div class="gdate"><span>${cur.getDate()}</span>${hasEvt?'<span class="badge">•</span>':''}</div>
      <div class="sub">I: ${hijri.day} ${hijri.name.slice(0,3)}</div>
      <div class="sub">P: ${pun.day} ${pun.monthName.slice(0,3)}</div>
    </div>`;
    cur=addDays(cur,1);
  }
  html+=`</div></div>`; content.innerHTML=html;
  document.getElementById('prevMonth').onclick=()=>{const b=getBaseDate(); b.setMonth(b.getMonth()-1); setBaseDate(b); render();};
  document.getElementById('todayMonth').onclick=()=>{const n=new Date(); n.setDate(1); setBaseDate(n); render();};
  document.getElementById('nextMonth').onclick=()=>{const b=getBaseDate(); b.setMonth(b.getMonth()+1); setBaseDate(b); render();};
  content.querySelectorAll("[data-goto]").forEach(el=>el.addEventListener('click',()=>{
    const [y,m,dd]=el.dataset.goto.split('-').map(Number); setBaseDate(new Date(y,m-1,dd)); setActiveView('day'); render();
  }));
}

function renderYear(d){
  const y=d.getFullYear(); let html=`<div class="calendar-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">`;
  for(let m=0;m<12;m++){
    const first=new Date(y,m,1); const dim=daysInMonth(y,m);
    let inner=`<div class="calendar-grid">`;
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(w=>inner+=`<div class="cell"><strong>${w}</strong></div>`);
    let cur=startOfWeek(first), last=new Date(y,m,dim), end=addDays(startOfWeek(last),6);
    while(cur<=end){
      const inMonth=(cur.getMonth()===m);
      const hijri=hijriOf(cur,hijriOffsetInput.value); const pun=punjabiInfoFromGregorian(cur);
      inner+=`<div class="cell ${isToday(cur)?'today':''}" style="opacity:${inMonth?1:.45}">
        <div class="gdate">${cur.getDate()}</div>
        <div class="sub">I: ${hijri.day} ${hijri.name.slice(0,3)}</div>
        <div class="sub">P: ${pun.day} ${pun.monthName.slice(0,3)}</div>
      </div>`;
      cur=addDays(cur,1);
    }
    inner+='</div>';
    html+=`<div class="card"><h3>${first.toLocaleString(undefined,{month:'long'})}</h3>${inner}</div>`;
  }
  html+='</div>'; content.innerHTML=html;
}

function setActiveView(v){document.querySelectorAll('.segmented button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));}

/* ---------- Farming Guide (per Punjabi month) ---------- */
function farmingDetailsHTML(idx){
  const en=[
    ["Wheat: final irrigation; heading begins.","Sugarcane (ratoon): cleaning & fertilizer.","Sunflower harvest; sow fodder.","Start field prep for cotton."],
    ["Wheat: harvesting & threshing.","Cotton: sowing; first irrigation; weeding.","Second-season maize; okra/bitter gourd.","Hot winds (loo): livestock/orchard care."],
    ["Wheat: threshing & stacking.","Cotton: weeding; scout pests.","Rice: nursery prep; maize fodder.","Irrigate orchards in heat waves."],
    ["Rice: transplant + first flood.","Cotton: watch whitefly/bollworm.","Sugarcane: fertilizer + earthing up."],
    ["Monsoon: ensure drainage.","Rice: tillering; manage water.","Cotton: reduce flower drop; balanced nutrition.","Summer maize harvest."],
    ["Rice: booting; watch disease.","Cotton: boll formation; late-pest control.","Jantar/cluster bean fodder; late maize possible.","Early sugarcane for jaggery (some areas)."],
    ["Rice: harvesting begins.","Cotton: first picking; field hygiene.","Wheat: land prep; mustard sowing end."],
    ["Wheat: peak sowing window.","Cotton: 2nd/3rd picks.","Sugarcane: harvesting begins.","Gram/peas/linseed sowing."],
    ["Wheat: steady growth.","Potato: early digging; mustard flowering.","Gram sprouting; frost/fog precautions."],
    ["Fog season: limit sprays; protect workers/livestock.","Wheat: tillering; avoid waterlogging.","Potato: major harvest; mustard pods."],
    ["Wheat: 2nd irrigation; weed control.","Gram: pod formation; protect from pod borer.","Mustard: harvest toward end; vegetables improve."],
    ["Wheat: milk stage; timely irrigation.","Mustard/potato harvest; sugarcane planting.","Deep ploughing for cotton."]
  ];
  const ur=[
    ["گندم: آخری پانی؛ بالی نکلنا۔","گنا (پرانی): صفائی/کھاد۔","سورج مکھی برداشت؛ چارہ بوائی۔","کپاس کیلئے زمین تیاری۔"],
    ["گندم: کٹائی و گہائی۔","کپاس: بوائی، پہلا پانی، گوڈی۔","دوسری فصل مکئی؛ بھنڈی/کریلا۔","لو: مویشی/باغات خیال۔"],
    ["گندم: گہائی و گٹھڑی۔","کپاس: گوڈی؛ کیڑوں کی نگرانی۔","چاول: نرسری؛ چارہ مکئی۔","گرمی میں باغات کو پانی۔"],
    ["چاول: پنیری و پہلا پانی۔","کپاس: وائٹ فلائی/بال ورم پر نظر۔","گنا: کھاد اور مٹی چڑھائی۔"],
    ["برسات؛ نکاسی آب یقینی۔","چاول: ٹیلرنگ؛ پانی کنٹرول۔","کپاس: پھول گرنا کم کریں۔","گرمیوں کی مکئی برداشت۔"],
    ["چاول: بال آنا؛ بیماری نگرانی۔","کپاس: ڈوڈی بننا؛ دیرینہ کیڑے سے بچاؤ۔","جنتر/گوار چارہ؛ دیر سے مکئی ممکن۔","گڑ بنانے کے لیے ابتدائی گنا۔"],
    ["چاول: کٹائی شروع۔","کپاس: پہلی چنائی؛ صفائی۔","گندم: زمین تیاری؛ آخر میں سرسوں۔"],
    ["گندم: بہترین بوائی وقت۔","کپاس: دوسری/تیسری چنائی۔","گنا: برداشت شروع۔","چنا/مٹر/السی بوائی۔"],
    ["گندم: متوازن بڑھوتری۔","آلو: ابتدائی کھدائی؛ سرسوں میں پھول۔","چنا اگاؤ؛ کہر/دھند سے بچاؤ۔"],
    ["دھند: اسپرے محدود؛ حفاظت۔","گندم: ٹیلرنگ؛ پانی کھڑا نہ ہو۔","آلو: بڑی برداشت؛ سرسوں پھلیاں۔"],
    ["گندم: دوسرا پانی؛ جڑی بوٹی کنٹرول۔","چنا: پھلیاں؛ پھلی چھیدو سے بچاؤ۔","سرسوں: آخر میں کٹائی؛ سبزیاں بہتر۔"],
    ["گندم: دودھیا دانہ؛ بروقت آبپاشی۔","سرسوں/آلو برداشت؛ گنے کی کاشت۔","کپاس کیلئے گہری جوت۔"]
  ];
  return `<div class="card">
    <h3>Farming Guide — ${PUNJABI_MONTHS[idx]}</h3>
    <div class="dual"><div><ul>${en[idx].map(x=>`<li>${x}</li>`).join('')}</ul></div>
    <div dir="rtl" style="font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',serif"><ul>${ur[idx].map(x=>`<li>${x}</li>`).join('')}</ul></div></div>
  </div>`;
}

/* ---------- App wiring ---------- */
function render(){const d=getBaseDate();const active=document.querySelector('.segmented button.active')?.dataset.view||'day'; if(active==='day')renderDay(d);else if(active==='week')renderWeek(d);else if(active==='month')renderMonth(d);else renderYear(d);}
function setActiveHandlers(){
  document.querySelectorAll('.segmented button').forEach(btn=>btn.addEventListener('click',()=>{setActiveView(btn.dataset.view); render();}));
  datePicker.addEventListener('change', render);
  todayBtn.addEventListener('click', ()=>{setBaseDate(new Date()); render();});
  hijriOffsetInput.addEventListener('change', render);
  document.getElementById('punjabiSystem').addEventListener('change', render);
  pkHolidays.addEventListener('change', render);
  deHolidays.addEventListener('change', render);
  addReminderBtn.addEventListener('click', ()=>{const d=getBaseDate();reminderDateEl.textContent=fmtGregorian(d);remTitle.value='';remNotes.value='';reminderDialog.showModal();});
  document.getElementById('saveReminder').addEventListener('click',(e)=>{e.preventDefault();const d=getBaseDate();if(!remTitle.value.trim())return;addReminder(ymd(d),remTitle.value.trim(),remNotes.value.trim());reminderDialog.close();render();});
}
(function init(){ setBaseDate(new Date()); setActiveHandlers(); render(); refreshWeatherUI(); })();
