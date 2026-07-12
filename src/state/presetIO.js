// save / load the full parameter set as a .json file

import { DEFAULTS } from './params.js';

export function exportPresetJSON(P){
  const blob = new Blob([JSON.stringify(P, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `texture-preset-${P.seed}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importPresetJSON(file){
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => {
      try{
        const raw = JSON.parse(rd.result);
        const out = { ...DEFAULTS };
        for(const [k, v] of Object.entries(raw)){
          if(k in DEFAULTS && typeof v === typeof DEFAULTS[k]) out[k] = v;
        }
        resolve(out);
      }catch(e){ reject(e); }
    };
    rd.onerror = reject;
    rd.readAsText(file);
  });
}
