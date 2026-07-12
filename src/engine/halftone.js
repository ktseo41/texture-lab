// halftone stage — separates the source into CMYK and rasterizes each
// channel as a rotated screen of dots. Each channel renders into its own
// cached offscreen layer; misregistration offsets are applied at composite
// time so they never force a re-rasterization.

import { hash3, vnoise } from './random.js';

export const CH_MARGIN = 40;   // extra border so offset layers don't clip
const CHUNK = 2200;            // shapes per fill — giant single paths tessellate slowly
const TSTEP = 6;               // turbulence field grid step (px)

/* ---- coarse turbulence displacement field, bilinearly sampled per dot ---- */
const turbCache = { key: '', dx: null, dy: null, gw: 0, gh: 0 };

function getTurbField(P){
  const key = [P.width, P.height, P.seed, P.turbScale].join('|');
  if(key !== turbCache.key){
    const gw = Math.ceil(P.width / TSTEP) + 3, gh = Math.ceil(P.height / TSTEP) + 3;
    const dx = new Float32Array(gw*gh), dy = new Float32Array(gw*gh);
    const tScale = 1 / Math.max(1, P.turbScale);
    for(let j=0; j<gh; j++){
      for(let i=0; i<gw; i++){
        const x = i*TSTEP, y = j*TSTEP;
        dx[j*gw+i] = vnoise(x*tScale, y*tScale, P.seed+13);
        dy[j*gw+i] = vnoise(x*tScale, y*tScale, P.seed+47);
      }
    }
    Object.assign(turbCache, { key, dx, dy, gw, gh });
  }
  return turbCache;
}

function sampleTurb(arr, gw, x, y){
  const fx = x / TSTEP, fy = y / TSTEP;
  const xi = fx|0, yi = fy|0;
  const u = fx - xi, v = fy - yi;
  const a = arr[yi*gw+xi], b = arr[yi*gw+xi+1];
  const c = arr[(yi+1)*gw+xi], d = arr[(yi+1)*gw+xi+1];
  return (a + (b-a)*u) * (1-v) + (c + (d-c)*u) * v;
}

/* ---- per-channel rasterized layers, cached until a dot param changes ---- */
const chCache = {};

export function getChannelLayer(P, ch, srcKey, src, w, h){
  const key = srcKey + '‖' + [w, h, P.seed, P.cell, P.shape, P.dotGain, P.dotMax, P.dotMin,
    P.sizeJitter, P.posJitter, P.roughness, P.turbAmt, P.turbScale, ch.ang, ch.ink].join(',');
  let e = chCache[ch.sid];
  if(!e || e.key !== key){
    const cv = (e && e.cv) || document.createElement('canvas');
    cv.width = w + CH_MARGIN*2; cv.height = h + CH_MARGIN*2;
    const c2 = cv.getContext('2d');
    c2.save();
    c2.translate(CH_MARGIN, CH_MARGIN);
    drawScreen(P, c2, src, w, h, ch);
    c2.restore();
    chCache[ch.sid] = e = { key, cv };
  }
  return e.cv;
}

function drawScreen(P, ctx, src, w, h, ch){
  const s = P.cell;
  const ang = ch.ang * Math.PI / 180;
  const cosA = Math.cos(ang), sinA = Math.sin(ang);
  const cx = w/2, cy = h/2;
  const n = Math.ceil(Math.hypot(w, h) / 2 / s) + 2;
  const turb = P.turbAmt;
  const tf = turb > 0 ? getTurbField(P) : null;
  const rough = P.roughness;
  const maxR = s * 0.72 * P.dotMax;
  const shape = P.shape;
  const seed = P.seed;
  const sid = ch.sid;
  const chi = ch.i;

  ctx.fillStyle = ch.ink;
  ctx.beginPath();
  let inPath = 0;
  const M = CH_MARGIN;

  for(let i=-n; i<=n; i++){
    for(let j=-n; j<=n; j++){
      const gx = i*s, gy = j*s;
      const x = cx + gx*cosA - gy*sinA;
      const y = cy + gx*sinA + gy*cosA;
      if(x < -M-s || x > w+M+s || y < -M-s || y > h+M+s) continue;

      // turbulence: displace SAMPLING position
      let sx = x, sy = y;
      if(tf){
        const tx = x < 0 ? 0 : x >= w ? w-1 : x;
        const ty = y < 0 ? 0 : y >= h ? h-1 : y;
        sx += sampleTurb(tf.dx, tf.gw, tx, ty) * turb;
        sy += sampleTurb(tf.dy, tf.gw, tx, ty) * turb;
      }
      const px = sx < 0 ? 0 : sx >= w ? w-1 : sx|0;
      const py = sy < 0 ? 0 : sy >= h ? h-1 : sy|0;
      const q = (py*w + px) * 4;
      const r8 = src[q]/255, g8 = src[q+1]/255, b8 = src[q+2]/255;

      // rgb -> cmyk
      const k = 1 - Math.max(r8, g8, b8);
      let v;
      if(chi === 3) v = k;
      else {
        const den = 1 - k;
        if(den < 0.004) v = 0;
        else v = chi === 0 ? (1-r8-k)/den : chi === 1 ? (1-g8-k)/den : (1-b8-k)/den;
      }
      v *= P.dotGain;
      if(v <= P.dotMin) continue;
      if(v > 1) v = 1;

      // per-dot deterministic randomness
      const h1 = hash3(i, j, seed + sid);
      const h2 = hash3(i, j, seed + sid + 5000);
      const h3v = hash3(i, j, seed + sid + 9000);

      let rr = s * 0.72 * Math.sqrt(v) * P.dotMax;
      if(P.sizeJitter > 0) rr *= 1 + (h1 - 0.5) * 2 * P.sizeJitter;
      if(rr <= 0.18) continue;
      if(rr > maxR * 1.35) rr = maxR * 1.35;

      let dx = x, dy = y;
      if(P.posJitter > 0){
        dx += (h2 - 0.5) * s * P.posJitter;
        dy += (h3v - 0.5) * s * P.posJitter;
      }

      if(rough > 0){
        // rough edge: main blob + 2 satellite blobs
        addShape(ctx, dx, dy, rr * (1 - rough*0.18), shape, ang, s);
        inPath++;
        const sr = rr * (0.28 + 0.42*h2) * rough * 1.2;
        if(sr > 0.25){
          const a1 = h1 * Math.PI * 2, a2 = h3v * Math.PI * 2;
          addShape(ctx, dx + Math.cos(a1)*rr*0.62, dy + Math.sin(a1)*rr*0.62, sr, 'circle', 0, s);
          addShape(ctx, dx + Math.cos(a2)*rr*0.7, dy + Math.sin(a2)*rr*0.7, sr*0.75, 'circle', 0, s);
          inPath += 2;
        }
      } else {
        addShape(ctx, dx, dy, rr, shape, ang, s);
        inPath++;
      }
      if(inPath >= CHUNK){
        ctx.fill();
        ctx.beginPath();
        inPath = 0;
      }
    }
  }
  if(inPath > 0) ctx.fill();
}

function addShape(ctx, x, y, r, shape, ang, cell){
  switch(shape){
    case 'circle':
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, 6.2832);
      break;
    case 'diamond': {
      const c = Math.cos(ang), s = Math.sin(ang);
      ctx.moveTo(x + r*c, y + r*s);
      ctx.lineTo(x - r*s, y + r*c);
      ctx.lineTo(x - r*c, y - r*s);
      ctx.lineTo(x + r*s, y - r*c);
      ctx.closePath();
      break;
    }
    case 'square': {
      const c = Math.cos(ang + 0.7854), s = Math.sin(ang + 0.7854);
      const rr = r * 1.1;
      ctx.moveTo(x + rr*c, y + rr*s);
      ctx.lineTo(x - rr*s, y + rr*c);
      ctx.lineTo(x - rr*c, y - rr*s);
      ctx.lineTo(x + rr*s, y - rr*c);
      ctx.closePath();
      break;
    }
    case 'ellipse':
      ctx.moveTo(x + r*1.3*Math.cos(ang), y + r*1.3*Math.sin(ang));
      ctx.ellipse(x, y, r*1.3, r*0.7, ang, 0, 6.2832);
      break;
    case 'line': {
      const c = Math.cos(ang), s = Math.sin(ang);
      const L = cell * 0.62, W = r * 0.8;
      ctx.moveTo(x + L*c - W*s, y + L*s + W*c);
      ctx.lineTo(x - L*c - W*s, y - L*s + W*c);
      ctx.lineTo(x - L*c + W*s, y - L*s - W*c);
      ctx.lineTo(x + L*c + W*s, y + L*s - W*c);
      ctx.closePath();
      break;
    }
  }
}
