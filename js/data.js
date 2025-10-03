export const ME_ID = 'me';

const speakImpl = (t) => window.speechSynthesis?.speak(new SpeechSynthesisUtterance(t));
export const speak = (t) => { try { speakImpl(t); } catch {} };
export const $ = (id) => document.getElementById(id);
export const nowStr = () => new Date().toLocaleString();
const saveLocal = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const readLocal = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export let projects = readLocal('projects', []); // [{id,name,desc,progress,updated,files, pos}]
export let selectedId = null;

export function setSelected(id){ selectedId = id; }
export function updateProjects(mutator){
  projects = mutator(Array.isArray(projects) ? projects.slice() : []);
  saveLocal('projects', projects);
  return projects;
}
export function saveProjects(){ saveLocal('projects', projects); }

export function toast(msg){
  $('status').textContent = msg;
  setTimeout(() => { $('status').textContent = 'ready' }, 1500);
}
