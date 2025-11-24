(() => {
const $=s=>document.querySelector(s);
const root=document.documentElement;

// THEME
function applyTheme(t){
  const mode=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;
  root.dataset.theme = mode;
  localStorage.setItem('tri.theme', t);
  $('#themePalette').value=t;
}
applyTheme(localStorage.getItem('tri.theme')||'system');
$('#themePalette').addEventListener('change',e=>applyTheme(e.target.value));

// DATE INIT (auto-load today)
const datePicker = $('#datePicker');
datePicker.valueAsDate = new Date();
$('#todayBtn').addEventListener('click',()=>{datePicker.valueAsDate=new Date(); render();});
datePicker.addEventListener('change', render);

// REMINDERS
$('#addReminderBtn').addEventListener('click',()=>openDialog(datePicker.value));
$('#exportBtn').addEventListener('click',exportRem);
$('#importFile').addEventListener('change',importRem);

// ---- Punjabi (Desi) Calendar ----
// Fixed solar month boundaries:
const DESI = [
  {n:'Chet', m:3, d:14},
  {n:'Vaisakh', m:4, d:14},
  {n:'Jeth', m:5, d:15},
  {n:'Harh', m:6, d:15},
  {n:'Sawan', m:7, d:16},
  {n:'Bhadon', m:8, d:16},
  {n:'Assu', m:9, d:16},
  {n:'Katak', m:10, d:16},
  {n:'Maghar', m:11, d:15},
  {n:'Poh', m:12, d:15},
  {n:'Magh', m:1, d:14},
  {n:'Phagan', m:2, d:13},
];

function getPunjabi(d){
  // Build candidate starts for y-1, y, y+1 then pick the latest <= d
  const y=d.getFullYear();
  const starts=[];
  for(const yr of [y-1,y,y+1]){
    for(const mm of DESI){
      starts.push({name:mm.n, date:new Date(yr, mm.m-1, mm.d)});
    }
  }
  starts.sort((a,b)=>a.date-b.date);
  let cur = starts[0], next = null;
  for(let i=0;i<starts.length;i++){
    if(starts[i].date<=d){ cur=starts[i]; next = starts[i+1]||null; } else break;
  }
  const day = Math.min(30, Math.floor((d - cur.date)/86400000)+1);
  // Punjabi (Desi) year: AD + 57 for Mar–Dec, AD + 56 for Jan–Feb
  const vs = (d.getMonth()+1 >= 3) ? (y+57) : (y+56);
  return {day, month:cur.name, year:vs};
}

// Hijri (tabular)
function getHijri(d){
  const f=new Intl.DateTimeFormat('en-u-ca-islamic',{day:'numeric',month:'long',year:'numeric'});
  const p=Object.fromEntries(f.formatToParts(d).map(o=>[o.type,o.value]));
  return `${p.day} ${p.month} ${p.year}`;
}

// Farming guide (EN + UR) per Punjabi month (lightweight local data)
const FARM = {
  'Chet': {en:["Field prep; first irrigations"], ur:["کھیت کی تیاری؛ پہلی آبپاشی"]},
  'Vaisakh': {en:["Summer sowing begins (mung)"], ur:["گرمیوں کی کاشت (ماش/مونگ)"]},
  'Jeth': {en:["Cotton care; irrigate weekly"], ur:["کپاس کی نگہداشت؛ ہفتہ وار آبپاشی"]},
  'Harh': {en:["Cotton/paddy active growth"], ur:["کپاس/چاول بڑھوتری"]},
  'Sawan': {en:["Paddy weeding; pest watch"], ur:["چاول کی گوڈی؛ کیڑوں پر نظر"]},
  'Bhadon': {en:["Early maize harvest"], ur:["مکئی کی ابتدائی کٹائی"]},
  'Assu': {en:["Prep wheat fields; manure"], ur:["گندم کے کھیت کی تیاری؛ کھاد"]},
  'Katak': {en:["Wheat sowing start"], ur:["گندم کی کاشت شروع"]},
  'Maghar': {en:["Wheat steady growth","Mustard flowering","Potato early digging","Gram sprouting; frost care"], ur:["گندم: متوازن بڑھوتری","سرسوں میں پھول","آلو: ابتدائی کھدائی","چنے کی اگاؤ؛ کہر/پال سے بچاؤ"]},
  'Poh': {en:["Wheat tillering; light irrigation"], ur:["گندم: ٹلرنگ؛ ہلکی آبپاشی"]},
  'Magh': {en:["Mustard harvest; potato finish"], ur:["سرسوں کی کٹائی؛ آلو کی کھدائی مکمل"]},
  'Phagan': {en:["Late gram; pre-harvest checks"], ur:["چنا: آخری مرحلہ؛ کٹائی سے پہلے جائزہ"]}
};

async function getWeather(){
  try{
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=30.6667&longitude=73.1&current_weather=true&windspeed_unit=ms');
    const j = await res.json();
    return j.current_weather;
  }catch{ return null; }
}

// Render
async function render(){
  const d = datePicker.valueAsDate || new Date();
  const eng = `${d.getDate()} ${d.toLocaleString('en',{month:'short'})} ${d.getFullYear()}`;
  const hij = getHijri(d);
  const p = getPunjabi(d);

  const farm = FARM[p.month] || {en:["No data"], ur:["—"]};

  let html = `<div class="card">
    <h2>${d.toLocaleDateString('en-US',{weekday:'short', day:'2-digit', month:'short', year:'numeric'})}</h2>
    <p><b>English:</b> ${eng}</p>
    <p><b>Islamic:</b> ${hij}</p>
    <p><b>Punjabi (پنجابی):</b> ${p.day} ${p.month} ${p.year}</p>
    <h3>Farming Guide — ${p.month}</h3>
    <ul>${farm.en.map(x=>`<li>${x}</li>`).join('')}</ul>
    <ul dir="rtl">${farm.ur.map(x=>`<li>${x}</li>`).join('')}</ul>
  </div>`;

  const w = await getWeather();
  if(w){
    const spray = w.windspeed>5 ? "⚠️ Spray wind alert: too windy" : "✅ Suitable for spraying";
    html += `<div class="weather"><b>Weather (Sahiwal):</b> ${w.temperature}°C, wind ${w.windspeed} m/s<br>${spray}</div>`;
  }
  $('#content').innerHTML = html;
}

// ----- reminders -----
function loadRem(){ try{return JSON.parse(localStorage.getItem('tri.rem')||'{}')}catch{return {}} }
function saveRem(x){ localStorage.setItem('tri.rem', JSON.stringify(x)); }

function openDialog(dt){
  const dlg=$('#reminderDialog');
  $('#reminderDate').textContent = dt;
  $('#remTitle').value=''; $('#remNotes').value='';
  dlg.showModal();
  $('#saveReminder').onclick = ()=>{
    const t=$('#remTitle').value.trim(); const n=$('#remNotes').value.trim();
    if(!t){ dlg.close(); return; }
    const map = loadRem(); map[dt]=map[dt]||[]; map[dt].push({t,n});
    saveRem(map); dlg.close(); render();
  };
}

function exportRem(){
  const b = new Blob([JSON.stringify({rem:loadRem()},null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='tri-calendar.json'; a.click();
}
function importRem(e){
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{ const o=JSON.parse(r.result); if(o.rem) saveRem(o.rem); render(); } catch{ alert('Invalid file'); } };
  r.readAsText(f);
}

// Service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}

render(); // initial render (no click needed)
})();