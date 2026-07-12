// control-panel builder: declarative defs → DOM, plus sync & visibility
// labels/hints/options come from i18n — label key = param key, hint key = hint.<key>, opt key = opt.<key>.<value>

import { t } from '../i18n.js';

export const UI = {
  'g-canvas': [
    {k:'width',  t:'number'},
    {k:'height', t:'number'},
    {k:'seed',   t:'number'},
  ],
  'g-source': [
    {k:'srcMode', t:'select', opts:['blobs','linear','image']},
    {k:'srcBg', t:'color', show:p=>p.srcMode==='blobs'},
    {k:'blobColors', t:'range', min:1, max:5, step:1, show:p=>p.srcMode==='blobs'},
    {k:'gradStops', t:'range', min:2, max:5, step:1, show:p=>p.srcMode==='linear'},
    {k:'srcC1', t:'color', show:p=>p.srcMode!=='image'},
    {k:'srcC2', t:'color', show:p=>p.srcMode==='linear' || (p.srcMode==='blobs' && p.blobColors>=2)},
    {k:'srcC3', t:'color', show:p=>(p.srcMode==='blobs' && p.blobColors>=3) || (p.srcMode==='linear' && p.gradStops>=3)},
    {k:'srcC4', t:'color', show:p=>(p.srcMode==='blobs' && p.blobColors>=4) || (p.srcMode==='linear' && p.gradStops>=4)},
    {k:'srcC5', t:'color', show:p=>(p.srcMode==='blobs' && p.blobColors>=5) || (p.srcMode==='linear' && p.gradStops>=5)},
    {k:'gradAngle', t:'range', min:0, max:360, step:1, show:p=>p.srcMode==='linear'},
    {k:'gradCX', t:'range', min:-50, max:150, step:1, show:p=>p.srcMode==='linear'},
    {k:'gradCY', t:'range', min:-50, max:150, step:1, show:p=>p.srcMode==='linear'},
    {k:'gradLen', t:'range', min:5, max:200, step:1, show:p=>p.srcMode==='linear', hint:true},
    {k:'blobCount', t:'range', min:1, max:16, step:1, show:p=>p.srcMode==='blobs'},
    {k:'blobScale', t:'range', min:10, max:150, step:1, show:p=>p.srcMode==='blobs'},
    {k:'blobIrregular', t:'range', min:0, max:1, step:0.01, show:p=>p.srcMode==='blobs', hint:true},
    {k:'blobSoft', t:'range', min:0, max:120, step:1, show:p=>p.srcMode==='blobs', hint:true},
    {k:'srcContrast', t:'range', min:-50, max:80, step:1},
    {k:'srcBright', t:'range', min:-60, max:60, step:1},
    {k:'posterize', t:'range', min:0, max:12, step:1, hint:true},
  ],
  'g-halftone': [
    {k:'htOn', t:'check'},
    {k:'cell', t:'range', min:2, max:30, step:0.5, dim:p=>!p.htOn},
    {k:'shape', t:'select', opts:['circle','diamond','square','ellipse','line'], dim:p=>!p.htOn},
    {k:'dotGain', t:'range', min:0.3, max:2.5, step:0.01, hint:true, dim:p=>!p.htOn},
    {k:'dotMax', t:'range', min:0.5, max:2.2, step:0.01, dim:p=>!p.htOn},
    {k:'dotMin', t:'range', min:0, max:0.3, step:0.005, dim:p=>!p.htOn},
    {k:'sizeJitter', t:'range', min:0, max:1, step:0.01, hint:true, dim:p=>!p.htOn},
    {k:'posJitter', t:'range', min:0, max:1, step:0.01, dim:p=>!p.htOn},
    {k:'roughness', t:'range', min:0, max:1, step:0.01, hint:true, dim:p=>!p.htOn},
    {k:'inkOpacity', t:'range', min:0.3, max:1, step:0.01, dim:p=>!p.htOn},
    {k:'misreg', t:'range', min:0, max:20, step:0.5, hint:true, dim:p=>!p.htOn},
    {k:'paper', t:'color', dim:p=>!p.htOn},
    {k:'cInk', t:'color', dim:p=>!p.htOn},
    {k:'mInk', t:'color', dim:p=>!p.htOn},
    {k:'yInk', t:'color', dim:p=>!p.htOn},
    {k:'kInk', t:'color', dim:p=>!p.htOn},
  ],
  'g-grunge': [
    {k:'turbAmt', t:'range', min:0, max:60, step:0.5, hint:true},
    {k:'turbScale', t:'range', min:5, max:200, step:1, dim:p=>p.turbAmt===0},
    {k:'fleck', t:'range', min:0, max:1, step:0.01, hint:true},
    {k:'dust', t:'range', min:0, max:1, step:0.01, hint:true},
  ],
  'g-grain': [
    {k:'grainAmt', t:'range', min:0, max:1, step:0.005},
    {k:'grainSize', t:'range', min:1, max:6, step:1, dim:p=>p.grainAmt===0},
    {k:'grainChroma', t:'range', min:0, max:1, step:0.01, hint:true, dim:p=>p.grainAmt===0},
  ],
};

export const CHANNELS = [
  {id:'c', name:'C'}, {id:'m', name:'M'}, {id:'y', name:'Y'}, {id:'k', name:'K'},
];

const inputs = {};
const visRules = [];
const dimRules = []; // {fn, els} — dim + disable inputs when fn(P) is true
const labeled = []; // {def, lab, hintEl, inp, rst}

function readInput(d, inp){
  if(d.t === 'check') return inp.checked;
  if(d.t === 'select' || d.t === 'color') return inp.value;
  return +inp.value;
}
function fmt(v){
  return (typeof v === 'number' && !Number.isInteger(v)) ? v.toFixed(2).replace(/\.?0+$/,'') : String(v);
}

export function updateVisibility(P){
  for(const r of visRules){
    const on = r.fn(P);
    for(const el of r.els) el.style.display = on ? '' : 'none';
  }
  for(const r of dimRules){
    const dim = r.fn(P);
    for(const el of r.els){
      el.classList.toggle('dim', dim);
      for(const i of el.querySelectorAll('input, select')) i.disabled = dim;
    }
  }
}

export function syncUI(P){
  for(const [k, o] of Object.entries(inputs)){
    const v = P[k];
    if(o.def.t === 'check') o.inp.checked = !!v;
    else o.inp.value = v;
    if(o.val) o.val.textContent = fmt(v);
  }
}

// re-apply current language to all generated labels/hints/options
export function relabelControls(){
  for(const it of labeled){
    it.lab.textContent = t(it.def.k);
    if(it.hintEl) it.hintEl.textContent = t('hint.' + it.def.k);
    if(it.rst) it.rst.title = t('title.rstOne');
    if(it.def.t === 'select'){
      for(const o of it.inp.options) o.textContent = t(`opt.${it.def.k}.${o.value}`);
    }
  }
}

// mark rows whose value differs from the baseline (current preset + defaults)
export function updateDirty(P, baseline){
  for(const it of labeled){
    if(!it.rst) continue;
    it.rst.style.visibility = P[it.def.k] !== baseline[it.def.k] ? 'visible' : 'hidden';
  }
}

function setInputValue(o, v){
  if(o.def.t === 'check') o.inp.checked = !!v;
  else o.inp.value = v;
  if(o.val) o.val.textContent = fmt(v);
}

// getP: () => current params object   onChange: (key) => void
// getBaseline: () => reference values for per-param reset (preset + defaults)
export function buildControls(getP, onChange, getBaseline){
  for(const [gid, defs] of Object.entries(UI)){
    const grp = document.getElementById(gid);
    for(const d of defs){
      const row = document.createElement('div');
      row.className = 'row';
      const lab = document.createElement('label');
      lab.textContent = t(d.k);
      row.appendChild(lab);
      let inp, val;
      if(d.t === 'range'){
        inp = document.createElement('input');
        inp.type = 'range'; inp.min = d.min; inp.max = d.max; inp.step = d.step;
        val = document.createElement('span'); val.className = 'val';
        row.appendChild(inp); row.appendChild(val);
      } else if(d.t === 'number'){
        inp = document.createElement('input'); inp.type = 'number';
        row.appendChild(inp);
      } else if(d.t === 'color'){
        inp = document.createElement('input'); inp.type = 'color';
        row.appendChild(inp);
      } else if(d.t === 'check'){
        inp = document.createElement('input'); inp.type = 'checkbox';
        row.appendChild(inp);
      } else if(d.t === 'select'){
        inp = document.createElement('select');
        for(const v of d.opts){
          const o = document.createElement('option');
          o.value = v; o.textContent = t(`opt.${d.k}.${v}`);
          inp.appendChild(o);
        }
        row.appendChild(inp);
      }
      inputs[d.k] = { inp, val, def: d };
      const rst = document.createElement('button');
      rst.type = 'button'; rst.className = 'rst'; rst.textContent = '↺';
      rst.title = t('title.rstOne'); rst.style.visibility = 'hidden';
      rst.addEventListener('click', () => {
        const P = getP();
        P[d.k] = getBaseline()[d.k];
        setInputValue(inputs[d.k], P[d.k]);
        onChange(d.k);
      });
      row.appendChild(rst);
      grp.appendChild(row);
      let hintEl = null;
      if(d.hint){
        hintEl = document.createElement('div'); hintEl.className = 'hint';
        hintEl.textContent = t('hint.' + d.k);
        grp.appendChild(hintEl);
      }
      labeled.push({ def: d, lab, hintEl, inp, rst });
      if(d.show) visRules.push({ fn: d.show, els: hintEl ? [row, hintEl] : [row] });
      if(d.dim) dimRules.push({ fn: d.dim, els: hintEl ? [row, hintEl] : [row] });
      inp.addEventListener('input', () => {
        const P = getP();
        P[d.k] = readInput(d, inp);
        if(val) val.textContent = fmt(P[d.k]);
        onChange(d.k);
      });
    }
  }
  // channel rows (enable / angle / offset X / offset Y)
  const chBox = document.getElementById('channels');
  for(const ch of CHANNELS){
    const row = document.createElement('div');
    row.className = 'chrow';
    const en = document.createElement('input'); en.type = 'checkbox';
    const tag = document.createElement('span'); tag.className = 'tag ch-' + ch.id; tag.textContent = ch.name;
    const ang = document.createElement('input'); ang.type = 'number'; ang.step = 1;
    const ox = document.createElement('input'); ox.type = 'number'; ox.step = 0.5;
    const oy = document.createElement('input'); oy.type = 'number'; oy.step = 0.5;
    row.append(en, tag, ang, ox, oy);
    chBox.appendChild(row);
    const bind = (inp, key, kind) => {
      inputs[key] = { inp, def: { t: kind } };
      inp.addEventListener('input', () => {
        const P = getP();
        P[key] = kind === 'check' ? inp.checked : (+inp.value || 0);
        onChange(key);
      });
    };
    bind(en, ch.id + 'On', 'check');
    bind(ang, ch.id + 'Ang', 'number');
    bind(ox, ch.id + 'OffX', 'number');
    bind(oy, ch.id + 'OffY', 'number');
  }
  // whole channel block (hint + grid) follows the halftone master toggle
  dimRules.push({ fn: p => !p.htOn, els: [chBox.closest('.grp')] });
}
