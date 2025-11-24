(() => {
const $=s=>document.querySelector(s);
const root=document.documentElement;
const state={theme:localStorage.getItem('tri.theme')||'system'};
function applyTheme(t){root.dataset.theme=t==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;localStorage.setItem('tri.theme',t);$('#themePalette').value=t;}
applyTheme(state.theme);
$('#themePalette').addEventListener('change',e=>applyTheme(e.target.value));
$('#todayBtn').addEventListener('click',()=>{$('#datePicker').valueAsDate=new Date();render();});
$('#datePicker').addEventListener('change',render);
$('#addReminderBtn').addEventListener('click',()=>openDialog($('#datePicker').value));
$('#exportBtn').addEventListener('click',exportRem);
$('#importFile').addEventListener('change',importRem);
$('#datePicker').valueAsDate=new Date();
render();

function getPunjabi(d){
const months=[{n:'Chet',m:3,d:14},{n:'Vaisakh',m:4,d:14},{n:'Jeth',m:5,d:15},{n:'Harh',m:6,d:15},{n:'Sawan',m:7,d:16},{n:'Bhadon',m:8,d:16},{n:'Assu',m:9,d:16},{n:'Katak',m:10,d:16},{n:'Maghar',m:11,d:15},{n:'Poh',m:12,d:15},{n:'Magh',m:1,d:14},{n:'Phagan',m:2,d:13}];
const y=d.getFullYear();
let cur=months.findLast(m=>d>=new Date(y,m.m-1,m.d))||months[months.length-1];
let start=new Date(y,cur.m-1,cur.d);
let day=Math.floor((d-start)/86400000)+1;
if(day>30) day=30;
const vs=(d.getMonth()<=1)?y+57:y+56;
return {day,month:cur.n,year:vs};
}

function getHijri(d){
const f=new Intl.DateTimeFormat('en-u-ca-islamic',{day:'numeric',month:'long',year:'numeric'});
const p=Object.fromEntries(f.formatToParts(d).map(o=>[o.type,o.value]));
return `${p.day} ${p.month} ${p.year}`;
}

const farming={Maghar:["Wheat steady growth","Potato early digging","Mustard flowering","Gram sprouting; frost precautions"],
Poh:["Wheat tillering","Gram podding","Irrigate fields lightly"],
Magh:["Harvest mustard","Irrigate wheat fields","Potato digging complete"]};

async function getWeather(){
try{
const res=await fetch('https://api.open-meteo.com/v1/forecast?latitude=30.6667&longitude=73.1&current_weather=true&windspeed_unit=ms');
const j=await res.json();
return j.current_weather;
}catch{return null;}
}

async function render(){
const d=$('#datePicker').valueAsDate||new Date();
const pun=getPunjabi(d);
const hij=getHijri(d);
let html=`<div class="card"><h2>${d.toDateString()}</h2>
<p><b>English:</b> ${d.getDate()} ${d.toLocaleString('en',{month:'short'})} ${d.getFullYear()}</p>
<p><b>Islamic:</b> ${hij}</p>
<p><b>Punjabi (پنجابی):</b> ${pun.day} ${pun.month} ${pun.year}</p>
<h3>Farming Guide — ${pun.month}</h3>
<ul>${(farming[pun.month]||['No data']).map(x=>`<li>${x}</li>`).join('')}</ul></div>`;

const w=await getWeather();
if(w){
let wind=w.windspeed>5?"⚠️ Spray wind alert: Too windy":"✅ Suitable for spraying";
html+=`<div class="weather"><b>Weather (Sahiwal):</b> ${w.temperature}°C, wind ${w.windspeed} m/s<br>${wind}</div>`;
}
$('#content').innerHTML=html;
}

function loadRem(){try{return JSON.parse(localStorage.getItem('tri.rem')||'{}')}catch{return {}}}
function saveRem(x){localStorage.setItem('tri.rem',JSON.stringify(x));}
function openDialog(dt){
const dlg=$('#reminderDialog');$('#reminderDate').textContent=dt;$('#remTitle').value='';$('#remNotes').value='';dlg.showModal();
$('#saveReminder').onclick=()=>{
const t=$('#remTitle').value.trim(),n=$('#remNotes').value.trim();
if(!t){dlg.close();return;}
const map=loadRem();map[dt]=map[dt]||[];map[dt].push({t,n});
saveRem(map);dlg.close();render();
};}

function exportRem(){
const data={rem:loadRem()};
const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='tri-calendar.json';a.click();
}
function importRem(e){
const f=e.target.files[0];if(!f)return;
const r=new FileReader();
r.onload=()=>{try{const o=JSON.parse(r.result);if(o.rem)saveRem(o.rem);render();}catch{alert('Invalid file');}};
r.readAsText(f);
}
})();