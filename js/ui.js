import { $, toast, speak, projects, selectedId, debounce } from './data.js';
import { initGraph, addProject, renameProjectById, deleteProjectById, showProject, searchFilesInSelected, fitView } from './graph.js';
import { startVoice, stopVoice } from './voice.js';
import { pickFolder, indexFiles, restoreHandles } from './files.js';

export async function initUI(){
  initGraph();

  if (!projects.length) {
  addProject('Sample Project');
}


  if (projects[0]) { // auto-select first
    showProject(projects[0].id);
  }
  await restoreHandles(projects);

  const centerBtn = $('centerBtn');
  if (centerBtn) centerBtn.onclick = () => fitView();

  $('addProjectBtn').onclick = () => {
    const name = prompt('Project name?'); if(!name) return;
    addProject(cap(name.trim()));
  };
  $('renameBtn').onclick = () => {
    if(!selectedId) return toast('Select a project');
    const name = prompt('New name?', $('pName').textContent || ''); if(name) renameProjectById(selectedId, cap(name.trim()));
  };
  $('deleteBtn').onclick = () => { if(!selectedId) return toast('Select a project'); deleteProjectById(selectedId); };

  $('voiceStartBtn').onclick = startVoice;
  $('voiceStopBtn').onclick = stopVoice;

  $('pickFolderBtn').onclick = pickFolder;
  $('indexBtn').onclick = indexFiles;

  // --- Debounced auto-persist for desc & progress ---
  const persist = debounce(() => {
    if (!selectedId) return;
    localStorage.setItem('projects', JSON.stringify(projects));
    toast('Saved');
  }, 400);

  // Description auto-save
  $('pDesc').addEventListener('input', () => {
    if (!selectedId) return;
    const p = projects.find(x => x.id === selectedId); if (!p) return;
    p.desc = $('pDesc').value;
    p.updated = new Date().toLocaleString();
    persist();
  });

  // Progress auto-save (also updates pill)
  $('pProgress').addEventListener('input', (e) => {
    if (!selectedId) return;
    const p = projects.find(x => x.id === selectedId); if (!p) return;
    const val = parseInt(e.target.value, 10) || 0;
    $('pProgressVal').textContent = val + '%';
    p.progress = val;
    p.updated = new Date().toLocaleString();
    persist();
  });

  // Search
  $('searchBtn').onclick = () => { 
    const t = $('searchInput').value.trim(); 
    if(t) searchFilesInSelected(t); 
  };
  $('searchInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ $('searchBtn').click(); } });
}

function cap(s){return s.replace(/\b\w/g, c=>c.toUpperCase());}
