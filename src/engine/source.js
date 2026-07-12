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

// bumped when webfonts finish loading so cached text renders with the real font
let fontGen = 0;
export function bumpFontGen(){ fontGen++; }

export function sourceKey(P){
  return [P.width, P.height, P.seed, P.srcMode, P.srcBg, P.srcC1, P.srcC2, P.srcC3,
    P.srcC4, P.srcC5, P.blobColors,
    P.blobCount, P.blobScale, P.blobIrregular, P.blobSoft, P.gradAngle,
    P.srcContrast, P.srcBright, P.posterize,
    P.textOn, P.text, P.textSize, P.textX, P.textY, P.textColor, P.textAlpha,
    P.textCursor, fontGen, uploadId].join('|');
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
    const a = P.gradAngle * Math.PI / 180;
    const rl = (Math.abs(Math.cos(a))*w + Math.abs(Math.sin(a))*h) / 2;
    const g = ctx.createLinearGradient(
      w/2 - Math.cos(a)*rl, h/2 - Math.sin(a)*rl,
      w/2 + Math.cos(a)*rl, h/2 + Math.sin(a)*rl);
    g.addColorStop(0, P.srcC2);
    g.addColorStop(0.5, P.srcC1);
    g.addColorStop(1, P.srcBg);
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

  // text — drawn last so contrast/posterize don't shift its color;
  // downstream halftone/grain screens it into the pattern
  if(P.textOn && P.text){
    const lines = String(P.text).split('\n');
    const px = P.textSize / 100 * h;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, P.textAlpha));
    ctx.font = `800 ${px}px "Pretendard Variable", Pretendard, sans-serif`;
    if('letterSpacing' in ctx) ctx.letterSpacing = `${px * -0.03}px`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lh = px * 0.98;
    const cx = P.textX / 100 * w, cy = P.textY / 100 * h;
    const y0 = cy - (lines.length - 1) * lh / 2;
    ctx.fillStyle = P.textColor;
    lines.forEach((ln, i) => ctx.fillText(ln, cx, y0 + i * lh));
    if(P.textCursor){
      const lastW = ctx.measureText(lines[lines.length - 1]).width;
      const ux = cx + lastW / 2 + px * 0.05, uy = y0 + (lines.length - 1) * lh;
      ctx.textAlign = 'left';
      ctx.lineWidth = Math.max(1, px * 0.045);
      ctx.strokeStyle = '#111111';
      ctx.strokeText('_', ux, uy);
      ctx.fillStyle = '#f7d500';
      ctx.fillText('_', ux, uy);
    }
    ctx.restore();
  }
}
