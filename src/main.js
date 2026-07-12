import './styles/base.css';
import './styles/themes.css';

import { DEFAULTS, PRESETS } from './state/params.js';
import { readURL, scheduleURLUpdate, shareURL } from './state/url.js';
import { exportPresetJSON, importPresetJSON } from './state/presetIO.js';
import { render } from './engine/pipeline.js';
import { setUploadedImage, clearUploadedImage, bumpFontGen } from './engine/source.js';
import { buildControls, syncUI, updateVisibility, relabelControls, updateDirty } from './ui/controls.js';
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

// first render can race webfont loading — re-render text with the real font
document.fonts.ready.then(() => { bumpFontGen(); requestRender(); });

/* ---------- user presets (localStorage) ---------- */
const USER_PRESET_KEY = 'texlab-userpresets';
function loadUserPresets(){
  try{ return JSON.parse(localStorage.getItem(USER_PRESET_KEY)) || {}; }catch{ return {}; }
}
function saveUserPresets(u){
  try{ localStorage.setItem(USER_PRESET_KEY, JSON.stringify(u)); }catch{}
}
// select option values: factory = preset id, user = 'u:' + name
function resolvePreset(v){
  if(v && v.startsWith('u:')) return loadUserPresets()[v.slice(2)] || {};
  return PRESETS[v] || {};
}

function baselineOf(){
  const sel = document.getElementById('preset');
  return { ...DEFAULTS, ...resolvePreset(sel.value) };
}

function onParamChange(){
  scheduleURLUpdate(P, document.getElementById('preset').value);
  updateVisibility(P);
  updateDirty(P, baselineOf());
  requestRender();
}

// fold sections whose feature is inactive in the current state
function updateSections(P){
  const open = {
    'g-halftone': P.htOn,
    'g-grunge': P.turbAmt > 0 || P.fleck > 0 || P.dust > 0,
    'g-grain': P.grainAmt > 0,
  };
  for(const [gid, on] of Object.entries(open)){
    document.getElementById(gid).closest('details').open = on;
  }
}

/* ---------- controls ---------- */
initLang();
buildControls(() => P, onParamChange, baselineOf);
applyStatic();

/* ---------- presets ---------- */
const presetSel = document.getElementById('preset');
const savePresetBtn = document.getElementById('savePreset');
const delPresetBtn = document.getElementById('delPreset');

function populatePresetSelect(){
  const cur = presetSel.value;
  presetSel.innerHTML = '';
  const factory = document.createElement('optgroup');
  factory.label = t('presets.factory');
  for(const id of Object.keys(PRESETS)){
    const o = document.createElement('option');
    o.value = id; o.textContent = t('preset.' + id);
    factory.appendChild(o);
  }
  presetSel.appendChild(factory);
  const names = Object.keys(loadUserPresets());
  if(names.length){
    const mine = document.createElement('optgroup');
    mine.label = t('presets.user');
    for(const n of names){
      const o = document.createElement('option');
      o.value = 'u:' + n; o.textContent = n;
      mine.appendChild(o);
    }
    presetSel.appendChild(mine);
  }
  if(cur && [...presetSel.options].some(o => o.value === cur)) presetSel.value = cur;
  delPresetBtn.hidden = !presetSel.value.startsWith('u:');
}
populatePresetSelect();

function applyPreset(v){
  P = { ...DEFAULTS, ...resolvePreset(v) };
  syncUI(P);
  updateSections(P);
  onParamChange();
}
presetSel.addEventListener('change', () => {
  delPresetBtn.hidden = !presetSel.value.startsWith('u:');
  applyPreset(presetSel.value);
});

savePresetBtn.addEventListener('click', () => {
  const name = (prompt(t('prompt.presetName')) || '').trim();
  if(!name) return;
  const u = loadUserPresets();
  const d = {};
  for(const k of Object.keys(DEFAULTS)) if(P[k] !== DEFAULTS[k]) d[k] = P[k];
  u[name] = d;
  saveUserPresets(u);
  presetSel.value = '';
  populatePresetSelect();
  presetSel.value = 'u:' + name;
  delPresetBtn.hidden = false;
  scheduleURLUpdate(P, presetSel.value);
  updateDirty(P, baselineOf());
  toast(t('toast.presetSaved'));
});

delPresetBtn.addEventListener('click', () => {
  const v = presetSel.value;
  if(!v.startsWith('u:')) return;
  const name = v.slice(2);
  if(!confirm(t('confirm.presetDelete').replace('{name}', name))) return;
  const u = loadUserPresets();
  delete u[name];
  saveUserPresets(u);
  presetSel.value = Object.keys(PRESETS)[0];
  populatePresetSelect();
  scheduleURLUpdate(P, presetSel.value);
  updateDirty(P, baselineOf());
  toast(t('toast.presetDeleted'));
});

/* ---------- toolbar ---------- */
document.getElementById('reset').addEventListener('click', () => {
  clearUploadedImage();
  uploadInput.value = '';
  clearUploadBtn.hidden = true;
  applyPreset(presetSel.value);
  toast(t('toast.reset'));
});

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
  const url = shareURL(P, presetSel.value);
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
    syncUI(P); updateSections(P); onParamChange();
    toast(t('toast.preset'));
  }catch{ toast(t('toast.jsonFail')); }
  e.target.value = '';
});

const uploadInput = document.getElementById('upload');
const clearUploadBtn = document.getElementById('clearUpload');
uploadInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if(!f) return;
  const img = new Image();
  img.onload = () => {
    setUploadedImage(img);
    P.srcMode = 'image';
    clearUploadBtn.hidden = false;
    syncUI(P); updateVisibility(P); onParamChange();
  };
  img.src = URL.createObjectURL(f);
});
clearUploadBtn.addEventListener('click', () => {
  clearUploadedImage();
  uploadInput.value = '';
  clearUploadBtn.hidden = true;
  if(P.srcMode === 'image') P.srcMode = 'blobs';
  syncUI(P); updateVisibility(P); onParamChange();
  toast(t('toast.uploadCleared'));
});

/* ---------- language ---------- */
const langBtns = [...document.querySelectorAll('#langSwitch button')];
function applyLang(l){
  setLang(l);
  langBtns.forEach(b => b.classList.toggle('on', b.dataset.lang === getLang()));
  applyStatic();
  relabelControls();
  populatePresetSelect();
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
if(fromURL && (Object.keys(fromURL.params).length || fromURL.ps)){
  P = { ...DEFAULTS, ...fromURL.params };
  if(fromURL.ps && [...presetSel.options].some(o => o.value === fromURL.ps)){
    presetSel.value = fromURL.ps;
    delPresetBtn.hidden = !fromURL.ps.startsWith('u:');
  }
  syncUI(P); updateSections(P); updateVisibility(P); updateDirty(P, baselineOf()); requestRender();
} else {
  presetSel.value = Object.keys(PRESETS)[0];
  applyPreset(presetSel.value);
}
