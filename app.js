document.addEventListener('DOMContentLoaded',()=>{
const root=document.documentElement;
root.dataset.theme=localStorage.getItem('theme')||'system';
document.getElementById('calendar-container').innerHTML=`
  <p>English: 23 Nov 2025<br>Islamic: 3 Jumada II 1447<br>Punjabi: 10 Maghar 2082</p>
  <p><b>Farming Guide — Maghar:</b> Wheat steady growth; Potato early digging; Mustard flowering.</p>`;
});