// full render pipeline:  source → CMYK separation/screening → speckle → grain

import { hash3 } from './random.js';
import { renderSource, sourceKey } from './source.js';
import { getChannelLayer, CH_MARGIN } from './halftone.js';
import { applyGrain, drawSpeckles } from './grain.js';
import { applyFractalGlass } from './glass.js';

export const srcCanvas = document.createElement('canvas');
const srcCache = { key: '', data: null };
const baseCache = { key: '', cv: null };    // source + halftone composite
const glassCache = { key: '', cv: null };   // base + fractal glass

function getSource(P){
  const key = sourceKey(P);
  if(key !== srcCache.key){
    renderSource(P, srcCanvas);
    srcCache.data = srcCanvas.getContext('2d').getImageData(0, 0, P.width, P.height).data;
    srcCache.key = key;
  }
  return { data: srcCache.data, key: srcCache.key };
}

// stage 1: source + halftone composite, re-rendered only when its params change
function getBase(P, src, w, h){
  const key = !P.htOn
    ? 'plain‖' + src.key + '‖' + w + ',' + h
    : src.key + '‖' + [w, h, P.seed, P.paper, P.inkOpacity, P.misreg,
        P.cell, P.shape, P.dotGain, P.dotMax, P.dotMin,
        P.sizeJitter, P.posJitter, P.roughness, P.turbAmt, P.turbScale,
        P.cOn, P.cAng, P.cOffX, P.cOffY, P.cInk,
        P.mOn, P.mAng, P.mOffX, P.mOffY, P.mInk,
        P.yOn, P.yAng, P.yOffX, P.yOffY, P.yInk,
        P.kOn, P.kAng, P.kOffX, P.kOffY, P.kInk].join(',');
  if(key === baseCache.key) return baseCache;

  const cv = baseCache.cv || document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');

  if(!P.htOn){
    ctx.drawImage(srcCanvas, 0, 0);
  } else {
    ctx.fillStyle = P.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = P.inkOpacity;

    const chans = [
      {i:0, on:P.cOn, ang:P.cAng, ox:P.cOffX, oy:P.cOffY, ink:P.cInk, sid:101},
      {i:1, on:P.mOn, ang:P.mAng, ox:P.mOffX, oy:P.mOffY, ink:P.mInk, sid:211},
      {i:2, on:P.yOn, ang:P.yAng, ox:P.yOffX, oy:P.yOffY, ink:P.yInk, sid:307},
      {i:3, on:P.kOn, ang:P.kAng, ox:P.kOffX, oy:P.kOffY, ink:P.kInk, sid:401},
    ];
    for(const ch of chans){
      if(!ch.on) continue;
      const layer = getChannelLayer(P, ch, src.key, src.data, w, h);
      const mrx = (hash3(ch.sid, 1, P.seed) - 0.5) * 2 * P.misreg;
      const mry = (hash3(ch.sid, 2, P.seed) - 0.5) * 2 * P.misreg;
      ctx.drawImage(layer, ch.ox + mrx - CH_MARGIN, ch.oy + mry - CH_MARGIN);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  Object.assign(baseCache, { key, cv });
  return baseCache;
}

// stage 2: fractal glass over the base, re-applied only when glass params change
function getGlass(P, base, w, h){
  const key = base.key + '‖' + [P.seed, P.fgWidth, P.fgIrregular, P.fgFrost,
    P.fgRefract, P.fgShade, P.fgDispersion, P.fgFade].join(',');
  if(key === glassCache.key) return glassCache;

  const cv = glassCache.cv || document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.drawImage(base.cv, 0, 0);
  applyFractalGlass(P, ctx, w, h);

  Object.assign(glassCache, { key, cv });
  return glassCache;
}

export function render(P, view){
  const w = P.width, h = P.height;
  view.width = w; view.height = h;
  const ctx = view.getContext('2d');

  const src = getSource(P);
  const base = getBase(P, src, w, h);
  const stage = P.fgOn ? getGlass(P, base, w, h) : base;

  ctx.drawImage(stage.cv, 0, 0);
  drawSpeckles(P, ctx, w, h);
  if(P.grainAmt > 0) applyGrain(P, ctx, w, h);
}
