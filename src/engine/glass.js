// fractal glass stage — a lens array (patterned glass): periodic ribs, each
// compressing and repeating a slice of the frosted image behind it (sawtooth
// refraction), with a hairline specular at each rib boundary, a lit→shaded
// ramp across the rib, and RGB dispersion.
// "fractal" = rib widths drift irregularly across the sheet.
// fgPattern picks the glass: vertical flutes (default, the original path
// below); a relief pattern — pyramids, wavy flutes — where both refraction and
// lighting come from the surface slope; or square lens cells, where every cell
// images the scene anew.

import { hash3 } from './random.js';

// smooth 1D value noise in [0,1)
function noise1(x, seed){
  const i = Math.floor(x), f = x - i;
  const s = f*f*(3-2*f);
  return hash3(i, 0, seed)*(1-s) + hash3(i+1, 0, seed)*s;
}

// smooth 2D value noise in [0,1)
function vnoise(x, y, seed){
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const sx = xf*xf*(3-2*xf), sy = yf*yf*(3-2*yf);
  const a = hash3(xi, yi, seed), b = hash3(xi+1, yi, seed);
  const c = hash3(xi, yi+1, seed), d = hash3(xi+1, yi+1, seed);
  return a + (b-a)*sx + (c-a)*sy + (a-b-c+d)*sx*sy;
}

// ---- relief patterns ------------------------------------------------------
// The glass surface is described by one or two families of parallel ridges.
// Each family is a 1D table over its ridge coordinate holding the surface
// slope there; the slope drives both the refraction offset (the image slides
// downhill) and the lighting (faces turned to the light brighten, the others
// darken), so flat colour still reads as glass without drawn-on lines.

const LIGHT_X = -0.6;                   // light from the upper left
const GLINT = 34;                       // additive glint strength at fgShade 1
const WAVE_SUB = 4;                     // wave: table oversampling (sub-pixel lookup)

// lit = light component along this family's axis.
// kind 'flute' : arc profile — gentle centre, steep edge, sharp groove
// kind 'facet' : flat pyramid face — constant slope per side, so each face shows
//                a shifted, uncompressed piece of the image in one even tone
// Lighting is mostly a gain on the image (mul) so colours stay the image's
// own, plus a small additive glint (add) on the lit shoulder.
function reliefTable(n, step, P, width, irr, seed, lit, kind){
  const pos = new Float32Array(n);      // |u|: 0 at the ridge centre, 1 at its edge
  const off = new Float32Array(n);
  const mul = new Float32Array(n);
  const add = new Float32Array(n);
  const half = P.fgRefract * 0.5;
  // micro-striation fades out with the lens: no refraction → untouched image
  const micro = 3 * Math.min(1, P.fgRefract / 20);
  const ls = lit < 0 ? -1 : 1;
  const facet = kind === 'facet';
  for(let i=0; i<n; i++){
    const x = i * step;
    // same width drift as the vertical flutes
    const xw = x + irr * width * (
      (noise1(x/(width*6), seed+3) - 0.5) * 3 +
      (noise1(x/(width*2.2), seed+11) - 0.5) * 1.2);
    const t = xw / width;
    const u = (t - Math.floor(t)) * 2 - 1;  // -1..1 across the ridge
    const au = u < 0 ? -u : u;
    const g = facet ? (u < 0 ? -1 : 1) * (0.8 + 0.2 * au)
      : u * 0.5 / Math.sqrt(1 - 0.75*u*u);
    // glint band on the lit shoulder
    const d = 1 - Math.abs(u - 0.55*ls) * 2.6;
    const spec = d > 0 && !facet ? d*d : 0;
    const e0 = 0.9;                                       // a thin crisp seam
    const e = au > e0 ? (au - e0) / (1 - e0) : 0;         // groove between ridges
    const m = 0.45 + 1.1 * noise1(x/(width*4), seed+41);  // per-ridge strength
    pos[i] = au;
    off[i] = g * half + (noise1(x/2.5, seed+23) - 0.5) * micro;
    mul[i] = P.fgShade * m * (g * lit * (facet ? 0.26 : 0.38) - e*e * 0.42);
    add[i] = P.fgShade * m * spec * GLINT;
  }
  return { pos, off, mul, add };
}

function applyRelief(P, ctx, s, w, h, width, irr, seed){
  const pat = P.fgPattern;
  const zero = new Float32Array(1);
  let A = null, B = null;
  let sA = 0, sB = 0;                   // table index step per x
  const baseA = new Float32Array(h), baseB = new Float32Array(h); // per-row index base
  // per-row displacement axis of family A (the wave's axis turns with the rib)
  const axR = new Float32Array(h), ayR = new Float32Array(h);
  let bx = 0, by = 0;
  let fsx = 240, fsy = 240;             // fade-noise wavelengths

  if(pat === 'pyramid'){
    // pressed pyramids are lit from above in every real photo: rows read stronger than columns
    A = reliefTable(w, 1, P, width, irr, seed, -0.3, 'facet');
    B = reliefTable(h, 1, P, width, irr, seed+101, -0.95, 'facet');
    sA = 1;
    for(let y=0; y<h; y++){ baseB[y] = y; axR[y] = 1; }
    by = 1; fsx = fsy = width*5;
  } else { // wave: vertical flutes swaying along y, refracting across the rib
    const amp = width * 0.55, len = width * 9;
    A = reliefTable(Math.ceil((w + amp*2 + 2) * WAVE_SUB), 1/WAVE_SUB, P, width, irr, seed, LIGHT_X, 'flute');
    sA = WAVE_SUB;
    const sway = y => {
      const ph = y/len + irr * 1.5 * (noise1(y/(len*1.7), seed+61) - 0.5);
      return amp * (1 + Math.sin(ph * Math.PI * 2));
    };
    for(let y=0; y<h; y++){
      baseA[y] = sway(y) * WAVE_SUB;
      const dy = (sway(y+1) - sway(y-1)) * 0.5, n = Math.sqrt(1 + dy*dy);
      axR[y] = 1/n; ayR[y] = dy/n;
    }
    fsx = width*2.5;
  }

  const posA = A ? A.pos : zero, offA = A ? A.off : zero, mulA = A ? A.mul : zero, addA = A ? A.add : zero;
  const posB = B ? B.pos : zero, offB = B ? B.off : zero, mulB = B ? B.mul : zero, addB = B ? B.add : zero;
  const facet = pat === 'pyramid';

  // pressed-glass skin (pyramid): the faces are never optically smooth. A tiling
  // noise tile gives (1) an orange-peel grain that nudges refraction and tone,
  // and (2) a slow wobble that bends the ridges so no two pyramids match.
  // The grain is what frosts real glass, so it follows fgFrost; both vanish
  // with the lens, keeping "everything at 0" an untouched image.
  const TN = 256;
  let tile = null, peb = 0, pebGain = 0, wob = 0;
  if(facet){
    tile = new Float32Array(TN * TN);
    for(let j=0; j<TN; j++) for(let i=0; i<TN; i++) tile[j*TN + i] = hash3(i, j, seed+71) - 0.5;
    const lens = Math.min(1, P.fgRefract / 20);
    peb = Math.min(1, P.fgFrost / 4) * lens * Math.min(3, 1 + P.fgRefract * 0.03);
    pebGain = Math.min(1, P.fgFrost / 4) * P.fgShade * 0.14;
    wob = lens * (0.5 + irr * 0.8);
  }
  const WS = 1 / (width * 0.9);           // ridge wobble: about one bend per cell

  const out = ctx.createImageData(w, h);
  const o = out.data;
  const disp = P.fgDispersion;
  const chScale = [1 - disp*0.16, 1, 1 + disp*0.16];
  const stride = w*4;

  // uneven lighting, as in the vertical path: coarse noise grid, bilinear read
  const fade = P.fgFade;
  const FSTEP = 4;
  let ff = null, fgw = 0;
  if(fade > 0){
    fgw = Math.ceil(w / FSTEP) + 2;
    const fgh = Math.ceil(h / FSTEP) + 2;
    ff = new Float32Array(fgw * fgh);
    for(let j=0; j<fgh; j++)
      for(let i=0; i<fgw; i++)
        ff[j*fgw + i] = vnoise(i*FSTEP/fsx, j*FSTEP/fsy, seed+53);
  }

  for(let y=0; y<h; y++){
    const ro = y*stride;
    const fy = y / FSTEP, yi = fy|0, fv = fy - yi;
    const r0 = yi*fgw, r1 = r0 + fgw;
    const bA = baseA[y], bB = baseB[y], ax = axR[y], ay = ayR[y];
    for(let x=0; x<w; x++){
      const ia = (x*sA + bA)|0, ib = (x*sB + bB)|0;
      let a = offA[ia], b = offB[ib], gain, sh;
      if(facet){
        // pyramid: the face whose edge is nearer owns the pixel (max(|u|,|v|))
        // — eased across the diagonal ridge, which pressed glass never leaves sharp
        sh = 0;
        // slow noise, bilinear off the tile
        const wx = x * WS, wy = y * WS, wxi = wx|0, wyi = wy|0, wfx = wx - wxi, wfy = wy - wyi;
        const t0 = ((wyi & 255) << 8), t1 = (((wyi+1) & 255) << 8), c0 = wxi & 255, c1 = (wxi+1) & 255;
        const n0 = tile[t0 + c0], n1 = tile[t1 + c0];
        const low = (n0 + (tile[t0 + c1]-n0)*wfx) * (1-wfy) + (n1 + (tile[t1 + c1]-n1)*wfx) * wfy;
        let t = (posA[ia] - posB[ib] + low * wob) * 2.2 + 0.5;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        a *= t; b *= 1 - t;
        gain = mulA[ia] * t + mulB[ib] * (1 - t);
        // orange-peel grain, about 2px
        const gi = ((x >> 1) & 255) + (((y >> 1) & 255) << 8);
        const gn = tile[gi], gm = tile[(gi + 4711) & 65535];
        a += gn * peb; b += gm * peb;
        gain += (gn + gm) * pebGain;
      } else {
        gain = mulA[ia] + mulB[ib];
        sh = addA[ia] + addB[ib];
      }
      if(ff){
        const fx = x / FSTEP, xi = fx|0, fu = fx - xi;
        const p = ff[r0+xi], q = ff[r1+xi];
        const nv = (p + (ff[r0+xi+1]-p)*fu) * (1-fv) + (q + (ff[r1+xi+1]-q)*fu) * fv;
        let m = 1 + fade * ((nv - 0.5) * 3.2 - 0.35);
        m = m < 0 ? 0 : m > 1.4 ? 1.4 : m;
        gain *= m; sh *= m;
      }
      gain += 1;
      const dx = a*ax + b*bx, dy = a*ay + b*by;
      const di = ro + x*4;
      for(let c=0; c<3; c++){
        let sx = x + dx * chScale[c], sy = y + dy * chScale[c];
        sx = sx < 0 ? 0 : sx > w-1 ? w-1 : sx;
        sy = sy < 0 ? 0 : sy > h-1 ? h-1 : sy;
        const x0 = sx|0, fr = sx - x0, y0 = sy|0, fq = sy - y0;
        const p0 = y0*stride + x0*4 + c;
        const p1 = x0 < w-1 ? p0+4 : p0;
        const dn = y0 < h-1 ? stride : 0;
        const top = s[p0] + (s[p1]-s[p0])*fr;
        const bot = s[p0+dn] + (s[p1+dn]-s[p0+dn])*fr;
        const v = (top + (bot-top)*fq) * gain + sh;
        o[di+c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      o[di+3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

// ---- square lens cells -----------------------------------------------------
// Pressed glass made of small convex lenses. A cell shows 1 − refract/width of
// the scene behind it: 1 untouched, 0 one flat colour (object near the focus —
// the mosaic look of something right behind the glass), negative flipped
// shrunken copies repeating cell after cell (object far away). No drawn
// borders — a cell reads through the image breaking at its edge, a soft dome
// shading and a thin dark seam. (after real photos of square-lens glass)

function applyLensCells(P, ctx, s, w, h, width, irr, seed){
  const out = ctx.createImageData(w, h);
  const o = out.data;
  const disp = P.fgDispersion;
  const chScale = [1 - disp*0.16, 1, 1 + disp*0.16];
  const stride = w*4;
  const k = P.fgRefract / width;         // cell spans ±fgRefract/2, as a flute does
  const half = width * 0.5, inv = 1 / half;
  const shade = P.fgShade;
  // near-focus light mixing inside a cell (the camera's aperture): a small
  // 3×3 spread, widest when the cell collapses to one colour
  const ap = width * 0.07 * Math.min(1, k);
  const nTap = ap > 0 ? 9 : 1, tapW = 1 / nTap;
  const tapX = new Float32Array(nTap), tapY = new Float32Array(nTap);
  if(ap > 0) for(let t=0; t<9; t++){ tapX[t] = (t%3 - 1) * ap; tapY[t] = ((t/3|0) - 1) * ap; }

  const fade = P.fgFade;
  const FSTEP = 4;
  let ff = null, fgw = 0;
  if(fade > 0){
    fgw = Math.ceil(w / FSTEP) + 2;
    const fgh = Math.ceil(h / FSTEP) + 2;
    ff = new Float32Array(fgw * fgh);
    for(let j=0; j<fgh; j++)
      for(let i=0; i<fgw; i++)
        ff[j*fgw + i] = vnoise(i*FSTEP/(width*5), j*FSTEP/(width*5), seed+53);
  }

  // per-cell traits, cached by cell id: optical-centre drift + strength
  const drift = irr * width * 0.9 * Math.min(1, P.fgRefract / 20); // no lens → no drift
  const cells = new Map();
  const cell = (ci, cj) => {
    const key = ci * 65536 + cj;
    let c = cells.get(key);
    if(!c){
      c = {
        jx: (hash3(ci, cj, seed+3) - 0.5) * drift,
        jy: (hash3(ci, cj, seed+11) - 0.5) * drift,
        m: 0.6 + 0.8 * hash3(ci, cj, seed+41),
      };
      cells.set(key, c);
    }
    return c;
  };

  const colI = new Int32Array(w), colD = new Float32Array(w);
  for(let x=0; x<w; x++){
    colI[x] = Math.floor(x / width);
    colD[x] = x - (colI[x] + 0.5) * width;
  }

  for(let y=0; y<h; y++){
    const ro = y*stride;
    const fy = y / FSTEP, yi = fy|0, fv = fy - yi;
    const r0 = yi*fgw, r1 = r0 + fgw;
    const sqJ = Math.floor(y / width), sqDy = y - (sqJ + 0.5) * width;
    let lastKey = -1, c = null;
    for(let x=0; x<w; x++){
      const lx = colD[x], ly = sqDy, ci = colI[x], cj = sqJ;
      const au = lx < 0 ? -lx : lx, av = ly < 0 ? -ly : ly;
      const hd = (au > av ? au : av) * inv;            // 0 centre .. 1 seam
      const key = ci * 65536 + cj;
      if(key !== lastKey){ c = cell(ci, cj); lastKey = key; }

      const u = lx * inv, v = ly * inv;
      const e = hd > 0.9 ? (hd - 0.9) * 10 : 0;            // thin seam
      const lit = -(u*0.6 + v*0.8);                    // light from the upper left
      // dome shading + seam, plus a faint per-cell tone (pressed cells never match)
      let g = shade * (c.m * (lit * 0.09 - e*e * 0.4) + (c.m - 1) * 0.07);
      let sh = shade * c.m * e * (lit > 0 ? lit : 0) * 22;   // lit rim
      if(ff){
        const fx = x / FSTEP, xi = fx|0, fu = fx - xi;
        const p0 = ff[r0+xi], q0 = ff[r1+xi];
        const nv = (p0 + (ff[r0+xi+1]-p0)*fu) * (1-fv) + (q0 + (ff[r1+xi+1]-q0)*fu) * fv;
        let m = 1 + fade * ((nv - 0.5) * 3.2 - 0.35);
        m = m < 0 ? 0 : m > 1.4 ? 1.4 : m;
        g *= m; sh *= m;
      }
      const gain = 1 + g;
      // lens: slightly stronger toward the rim, like a real pressed dimple
      const bend = k * (0.85 + 0.3 * hd * hd);
      const dx = c.jx - lx * bend, dy = c.jy - ly * bend;
      const di = ro + x*4;
      for(let ch=0; ch<3; ch++){
        let acc = 0;
        for(let t=0; t<nTap; t++){
          let sx = x + dx * chScale[ch] + tapX[t], sy = y + dy * chScale[ch] + tapY[t];
          sx = sx < 0 ? 0 : sx > w-1 ? w-1 : sx;
          sy = sy < 0 ? 0 : sy > h-1 ? h-1 : sy;
          const x0 = sx|0, fr = sx - x0, y0 = sy|0, fq = sy - y0;
          const p0 = y0*stride + x0*4 + ch;
          const p1 = x0 < w-1 ? p0+4 : p0;
          const dn = y0 < h-1 ? stride : 0;
          const top = s[p0] + (s[p1]-s[p0])*fr;
          const bot = s[p0+dn] + (s[p1+dn]-s[p0+dn])*fr;
          acc += top + (bot-top)*fq;
        }
        const val = acc * tapW * gain + sh;
        o[di+ch] = val < 0 ? 0 : val > 255 ? 255 : val;
      }
      o[di+3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

export function applyFractalGlass(P, ctx, w, h){
  const width = Math.max(4, P.fgWidth);
  const irr = P.fgIrregular;
  const seed = P.seed;

  // frost: blur the image behind the glass before refracting it
  let s;
  if(P.fgFrost > 0){
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.filter = `blur(${P.fgFrost}px)`;
    tctx.drawImage(ctx.canvas, 0, 0);
    s = tctx.getImageData(0, 0, w, h).data;
  } else {
    s = ctx.getImageData(0, 0, w, h).data;
  }

  if(P.fgPattern === 'grid'){
    applyLensCells(P, ctx, s, w, h, width, irr, seed);
    return;
  }
  // anything else (incl. patterns that no longer exist) is the vertical glass
  if(P.fgPattern === 'pyramid' || P.fgPattern === 'wave'){
    applyRelief(P, ctx, s, w, h, width, irr, seed);
    return;
  }

  // per-column tables — ribs are perfectly vertical
  const off = new Float32Array(w);
  const shade = new Float32Array(w);
  for(let x=0; x<w; x++){
    // warp the rib coordinate so widths drift: dense flutes here, wide there
    const xw = x + irr * width * (
      (noise1(x/(width*6), seed+3) - 0.5) * 3 +
      (noise1(x/(width*2.2), seed+11) - 0.5) * 1.2);
    const u = xw / width;
    const t = u - Math.floor(u);            // 0..1 across the rib
    // lens: each rib samples a slice wider than itself → compressed copy,
    // plus a faint micro-striation (the fine wood-grain shimmer of the glass)
    off[x] = (t - 0.5) * P.fgRefract + (noise1(x/2.5, seed+23) - 0.5) * 3;
    // shading is only visible at the boundaries: a hairline specular with a
    // soft shadow beside it — flat rib interiors stay invisible, so the glass
    // reads through refraction, not through banding
    const spec = Math.pow(1 - Math.min(t*8, 1), 2);       // hairline at edge
    const d = Math.min(t, 1 - t);                          // dist to boundary
    const shad = Math.pow(1 - Math.min(d*3.5, 1), 2);     // groove both sides
    const m = 0.45 + 1.1 * noise1(x/(width*4), seed+41);  // per-rib strength
    shade[x] = P.fgShade * m * (spec * 115 - shad * 48 + (0.5 - t) * 6);
  }

  const out = ctx.createImageData(w, h);
  const o = out.data;
  const disp = P.fgDispersion;
  const chScale = [1 - disp*0.16, 1, 1 + disp*0.16];

  // uneven lighting: the boundary hairlines swell and vanish along their
  // length instead of running uniformly edge to edge. The fade noise is
  // low-frequency, so it's precomputed on a coarse grid and bilinearly
  // sampled per pixel instead of calling vnoise w×h times.
  const fade = P.fgFade;
  const FSTEP = 4;
  let ff = null, fgw = 0;
  if(fade > 0){
    fgw = Math.ceil(w / FSTEP) + 2;
    const fgh = Math.ceil(h / FSTEP) + 2;
    ff = new Float32Array(fgw * fgh);
    for(let j=0; j<fgh; j++)
      for(let i=0; i<fgw; i++)
        ff[j*fgw + i] = vnoise(i*FSTEP/(width*2.5), j*FSTEP/240, seed+53);
  }

  for(let y=0; y<h; y++){
    const ro = y*w*4;
    const fy = y / FSTEP, yi = fy|0, fv = fy - yi;
    const r0 = yi*fgw, r1 = r0 + fgw;
    for(let x=0; x<w; x++){
      const base = off[x];
      let sh = shade[x];
      if(ff){
        const fx = x / FSTEP, xi = fx|0, fu = fx - xi;
        const a = ff[r0+xi], b = ff[r0+xi+1];
        const c = ff[r1+xi], d = ff[r1+xi+1];
        const nv = (a + (b-a)*fu) * (1-fv) + (c + (d-c)*fu) * fv;
        let m = 1 + fade * ((nv - 0.5) * 3.2 - 0.35);
        m = m < 0 ? 0 : m > 1.4 ? 1.4 : m;
        sh *= m;
      }
      const di = ro + x*4;
      for(let c=0; c<3; c++){
        let sx = x + base * chScale[c];
        sx = sx < 0 ? 0 : sx > w-1 ? w-1 : sx;
        const x0 = sx|0, fr = sx - x0;
        const x1 = x0 < w-1 ? x0+1 : x0;
        const v = s[ro + x0*4 + c]*(1-fr) + s[ro + x1*4 + c]*fr + sh;
        o[di+c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      o[di+3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}
