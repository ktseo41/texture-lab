// all render parameters + factory presets

export const DEFAULTS = {
  // canvas
  width: 1200, height: 800, seed: 7,
  // source
  srcMode: "blobs",          // blobs | linear | image
  srcBg: "#9a9a92",
  srcC1: "#2b2b2b", srcC2: "#e8e4d8", srcC3: "#555550",
  blobCount: 6, blobScale: 55, blobIrregular: 0.5, blobSoft: 30,
  gradAngle: 45,
  srcContrast: 0, srcBright: 0, posterize: 0,
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
  // grunge
  turbAmt: 0, turbScale: 40, fleck: 0, dust: 0,
  // grain
  grainAmt: 0, grainSize: 1, grainChroma: 0.15,
};

export const PRESETS = {
  "① 프린트 그런지 (흑백 망점+CMY 플레이크)": {
    seed: 11,
    srcMode:"blobs", srcBg:"#84847c", srcC1:"#3a3a38", srcC2:"#d8d4c6", srcC3:"#5a5a54",
    blobCount:8, blobScale:60, blobIrregular:0.65, blobSoft:40, srcContrast:0, srcBright:0, posterize:0,
    htOn:true, cell:5, shape:"circle", dotGain:1.0, dotMax:1.22, dotMin:0.02,
    sizeJitter:0.45, posJitter:0.3, roughness:0.5, inkOpacity:1,
    cOn:false, mOn:false, yOn:false, kOn:true, kAng:45,
    misreg:0, turbAmt:6, turbScale:30,
    fleck:0.55, dust:0.25, grainAmt:0.06, grainSize:1, grainChroma:0.5,
  },
  "② 그레인 그라디언트 (노이즈 필름)": {
    seed: 4,
    srcMode:"blobs", srcBg:"#8fd12e", srcC1:"#22251a", srcC2:"#e6cf3c", srcC3:"#a8c832",
    blobCount:4, blobScale:85, blobIrregular:0.75, blobSoft:90, srcContrast:0, srcBright:0, posterize:0,
    htOn:false,
    turbAmt:0, fleck:0, dust:0,
    grainAmt:0.38, grainSize:1, grainChroma:0.12,
  },
  "③ 팝 할프톤 글리치 (CMYK 판 어긋남)": {
    seed: 23,
    srcMode:"blobs", srcBg:"#1cc4d8", srcC1:"#c81e0a", srcC2:"#e8f8ff", srcC3:"#124a20",
    blobCount:6, blobScale:70, blobIrregular:0.6, blobSoft:25, srcContrast:18, srcBright:4, posterize:5,
    htOn:true, cell:9, shape:"diamond", dotGain:1.0, dotMax:1.32, dotMin:0.03,
    sizeJitter:0.15, posJitter:0.1, roughness:0.2, inkOpacity:1,
    cOn:true, mOn:true, yOn:true, kOn:true,
    cAng:15, mAng:75, yAng:0, kAng:45,
    misreg:6, turbAmt:10, turbScale:55,
    fleck:0.06, dust:0.05, grainAmt:0.05, grainSize:1, grainChroma:0.3,
  },
  "④ 클린 CMYK 할프톤": {
    seed: 2,
    srcMode:"blobs", srcBg:"#e8e2d5", srcC1:"#d43a6a", srcC2:"#2a6ad4", srcC3:"#e8b23a",
    blobCount:5, blobScale:75, blobIrregular:0.5, blobSoft:35, srcContrast:5, srcBright:0, posterize:0,
    htOn:true, cell:8, shape:"circle", dotGain:1, dotMax:1.35, dotMin:0.02,
    sizeJitter:0, posJitter:0, roughness:0, inkOpacity:1,
    cOn:true, mOn:true, yOn:true, kOn:true,
    cAng:15, mAng:75, yAng:0, kAng:45, misreg:0,
    turbAmt:0, fleck:0, dust:0, grainAmt:0, grainChroma:0.15,
  },
  "⑤ 신문 인쇄 (거친 모노 망점)": {
    seed: 31,
    srcMode:"blobs", srcBg:"#b8b4a8", srcC1:"#2a2a2a", srcC2:"#e2ddcc", srcC3:"#6a685e",
    blobCount:7, blobScale:65, blobIrregular:0.6, blobSoft:45, srcContrast:12, posterize:0,
    htOn:true, cell:4, shape:"circle", dotGain:1.05, dotMax:1.4, dotMin:0.02,
    sizeJitter:0.3, posJitter:0.2, roughness:0.4, inkOpacity:0.92,
    cOn:false, mOn:false, yOn:false, kOn:true, kAng:45,
    paper:"#f2ecdd", misreg:0, turbAmt:3, turbScale:25,
    fleck:0, dust:0.35, grainAmt:0.1, grainSize:1, grainChroma:0.05,
  },
};
