// control-panel builder: declarative defs → DOM, plus sync & visibility

export const UI = {
  'g-canvas': [
    {k:'width',  t:'number', l:'너비 px'},
    {k:'height', t:'number', l:'높이 px'},
    {k:'seed',   t:'number', l:'시드'},
  ],
  'g-source': [
    {k:'srcMode', t:'select', l:'소스 모드', opts:{blobs:'컬러 블롭', linear:'리니어 그라디언트', image:'업로드 이미지'}},
    {k:'srcBg', t:'color', l:'배경색', show:p=>p.srcMode!=='image'},
    {k:'srcC1', t:'color', l:'색 1 (어두움)', show:p=>p.srcMode!=='image'},
    {k:'srcC2', t:'color', l:'색 2 (밝음)', show:p=>p.srcMode!=='image'},
    {k:'srcC3', t:'color', l:'색 3', show:p=>p.srcMode==='blobs'},
    {k:'gradAngle', t:'range', l:'그라디언트 각도°', min:0, max:360, step:1, show:p=>p.srcMode==='linear'},
    {k:'blobCount', t:'range', l:'블롭 개수', min:1, max:16, step:1, show:p=>p.srcMode==='blobs'},
    {k:'blobScale', t:'range', l:'블롭 크기 %', min:10, max:150, step:1, show:p=>p.srcMode==='blobs'},
    {k:'blobIrregular', t:'range', l:'블롭 불규칙성', min:0, max:1, step:0.01, show:p=>p.srcMode==='blobs', hint:'0=정직한 원, 1=여러 덩어리가 뭉친 유기적 형태'},
    {k:'blobSoft', t:'range', l:'블롭 소프트니스', min:0, max:120, step:1, show:p=>p.srcMode==='blobs', hint:'경계를 흐리는 블러 반경(px)'},
    {k:'srcContrast', t:'range', l:'대비', min:-50, max:80, step:1},
    {k:'srcBright', t:'range', l:'밝기', min:-60, max:60, step:1},
    {k:'posterize', t:'range', l:'포스터라이즈', min:0, max:12, step:1, hint:'0=끔. 톤 단계를 제한해 팝아트 느낌'},
  ],
  'g-halftone': [
    {k:'htOn', t:'check', l:'할프톤 켜기'},
    {k:'cell', t:'range', l:'망점 간격 px', min:2, max:30, step:0.5},
    {k:'shape', t:'select', l:'도트 모양', opts:{circle:'원', diamond:'다이아몬드', square:'사각', ellipse:'타원', line:'라인'}},
    {k:'dotGain', t:'range', l:'도트 게인', min:0.3, max:2.5, step:0.01, hint:'잉크 퍼짐 — 높을수록 어두운 부분이 뭉개짐'},
    {k:'dotMax', t:'range', l:'최대 도트 크기', min:0.5, max:2.2, step:0.01},
    {k:'dotMin', t:'range', l:'최소 도트 임계', min:0, max:0.3, step:0.005},
    {k:'sizeJitter', t:'range', l:'크기 지터', min:0, max:1, step:0.01, hint:'도트 크기의 랜덤 불균일 — 낡은 인쇄 느낌'},
    {k:'posJitter', t:'range', l:'위치 지터', min:0, max:1, step:0.01},
    {k:'roughness', t:'range', l:'엣지 거칠기', min:0, max:1, step:0.01, hint:'도트 가장자리가 잉크 번지듯 울퉁불퉁해짐'},
    {k:'inkOpacity', t:'range', l:'잉크 불투명도', min:0.3, max:1, step:0.01},
    {k:'misreg', t:'range', l:'판 어긋남(랜덤) px', min:0, max:20, step:0.5, hint:'시드 기반 랜덤 오프셋. 아래 채널별 오프셋과 합산'},
    {k:'paper', t:'color', l:'종이색'},
    {k:'cInk', t:'color', l:'C 잉크색'},
    {k:'mInk', t:'color', l:'M 잉크색'},
    {k:'yInk', t:'color', l:'Y 잉크색'},
    {k:'kInk', t:'color', l:'K 잉크색'},
  ],
  'g-grunge': [
    {k:'turbAmt', t:'range', l:'터뷸런스 강도 px', min:0, max:60, step:0.5, hint:'샘플 좌표를 노이즈로 비틀어 물결/스캔 왜곡'},
    {k:'turbScale', t:'range', l:'터뷸런스 스케일', min:5, max:200, step:1},
    {k:'fleck', t:'range', l:'CMY 플레이크', min:0, max:1, step:0.01, hint:'랜덤한 시안/마젠타/옐로 미세 잉크 얼룩'},
    {k:'dust', t:'range', l:'먼지/스펙클', min:0, max:1, step:0.01, hint:'종이색·잉크색의 미세 점 노이즈'},
  ],
  'g-grain': [
    {k:'grainAmt', t:'range', l:'그레인 강도', min:0, max:1, step:0.005},
    {k:'grainSize', t:'range', l:'그레인 크기 px', min:1, max:6, step:1},
    {k:'grainChroma', t:'range', l:'컬러 그레인', min:0, max:1, step:0.01, hint:'0=흑백 그레인, 1=RGB 채널 독립 컬러 노이즈'},
  ],
};

export const CHANNELS = [
  {id:'c', name:'C'}, {id:'m', name:'M'}, {id:'y', name:'Y'}, {id:'k', name:'K'},
];

const inputs = {};
const visRules = [];

function readInput(d, inp){
  if(d.t === 'check') return inp.checked;
  if(d.t === 'select' || d.t === 'color') return inp.value;
  return +inp.value;
}
function fmt(v){
  return (typeof v === 'number' && !Number.isInteger(v)) ? v.toFixed(2).replace(/\.?0+$/,'') : String(v);
}

export function updateVisibility(P){
  for(const r of visRules){
    const on = r.fn(P);
    for(const el of r.els) el.style.display = on ? '' : 'none';
  }
}

export function syncUI(P){
  for(const [k, o] of Object.entries(inputs)){
    const v = P[k];
    if(o.def.t === 'check') o.inp.checked = !!v;
    else o.inp.value = v;
    if(o.val) o.val.textContent = fmt(v);
  }
}

// getP: () => current params object   onChange: (key) => void
export function buildControls(getP, onChange){
  for(const [gid, defs] of Object.entries(UI)){
    const grp = document.getElementById(gid);
    for(const d of defs){
      const row = document.createElement('div');
      row.className = 'row';
      const lab = document.createElement('label');
      lab.textContent = d.l;
      row.appendChild(lab);
      let inp, val;
      if(d.t === 'range'){
        inp = document.createElement('input');
        inp.type = 'range'; inp.min = d.min; inp.max = d.max; inp.step = d.step;
        val = document.createElement('span'); val.className = 'val';
        row.appendChild(inp); row.appendChild(val);
      } else if(d.t === 'number'){
        inp = document.createElement('input'); inp.type = 'number';
        row.appendChild(inp);
      } else if(d.t === 'color'){
        inp = document.createElement('input'); inp.type = 'color';
        row.appendChild(inp);
      } else if(d.t === 'check'){
        inp = document.createElement('input'); inp.type = 'checkbox';
        row.appendChild(inp);
      } else if(d.t === 'select'){
        inp = document.createElement('select');
        for(const [v, txt] of Object.entries(d.opts)){
          const o = document.createElement('option'); o.value = v; o.textContent = txt;
          inp.appendChild(o);
        }
        row.appendChild(inp);
      }
      inputs[d.k] = { inp, val, def: d };
      grp.appendChild(row);
      let hintEl = null;
      if(d.hint){
        hintEl = document.createElement('div'); hintEl.className = 'hint'; hintEl.textContent = d.hint;
        grp.appendChild(hintEl);
      }
      if(d.show) visRules.push({ fn: d.show, els: hintEl ? [row, hintEl] : [row] });
      inp.addEventListener('input', () => {
        const P = getP();
        P[d.k] = readInput(d, inp);
        if(val) val.textContent = fmt(P[d.k]);
        if(d.k === 'srcMode') updateVisibility(P);
        onChange(d.k);
      });
    }
  }
  // channel rows (enable / angle / offset X / offset Y)
  const chBox = document.getElementById('channels');
  for(const ch of CHANNELS){
    const row = document.createElement('div');
    row.className = 'chrow';
    const en = document.createElement('input'); en.type = 'checkbox';
    const tag = document.createElement('span'); tag.className = 'tag ch-' + ch.id; tag.textContent = ch.name;
    const ang = document.createElement('input'); ang.type = 'number'; ang.step = 1;
    const ox = document.createElement('input'); ox.type = 'number'; ox.step = 0.5;
    const oy = document.createElement('input'); oy.type = 'number'; oy.step = 0.5;
    row.append(en, tag, ang, ox, oy);
    chBox.appendChild(row);
    const bind = (inp, key, kind) => {
      inputs[key] = { inp, def: { t: kind } };
      inp.addEventListener('input', () => {
        const P = getP();
        P[key] = kind === 'check' ? inp.checked : (+inp.value || 0);
        onChange(key);
      });
    };
    bind(en, ch.id + 'On', 'check');
    bind(ang, ch.id + 'Ang', 'number');
    bind(ox, ch.id + 'OffX', 'number');
    bind(oy, ch.id + 'OffY', 'number');
  }
}
