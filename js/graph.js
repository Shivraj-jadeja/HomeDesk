if (!window.vis?.DataSet) {
  console.error('vis-network not loaded before graph.js. Check script order.');
}

import { ME_ID, $, speak, toast, nowStr, projects, updateProjects, setSelected, selectedId, debounce } from './data.js';

export const nodes = new vis.DataSet();
export const edges = new vis.DataSet();
let network;

const fields = {
  name: $('pName'), desc: $('pDesc'), prog: $('pProgress'),
  progVal: $('pProgressVal'), updated: $('pUpdated'),
  files: $('files'), fileCount: $('fileCount')
};

export function initGraph(){
  const container = $('network');
  const options = {
    physics: { stabilization:true, barnesHut:{ gravitationalConstant:-4000 }},
    interaction: { hover:true, multiselect:false, keyboard:true },
    nodes: { shape:'box', color:{ background:'#1f2937', border:'#334155',
      highlight:{background:'#0ea5e9', border:'#38bdf8'} }, font:{ color:'#e5e7eb' }, margin:8, borderWidth:1 },
    edges: { color:'#3b4f9b', smooth:true },
  };
  network = new vis.Network(container, {nodes, edges}, options);
  ensureMe();
  for(const p of projects){
    nodes.update({ id:p.id, label:p.name, x:p.pos?.x, y:p.pos?.y, fixed:false });
    if(!edges.get(`${ME_ID}-${p.id}`)) edges.add({ id:`${ME_ID}-${p.id}`, from:ME_ID, to:p.id });
  }
  network.on('selectNode', (params)=>{ const id = params.nodes[0]; if(id===ME_ID) return; showProject(id); });
  const savePositionsDebounced = debounce(() => savePositions(true), 400);
  network.on('dragEnd', (params) => {
   if (params.nodes && params.nodes.length) {
       savePositionsDebounced();
   }
   });

  // Safety: persist positions before leaving/reloading
  window.addEventListener('beforeunload', () => savePositions(true));
}

function ensureMe(){
  if(!nodes.get(ME_ID)) nodes.add({ id:ME_ID, label:'Shivraj', color:{background:'#0ea5e9',border:'#22d3ee'}, font:{color:'#001018'} });
}

export function showProject(id){
  const p = projects.find(x=>x.id===id); if(!p) return;
  setSelected(id);
  fields.name.textContent = p.name;
  fields.desc.value = p.desc || '';
  fields.prog.value = p.progress ?? 0;
  fields.progVal.textContent = `${fields.prog.value}%`;
  fields.updated.textContent = p.updated || '—';
  renderFiles(p.files||[]);
}

function renderFiles(list){
  fields.files.innerHTML = list?.length ? '' : '<div class="muted">No files indexed yet.</div>';
  for(const f of (list||[]).slice(0,500)){
    const div = document.createElement('div');
    div.className='file';
    div.textContent = `${f.path}  (${fmtSize(f.size)})`;
    fields.files.appendChild(div);
  }
  fields.fileCount.textContent = `(${list?.length||0})`;
}
function fmtSize(n){ if(!Number.isFinite(n)) return '-'; const u=['B','KB','MB','GB']; let i=0; while(n>1024&&i<u.length-1){n/=1024;i++} return n.toFixed(1)+' '+u[i]; }

export function addProject(name){
  const id = 'p_'+Math.random().toString(36).slice(2,8);
  const p = { id, name, desc:'', progress:0, updated: nowStr(), files:[] };
  updateProjects(list => (list.push(p), list));
  nodes.add({ id, label:name });
  edges.add({ id:`${ME_ID}-${id}`, from:ME_ID, to:id });
  network.selectNodes([id]); showProject(id);
  try { network.fit({ animation: true, padding: 100 }); } catch {}
  speak(`Added project ${name}`);
}

export function renameProjectById(id,newName){
  const p = projects.find(x=>x.id===id); if(!p) return;
  p.name = newName; p.updated = nowStr();
  updateProjects(list => list);
  nodes.update({id, label:newName});
  showProject(id);
  toast('Renamed');
}

export function deleteProjectById(id){
  const p = projects.find(x=>x.id===id); if(!p) return;
  if(!confirm(`Delete project "${p.name}"?`)) return;

  updateProjects(list => {
    const idx = list.findIndex(z=>z.id===id);
    if(idx>-1) list.splice(idx,1);
    return list;
  });
  nodes.remove(id);
  edges.remove(`${ME_ID}-${id}`);

  setSelected(null);
  $('pName').textContent = '—';
  $('pDesc').value = '';
  $('pProgress').value = 0;
  $('pProgressVal').textContent = '0%';
  $('pUpdated').textContent = '—';
  $('files').innerHTML = '';
  $('fileCount').textContent = '(0)';

  toast('Deleted');
  speak('Project deleted');
}

export function openByName(name, focusOnly=false){
  const key = name.trim().toLowerCase();
  const p = projects.find(x => x.name.toLowerCase() === key);
  if(!p){ toast('Not found: '+name); speak('Project not found'); return; }
  network.selectNodes([p.id]); showProject(p.id);
  if(focusOnly){ network.focus(p.id,{ scale:1.2, animation:true }); }
  speak((focusOnly?'Focused ':'Opened ') + p.name);
}

export function setProgressByName(name,val){ 
  const key = name.trim().toLowerCase();
  const p = projects.find(x => x.name.toLowerCase() === key);
  if(!p){ speak('Project not found'); return; }
  val = Math.max(0, Math.min(100, val));
  p.progress = val; p.updated = nowStr();
  updateProjects(list => list);
  $('pProgress').value = val; $('pProgressVal').textContent = val+'%';
  speak(`${p.name} progress set to ${val} percent`);
}

export function searchFilesInSelected(term){
  if(!selectedId) return toast('Select a project');
  const p = projects.find(x=>x.id===selectedId); if(!p?.files?.length) return toast('No index');
  const q = term.toLowerCase();
  const res = p.files.filter(f => f.path.toLowerCase().includes(q)).slice(0,500);
  const files = $('files'); files.innerHTML='';
  for(const f of res){ const div=document.createElement('div'); div.className='file'; div.textContent=`${f.path} (${fmtSize(f.size)})`; files.appendChild(div); }
  $('fileCount').textContent=`(${res.length}/${p.files.length})`;
  toast(`Found ${res.length}`);
}

export function savePositions(silent = false){
  const ids = projects.map(p=>p.id);
  const pos = network.getPositions(ids);
  for (const p of projects){
    if (pos[p.id]) p.pos = { x: pos[p.id].x, y: pos[p.id].y };
  }
  updateProjects(list => list);
  if (!silent) toast('Layout saved');
}

export function focusSelected(){
  if(!selectedId) return;
  network.focus(selectedId,{ scale:1.2, animation:true });
}

export function fitView() {
  const count = nodes.getIds().length;
  if (!count) return;
  if (typeof network?.fit === 'function') {
    network.fit({ animation: true, padding: 100 });
  }
}
