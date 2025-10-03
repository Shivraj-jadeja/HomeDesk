import { $, toast, speak, projects, selectedId, nowStr, updateProjects } from './data.js';

const dbName = "homedesk-handles";
let dirHandleByProject = new Map();

export async function pickFolder(){
  if(!selectedId) return toast('Select a project');
  if(!window.showDirectoryPicker){ toast('Folder picker not supported'); return; }
  try{
    const handle = await window.showDirectoryPicker({ id:'homedesk', mode:'read' });
    dirHandleByProject.set(selectedId, handle);
    await saveHandle(selectedId, handle);
    toast('Folder set');
    speak('Folder selected');
  }catch(e){ if(e?.name!=='AbortError') toast('Folder error'); }
}

export async function indexFiles(){
  if(!selectedId) return toast('Select a project');
  const p = projects.find(x=>x.id===selectedId);
  if(!p) return;

  if (p.files && p.files.length > 0) {
    p.files = []; p.updated = nowStr();
    updateProjects(list => list);
    toast('Files cleared (folder remembered)');
    speak('Files cleared');
    return;
  }

  let handle = dirHandleByProject.get(selectedId);
  if(!handle) {
    if(!window.showDirectoryPicker){ toast('Folder picker not supported'); return; }
    try {
      handle = await window.showDirectoryPicker({ id:'homedesk', mode:'read' });
      dirHandleByProject.set(selectedId, handle);
      toast('Folder set'); speak('Folder selected');
    } catch(e){ if(e?.name!=='AbortError') toast('Folder error'); return; }
  }

  const files=[]; let count=0; const limit=1500;
  for await (const file of walk(handle)){
    files.push(file); count++; if(count>=limit) break;
  }
  p.files = files; p.updated = nowStr();
  updateProjects(list => list);
  toast(`Indexed ${files.length} files`);
  speak(`Indexed ${files.length} files`);
}

export async function restoreHandles(projects){
  for (const p of projects){
    const h = await loadHandle(p.id);
    if (h) dirHandleByProject.set(p.id, h);
  }
}

async function* walk(dirHandle, prefix=''){
  for await (const [name, handle] of dirHandle.entries()){
    if(name === '.git' || name.startsWith('.git/')) continue;
    const path = prefix ? `${prefix}/${name}` : name;
    if(handle.kind === 'file'){
      try{ const f = await handle.getFile(); yield { path, size:f.size, modified:f.lastModified }; }catch{}
    } else if(handle.kind === 'directory'){
      yield* walk(handle, path);
    }
  }
}

// IDB small helpers
function openDB(){
  return new Promise((resolve) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore("handles");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
async function saveHandle(projectId, handle){
  const db = await openDB(); if(!db) return;
  const tx = db.transaction("handles", "readwrite");
  tx.objectStore("handles").put(handle, projectId);
}
async function loadHandle(projectId){
  const db = await openDB(); if(!db) return null;
  return new Promise((res)=>{
    const tx = db.transaction("handles", "readonly");
    const getReq = tx.objectStore("handles").get(projectId);
    getReq.onsuccess = () => res(getReq.result || null);
    getReq.onerror = () => res(null);
  });
}
