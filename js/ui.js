import { $, toast, projects, selectedId, debounce, saveProjects } from './data.js';
import { initGraph, addProject, renameProjectById, deleteProjectById, showProject, searchFilesInSelected, fitView, openNodeSpace, traceTether, selectFirstHomeProject } from './graph.js';
import { startVoice, stopVoice } from './voice.js';
import { pickFolder, indexFiles, restoreHandles } from './files.js';

export async function initUI(){
  initGraph();

  if (!projects.length) {
    addProject('Sample Project');
  }

  selectFirstHomeProject();
  await restoreHandles(projects);

  const centerBtn = $('centerBtn');
  if (centerBtn) {
    centerBtn.onclick = () => {
      fitView();

      if (typeof window.resetHomedeskGalaxy === 'function') {
        window.resetHomedeskGalaxy();
      }
    };
  }

  $('addProjectBtn').onclick = () => {
    const name = prompt('Project name?'); if(!name) return;
    addProject(cap(name.trim()));
  };

  $('openNodeBtn').onclick = () => {
    if(!selectedId) return toast('Select a project');
    openNodeSpace(selectedId);
  };

  $('traceTetherBtn').onclick = () => traceTether();

  $('renameBtn').onclick = () => {
    if(!selectedId) return toast('Select a project');
    const name = prompt('New name?', $('pName').textContent || ''); if(name) renameProjectById(selectedId, cap(name.trim()));
  };

  $('deleteBtn').onclick = () => {
    if(!selectedId) return toast('Select a project');
    deleteProjectById(selectedId);
  };

  $('voiceStartBtn').onclick = startVoice;
  $('voiceStopBtn').onclick = stopVoice;

  $('pickFolderBtn').onclick = pickFolder;
  $('indexBtn').onclick = indexFiles;

  const persist = debounce(() => {
    if (!selectedId) return;
    saveProjects();
    toast('Saved');
  }, 400);

  $('pDesc').addEventListener('input', () => {
    if (!selectedId) return;
    const p = projects.find(x => x.id === selectedId); if (!p) return;
    p.desc = $('pDesc').value;
    p.updated = new Date().toLocaleString();
    $('pUpdated').textContent = p.updated;
    persist();
  });

  $('pProgress').addEventListener('input', (e) => {
    if (!selectedId) return;
    const p = projects.find(x => x.id === selectedId); if (!p) return;
    const val = parseInt(e.target.value, 10) || 0;
    $('pProgressVal').textContent = val + '%';
    p.progress = val;
    p.updated = new Date().toLocaleString();
    $('pUpdated').textContent = p.updated;
    persist();
  });

  $('searchBtn').onclick = () => {
    const t = $('searchInput').value.trim();
    if(t) searchFilesInSelected(t);
  };

  $('searchInput').addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      $('searchBtn').click();
    }
  });
}

function cap(s){
  return s.replace(/\b\w/g, c=>c.toUpperCase());
}