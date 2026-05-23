import { toast, speak, projects, selectedId } from './data.js';
import { addProject, openByName, openNodeByName, setProgressByName, searchFilesInSelected, renameProjectById, deleteProjectById, fitView, traceTether } from './graph.js';

let rec = null; let listening=false;

function canVoice(){
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function startVoice(){
  if(!canVoice()){ toast('Voice not supported'); return; }
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  rec = new SpeechRec(); rec.lang='en-US'; rec.continuous=true; rec.interimResults=false;
  rec.onresult = (ev)=>{ const t = ev.results[ev.results.length-1][0].transcript.trim(); handleCommand(t); };
  rec.onerror = (e)=> toast('Voice error: '+e.error);
  rec.onend = ()=>{ if(listening){ rec.start(); } };
  rec.start(); listening=true; document.getElementById('voiceHint').textContent='🎤 Listening'; speak('Listening');
}

export function stopVoice(){
  if(rec){ listening=false; rec.stop(); document.getElementById('voiceHint').textContent='🎤 Voice off'; toast('Voice stopped'); }
}

function cap(s){return s.replace(/\b\w/g, c=>c.toUpperCase());}

export function handleCommand(raw){
  const t = raw.toLowerCase().trim();
  console.log('voice>', t);

  if (t === 'stop voice' || t === 'voice stop' || t === 'stop listening') {
    stopVoice(); speak('Voice stopped'); return;
  }
  if (t === 'center view' || t === 'reset view' || t === 'fit view') {
    fitView(); speak('Centered'); return;
  }
  if (t === 'trace tether' || t === 'follow tether' || t === 'go back') {
    traceTether(); speak('Following trace tether'); return;
  }

  if(/^(list|show) projects?$/.test(t)){
    const names = projects.map(p=>p.name).join(', ') || 'no projects';
    speak('Projects: ' + names); toast('Listed projects'); return;
  }

  let m;
  if(m = t.match(/^open node (.+)$/)){
    const p = openNodeByName(m[1].trim());
    speak(p ? `Opened ${p.name} space` : 'Project not found');
    return;
  }
  if(m = t.match(/^open project (.+)$/)){
    const p = openByName(m[1].trim());
    speak(p ? `Opened ${p.name}` : 'Project not found');
    return;
  }
  if(m = t.match(/^focus (.+)$/)){
    const p = openByName(m[1].trim(), true);
    speak(p ? `Focused ${p.name}` : 'Project not found');
    return;
  }
  if(m = t.match(/^set progress (.+) to (\d{1,3})$/)){
    const p = setProgressByName(m[1].trim(), parseInt(m[2],10));
    speak(p ? `${p.name} progress set` : 'Project not found');
    return;
  }
  if(m = t.match(/^add project (.+)$/)){
    const p = addProject(cap(m[1].trim()));
    speak(`Added project ${p.name}`);
    return;
  }
  if(m = t.match(/^add node (.+)$/)){
    const p = addProject(cap(m[1].trim()));
    speak(`Added node ${p.name}`);
    return;
  }
  if(m = t.match(/^search files (for )?(.+)$/)){ searchFilesInSelected(m[2].trim()); speak('Searching files'); return; }

  if (m = t.match(/^rename project (.+) to (.+)$/)) {
    const oldRaw = m[1].trim();
    const newName = cap(m[2].trim());
    if (oldRaw === 'current' || oldRaw === 'this') {
      if (!selectedId) { speak('No project selected'); toast('Select a project'); return; }
      renameProjectById(selectedId, newName);
      speak('Renamed'); return;
    } else {
      const p = projects.find(x => x.name.toLowerCase() === oldRaw.toLowerCase());
      if (!p) { speak('Project not found'); toast('Not found: ' + oldRaw); return; }
      renameProjectById(p.id, newName);
      speak('Renamed'); return;
    }
  }

  if(m = t.match(/^delete (project )?(.+)$/)){
    const target = (m[2]||'').trim();
    if(target === 'current project' || target === 'current' || target === 'this project'){
      if(!selectedId){ speak('No project selected'); toast('Select a project'); return; }
      deleteProjectById(selectedId); speak('Project deleted'); return;
    }
    const p = projects.find(x=>x.name.toLowerCase()===target.toLowerCase());
    if(!p){ speak('Project not found'); toast('Not found: '+target); return; }
    deleteProjectById(p.id); speak('Project deleted'); return;
  }

  toast('Unrecognized: '+raw); speak('Sorry, I did not get that');
}
