(() => {
const $=s=>document.querySelector(s);
const root=document.documentElement;
$('#themePalette').addEventListener('change',e=>root.dataset.theme=e.target.value);
$('#todayBtn').addEventListener('click',()=>{$('#datePicker').valueAsDate=new Date();render();});
$('#datePicker').addEventListener('change',render);
$('#addReminderBtn').addEventListener('click',()=>openDialog($('#datePicker').value));
$('#exportBtn').addEventListener('click',exportRem);
$('#importFile').addEventListener('change',importRem);
$('#datePicker').valueAsDate=new Date();render();
function getPunjabi(d){
const m=[{n:'Chet',mm:3,dd:14},{n:'Vaisakh',mm:4,dd:14},{n:'Jeth',mm:5,dd:15},{n:'Harh',mm:6,dd:15},{n:'Sawan',mm:7,dd:16},{n:'Bhadon',mm:8,dd:16},{n:'Assu',mm:9,dd:16},{n:'Katak',mm:10,dd:16},{n:'Maghar',mm:11,dd:15},{n:'Poh',mm:12,dd:15},{n:'Magh',mm:1,dd:14},{n:'Phagan',mm:2,dd:13}];
let y=d.getFullYear();
let cur=m.findLast(x=>d>=new Date(y,x.mm-1,x.dd))||m[m.length-1];
let start=new Date(y,cur.mm-1,cur.dd);
let diff=Math.floor((d-start)/86400000)+1;
let vs=(d.getMonth()<=1)?y+57:y+56;
return {day:diff,month:cur.n,year:vs};
}
function getHijri(d){
const f=new Intl.DateTimeFormat('en-u-ca-islamic',{day:'numeric',month:'long',year:'numeric'});
const p=Object.fromEntries(f.formatToParts(d).map(o=>[o.type,o.value]));
return `${p.day} ${p.month} ${p.year}`;
}
function render(){
const d=$('#datePicker').valueAsDate||new Date();
const pun=getPunjabi(d);
const hij=getHijri(d);
$('#content').innerHTML=`<div class='card'><h2>${d.toDateString()}</h2>
<p><b>English:</b> ${d.getDate()} ${d.toLocaleString('en',{month:'short'})} ${d.getFullYear()}</p>
<p><b>Islamic:</b> ${hij}</p>
<p><b>Punjabi (پنجابی):</b> ${pun.day} ${pun.month} ${pun.year}</p></div>`;
}
function loadRem(){try{return JSON.parse(localStorage.getItem('tri.rem')||'{}')}catch{return {}}}
function saveRem(x){localStorage.setItem('tri.rem',JSON.stringify(x));}
function openDialog(dt){const dlg=$('#reminderDialog');$('#reminderDate').textContent=dt;$('#remTitle').value='';$('#remNotes').value='';dlg.showModal();$('#saveReminder').onclick=()=>{const t=$('#remTitle').value.trim();if(!t){dlg.close();return;}const map=loadRem();map[dt]=map[dt]||[];map[dt].push({t});saveRem(map);dlg.close();render();};}
function exportRem(){const data={rem:loadRem()};const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='tri-calendar.json';a.click();}
function importRem(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(o.rem)saveRem(o.rem);render();}catch{alert('bad file');}};r.readAsText(f);}
})();