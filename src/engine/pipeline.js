// full render pipeline:  source → CMYK separation/screening → speckle → grain

import { hash3 } from './random.js';
import { renderSource, sourceKey } from './source.js';
import { getChannelLayer, CH_MARGIN } from './halftone.js';
import { applyGrain, drawSpeckles } from './grain.js';

export const srcCanvas = document.createElement('canvas');
const srcCache = { key: '', data: null };

function getSource(P){
  const key = sourceKey(P);
  if(key !== srcCache.key){
    renderSource(P, srcCanvas);
    srcCache.data = srcCanvas.getContext('2d').getImageData(0, 0, P.width, P.height).data;
    srcCache.key = key;
  }
  return { data: srcCache.data, key: srcCache.key };
}

export function render(P, view){
  const w = P.width, h = P.height;
  view.width = w; view.height = h;
  const ctx = view.getContext('2d');

  const src = getSource(P);

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

  drawSpeckles(P, ctx, w, h);
  if(P.grainAmt > 0) applyGrain(P, ctx, w, h);
}
