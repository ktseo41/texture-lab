// photo palette extraction — dominant colors + area ratios.
// Exact RGB values are too fine to group by, so colors are bucketed on a
// coarse histogram first, then buckets within a perceptual tolerance are
// merged into clusters ("emerald-ish greens count as one color").

const SAMPLE_MAX = 96; // longest side of the downsampled analysis canvas

// redmean color distance — cheap approximation of perceptual difference
function dist(a, b){
  const rm = (a.r + b.r) / 2;
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return Math.sqrt(
    (2 + rm / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rm) / 256) * db * db);
}

function rgb2hex({ r, g, b }){
  const h = v => Math.round(v).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

// → [{hex, r, g, b, ratio}] sorted by ratio desc; ratios are shares of all
// sampled pixels, so dropped tail clusters mean they may not sum to 1
export function extractPalette(img, { tolerance = 80, maxColors = 6 } = {}){
  const scale = Math.min(1, SAMPLE_MAX / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;

  // coarse histogram: 16 levels per channel, mean color per bucket
  const bins = new Map();
  let total = 0;
  for(let i = 0; i < d.length; i += 4){
    if(d[i + 3] < 128) continue;
    const key = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4);
    let b = bins.get(key);
    if(!b) bins.set(key, b = { r: 0, g: 0, b: 0, n: 0 });
    b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; b.n++;
    total++;
  }
  if(!total) return [];

  const cells = [...bins.values()]
    .map(b => ({ r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n }))
    .sort((a, b) => b.n - a.n);

  // greedy agglomeration, biggest bucket first: a bucket joins the nearest
  // cluster within tolerance (weighted running mean) or seeds a new one
  const clusters = [];
  for(const c of cells){
    let best = null, bestD = Infinity;
    for(const cl of clusters){
      const dd = dist(c, cl);
      if(dd < bestD){ bestD = dd; best = cl; }
    }
    if(best && bestD <= tolerance){
      const n = best.n + c.n;
      best.r = (best.r * best.n + c.r * c.n) / n;
      best.g = (best.g * best.n + c.g * c.n) / n;
      best.b = (best.b * best.n + c.b * c.n) / n;
      best.n = n;
    } else {
      clusters.push({ ...c });
    }
  }

  return clusters
    .sort((a, b) => b.n - a.n)
    .slice(0, maxColors)
    .map(c => ({ hex: rgb2hex(c), r: c.r, g: c.g, b: c.b, ratio: c.n / total }));
}

// write a palette into the blob-source params: the dominant color becomes
// the background, the rest fill srcC1..C5 in ratio order
export function applyPaletteToParams(P, palette){
  if(!palette.length) return;
  P.srcMode = 'blobs';
  P.srcBg = palette[0].hex;
  const rest = palette.slice(1);
  const keys = ['srcC1', 'srcC2', 'srcC3', 'srcC4', 'srcC5'];
  keys.forEach((k, i) => {
    // fewer colors than slots: reuse from the top so hidden slots stay sane
    P[k] = (rest[i % Math.max(1, rest.length)] || palette[0]).hex;
  });
  P.blobColors = Math.max(1, Math.min(5, rest.length || 1));
}
