import './styles/base.css';
import './styles/themes.css';

import { DEFAULTS, PRESETS } from './state/params.js';
import { readURL, scheduleURLUpdate, shareURL } from './state/url.js';
import { exportPresetJSON, importPresetJSON } from './state/presetIO.js';
import { render } from './engine/pipeline.js';
import { setUploadedImage } from './engine/source.js';
import { buildControls, syncUI, updateVisibility, relabelControls } from './ui/controls.js';
import { t, initLang, setLang, getLang, applyStatic } from './i18n.js';

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
initLang();
buildControls(() => P, onParamChange);
applyStatic();

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
    toast(t('toast.link'));
  }catch{
    toast(t('toast.linkFail'));
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
    toast(t('toast.preset'));
  }catch{ toast(t('toast.jsonFail')); }
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

/* ---------- language ---------- */
const langBtns = [...document.querySelectorAll('#langSwitch button')];
function applyLang(l){
  setLang(l);
  langBtns.forEach(b => b.classList.toggle('on', b.dataset.lang === getLang()));
  applyStatic();
  relabelControls();
}
langBtns.forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));
applyLang(getLang());

/* ---------- panel resize ---------- */
const panel = document.getElementById('panel');
const resizer = document.getElementById('resizer');
try{
  const w = +localStorage.getItem('texlab-panelw');
  if(w >= 280 && w <= 640) panel.style.width = w + 'px';
}catch{}
resizer.addEventListener('pointerdown', e => {
  e.preventDefault();
  resizer.setPointerCapture(e.pointerId);
  resizer.classList.add('dragging');
  const startX = e.clientX, startW = panel.offsetWidth;
  const onMove = ev => {
    const w = Math.max(280, Math.min(640, startW + (startX - ev.clientX)));
    panel.style.width = w + 'px';
  };
  const onUp = ev => {
    resizer.classList.remove('dragging');
    resizer.releasePointerCapture(ev.pointerId);
    resizer.removeEventListener('pointermove', onMove);
    resizer.removeEventListener('pointerup', onUp);
    try{ localStorage.setItem('texlab-panelw', panel.offsetWidth); }catch{}
  };
  resizer.addEventListener('pointermove', onMove);
  resizer.addEventListener('pointerup', onUp);
});

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
