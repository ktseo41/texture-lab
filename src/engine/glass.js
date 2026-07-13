// fractal glass stage — a vertical lens array (fluted glass): straight
// periodic ribs, each compressing and repeating a slice of the frosted
// image behind it (sawtooth refraction), with a hairline specular at each
// rib boundary, a lit→shaded ramp across the rib, and RGB dispersion.
// "fractal" = rib widths drift irregularly across the sheet.

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
