// grain & speckle stage — film grain (precomputed noise planes, amount and
// chroma applied cheaply per frame), plus dust and stray CMY ink flecks.

import { hash3, mulberry32 } from './random.js';

const grainCache = { key: '', n: null };

function getGrainNoise(P, w, h){
  const key = [w, h, P.seed, P.grainSize|0].join('|');
  if(key !== grainCache.key){
    const n = new Float32Array(w*h*4);
    const gs = Math.max(1, P.grainSize|0);
    const seed = P.seed;
    for(let y=0; y<h; y++){
      const hy = (y/gs)|0, ro = y*w*4;
      for(let x=0; x<w; x++){
        const hx = (x/gs)|0, i = ro + x*4;
        n[i]   = hash3(hx, hy, seed+21) - 0.5;
        n[i+1] = hash3(hx, hy, seed+55) - 0.5;
        n[i+2] = hash3(hx, hy, seed+89) - 0.5;
        n[i+3] = hash3(hx, hy, seed+123) - 0.5;
      }
    }
    grainCache.n = n; grainCache.key = key;
  }
  return grainCache.n;
}

export function applyGrain(P, ctx, w, h){
  const id = ctx.getImageData(0, 0, w, h), d = id.data;
  const amt = P.grainAmt * 190;
  const chroma = P.grainChroma;
  const n = getGrainNoise(P, w, h);
  const len = w*h*4;
  if(chroma > 0){
    const inv = 1 - chroma;
    for(let i=0; i<len; i+=4){
      const nL = n[i] * amt;
      d[i]   += nL*inv + n[i+1]*amt*chroma;
      d[i+1] += nL*inv + n[i+2]*amt*chroma;
      d[i+2] += nL*inv + n[i+3]*amt*chroma;
    }
  } else {
    for(let i=0; i<len; i+=4){
      const nL = n[i] * amt;
      d[i] += nL; d[i+1] += nL; d[i+2] += nL;
    }
  }
  ctx.putImageData(id, 0, 0);
}

export function drawSpeckles(P, ctx, w, h){
  const area = w * h;
  const rng = mulberry32(P.seed * 733 + 19);

  if(P.fleck > 0){
    // tiny stray-ink flecks like plate noise
    const cols = [P.cInk, P.mInk, P.yInk, '#ff2222', '#2266ff', '#22ddff'];
    const count = Math.floor(area / 900 * P.fleck);
    for(let i=0; i<count; i++){
      const x = rng()*w, y = rng()*h;
      const r = 0.5 + rng()*rng()*2.4;
      ctx.fillStyle = cols[(rng()*cols.length)|0];
      ctx.globalAlpha = 0.5 + rng()*0.5;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r*(0.4+rng()*0.6), rng()*3.14, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if(P.dust > 0){
    const count = Math.floor(area / 700 * P.dust);
    for(let i=0; i<count; i++){
      const x = rng()*w, y = rng()*h;
      const r = 0.3 + rng()*rng()*1.4;
      ctx.fillStyle = rng() < 0.5 ? P.paper : P.kInk;
      ctx.globalAlpha = 0.35 + rng()*0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
