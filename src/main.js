import './styles/base.css';
import './styles/themes.css';

import { DEFAULTS, PRESETS } from './state/params.js';
import { readURL, scheduleURLUpdate, shareURL } from './state/url.js';
import { exportPresetJSON, importPresetJSON } from './state/presetIO.js';
import { render } from './engine/pipeline.js';
import { setUploadedImage } from './engine/source.js';
import { buildControls, syncUI, updateVisibility } from './ui/controls.js';

let P = { ...DEFAULTS };

const view = document.getElementById('view');
const busy = document.getElementById('busy');
const statSize = document.getElementById('stat-size');
const statSeed = document.getElementById('stat-seed');
const statTime = document.getElementById('stat-time');

/* ---------- render scheduling ---------- */
let pending = false;
function requestRender(){
  if(pending) return;
  pending = true;
  busy.classList.add('on');
  requestAnimationFrame(() => {
    setTimeout(() => {
      const t0 = performance.now();
      render(P, view);
      statTime.textContent = `${Math.round(performance.now() - t0)} ms`;
      statSize.textContent = `${P.width}×${P.height}`;
      statSeed.textContent = `SEED ${P.seed}`;
      pending = false;
      busy.classList.remove('on');
    }, 0);
  });
}

function onParamChange(){
  scheduleURLUpdate(P);
  requestRender();
}

/* ---------- controls ---------- */
buildControls(() => P, onParamChange);

/* ---------- presets ---------- */
const presetSel = document.getElementById('preset');
for(const name of Object.keys(PRESETS)){
  const o = document.createElement('option');
  o.value = name; o.textContent = name;
  presetSel.appendChild(o);
}
function applyPreset(name){
  P = { ...DEFAULTS, ...(PRESETS[name] || {}) };
  syncUI(P);
  updateVisibility(P);
  onParamChange();
}
presetSel.addEventListener('change', () => applyPreset(presetSel.value));

/* ---------- toolbar ---------- */
document.getElementById('rndSeed').addEventListener('click', () => {
  P.seed = 1 + Math.floor(Math.random() * 99999);
  syncUI(P); onParamChange();
});

document.getElementById('export').addEventListener('click', () => {
  view.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `texture-${P.seed}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
});

document.getElementById('share').addEventListener('click', async () => {
  const url = shareURL(P);
  try{
    await navigator.clipboard.writeText(url);
    toast('링크가 클립보드에 복사되었습니다');
  }catch{
    toast('주소창의 URL을 복사하세요 (자동 복사 실패)');
  }
});

document.getElementById('saveJson').addEventListener('click', () => exportPresetJSON(P));
document.getElementById('loadJson').addEventListener('click', () =>
  document.getElementById('jsonFile').click());
document.getElementById('jsonFile').addEventListener('change', async e => {
  const f = e.target.files[0];
  if(!f) return;
  try{
    P = await importPresetJSON(f);
    syncUI(P); updateVisibility(P); onParamChange();
    toast('프리셋을 불러왔습니다');
  }catch{ toast('JSON 파싱 실패'); }
  e.target.value = '';
});

document.getElementById('upload').addEventListener('change', e => {
  const f = e.target.files[0];
  if(!f) return;
  const img = new Image();
  img.onload = () => {
    setUploadedImage(img);
    P.srcMode = 'image';
    syncUI(P); updateVisibility(P); onParamChange();
  };
  img.src = URL.createObjectURL(f);
});

/* ---------- theme ---------- */
const themeBtns = [...document.querySelectorAll('#themeSwitch button')];
function setTheme(t){
  document.body.dataset.theme = t;
  themeBtns.forEach(b => b.classList.toggle('on', b.dataset.t === t));
  try{ localStorage.setItem('texlab-theme', t); }catch{}
}
themeBtns.forEach(b => b.addEventListener('click', () => setTheme(b.dataset.t)));
try{
  const saved = localStorage.getItem('texlab-theme');
  if(saved === 'brutal' || saved === 'instrument') setTheme(saved);
}catch{}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('on'); el.hidden = true; }, 2200);
}

/* ---------- init: URL state > first preset ---------- */
const fromURL = readURL();
if(fromURL && Object.keys(fromURL).length){
  P = { ...DEFAULTS, ...fromURL };
  syncUI(P); updateVisibility(P); requestRender();
} else {
  presetSel.value = Object.keys(PRESETS)[0];
  applyPreset(presetSel.value);
}
