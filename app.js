// app.js - Organización y Gestión de la Información (prototipo)
// Funciona con LocalStorage. Guardar como app.js y enlazar desde index.html

// --- CONFIG ---
const STORAGE_KEY = 'sig_info_records_final_v1';
const USER_KEY = 'sig_info_user_final_v1';

// --- DOM ---
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userArea = document.getElementById('user-area');

const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const docIdEl = document.getElementById('docId');
const titleEl = document.getElementById('title');
const categoryEl = document.getElementById('category');
const tagsEl = document.getElementById('tags');
const descriptionEl = document.getElementById('description');

const searchEl = document.getElementById('search');
const filterCategory = document.getElementById('filterCategory');
const filterTag = document.getElementById('filterTag');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const applyFilters = document.getElementById('applyFilters');
const resetFilters = document.getElementById('resetFilters');

const listEl = document.getElementById('list');
const emptyNotice = document.getElementById('emptyNotice');

const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const fileImport = document.getElementById('fileImport');

const reportSummary = document.getElementById('reportSummary');
const refreshReport = document.getElementById('refreshReport');
const guideBtn = document.getElementById('guideBtn');

const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalCloseBtn = document.getElementById('modalCloseBtn');

const chartContainer = document.getElementById('chartContainer');

// --- STATE ---
let records = [];
let currentUser = null;

// --- HELPERS ---
const nowISO = () => new Date().toISOString();
const genId = () => 'r_' + Math.random().toString(36).slice(2,9);
const saveAll = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
const loadAll = () => { const raw = localStorage.getItem(STORAGE_KEY); records = raw ? JSON.parse(raw) : []; };
const loadUser = () => { const raw = localStorage.getItem(USER_KEY); currentUser = raw ? JSON.parse(raw) : null; };
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escCsv = s => s==null ? '""' : '"' + String(s).replace(/"/g,'""') + '"';

// --- AUTH ---
function login(name, password){
  if(!name) return alert('Ingrese nombre de usuario');
  const role = (password === 'admin123') ? 'admin' : 'user';
  currentUser = { name, role };
  localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  refreshAuthUI();
  renderList();
}
function logout(){
  localStorage.removeItem(USER_KEY);
  currentUser = null;
  refreshAuthUI();
  renderList();
}
function refreshAuthUI(){
  if(currentUser){
    userArea.innerHTML = <strong>${esc(currentUser.name)}</strong> • <span class="muted">${currentUser.role}</span>;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    userArea.textContent = 'No autenticado';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

// --- CRUD ---
function addOrUpdate(){
  const title = titleEl.value.trim();
  if(!title) return alert('El título es obligatorio');
  const category = categoryEl.value;
  const tags = tagsEl.value.split(',').map(s=>s.trim()).filter(Boolean);
  const description = descriptionEl.value.trim();
  const idVal = docIdEl.value;

  if(idVal){
    const rec = records.find(r=>r.id===idVal);
    if(rec){
      rec.title = title; rec.category = category; rec.tags = tags; rec.description = description; rec.updatedAt = nowISO();
      rec.owner = currentUser ? currentUser.name : rec.owner;
      saveAll(); renderList(); clearForm(); return;
    }
  }
  const newRec = { id: genId(), title, category, tags, description, createdAt: nowISO(), updatedAt: nowISO(), owner: currentUser ? currentUser.name : 'anon' };
  records.unshift(newRec);
  saveAll(); renderList(); clearForm();
}
function clearForm(){
  docIdEl.value=''; titleEl.value=''; categoryEl.value='Administrativo'; tagsEl.value=''; descriptionEl.value='';
}
function loadForEdit(id){
  const r = records.find(x=>x.id===id); if(!r) return;
  docIdEl.value = r.id;
  titleEl.value = r.title;
  categoryEl.value = r.category;
  tagsEl.value = r.tags.join(', ');
  descriptionEl.value = r.description;
  window.scrollTo({top:0,behavior:'smooth'});
}
function removeRecord(id){
  records = records.filter(r=>r.id!==id);
  saveAll(); renderList();
}

// --- RENDER ---
function renderList(){
  const q = (searchEl.value || '').toLowerCase();
  const cat = filterCategory.value;
  const tagf = (filterTag.value || '').toLowerCase();
  const from = dateFrom.value ? new Date(dateFrom.value) : null;
  const to = dateTo.value ? new Date(dateTo.value) : null;

  const filtered = records.filter(r=>{
    if(cat && r.category !== cat) return false;
    if(tagf && r.tags.join(' ').toLowerCase().indexOf(tagf) === -1) return false;
    if(q && (r.title + ' ' + r.description + ' ' + r.tags.join(' ')).toLowerCase().indexOf(q) === -1) return false;
    if(from && new Date(r.createdAt) < from) return false;
    if(to && new Date(r.createdAt) > new Date(to.getFullYear(),to.getMonth(),to.getDate(),23,59,59)) return false;
    return true;
  });

  listEl.innerHTML = '';
  if(filtered.length === 0){
    emptyNotice.style.display = 'block';
    updateReport();
    return;
  }
  emptyNotice.style.display = 'none';

  filtered.forEach(r=>{
    const item = document.createElement('div'); item.className='item';
    const head = document.createElement('div'); head.className='item-head';
    head.innerHTML = <div class="item-title">${esc(r.title)}</div><div class="muted">${esc(r.category)}</div>;
    const desc = document.createElement('div'); desc.className='item-meta';
    desc.innerHTML = <div class="muted">${esc(r.description || '')}</div><div class="muted">Propietario: ${esc(r.owner||'') }<br><small>${new Date(r.createdAt).toLocaleString()}</small></div>;
    const tagsWrap = document.createElement('div'); tagsWrap.className='tags';
    (r.tags || []).forEach(t=>{ const s=document.createElement('span'); s.className='tag'; s.textContent = t; tagsWrap.appendChild(s); });

    const controls = document.createElement('div'); controls.className='controls';
    const editBtn = document.createElement('button'); editBtn.className='btn ghost'; editBtn.textContent='Editar'; editBtn.onclick = ()=>loadForEdit(r.id);
    const downloadBtn = document.createElement('button'); downloadBtn.className='btn ghost'; downloadBtn.textContent='Descargar JSON'; downloadBtn.onclick = ()=>downloadJson(r);
    controls.appendChild(editBtn); controls.appendChild(downloadBtn);

    if(currentUser && currentUser.role === 'admin'){
      const delBtn = document.createElement('button'); delBtn.className='btn danger'; delBtn.textContent='Eliminar';
      delBtn.onclick = ()=>{ if(confirm('¿Eliminar este registro?')) removeRecord(r.id); };
      controls.appendChild(delBtn);
    }

    item.appendChild(head); item.appendChild(tagsWrap); item.appendChild(desc); item.appendChild(controls);
    listEl.appendChild(item);
  });

  updateReport();
}

// --- IMPORT / EXPORT ---
function exportJson(){
  const blob = new Blob([JSON.stringify(records, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'backup_sig_info.json'; a.click();
  URL.revokeObjectURL(url);
}
function exportCsv(){
  const header = ['id','title','category','tags','description','createdAt','updatedAt','owner'];
  const rows = records.map(r => [r.id, r.title, r.category, (r.tags||[]).join(';'), r.description, r.createdAt||'', r.updatedAt||'', r.owner || '']);
  const csv = [header.map(escCsv).join(','), ...rows.map(row => row.map(escCsv).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'sig_info.csv'; a.click(); URL.revokeObjectURL(url);
}
function handleImportFile(file){
  const reader = new FileReader();
  reader.onload = ev=>{
    try{
      const data = JSON.parse(ev.target.result);
      if(!Array.isArray(data)) return alert('JSON inválido: se espera un arreglo de registros');
      if(!confirm('Se añadirán ' + data.length + ' registros al sistema actual. ¿Continuar?')) return;
      const sanitized = data.map(d=>({
        id: d.id || genId(),
        title: d.title || 'Sin título',
        category: d.category || 'Otro',
        tags: Array.isArray(d.tags) ? d.tags : String(d.tags||'').split(/[,;]+/).map(s=>s.trim()).filter(Boolean),
        description: d.description || '',
        createdAt: d.createdAt || nowISO(),
        updatedAt: d.updatedAt || nowISO(),
        owner: d.owner || 'importado'
      }));
      records = sanitized.concat(records);
      saveAll(); renderList(); alert('Importación completada');
    }catch(e){
      alert('Error al leer JSON: ' + e.message);
    }
  };
  reader.readAsText(file);
}
function downloadJson(rec){
  const blob = new Blob([JSON.stringify(rec, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = (rec.id || 'registro') + '.json'; a.click(); URL.revokeObjectURL(url);
}

// --- REPORT & CHART ---
function updateReport(){
  const byCat = records.reduce((acc,r)=>{ acc[r.category] = (acc[r.category]||0)+1; return acc; }, {});
  const parts = ['Total registros: ' + records.length];
  for(const k in byCat) parts.push(${k}: ${byCat[k]});
  reportSummary.textContent = parts.join(' • ');
  renderChart(byCat);
}

function renderChart(dataObj){
  chartContainer.innerHTML = '';
  const categories = Object.keys(dataObj);
  if(categories.length === 0){
    chartContainer.innerHTML = '<div class="muted">Sin datos para graficar</div>';
    return;
  }
  const counts = categories.map(k=>dataObj[k]);
  const max = Math.max(...counts);
  const width = chartContainer.clientWidth - 20;
  const height = 220;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('width', width); svg.setAttribute('height', height); svg.setAttribute('viewBox', 0 0 ${width} ${height});
  const padding = {top:20,left:40,right:10,bottom:60};
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const gap = 12;
  const barW = (chartW - (categories.length-1)*gap) / categories.length;

  // y grid
  for(let i=0;i<=4;i++){
    const y = padding.top + chartH - (chartH * (i/4));
    const line = document.createElementNS(svgNS,'line');
    line.setAttribute('x1', padding.left); line.setAttribute('x2', width - padding.right); line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke','#0b2033'); line.setAttribute('stroke-width','1');
    svg.appendChild(line);
    const txt = document.createElementNS(svgNS,'text'); txt.setAttribute('x',6); txt.setAttribute('y', y-6); txt.setAttribute('font-size',10); txt.setAttribute('fill','#9aa4b2'); txt.textContent = Math.round(max*(i/4));
    svg.appendChild(txt);
  }

  categories.forEach((cat,i)=>{
    const val = dataObj[cat];
    const x = padding.left + i*(barW+gap);
    const h = max===0 ? 0 : (val/max)*chartH;
    const y = padding.top + (chartH - h);
    const rect = document.createElementNS(svgNS,'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y); rect.setAttribute('width', Math.max(6, barW)); rect.setAttribute('height', Math.max(2,h));
    rect.setAttribute('rx',6); rect.setAttribute('fill','#1f8ef1');
    svg.appendChild(rect);
    const vlabel = document.createElementNS(svgNS,'text'); vlabel.setAttribute('x', x + barW/2); vlabel.setAttribute('y', y-6); vlabel.setAttribute('font-size',11); vlabel.setAttribute('fill','#e6eef8'); vlabel.setAttribute('text-anchor','middle'); vlabel.textContent = val;
    svg.appendChild(vlabel);
    const clabel = document.createElementNS(svgNS,'text'); clabel.setAttribute('x', x + barW/2); clabel.setAttribute('y', padding.top + chartH + 22); clabel.setAttribute('font-size',12); clabel.setAttribute('fill','#9aa4b2'); clabel.setAttribute('text-anchor','middle'); clabel.textContent = cat;
    svg.appendChild(clabel);
  });

  chartContainer.appendChild(svg);
}

// --- EVENTS ---
loginBtn.addEventListener('click', ()=>login(usernameEl.value.trim(), passwordEl.value));
logoutBtn.addEventListener('click', logout);
saveBtn.addEventListener('click', addOrUpdate);
clearBtn.addEventListener('click', clearForm);

searchEl.addEventListener('input', throttle(renderList, 180));
applyFilters.addEventListener('click', renderList);
resetFilters.addEventListener('click', ()=>{ searchEl.value=''; filterCategory.value=''; filterTag.value=''; dateFrom.value=''; dateTo.value=''; renderList(); });

exportJsonBtn.addEventListener('click', exportJson);
exportCsvBtn.addEventListener('click', exportCsv);
fileImport.addEventListener('change', e=>{ const f = e.target.files[0]; if(!f) return; handleImportFile(f); e.target.value=''; });

refreshReport.addEventListener('click', updateReport);
guideBtn.addEventListener('click', ()=>openModal());
modalClose.addEventListener('click', ()=>closeModal());
modalCloseBtn.addEventListener('click', ()=>closeModal());
modal.addEventListener('click', ev=>{ if(ev.target === modal) closeModal(); });

// --- modal ---
function openModal(){ modal.setAttribute('aria-hidden','false'); modal.style.visibility='visible'; modal.style.opacity='1'; }
function closeModal(){ modal.setAttribute('aria-hidden','true'); modal.style.visibility='hidden'; modal.style.opacity='0'; }

// --- util ---
function throttle(fn, wait){ let t=null; return (...args)=>{ if(t) clearTimeout(t); t=setTimeout(()=>{ fn(...args); t=null; }, wait); }; }

// --- seed & boot ---
function seedIfEmpty(){
  if(records.length === 0){
    records = [
      { id: genId(), title: 'Acta reunión 2025-01-15', category: 'Administrativo', tags:['acta','reunión'], description:'Acta inicial plan.', createdAt: nowISO(), updatedAt: nowISO(), owner:'docente' },
      { id: genId(), title: 'Plan de estudios 2025', category: 'Académico', tags:['plan','curso'], description:'Plan del ciclo 2025.', createdAt: nowISO(), updatedAt: nowISO(), owner:'admin' }
    ];
    saveAll();
  }
}

(function boot(){
  loadAll();
  loadUser();
  seedIfEmpty();
  refreshAuthUI();
  renderList();
})();
