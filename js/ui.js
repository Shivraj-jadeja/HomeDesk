import { $, toast, speak, projects, selectedId, setSelected } from './data.js';
import { initGraph, addProject, renameProjectById, deleteProjectById, savePositions, showProject, openByName, searchFilesInSelected } from './graph.js';
import { startVoice, stopVoice } from './voice.js';
import { pickFolder, indexFiles, restoreHandles } from './files.js';

export async function initUI(){
  initGraph();

  if (projects[0]) { // auto-select first
    showProject(projects[0].id);
  }
  await restoreHandles(projects);

  $('addProjectBtn').onclick = () => {
    const name = prompt('Project name?'); if(!name) return;
    addProject(cap(name.trim()));
  };
  $('renameBtn').onclick = () => {
    if(!selectedId) return toast('Select a project');
    const name = prompt('New name?', $('pName').textContent || ''); if(name) renameProjectById(selectedId, cap(name.trim()));
  };
  $('deleteBtn').onclick = () => { if(!selectedId) return toast('Select a project'); deleteProjectById(selectedId); };
  $('saveLayoutBtn').onclick = savePositions;

  $('voiceStartBtn').onclick = startVoice;
  $('voiceStopBtn').onclick = stopVoice;

  $('pickFolderBtn').onclick = pickFolder;
  $('indexBtn').onclick = indexFiles;

  $('saveBtn').onclick = () => {
    if(!selectedId) return;
    const p = projects.find(x=>x.id===selectedId);
    if(!p) return;
    p.desc = $('pDesc').value;
    p.progress = parseInt($('pProgress').value,10);
    p.updated = new Date().toLocaleString();
    localStorage.setItem('projects', JSON.stringify(projects));
    toast('Saved'); speak('Saved');
  };
  $('pProgress').oninput = (e)=> $('pProgressVal').textContent = e.target.value + '%';
  $('searchBtn').onclick = () => { const t = $('searchInput').value.trim(); if(t) searchFilesInSelected(t); };
  $('searchInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ $('searchBtn').click(); } });
}

function cap(s){return s.replace(/\b\w/g, c=>c.toUpperCase());}
