export const ME_ID = 'me';

const speakImpl = (t) => window.speechSynthesis?.speak(new SpeechSynthesisUtterance(t));
export const speak = (t) => { try { speakImpl(t); } catch {} };
export const $ = (id) => document.getElementById(id);
export const nowStr = () => new Date().toLocaleString();

const DB_ENDPOINT = './homedesk-db';

const saveLocal = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const readLocal = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};

export let projects = readLocal('projects', []);
export let selectedId = null;
export let viewRootId = readLocal('viewRootId', ME_ID) || ME_ID;

let serverSaveTimer = null;
let serverReady = false;

export function setSelected(id){
  selectedId = id;
}

export function setViewRoot(id){
  viewRootId = id || ME_ID;
  saveLocal('viewRootId', viewRootId);
}

export async function loadProjectsFromServer() {
  try {
    const res = await fetch(DB_ENDPOINT, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`DB load failed: ${res.status}`);
    }

    const data = await res.json();

    if (Array.isArray(data.projects)) {
      projects = data.projects;
      saveLocal('projects', projects);
      serverReady = true;
      return true;
    }
  } catch (err) {
    console.warn('HomeDesk DB server not available. Using localStorage fallback.', err);
  }

  serverReady = false;
  projects = readLocal('projects', []);
  return false;
}

async function saveProjectsToServerNow() {
  if (!serverReady) return false;

  try {
    const res = await fetch(DB_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projects })
    });

    if (!res.ok) {
      throw new Error(`DB save failed: ${res.status}`);
    }

    return true;
  } catch (err) {
    console.warn('Could not save to HomeDesk DB server. localStorage backup still saved.', err);
    serverReady = false;
    return false;
  }
}

function queueServerSave() {
  clearTimeout(serverSaveTimer);

  serverSaveTimer = setTimeout(() => {
    saveProjectsToServerNow();
  }, 250);
}

export function updateProjects(mutator){
  projects = mutator(Array.isArray(projects) ? projects.slice() : []);

  saveLocal('projects', projects);
  queueServerSave();

  return projects;
}

export function saveProjects(){
  saveLocal('projects', projects);
  queueServerSave();
}

export async function saveProjectsNow(){
  saveLocal('projects', projects);
  return await saveProjectsToServerNow();
}

export function toast(msg){
  $('status').textContent = msg;
  setTimeout(() => { $('status').textContent = 'ready' }, 1500);
}

export function debounce(fn, ms = 400) {
  let t;

  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}