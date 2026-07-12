// source stage — the continuous-tone base image that later stages
// separate into CMYK and screen into dots.

import { mulberry32, hex2rgb } from './random.js';

let uploadedImg = null;
let uploadId = 0;

export function setUploadedImage(img){
  uploadedImg = img;
  uploadId++;
}
export function clearUploadedImage(){
  uploadedImg = null;
  uploadId++;
}
export function hasUploadedImage(){ return !!uploadedImg; }

export function sourceKey(P){
  return [P.width, P.height, P.seed, P.srcMode, P.srcBg, P.srcC1, P.srcC2, P.srcC3,
    P.srcC4, P.srcC5, P.blobColors,
    P.blobCount, P.blobScale, P.blobIrregular, P.blobSoft,
    P.gradAngle, P.gradStops, P.gradCX, P.gradCY, P.gradLen,
    P.srcContrast, P.srcBright, P.posterize, uploadId].join('|');
}

export function renderSource(P, srcCanvas){
  const w = P.width, h = P.height;
  srcCanvas.width = w; srcCanvas.height = h;
  const ctx = srcCanvas.getContext('2d');
  const rng = mulberry32(P.seed * 1013 + 77);

  if(P.srcMode === 'image' && uploadedImg){
    const ir = uploadedImg.width / uploadedImg.height, cr = w/h;
    let dw, dh;
    if(ir > cr){ dh = h; dw = h*ir; } else { dw = w; dh = w/ir; }
    ctx.drawImage(uploadedImg, (w-dw)/2, (h-dh)/2, dw, dh);
  } else if(P.srcMode === 'linear'){
    // start point + angle + length; the gradient clamps to its end colors
    // beyond the segment, so a short run "stops" mid-canvas
    const a = P.gradAngle * Math.PI / 180;
    const len = Math.max(1, (P.gradLen ?? 100) / 100 * Math.hypot(w, h));
    const x0 = (P.gradCX ?? 0) / 100 * w;
    const y0 = (P.gradCY ?? 0) / 100 * h;
    const g = ctx.createLinearGradient(x0, y0, x0 + Math.cos(a)*len, y0 + Math.sin(a)*len);
    const n = Math.max(2, Math.min(5, P.gradStops ?? 3));
    const cols = [P.srcC1, P.srcC2, P.srcC3, P.srcC4, P.srcC5].slice(0, n);
    cols.forEach((c, i) => g.addColorStop(i / (n - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } else {
    // organic blobs: clusters of sub-blobs on a low-res canvas, upscaled + blurred
    const sc = 4;
    const lw = Math.ceil(w/sc), lh = Math.ceil(h/sc);
    const lo = document.createElement('canvas');
    lo.width = lw; lo.height = lh;
    const lctx = lo.getContext('2d');
    lctx.fillStyle = P.srcBg; lctx.fillRect(0, 0, lw, lh);
    const cols = [P.srcC1, P.srcC2, P.srcC3, P.srcC4, P.srcC5]
      .slice(0, Math.max(1, Math.min(5, P.blobColors || 3)));
    const irr = P.blobIrregular;
    for(let i=0; i<P.blobCount; i++){
      const cx = rng()*lw, cy = rng()*lh;
      const r = (0.25 + rng()*0.9) * Math.min(lw,lh) * P.blobScale/100;
      const [cr_, cg_, cb_] = hex2rgb(cols[i % cols.length]);
      const sub = 1 + Math.round(irr * 5 * (0.5 + rng()*0.5));
      for(let s2=0; s2<sub; s2++){
        let bx = cx, by = cy, br = r;
        if(s2 > 0){
          const aa = rng()*6.2832, dd = rng()*r*0.85*irr;
          bx = cx + Math.cos(aa)*dd;
          by = cy + Math.sin(aa)*dd * (0.6 + rng()*0.5); // slight anisotropy
          br = r * (0.3 + rng()*0.55);
        } else if(sub > 1){
          br = r * (0.55 + rng()*0.3);
        }
        const g = lctx.createRadialGradient(bx, by, 0, bx, by, br);
        const inner = 0.15 + (1-irr)*0.25;
        g.addColorStop(0, `rgba(${cr_},${cg_},${cb_},0.95)`);
        g.addColorStop(inner, `rgba(${cr_},${cg_},${cb_},${0.75 + irr*0.15})`);
        g.addColorStop(1, `rgba(${cr_},${cg_},${cb_},0)`);
        lctx.fillStyle = g;
        lctx.fillRect(bx-br, by-br, br*2, br*2);
      }
    }
    ctx.fillStyle = P.srcBg; ctx.fillRect(0, 0, w, h);
    const blur = P.blobSoft;
    const pad = blur * 1.2;
    if(blur > 0) ctx.filter = `blur(${blur}px)`;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(lo, -pad, -pad, w + pad*2, h + pad*2);
    ctx.filter = 'none';
  }

  // contrast / brightness / posterize
  if(P.srcContrast !== 0 || P.srcBright !== 0 || P.posterize > 0){
    const id = ctx.getImageData(0, 0, w, h), d = id.data;
    const cf = (259 * (P.srcContrast + 255)) / (255 * (259 - P.srcContrast));
    const br = P.srcBright;
    const lv = P.posterize;
    for(let i=0; i<d.length; i+=4){
      for(let j=0; j<3; j++){
        let v = cf * (d[i+j] - 128) + 128 + br;
        if(lv > 0) v = Math.round(Math.round(v / 255 * (lv-1)) / (lv-1) * 255);
        d[i+j] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    ctx.putImageData(id, 0, 0);
  }
}
