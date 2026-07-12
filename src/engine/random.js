// deterministic hashing & noise — everything visual derives from these,
// so the same seed always reproduces the same texture.

export function hash3(x, y, s){
  let h = (x|0) * 374761393 + (y|0) * 668265263 + (s|0) * 2147483423;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295; // 0..1
}

export function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// smooth 2D value noise, -1..1
export function vnoise(x, y, s){
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf*xf*(3-2*xf), v = yf*yf*(3-2*yf);
  const a = hash3(xi, yi, s),   b = hash3(xi+1, yi, s);
  const c = hash3(xi, yi+1, s), d = hash3(xi+1, yi+1, s);
  return ((a + (b-a)*u) + ((c + (d-c)*u) - (a + (b-a)*u)) * v) * 2 - 1;
}

export function hex2rgb(h){
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}
