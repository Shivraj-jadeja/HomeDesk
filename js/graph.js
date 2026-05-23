// js/graph.js
if (!window.vis?.DataSet) {
  console.error('vis-network not loaded before graph.js. Check script order.');
}

import { ME_ID, $, toast, nowStr, projects, updateProjects, saveProjects, setSelected, selectedId, debounce, viewRootId, setViewRoot } from './data.js';

export const nodes = new vis.DataSet();
export const edges = new vis.DataSet();
let network;

const TETHER_ID = '__trace_tether__';

const fields = {
  name: $('pName'), desc: $('pDesc'), prog: $('pProgress'),
  progVal: $('pProgressVal'), updated: $('pUpdated'),
  files: $('files'), fileCount: $('fileCount'), space: $('spaceName')
};

export function initGraph(){
  const container = $('graph');
  if (!container) { console.error('#graph not found'); return; }
  container.style.width = '100%';
  container.style.height = '100%';

  const options = {
    autoResize: true,
    physics: { stabilization: true, barnesHut: { gravitationalConstant: -4000 } },
    interaction: { hover: true, multiselect: false, keyboard: true },
    nodes: {
      shape: 'box',
      color: { background:'#1f2937', border:'#334155', highlight:{ background:'#0ea5e9', border:'#38bdf8' } },
      font: { color:'#e5e7eb' }, margin:8, borderWidth:1
    },
    edges: { color:'#3b4f9b', smooth:true }
  };

  network = new vis.Network(container, { nodes, edges }, options);
  migrateOldProjects();
  renderCurrentSpace(false);

  network.on('selectNode', (params)=>{
    const id = params.nodes[0];
    if (id === TETHER_ID) return;
    if (id === ME_ID) { clearSelectionPanel(false); return; }
    showProject(id);
  });

  network.on('doubleClick', (params) => {
    const id = params.nodes?.[0];
    if (!id) return;
    if (id === TETHER_ID) { traceTether(); return; }
    if (id !== ME_ID) openNodeSpace(id);
  });

  const savePositionsDebounced = debounce(() => savePositions(true), 400);
  network.on('dragEnd', (params) => {
    if (params.nodes && params.nodes.length) savePositionsDebounced();
  });

  window.addEventListener('beforeunload', () => savePositions(true));
}

function migrateOldProjects(){
  let changed = false;
  const validIds = new Set(projects.map(p => p.id));

  for (const p of projects) {
    if (!p.parentId || p.parentId === 'root' || (!validIds.has(p.parentId) && p.parentId !== ME_ID)) {
      p.parentId = ME_ID;
      changed = true;
    }
    if (p.pos && !p.posByView) {
      p.posByView = { [p.parentId || ME_ID]: p.pos };
      changed = true;
    }
  }

  if (viewRootId !== ME_ID && !validIds.has(viewRootId)) {
    setViewRoot(ME_ID);
  }

  if (changed) saveProjects();
}

function getProject(id){ return projects.find(x => x.id === id); }
function getParentId(id){ return getProject(id)?.parentId || ME_ID; }
function rootLabel(){ return viewRootId === ME_ID ? 'Shivraj' : (getProject(viewRootId)?.name || 'Shivraj'); }
function visibleChildren(){ return projects.filter(p => (p.parentId || ME_ID) === viewRootId); }
function posFor(p, rootId){ return p.posByView?.[rootId] || p.pos || undefined; }

function renderCurrentSpace(animate = true){
  nodes.clear();
  edges.clear();

  const currentRoot = viewRootId;
  fields.space.textContent = rootLabel();

  if (currentRoot === ME_ID) {
    nodes.add({
      id:ME_ID,
      label:'Shivraj',
      color:{ background:'#0ea5e9', border:'#22d3ee' },
      font:{ color:'#001018' }
    });
  } else {
    const rootProject = getProject(currentRoot);
    nodes.add({
      id:currentRoot,
      label: rootProject?.name || 'Node',
      x: posFor(rootProject || {}, currentRoot)?.x,
      y: posFor(rootProject || {}, currentRoot)?.y,
      color:{ background:'#0ea5e9', border:'#22d3ee' },
      font:{ color:'#ffffff', size:16, bold:true },
      margin:10,
      borderWidth:2
    });

    nodes.add({
      id:TETHER_ID,
      label:`↖ Trace tether\n${rootLabelOf(getParentId(currentRoot))}`,
      x:-220,
      y:-140,
      color:{
        background:'#211747',
        border:'#a78bfa',
        highlight:{ background:'#3b217b', border:'#c4b5fd' }
      },
      font:{ color:'#ddd6fe' },
      margin:9,
      borderWidth:1
    });

    edges.add({
      id:`${TETHER_ID}-${currentRoot}`,
      from:TETHER_ID,
      to:currentRoot,
      dashes:true,
      color:{ color:'#a78bfa' },
      smooth:{ type:'curvedCW', roundness:0.25 }
    });
  }

  for (const p of visibleChildren()){
    const pos = posFor(p, viewRootId);
    nodes.update({
      id:p.id,
      label:p.name,
      x:pos?.x,
      y:pos?.y,
      fixed:false
    });

    const edgeId = `${viewRootId}-${p.id}`;
    if (!edges.get(edgeId)) {
      edges.add({
        id:edgeId,
        from:viewRootId,
        to:p.id
      });
    }
  }

  try {
    network.fit({ animation: animate, padding: 100 });
  } catch {}
}

function rootLabelOf(id){
  if (id === ME_ID) return 'Shivraj';
  return getProject(id)?.name || 'Shivraj';
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

function clearSelectionPanel(clearSpace = true){
  setSelected(null);
  if (clearSpace) fields.space.textContent = rootLabel();
  fields.name.textContent = '—';
  fields.desc.value = '';
  fields.prog.value = 0;
  fields.progVal.textContent = '0%';
  fields.updated.textContent = '—';
  fields.files.innerHTML = '<div class="muted">Select a project to view files.</div>';
  fields.fileCount.textContent = '(0)';
}

function renderFiles(list){
  fields.files.innerHTML = list?.length ? '' : '<div class="muted">No files indexed yet.</div>';

  for (const f of (list||[]).slice(0,500)) {
    const div = document.createElement('div');
    div.className = 'file';
    div.textContent = `${f.path}  (${fmtSize(f.size)})`;
    fields.files.appendChild(div);
  }

  fields.fileCount.textContent = `(${list?.length||0})`;
}

function fmtSize(n){
  if(!Number.isFinite(n)) return '-';
  const u=['B','KB','MB','GB'];
  let i=0;
  while(n>1024&&i<u.length-1){n/=1024;i++}
  return n.toFixed(1)+' '+u[i];
}

export function addProject(name){
  const id = 'p_'+Math.random().toString(36).slice(2,8);
  const p = {
    id,
    name,
    parentId:viewRootId,
    desc:'',
    progress:0,
    updated: nowStr(),
    files:[],
    posByView:{}
  };

  updateProjects(list => (list.push(p), list));
  renderCurrentSpace(true);
  network.selectNodes([id]);
  showProject(id);
  toast(`Added ${name}`);
  return p;
}

export function renameProjectById(id,newName){
  const p = projects.find(x=>x.id===id); if(!p) return;
  p.name = newName;
  p.updated = nowStr();

  updateProjects(list => list);

  if (nodes.get(id)) {
    nodes.update({
      id,
      label: newName
    });
  }

  showProject(id);
  fields.space.textContent = rootLabel();
  toast('Renamed');
}

function descendantsOf(id){
  const result = [];
  const stack = [id];

  while (stack.length) {
    const cur = stack.pop();
    result.push(cur);
    for (const child of projects.filter(p => p.parentId === cur)) {
      stack.push(child.id);
    }
  }

  return result;
}

export function deleteProjectById(id){
  const p = projects.find(x=>x.id===id); if(!p) return;

  const all = descendantsOf(id);
  const extra = all.length > 1 ? ` and ${all.length - 1} child node(s)` : '';

  if(!confirm(`Delete project "${p.name}"${extra}?`)) return;

  const parent = getParentId(id);

  updateProjects(list => list.filter(z => !all.includes(z.id)));

  if (viewRootId === id || all.includes(viewRootId)) setViewRoot(parent);
  if (selectedId === id || all.includes(selectedId)) clearSelectionPanel(false);

  renderCurrentSpace(true);
  toast('Deleted');
}

export function openNodeSpace(id){
  if (id === ME_ID || id === TETHER_ID) return;

  const p = getProject(id);
  if (!p) return toast('Select a project');

  savePositions(true);
  setViewRoot(id);
  renderCurrentSpace(true);
  network.selectNodes([id]);
  showProject(id);
  toast(`Opened ${p.name} space`);
}

export function traceTether(){
  if (viewRootId === ME_ID) {
    fitView();
    toast('Already at Shivraj space');
    return;
  }

  const from = viewRootId;
  const parent = getParentId(from);

  savePositions(true);
  setViewRoot(parent);
  renderCurrentSpace(true);
  network.selectNodes([from]);
  showProject(from);
  toast(`Returned to ${rootLabelOf(parent)} space`);
}

export function openByName(name, focusOnly=false){
  const key = name.trim().toLowerCase();
  const p = projects.find(x => x.name.toLowerCase() === key);

  if(!p){
    toast('Not found: '+name);
    return null;
  }

  if (!nodes.get(p.id)) {
    setViewRoot(p.parentId || ME_ID);
    renderCurrentSpace(true);
  }

  network.selectNodes([p.id]);
  showProject(p.id);

  if(focusOnly){
    network.focus(p.id,{ scale:1.2, animation:true });
  }

  return p;
}

export function openNodeByName(name){
  const p = openByName(name, false);
  if (p) openNodeSpace(p.id);
  return p;
}

export function setProgressByName(name,val){
  const key = name.trim().toLowerCase();
  const p = projects.find(x => x.name.toLowerCase() === key);

  if(!p){
    return null;
  }

  val = Math.max(0, Math.min(100, val));
  p.progress = val;
  p.updated = nowStr();

  updateProjects(list => list);

  if (selectedId === p.id) {
    $('pProgress').value = val;
    $('pProgressVal').textContent = val+'%';
  }

  return p;
}

export function searchFilesInSelected(term){
  if(!selectedId) return toast('Select a project');

  const p = projects.find(x=>x.id===selectedId);
  if(!p?.files?.length) return toast('No index');

  const q = term.toLowerCase();
  const res = p.files.filter(f => f.path.toLowerCase().includes(q)).slice(0,500);

  const files = $('files');
  files.innerHTML='';

  for(const f of res){
    const div=document.createElement('div');
    div.className='file';
    div.textContent=`${f.path} (${fmtSize(f.size)})`;
    files.appendChild(div);
  }

  $('fileCount').textContent=`(${res.length}/${p.files.length})`;
  toast(`Found ${res.length}`);
}

export function savePositions(silent = false){
  if (!network) return;

  const visibleProjectIds = nodes.getIds().filter(id => id !== ME_ID && id !== TETHER_ID);
  const pos = network.getPositions(visibleProjectIds);

  for (const p of projects){
    if (pos[p.id]) {
      p.posByView = p.posByView || {};
      p.posByView[viewRootId] = {
        x: pos[p.id].x,
        y: pos[p.id].y
      };

      if ((p.parentId || ME_ID) === ME_ID && viewRootId === ME_ID) {
        p.pos = p.posByView[viewRootId];
      }
    }
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

export function selectFirstHomeProject(){
  const first = projects.find(p => (p.parentId || ME_ID) === ME_ID);

  if (first) {
    if (!nodes.get(first.id)) renderCurrentSpace(false);
    network.selectNodes([first.id]);
    showProject(first.id);
  } else {
    clearSelectionPanel(false);
  }
}