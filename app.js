// Tri Calendar full build v11
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;

  // Persisted settings
  const state = {
    theme: localStorage.getItem('tri.theme') || 'system',
    hijriOffset: parseInt(localStorage.getItem('tri.hijriOffset')||'0',10),
    punjabiSystem: localStorage.getItem('tri.punjabiSystem') || 'vs',
    pkHolidays: JSON.parse(localStorage.getItem('tri.pkHolidays')||'true'),
    deHolidays: JSON.parse(localStorage.getItem('tri.deHolidays')||'true'),
    remoteQuoteURL: localStorage.getItem('tri.remoteQuoteURL') || ''
  };

  function applyTheme(t){ state.theme=t; localStorage.setItem('tri.theme',t); root.setAttribute('data-theme', t); }
  applyTheme(state.theme);

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    // Theme selector
    const themeSel = $('#themePalette'); themeSel.value = state.theme;
    themeSel.addEventListener('change', e => applyTheme(e.target.value));

    // Inputs
    $('#hijriOffset').value = state.hijriOffset;
    $('#hijriOffset').addEventListener('input', e=>{
      state.hijriOffset = parseInt(e.target.value||'0',10);
      localStorage.setItem('tri.hijriOffset', state.hijriOffset);
      render();
    });

    $('#punjabiSystem').value = state.punjabiSystem;
    $('#punjabiSystem').addEventListener('change', e=>{
      state.punjabiSystem = e.target.value;
      localStorage.setItem('tri.punjabiSystem', state.punjabiSystem);
      render();
    });

    $('#pkHolidays').checked = !!state.pkHolidays;
    $('#deHolidays').checked = !!state.deHolidays;
    $('#pkHolidays').addEventListener('change', e=>{
      state.pkHolidays = e.target.checked;
      localStorage.setItem('tri.pkHolidays', state.pkHolidays);
      render();
    });
    $('#deHolidays').addEventListener('change', e=>{
      state.deHolidays = e.target.checked;
      localStorage.setItem('tri.deHolidays', state.deHolidays);
      render();
    });

    $('#remoteQuoteURL').value = state.remoteQuoteURL;
    $('#remoteQuoteURL').addEventListener('change', e=>{
      state.remoteQuoteURL = e.target.value.trim();
      localStorage.setItem('tri.remoteQuoteURL', state.remoteQuoteURL);
      render();
    });

    // Date
    const dp = $('#datePicker');
    const today = new Date();
    dp.valueAsDate = today;
    $('#todayBtn').addEventListener('click', ()=>{ dp.valueAsDate = new Date(); render(); });
    dp.addEventListener('change', render);

    // Views (enable only Day for now)
    $$('.segmented button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('.segmented button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        // only 'day' implemented fully
        render();
      });
    });

    // Reminders
    $('#addReminderBtn').addEventListener('click', ()=> openReminderDialog(dp.value));
    $('#exportBtn').addEventListener('click', exportReminders);
    $('#importFile').addEventListener('change', importReminders);

    // PWA install prompt logic (optional; handled in index previously)

    render();
  }

  // Helpers
  function fmtDate(d){
    return d.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  }
  function addDays(d, days){ const nd = new Date(d); nd.setDate(nd.getDate()+days); return nd; }

  function getHijri(d){
    const dd = addDays(d, state.hijriOffset);
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic', {day:'numeric', month:'long', year:'numeric'});
    const parts = fmt.formatToParts(dd).reduce((o,p)=>{o[p.type]=p.value;return o;},{});
    return { day: parts.day, month: parts.month, year: parts.year, label: `${parts.day} ${parts.month} ${parts.year}` };
  }

  // Punjabi fixed solar months starting near Mar-14 (approx)
  const punjabiMonths = [
    {name:'Chet', start:[3,14]}, {name:'Vaisakh', start:[4,14]}, {name:'Jeth', start:[5,15]},
    {name:'Harh', start:[6,15]}, {name:'Sawan', start:[7,16]}, {name:'Bhadon', start:[8,16]},
    {name:'Assu', start:[9,16]}, {name:'Katak', start:[10,16]}, {name:'Maghar', start:[11,15]},
    {name:'Poh', start:[12,15]}, {name:'Magh', start:[1,14]}, {name:'Phagan', start:[2,13]}
  ];
  function getPunjabi(d){
    const y = d.getFullYear();
    const dates = punjabiMonths.map(m=>{
      const [mm,dd] = m.start;
      const year = (mm>=3? y : y+1); // months Jan/Feb belong to next year in this list
      return {name:m.name, date:new Date(year, mm-1, dd)};
    }).sort((a,b)=>a.date-b.date);
    let month = dates.findLast(m=>d>=m.date) || dates[dates.length-1];
    // Year label (VS approx): if month is Jan/Feb (Magh/Phagan), VS = y+57 else y+56
    const vsYear = (d.getMonth()<=1) ? y+57 : y+56;
    return {name:month.name, year: vsYear};
  }

  // Farming guide snippets per Punjabi month (english & urdu)
  const farmingGuide = {
    'Chet': {en:['Prepare fields; pre‑monsoon checks.'], ur:['کھیت کی تیاری؛ پری مون سون جانچ۔']},
    'Vaisakh': {en:['Sow cotton; irrigate wheat harvest.'], ur:['کپاس کی کاشت؛ گندم کی کٹائی کی آبپاشی۔']},
    'Jeth': {en:['Irrigate cotton; check pests.'], ur:['کپاس کی آبپاشی؛ کیڑوں کی نگرانی۔']},
    'Harh': {en:['Weed cotton; fodder management.'], ur:['کپاس کی گوڈی؛ چارہ بندوبست۔']},
    'Sawan': {en:['Monsoon care; drainage checks.'], ur:['برسات میں نگہداشت؛ نکاسی آب چیک۔']},
    'Bhadon': {en:['Plan Rabi crops; mustard nursery.'], ur:['ربیع فصلوں کی منصوبہ بندی؛ سرسوں نرسری۔']},
    'Assu': {en:['Wheat land prep; early gram.'], ur:['گندم کی زمین کی تیاری؛ چنے کی ابتدائی بوائی۔']},
    'Katak': {en:['Wheat sowing window starts.'], ur:['گندم کی بوائی کا آغاز۔']},
    'Maghar': {en:['Wheat: steady growth.','Potato: early digging; mustard flowering.','Gram sprouting; frost/fog precautions.'], ur:['گندم: متوازن بڑھوتری۔','آلو: ابتدائی کھدائی؛ سرسوں میں پھول۔','چنے کی اگاؤ؛ کہر/دھند سے بچاؤ۔']},
    'Poh': {en:['Irrigate wheat if dry; frost alert.'], ur:['خشک موسم میں گندم کو پانی؛ کہر الرٹ۔']},
    'Magh': {en:['Watch rust in wheat; spray windows.'], ur:['گندم میں رسٹ پر نظر؛ سپرے کے اوقات۔']},
    'Phagan': {en:['Prep for harvest; store planning.'], ur:['کٹائی کی تیاری؛ ذخیرہ اندوزی کی منصوبہ بندی۔']},
  };

  // Reminders storage
  function loadReminders(){ try{return JSON.parse(localStorage.getItem('tri.reminders')||'{}')}catch{return {}} }
  function saveReminders(map){ localStorage.setItem('tri.reminders', JSON.stringify(map)); }
  function dateKey(d){ return d.toISOString().split('T')[0]; }

  function openReminderDialog(dateStr){
    const dlg = $('#reminderDialog');
    $('#reminderDate').textContent = dateStr;
    $('#remTitle').value = '';
    $('#remNotes').value = '';
    dlg.showModal();
    $('#saveReminder').onclick = () => {
      const title = $('#remTitle').value.trim();
      const notes = $('#remNotes').value.trim();
      if(!title){ dlg.close(); return; }
      const map = loadReminders();
      map[dateStr] = map[dateStr] || [];
      map[dateStr].push({title, notes, created: Date.now()});
      saveReminders(map);
      dlg.close();
      render();
    };
  }

  function exportReminders(){
    const data = {
      reminders: loadReminders(),
      settings: state
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tri-calendar-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importReminders(ev){
    const file = ev.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const obj = JSON.parse(reader.result);
        if(obj.reminders) saveReminders(obj.reminders);
        if(obj.settings){
          Object.entries(obj.settings).forEach(([k,v])=>{
            state[k]=v; localStorage.setItem('tri.'+k, typeof v==='string'? v : JSON.stringify(v));
          });
        }
        // re-apply theme & inputs
        applyTheme(state.theme);
        $('#hijriOffset').value = state.hijriOffset;
        $('#punjabiSystem').value = state.punjabiSystem;
        $('#pkHolidays').checked = !!state.pkHolidays;
        $('#deHolidays').checked = !!state.deHolidays;
        $('#remoteQuoteURL').value = state.remoteQuoteURL||'';
        render();
      }catch(e){ alert('Invalid JSON'); }
    };
    reader.readAsText(file);
  }

  async function getDailyQuote(){
    // Try remote first if provided
    const key='tri.quoteCache';
    const cached = localStorage.getItem(key);
    if(cached){
      try{
        const obj = JSON.parse(cached);
        // same day cache
        const today = new Date().toDateString();
        if(obj.today === today) return obj.data;
      }catch{}
    }
    if(state.remoteQuoteURL){
      try{
        const res = await fetch(state.remoteQuoteURL, {cache:'no-store'});
        if(res.ok){
          const data = await res.json();
          const obj = {today: new Date().toDateString(), data};
          localStorage.setItem(key, JSON.stringify(obj));
          return data;
        }
      }catch{ /* ignore */ }
    }
    // Fallback local
    try{
      const res = await fetch('data/quotes-local.json');
      const q = await res.json();
      const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0))/86400000);
      const pick = q.quotes[doy % q.quotes.length];
      return pick;
    }catch{ return {text:'', ur:'', ref:''}; }
  }

  function render(){
    const base = $('#datePicker').valueAsDate || new Date();
    const hijri = getHijri(base);
    const pun = getPunjabi(base);
    const content = $('#content');
    content.innerHTML = '';

    // Daily Panel (Style C)
    const wrap = document.createElement('div');
    wrap.className = 'card daily-wrap';

    // Top header
    const top = document.createElement('div'); top.className='daily-top';
    const title = document.createElement('div');
    title.innerHTML = `<h2>${fmtDate(base)} <span class="badge">${isToday(base)?'today':''}</span></h2>
      <div class="date-pills">
        <span class="pill"><b>English:</b> ${base.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
        <span class="pill"><b>Islamic:</b> ${hijri.label} <span class="badge">offset ${state.hijriOffset}</span></span>
        <span class="pill"><b>Punjabi:</b> ${pun.name} ${pun.year}</span>
      </div>`;
    const boxes = document.createElement('div'); boxes.className='date-boxes';
    boxes.innerHTML = `
      <div class="date-box"><div><b>English</b></div><div>${base.getDate()} ${base.toLocaleDateString('en-GB',{month:'short'})}</div></div>
      <div class="date-box"><div><b>Islamic</b></div><div>${hijri.day} ${hijri.month}</div></div>
      <div class="date-box"><div><b>Punjabi (پنجابی)</b></div><div>${pun.name}</div></div>
    `;
    top.append(title, boxes);
    wrap.append(top);

    // Quote card
    const quoteCard = document.createElement('div'); quoteCard.className='quote-card';
    quoteCard.innerHTML = `<div class="quote-ur" id="quoteUr">…</div><div class="quote-ref" id="quoteRef"></div>`;
    wrap.append(quoteCard);

    // Farming Guide
    const fg = farmingGuide[pun.name] || {en:['—'], ur:[]};
    const fgCard = document.createElement('div'); fgCard.className='card';
    fgCard.innerHTML = `<h2>Farming Guide — ${pun.name}</h2>
      <ul>${fg.en.map(x=>`<li>${x}</li>`).join('')}</ul>
      <div class="dual-rtl">${fg.ur.map(x=>`<p>— ${x}</p>`).join('')}</div>`;
    content.append(wrap, fgCard);

    // Events & Reminders
    const evCard = document.createElement('div'); evCard.className='card';
    evCard.innerHTML = `<h2>Events & Reminders</h2>`;
    const map = loadReminders();
    const dk = dateKey(base);
    const list = document.createElement('ul');
    (map[dk]||[]).forEach((r,i)=>{
      const li = document.createElement('li');
      const delBtn = document.createElement('button'); delBtn.textContent='×'; delBtn.className='ghost';
      delBtn.style.marginLeft='8px';
      delBtn.onclick = ()=>{ map[dk].splice(i,1); saveReminders(map); render(); };
      li.textContent = r.title + (r.notes? ' — '+r.notes: '');
      li.appendChild(delBtn);
      list.appendChild(li);
    });
    if(!(map[dk]||[]).length) evCard.append('No events.');
    evCard.append(list);
    content.append(evCard);

    // Load quote async
    getDailyQuote().then(q=>{
      $('#quoteUr').textContent = q.ur || q.text || '';
      $('#quoteRef').textContent = q.ref || '';
    });
  }

  function isToday(d){
    const t = new Date();
    return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
  }

})();