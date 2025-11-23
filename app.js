function pad(n){ return n<10 ? "0"+n : ""+n; }
function cloneDate(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d, delta){ const x = cloneDate(d); x.setDate(x.getDate()+delta); return x; }
function startOfWeek(d, weekStartsOn=1){ const x = cloneDate(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); return x; }
function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
function ymd(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function gregorianToJD(y,m,d){ const a=Math.floor((14-m)/12); const y2=y+4800-a; const m2=m+12*a-3; return d+Math.floor((153*m2+2)/5)+365*y2+Math.floor(y2/4)-Math.floor(y2/100)+Math.floor(y2/400)-32045; }
const ISLAMIC_EPOCH=1948439;
function islamicToJD(y,m,d){ return d+Math.ceil(29.5*(m-1))+(y-1)*354+Math.floor((3+11*y)/30)+ISLAMIC_EPOCH-1; }
function jdToIslamic(jd){ const y=Math.floor((30*(jd-ISLAMIC_EPOCH)+10646)/10631); let m=Math.min(12, Math.ceil((jd-islamicToJD(y,1,1)+1)/29.5)); const d=jd-islamicToJD(y,m,1)+1; return {year:y, month:m, day:d}; }
const ISLAMIC_MONTHS=["Muharram","Safar","Rabiʿ I","Rabiʿ II","Jumada I","Jumada II","Rajab","Shaʿban","Ramadan","Shawwal","Dhu al-Qidah","Dhu al-Hijjah"];
const PUNJABI_MONTHS=["Chet","Vaisakh","Jeth","Harh","Sawan","Bhadon","Assu","Katak","Maghar","Poh","Magh","Phagun"];
function hijriOf(d, off){ const base=new Date(d); if(off) base.setDate(base.getDate()+Number(off)); const jd=gregorianToJD(base.getFullYear(), base.getMonth()+1, base.getDate()); const ih=jdToIslamic(jd); ih.name=ISLAMIC_MONTHS[ih.month-1]; return ih; }
function punjabiInfoFromGregorian(gd){
  const y=gd.getFullYear(); const boundaries=[];
  function pushB(year,m,d,idx){ boundaries.push({date:new Date(year,m-1,d), idx}); }
  const seq=[(Y)=>pushB(Y,3,14,0),(Y)=>pushB(Y,4,14,1),(Y)=>pushB(Y,5,15,2),(Y)=>pushB(Y,6,15,3),(Y)=>pushB(Y,7,16,4),(Y)=>pushB(Y,8,16,5),(Y)=>pushB(Y,9,15,6),(Y)=>pushB(Y,10,15,7),(Y)=>pushB(Y,11,14,8),(Y)=>pushB(Y,12,14,9),(Y)=>pushB(Y+1,1,13,10),(Y)=>pushB(Y+1,2,12,11)];
  seq.forEach(f=>f(y-1)); seq.forEach(f=>f(y)); boundaries.sort((a,b)=>a.date-b.date);
  let idxFound=-1; for(let i=0;i<boundaries.length;i++){ if(boundaries[i].date<=gd) idxFound=i; else break; }
  if(idxFound<0) idxFound=0; const current=boundaries[idxFound]; const next=boundaries[idxFound+1]||{date:new Date(gd.getFullYear()+1,2,14), idx:0};
  const dayNo=Math.floor((gd-current.date)/(24*3600*1000))+1; const monthName=PUNJABI_MONTHS[current.idx];
  const system=document.querySelector("#punjabiSystem")?.value||"vs"; const gMarch14=new Date(gd.getFullYear(),2,14);
  let yearVal=(system==="vs")?((gd>=gMarch14)?gd.getFullYear()+57:gd.getFullYear()+56):((gd>=gMarch14)?gd.getFullYear()-1468:gd.getFullYear()-1469);
  const daysInThis=Math.floor((next.date-current.date)/(24*3600*1000));
  return { idx:current.idx, monthName, day:dayNo, year:yearVal, daysInMonth:daysInThis };
}
function fmtGregorian(d){ return d.toLocaleDateString(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"}); }
function englishShort(d){ return `${d.getDate()} ${d.toLocaleString(undefined,{month:"short"})} ${d.getFullYear()}`; }

// Theme fix: default light; .dark forces dark. No system override.
const darkToggle=document.getElementById("darkToggle");
(function initTheme(){
  const stored = localStorage.getItem("tri_theme");
  const isDark = stored ? (stored === 'dark') : false;
  document.documentElement.classList.toggle('dark', isDark);
  darkToggle.textContent = isDark ? '☀️' : '🌙';
  darkToggle.addEventListener('click', ()=>{
    const nextDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('tri_theme', nextDark ? 'dark' : 'light');
    darkToggle.textContent = nextDark ? '☀️' : '🌙';
  });
})();

function setBaseDate(d){ document.getElementById("datePicker").value = `${d.getFullYear()}-${('0'+(d.getMonth()+1)).slice(-2)}-${('0'+d.getDate()).slice(-2)}`; }
function getBaseDate(){ const v=document.getElementById("datePicker").value; if(!v) return new Date(); const [y,m,d]=v.split('-').map(Number); return new Date(y,m-1,d); }
function isToday(d){ const t=new Date(); return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate(); }

const LS_KEY="tri_calendar_reminders_v1";
function loadReminders(){ try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch(e){ return {}; } }
function saveReminders(obj){ localStorage.setItem(LS_KEY, JSON.stringify(obj)); }
function addReminder(dateStr,title,notes){ const db=loadReminders(); db[dateStr]=db[dateStr]||[]; db[dateStr].push({title,notes,created:Date.now()}); saveReminders(db); }
function deleteReminder(dateStr, idx){ const db=loadReminders(); if(db[dateStr]){ db[dateStr].splice(idx,1); if(db[dateStr].length===0) delete db[dateStr]; saveReminders(db);}}

function specialEventsForDate(d, hijriOffset){
  const events=[]; const h=hijriOf(d,hijriOffset); const m=d.getMonth()+1, day=d.getDate();
  if(h.month===9 && h.day===1) events.push({kind:"islamic", name:"Ramadan begins"});
  if(h.month===9 && [21,23,25,27,29].includes(h.day)) events.push({kind:"islamic", name:"Laylat al-Qadr (odd night)"});
  if(h.month===10 && h.day===1) events.push({kind:"islamic", name:"Eid al-Fitr"});
  if(h.month===12 && h.day===10) events.push({kind:"islamic", name:"Eid al-Adha"});
  if(h.month===1 && h.day===1) events.push({kind:"islamic", name:"Islamic New Year"});
  if(h.month===1 && h.day===10) events.push({kind:"islamic", name:"Ashura (10 Muharram)"});
  if(h.month===3 && h.day===12) events.push({kind:"islamic", name:"Mawlid (12 Rabiʿ I)"});
  if(h.month===7 && h.day===27) events.push({kind:"islamic", name:"Shab-e-Mi'raj"});
  if(h.month===8 && h.day===15) events.push({kind:"islamic", name:"Shab-e-Barat"});
  if(m===1 && day===1) events.push({kind:"english", name:"New Year’s Day"});
  if(m===2 && day===14) events.push({kind:"english", name:"Valentine’s Day"});
  if(m===5 && day===1) events.push({kind:"english", name:"Labour Day"});
  if(m===8 && day===14) events.push({kind:"english", name:"Pakistan Independence Day"});
  if(m===10 && day===3) events.push({kind:"english", name:"German Unity Day"});
  if(m===12 && day===25) events.push({kind:"english", name:"Christmas Day"});
  if(m===1 && day===13) events.push({kind:"punjabi", name:"Lohri"});
  if(m===1 && day===14) events.push({kind:"punjabi", name:"Maghi"});
  if(m===3 && day===14) events.push({kind:"punjabi", name:"Chet starts (Desi New Year)"});
  if(m===4 && day===14) events.push({kind:"punjabi", name:"Vaisakhi"});
  return events;
}

const content=document.getElementById("content");
const todayBtn=document.getElementById("todayBtn");
const hijriOffsetInput=document.getElementById("hijriOffset");
const reminderDialog=document.getElementById("reminderDialog");
const reminderDateEl=document.getElementById("reminderDate");
const remTitle=document.getElementById("remTitle");
const remNotes=document.getElementById("remNotes");
const addReminderBtn=document.getElementById("addReminderBtn");

function farmingDetailsHTML(idx){
  const f=[
    ["Wheat: final irrigation (last pani); heading begins.","Sugarcane (ratoon): cleaning + fertilizer.","Sunflower harvest; sow fodder (maize/elephant grass).","Start field prep for cotton."],
    ["Wheat: harvesting & threshing begins.","Cotton: sowing; first irrigation; early weeding.","Maize (2nd season) possible; okra/bitter gourd planting.","Hot winds (loo): livestock care + orchard watering."],
    ["Wheat: threshing/stacking.","Cotton: weeding + insect scouting.","Rice: nursery preparation; maize fodder sowing.","Heatwave: irrigate orchards."],
    ["Rice: transplanting + first flood irrigation.","Cotton: monitor whitefly/bollworm; timely sprays.","Sugarcane: fertilizer + earthing up."],
    ["Monsoon: ensure drainage.","Rice: tillering; maintain water carefully.","Cotton: control flower drop; balanced nutrition.","Summer maize harvest; vegetables thrive."],
    ["Rice: booting; monitor pests/disease.","Cotton: boll formation; protect from late pests.","Fodder jantar/cluster bean sowing; late maize possible.","Early sugarcane for jaggery (some areas)."],
    ["Rice: harvesting begins.","Cotton: first picking; clean fields.","Wheat: land prep; mustard sowing end of month."],
    ["Wheat: peak sowing window.","Cotton: 2nd/3rd pickings.","Sugarcane: harvesting begins.","Gram/peas/linseed sowing."],
    ["Wheat: steady growth.","Potato: early digging; mustard flowering.","Gram sprouting; watch frost/fog; cattle care."],
    ["Fog season: limit sprays; protect workers/livestock.","Wheat: tillering; avoid waterlogging.","Potato: major harvest; mustard pods."],
    ["Wheat: 2nd irrigation; manage weeds.","Gram: pod formation; protect from pod borer.","Mustard: harvest toward end; vegetables improve."],
    ["Wheat: milk stage; timely irrigation.","Mustard/potato harvest; sugarcane planting.","Deep ploughing for cotton."]
  ];
  const ur=[
    ["گندم: آخری پانی، بالی نکلنا شروع۔","گنا (پرانی فصل): صفائی اور کھاد۔","سورج مکھی کی برداشت؛ چارہ بوائی۔","کپاس کے لیے زمین کی تیاری۔"],
    ["گندم: کٹائی و گہائی۔","کپاس: بوائی، پہلا پانی، ابتدائی گوڈی۔","مکئی دوسری فصل؛ بھنڈی/کریلا۔","لو: مویشی/باغات کی دیکھ بھال۔"],
    ["گندم: گہائی و گٹھڑی۔","کپاس: گوڈی، کیڑوں کی نگرانی۔","چاول: نرسری؛ چارہ مکئی۔","گرمی میں باغات کو پانی۔"],
    ["چاول: پنیری اور پہلا پانی۔","کپاس: وائٹ فلائی/بال ورم کنٹرول۔","گنا: کھاد اور مٹی چڑھائی۔"],
    ["برسات؛ نکاسی آب یقینی۔","چاول: ٹیلرنگ؛ پانی کا دھیان۔","کپاس: پھول گرنے کی روک تھام۔","گرمیوں کی مکئی کی برداشت۔"],
    ["چاول: بال آنا؛ کیڑے/بیماری پر نظر۔","کپاس: ڈوڈی بننا؛ دیرینہ کیڑے سے بچاؤ۔","جنتر/گوار چارہ بوائی؛ دیر سے مکئی ممکن۔","کچھ جگہ گڑ کی تیاری۔"],
    ["چاول: کٹائی شروع۔","کپاس: پہلی چنائی؛ کھیت صاف۔","گندم: زمین کی تیاری؛ آخر میں سرسوں۔"],
    ["گندم: بہترین کاشت وقت۔","کپاس: دوسری/تیسری چنائی۔","گنا: برداشت شروع۔","چنا، مٹر، السی بوائی۔"],
    ["گندم: متوازن بڑھوتری۔","آلو: ابتدائی کھدائی؛ سرسوں میں پھول۔","چنے کی اگاؤ؛ کہر/دھند؛ مویشی خیال۔"],
    ["دھند: اسپرے محدود؛ کارکن/مویشی حفاظت۔","گندم: ٹیلرنگ؛ پانی کھڑا نہ ہو۔","آلو: بڑی برداشت؛ سرسوں پھلیاں۔"],
    ["گندم: دوسرا پانی؛ جڑی بوٹی کنٹرول۔","چنا: پھلیاں؛ پھلی چھیدو سے بچاؤ۔","سرسوں: آخر میں کٹائی؛ سبزیاں بہتر۔"],
    ["گندم: دودھیا دانہ؛ بروقت آبپاشی۔","سرسوں/آلو کی برداشت؛ گنے کی کاشت۔","کپاس کے لیے گہری جوت۔"]
  ];
  const idx=punjabiInfoFromGregorian(getBaseDate()).idx;
  return `<div class="card"><h3>Farming Guide</h3><div class="dual"><div class="en"><ul>${f[idx].map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="ur"><ul>${ur[idx].map(x=>`<li>${x}</li>`).join('')}</ul></div></div></div>`;
}

function renderDay(d){
  const hijri=hijriOf(d, hijriOffsetInput.value); const pun=punjabiInfoFromGregorian(d);
  const dateStr=ymd(d); const myRems=loadReminders()[dateStr]||[]; const autos=specialEventsForDate(d, hijriOffsetInput.value);
  const all=[...myRems.map(r=>({kind:"custom",name:r.title,notes:r.notes})), ...autos];
  let eventsHtml = all.length ? `<ul>`+all.map((e,i)=>`<li><span class="badge">${e.kind}</span> ${e.name||""}${e.notes?` — <span class="muted">${e.notes}</span>`:""} ${e.kind==="custom"?`<button class="ghost small" data-del="${i}">Delete</button>`:""}</li>`).join("") + `</ul>` : `<p class="muted">No events.</p>`;
  const hBadge=`<span class="badge">offset ${Number(hijriOffsetInput.value)}</span>`; const pBadge=`<span class="badge">${pun.daysInMonth}-day month</span>`;
  content.innerHTML = `<div class="card"><h2>${fmtGregorian(d)} ${isToday(d)?'<span class="badge">today</span>':''}</h2><div class="rowline">English: <strong>${englishShort(d)}</strong></div><div class="rowline">Islamic: <strong>${hijri.day} ${hijri.name} ${hijri.year}</strong> ${hBadge}</div><div class="rowline">Punjabi: <strong>${pun.day} ${pun.monthName} ${pun.year}</strong> ${pBadge}</div></div>` + farmingDetailsHTML(pun.idx) + `<div class="card"><h3>Events & Reminders</h3>${eventsHtml}</div>`;
  content.querySelectorAll("[data-del]").forEach(btn=>btn.addEventListener("click",()=>{ const idx=Number(btn.dataset.del); deleteReminder(dateStr, idx); render(); }));
}

function renderWeek(d){
  const start=startOfWeek(d); const end=addDays(start,6); let html=`<div class="card"><h2>Week of ${englishShort(start)} → ${englishShort(end)}</h2>`;
  for(let i=0;i<7;i++){ const cur=addDays(start,i); const hijri=hijriOf(cur, hijriOffsetInput.value); const pun=punjabiInfoFromGregorian(cur); const dateStr=ymd(cur); const myRems=loadReminders()[dateStr]||[]; const autos=specialEventsForDate(cur, hijriOffsetInput.value); const summaries=[...autos.map(e=>e.name), ...myRems.map(r=>`🔔 ${r.title}`)].slice(0,3).join(" • "); html += `<div class="card smallcard" data-goto="${dateStr}"><div><strong>${fmtGregorian(cur)}${isToday(cur)?' <span class="badge">today</span>':''}</strong></div><div class="rowline">I: ${hijri.day} ${hijri.name} · P: ${pun.day} ${pun.monthName}</div><div class="rowline">${summaries || '<span class="muted">No events</span>'}</div></div>`; }
  html += `</div>`; content.innerHTML=html;
  content.querySelectorAll("[data-goto]").forEach(card=>card.addEventListener("click",()=>{ const [yy,mm,dd]=card.dataset.goto.split("-").map(Number); setBaseDate(new Date(yy,mm-1,dd)); document.querySelector('.segmented [data-view="day"]').click(); }));
}

function renderMonth(d){
  const y=d.getFullYear(), m=d.getMonth(); const first=new Date(y,m,1); const days=daysInMonth(y,m);
  const firstWeekStart=startOfWeek(first); const last=new Date(y,m,days); const lastWeekEnd=addDays(startOfWeek(last),6);
  let cur=new Date(firstWeekStart); let html=`<div class="card"><div class="month-header"><h2>${first.toLocaleString(undefined,{month:"long"})} ${y}</h2><div class="nav-buttons"><button id="prevMonth">◀</button><button id="thisMonth">This month</button><button id="nextMonth">▶</button></div></div><div class="calendar-grid"><div class="cell"><strong>Mon</strong></div><div class="cell"><strong>Tue</strong></div><div class="cell"><strong>Wed</strong></div><div class="cell"><strong>Thu</strong></div><div class="cell"><strong>Fri</strong></div><div class="cell"><strong>Sat</strong></div><div class="cell"><strong>Sun</strong></div>`;
  while(cur<=lastWeekEnd){ const inMonth=(cur.getMonth()===m); const hijri=hijriOf(cur, hijriOffsetInput.value); const pun=punjabiInfoFromGregorian(cur); const dateStr=ymd(cur); const myRems=loadReminders()[dateStr]||[]; const autos=specialEventsForDate(cur, hijriOffsetInput.value); const hasEvent=(myRems.length+autos.length)>0; html += `<div class="cell ${isToday(cur)?'today':''}" data-goto="${dateStr}" style="opacity:${inMonth?1:0.45}"><div class="gdate"><span>${cur.getDate()}</span>${hasEvent?'<span class="badge">•</span>':''}</div><div class="sub">I: ${hijri.day} ${hijri.name.slice(0,3)}</div><div class="sub">P: ${pun.day} ${pun.monthName.slice(0,3)}</div></div>`; cur=addDays(cur,1); }
  html += `</div></div>`; content.innerHTML=html;
  document.getElementById("prevMonth").onclick=()=>{ const base=getBaseDate(); base.setMonth(base.getMonth()-1); setBaseDate(base); render(); };
  document.getElementById("thisMonth").onclick=()=>{ const now=new Date(); now.setDate(1); setBaseDate(now); render(); };
  document.getElementById("nextMonth").onclick=()=>{ const base=getBaseDate(); base.setMonth(base.getMonth()+1); setBaseDate(base); render(); };
  content.querySelectorAll("[data-goto]").forEach(cell=>cell.addEventListener("click",()=>{ const [yy,mm,dd]=cell.dataset.goto.split("-").map(Number); setBaseDate(new Date(yy,mm-1,dd)); document.querySelector('.segmented [data-view="day"]').click(); }));
}

function renderYear(d){
  const y=d.getFullYear(); let html=`<div class="year-grid">`;
  for(let m=0;m<12;m++){ const first=new Date(y,m,1); const days=daysInMonth(y,m); let inner=`<div class="calendar-grid">`; ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(w=>inner+=`<div class="cell"><strong>${w}</strong></div>`); let cur=startOfWeek(first); const last=new Date(y,m,days); const lastEnd=addDays(startOfWeek(last),6); while(cur<=lastEnd){ const inMonth=(cur.getMonth()===m); const hijri=hijriOf(cur, hijriOffsetInput.value); const pun=punjabiInfoFromGregorian(cur); inner += `<div class="cell ${isToday(cur)?'today':''}" style="opacity:${inMonth?1:0.45}"><div class="gdate">${cur.getDate()}</div><div class="sub">I: ${hijri.day} ${hijri.name.slice(0,3)}</div><div class="sub">P: ${pun.day} ${pun.monthName.slice(0,3)}</div></div>`; cur=addDays(cur,1);} inner += `</div>`; html += `<div class="month-card"><h3>${first.toLocaleString(undefined,{month:"long"})}</h3>${inner}</div>`; }
  html += `</div>`; content.innerHTML=html;
}

function render(){ const d=getBaseDate(); const active=document.querySelector(".segmented button.active")?.dataset.view||"day"; if(active==="day") renderDay(d); else if(active==="week") renderWeek(d); else if(active==="month") renderMonth(d); else renderYear(d); }

(function init(){
  const now=new Date(); setBaseDate(now); render();
  document.getElementById("datePicker").addEventListener("change", render);
  todayBtn.addEventListener("click", ()=>{ setBaseDate(new Date()); render(); });
  hijriOffsetInput.addEventListener("change", render);
  document.getElementById("punjabiSystem").addEventListener("change", render);
  document.querySelectorAll(".segmented button").forEach(btn=>btn.addEventListener("click", ()=>{ document.querySelectorAll(".segmented button").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); render(); }));
  addReminderBtn.addEventListener("click", ()=>{ const d=getBaseDate(); reminderDateEl.textContent=fmtGregorian(d); remTitle.value=""; remNotes.value=""; reminderDialog.showModal(); });
  document.getElementById("saveReminder").addEventListener("click",(e)=>{ e.preventDefault(); const d=getBaseDate(); const dateStr=ymd(d); if(remTitle.value.trim().length===0){ return; } addReminder(dateStr, remTitle.value.trim(), remNotes.value.trim()); reminderDialog.close(); render(); });
})();