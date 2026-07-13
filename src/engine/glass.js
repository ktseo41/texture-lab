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
    const shad = Math.pow(1 - Math.min((1-t)*7, 1), 2);   // shadow before it
    const m = 0.45 + 1.1 * noise1(x/(width*4), seed+41);  // per-rib strength
    shade[x] = P.fgShade * m * (spec * 115 - shad * 45 + (0.5 - t) * 10);
  }

  const out = ctx.createImageData(w, h);
  const o = out.data;
  const disp = P.fgDispersion;
  const chScale = [1 - disp*0.16, 1, 1 + disp*0.16];

  // uneven lighting: the boundary hairlines swell and vanish along their
  // length instead of running uniformly edge to edge
  const fade = P.fgFade;

  for(let y=0; y<h; y++){
    const ro = y*w*4;
    for(let x=0; x<w; x++){
      const base = off[x];
      let sh = shade[x];
      if(fade > 0){
        let m = 1 + fade * ((vnoise(x/(width*2.5), y/240, seed+53) - 0.5) * 3.2 - 0.35);
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
