// all render parameters + factory presets

export const DEFAULTS = {
  // canvas
  width: 1200, height: 800, seed: 7,
  // source
  srcMode: "blobs",          // blobs | linear | image
  srcBg: "#9a9a92",
  srcC1: "#2b2b2b", srcC2: "#e8e4d8", srcC3: "#555550",
  srcC4: "#8a4a3a", srcC5: "#3a5a6a",
  blobColors: 3,
  blobCount: 6, blobScale: 55, blobIrregular: 0.5, blobSoft: 30,
  gradAngle: 45,
  srcContrast: 0, srcBright: 0, posterize: 0,
  // text (drawn into the source, so it screens into dots like everything else)
  textOn: false, text: "TEXTURE\nLAB", textSize: 18,
  textX: 50, textY: 50, textColor: "#111111", textAlpha: 1.0, textCursor: false,
  // halftone
  htOn: true,
  cell: 6, shape: "circle", dotGain: 1.0, dotMax: 1.45, dotMin: 0.02,
  sizeJitter: 0, posJitter: 0, roughness: 0, inkOpacity: 1.0,
  paper: "#ffffff",
  cOn: true, mOn: true, yOn: true, kOn: true,
  cAng: 15, mAng: 75, yAng: 0, kAng: 45,
  cOffX: 0, cOffY: 0, mOffX: 0, mOffY: 0, yOffX: 0, yOffY: 0, kOffX: 0, kOffY: 0,
  misreg: 0,
  cInk: "#00adee", mInk: "#ec008c", yInk: "#fff200", kInk: "#231f20",
  // fractal glass (ribbed-glass refraction overlay)
  fgOn: false, fgWidth: 30, fgIrregular: 0.5, fgRefract: 80,
  fgShade: 0.5, fgDispersion: 0.3, fgFrost: 6, fgFade: 0.5,
  // grunge
  turbAmt: 0, turbScale: 40, fleck: 0, dust: 0,
  // grain
  grainAmt: 0, grainSize: 1, grainChroma: 0.15,
};

// only keys that differ from DEFAULTS; values whose visual effect measured
// below perception (pixel-diff audit, 2026-07) were dropped
export const PRESETS = {
  printGrunge: {
    seed: 11,
    srcBg:"#84847c", srcC1:"#3a3a38", srcC2:"#d8d4c6", srcC3:"#5a5a54",
    blobCount:8, blobScale:60, blobIrregular:0.65, blobSoft:40,
    cell:5, dotMax:1.22, sizeJitter:0.45, posJitter:0.3, roughness:0.5,
    cOn:false, mOn:false, yOn:false,
    fleck:0.55, dust:0.25,
  },
  grainGradient: {
    seed: 4,
    srcBg:"#8fd12e", srcC1:"#22251a", srcC2:"#e6cf3c", srcC3:"#a8c832",
    blobCount:4, blobScale:85, blobIrregular:0.75, blobSoft:90,
    htOn:false,
    grainAmt:0.38, grainChroma:0.12,
  },
  popGlitch: {
    seed: 23,
    srcBg:"#1cc4d8", srcC1:"#c81e0a", srcC2:"#e8f8ff", srcC3:"#124a20",
    blobScale:70, blobIrregular:0.6, blobSoft:25,
    srcContrast:18, srcBright:4, posterize:5,
    cell:9, shape:"diamond", dotMax:1.32, dotMin:0.03,
    sizeJitter:0.15, posJitter:0.1, roughness:0.2,
    misreg:6, turbAmt:10, turbScale:55,
  },
  cleanCmyk: {
    seed: 2,
    srcBg:"#e8e2d5", srcC1:"#d43a6a", srcC2:"#2a6ad4", srcC3:"#e8b23a",
    blobCount:5, blobScale:75, blobSoft:35, srcContrast:5,
    cell:8, dotMax:1.35,
  },
  newsprint: {
    seed: 31,
    srcBg:"#b8b4a8", srcC1:"#2a2a2a", srcC2:"#e2ddcc", srcC3:"#6a685e",
    blobCount:7, blobScale:65, blobIrregular:0.6, blobSoft:45, srcContrast:12,
    cell:4, dotGain:1.05, dotMax:1.4,
    sizeJitter:0.3, posJitter:0.2, roughness:0.4, inkOpacity:0.92,
    cOn:false, mOn:false, yOn:false,
    paper:"#f2ecdd", dust:0.35,
    grainAmt:0.1, grainChroma:0.05,
  },
  fractalGlass: {
    seed: 5,
    srcMode:"linear", gradAngle:165,
    srcBg:"#4d5cae", srcC1:"#9aa2ce", srcC2:"#f4eeda",
    srcContrast:35, posterize:5,
    htOn:false,
    fgOn:true, fgWidth:30, fgIrregular:0.5, fgRefract:170,
    fgShade:0.5, fgDispersion:0.35, fgFrost:5, fgFade:0.7,
    grainAmt:0.06,
  },
};
