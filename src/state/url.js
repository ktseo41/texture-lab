// encode the non-default part of the state into the URL (?p=...)
// so any texture setting can be shared as a link.

import { DEFAULTS } from './params.js';

function diffFromDefaults(P){
  const d = {};
  for(const k of Object.keys(DEFAULTS)){
    if(P[k] !== DEFAULTS[k]) d[k] = P[k];
  }
  return d;
}

function b64urlEncode(str){
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str){
  return decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
}

export function encodeState(P){
  const d = diffFromDefaults(P);
  return Object.keys(d).length ? b64urlEncode(JSON.stringify(d)) : '';
}

export function readURL(){
  try{
    const q = new URLSearchParams(location.search).get('p');
    if(!q) return null;
    const d = JSON.parse(b64urlDecode(q));
    // only accept known keys with matching types
    const out = {};
    for(const [k, v] of Object.entries(d)){
      if(k in DEFAULTS && typeof v === typeof DEFAULTS[k]) out[k] = v;
    }
    return out;
  }catch{ return null; }
}

let urlTimer = null;
export function scheduleURLUpdate(P){
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const enc = encodeState(P);
    const url = enc ? `${location.pathname}?p=${enc}` : location.pathname;
    history.replaceState(null, '', url);
  }, 300);
}

export function shareURL(P){
  const enc = encodeState(P);
  const url = enc ? `${location.pathname}?p=${enc}` : location.pathname;
  history.replaceState(null, '', url);
  return location.href;
}
