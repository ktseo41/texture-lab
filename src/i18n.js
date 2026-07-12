// i18n: ko / en / ja — labels keyed by param key, hints by hint.<key>, opts by opt.<key>.<value>

export const LANGS = ['ko', 'en', 'ja'];

const DICT = {
  ko: {
    'app.sub': 'CMYK HALFTONE · PRINT GRUNGE · GRAIN GRADIENT',
    'sec.canvas': '캔버스 / 시드',
    'sec.source': '소스 (베이스 이미지)',
    'sec.halftone': '할프톤 스크린',
    'sec.grunge': '그런지 / 왜곡',
    'sec.grain': '그레인',
    'upload': '이미지 업로드',
    'ch.hint': '채널별 스크린 각도와 판 어긋남 오프셋. 인쇄 표준: C=15° M=75° Y=0° K=45°',
    'busy': 'RENDERING…',

    'title.rndSeed': '시드 랜덤화',
    'title.share': '현재 설정을 URL로 복사',
    'title.saveJson': '프리셋 JSON 저장',
    'title.loadJson': '프리셋 JSON 불러오기',

    'toast.link': '링크가 클립보드에 복사되었습니다',
    'toast.linkFail': '주소창의 URL을 복사하세요 (자동 복사 실패)',
    'toast.preset': '프리셋을 불러왔습니다',
    'toast.jsonFail': 'JSON 파싱 실패',

    'width': '너비 px', 'height': '높이 px', 'seed': '시드',
    'srcMode': '소스 모드',
    'opt.srcMode.blobs': '컬러 블롭', 'opt.srcMode.linear': '리니어 그라디언트', 'opt.srcMode.image': '업로드 이미지',
    'srcBg': '배경색', 'srcC1': '색 1 (어두움)', 'srcC2': '색 2 (밝음)', 'srcC3': '색 3',
    'gradAngle': '그라디언트 각도°',
    'blobCount': '블롭 개수', 'blobScale': '블롭 크기 %',
    'blobIrregular': '블롭 불규칙성',
    'hint.blobIrregular': '0=정직한 원, 1=여러 덩어리가 뭉친 유기적 형태',
    'blobSoft': '블롭 소프트니스',
    'hint.blobSoft': '경계를 흐리는 블러 반경(px)',
    'srcContrast': '대비', 'srcBright': '밝기',
    'posterize': '포스터라이즈',
    'hint.posterize': '0=끔. 톤 단계를 제한해 팝아트 느낌',

    'htOn': '할프톤 켜기', 'cell': '망점 간격 px', 'shape': '도트 모양',
    'opt.shape.circle': '원', 'opt.shape.diamond': '다이아몬드', 'opt.shape.square': '사각',
    'opt.shape.ellipse': '타원', 'opt.shape.line': '라인',
    'dotGain': '도트 게인',
    'hint.dotGain': '잉크 퍼짐 — 높을수록 어두운 부분이 뭉개짐',
    'dotMax': '최대 도트 크기', 'dotMin': '최소 도트 임계',
    'sizeJitter': '크기 지터',
    'hint.sizeJitter': '도트 크기의 랜덤 불균일 — 낡은 인쇄 느낌',
    'posJitter': '위치 지터',
    'roughness': '엣지 거칠기',
    'hint.roughness': '도트 가장자리가 잉크 번지듯 울퉁불퉁해짐',
    'inkOpacity': '잉크 불투명도',
    'misreg': '판 어긋남(랜덤) px',
    'hint.misreg': '시드 기반 랜덤 오프셋. 아래 채널별 오프셋과 합산',
    'paper': '종이색', 'cInk': 'C 잉크색', 'mInk': 'M 잉크색', 'yInk': 'Y 잉크색', 'kInk': 'K 잉크색',

    'turbAmt': '터뷸런스 강도 px',
    'hint.turbAmt': '샘플 좌표를 노이즈로 비틀어 물결/스캔 왜곡',
    'turbScale': '터뷸런스 스케일',
    'fleck': 'CMY 플레이크',
    'hint.fleck': '랜덤한 시안/마젠타/옐로 미세 잉크 얼룩',
    'dust': '먼지/스펙클',
    'hint.dust': '종이색·잉크색의 미세 점 노이즈',

    'grainAmt': '그레인 강도', 'grainSize': '그레인 크기 px',
    'grainChroma': '컬러 그레인',
    'hint.grainChroma': '0=흑백 그레인, 1=RGB 채널 독립 컬러 노이즈',
  },

  en: {
    'app.sub': 'CMYK HALFTONE · PRINT GRUNGE · GRAIN GRADIENT',
    'sec.canvas': 'Canvas / Seed',
    'sec.source': 'Source (base image)',
    'sec.halftone': 'Halftone screen',
    'sec.grunge': 'Grunge / distortion',
    'sec.grain': 'Grain',
    'upload': 'Upload image',
    'ch.hint': 'Per-channel screen angle and plate offset. Print standard: C=15° M=75° Y=0° K=45°',
    'busy': 'RENDERING…',

    'title.rndSeed': 'Randomize seed',
    'title.share': 'Copy current settings as URL',
    'title.saveJson': 'Save preset JSON',
    'title.loadJson': 'Load preset JSON',

    'toast.link': 'Link copied to clipboard',
    'toast.linkFail': 'Copy the URL from the address bar (auto-copy failed)',
    'toast.preset': 'Preset loaded',
    'toast.jsonFail': 'Failed to parse JSON',

    'width': 'Width px', 'height': 'Height px', 'seed': 'Seed',
    'srcMode': 'Source mode',
    'opt.srcMode.blobs': 'Color blobs', 'opt.srcMode.linear': 'Linear gradient', 'opt.srcMode.image': 'Uploaded image',
    'srcBg': 'Background', 'srcC1': 'Color 1 (dark)', 'srcC2': 'Color 2 (light)', 'srcC3': 'Color 3',
    'gradAngle': 'Gradient angle°',
    'blobCount': 'Blob count', 'blobScale': 'Blob size %',
    'blobIrregular': 'Blob irregularity',
    'hint.blobIrregular': '0 = clean circle, 1 = organic clustered lumps',
    'blobSoft': 'Blob softness',
    'hint.blobSoft': 'Blur radius softening the edges (px)',
    'srcContrast': 'Contrast', 'srcBright': 'Brightness',
    'posterize': 'Posterize',
    'hint.posterize': '0 = off. Limits tone steps for a pop-art look',

    'htOn': 'Halftone on', 'cell': 'Dot pitch px', 'shape': 'Dot shape',
    'opt.shape.circle': 'Circle', 'opt.shape.diamond': 'Diamond', 'opt.shape.square': 'Square',
    'opt.shape.ellipse': 'Ellipse', 'opt.shape.line': 'Line',
    'dotGain': 'Dot gain',
    'hint.dotGain': 'Ink spread — higher values crush the shadows',
    'dotMax': 'Max dot size', 'dotMin': 'Min dot threshold',
    'sizeJitter': 'Size jitter',
    'hint.sizeJitter': 'Random dot-size unevenness — worn print look',
    'posJitter': 'Position jitter',
    'roughness': 'Edge roughness',
    'hint.roughness': 'Dot edges get ragged like bleeding ink',
    'inkOpacity': 'Ink opacity',
    'misreg': 'Misregistration (random) px',
    'hint.misreg': 'Seeded random offset, added to the per-channel offsets below',
    'paper': 'Paper color', 'cInk': 'C ink', 'mInk': 'M ink', 'yInk': 'Y ink', 'kInk': 'K ink',

    'turbAmt': 'Turbulence amount px',
    'hint.turbAmt': 'Warps sample coordinates with noise — ripple / scan distortion',
    'turbScale': 'Turbulence scale',
    'fleck': 'CMY flecks',
    'hint.fleck': 'Random tiny cyan / magenta / yellow ink specks',
    'dust': 'Dust / speckle',
    'hint.dust': 'Fine paper- and ink-colored dot noise',

    'grainAmt': 'Grain amount', 'grainSize': 'Grain size px',
    'grainChroma': 'Color grain',
    'hint.grainChroma': '0 = mono grain, 1 = independent RGB color noise',
  },

  ja: {
    'app.sub': 'CMYK HALFTONE · PRINT GRUNGE · GRAIN GRADIENT',
    'sec.canvas': 'キャンバス / シード',
    'sec.source': 'ソース（ベース画像）',
    'sec.halftone': 'ハーフトーンスクリーン',
    'sec.grunge': 'グランジ / 歪み',
    'sec.grain': 'グレイン',
    'upload': '画像アップロード',
    'ch.hint': 'チャンネル別スクリーン角度と版ズレオフセット。印刷標準: C=15° M=75° Y=0° K=45°',
    'busy': 'RENDERING…',

    'title.rndSeed': 'シードをランダム化',
    'title.share': '現在の設定をURLとしてコピー',
    'title.saveJson': 'プリセットJSONを保存',
    'title.loadJson': 'プリセットJSONを読み込み',

    'toast.link': 'リンクをクリップボードにコピーしました',
    'toast.linkFail': 'アドレスバーのURLをコピーしてください（自動コピー失敗）',
    'toast.preset': 'プリセットを読み込みました',
    'toast.jsonFail': 'JSONの解析に失敗しました',

    'width': '幅 px', 'height': '高さ px', 'seed': 'シード',
    'srcMode': 'ソースモード',
    'opt.srcMode.blobs': 'カラーブロブ', 'opt.srcMode.linear': 'リニアグラデーション', 'opt.srcMode.image': 'アップロード画像',
    'srcBg': '背景色', 'srcC1': '色 1（暗）', 'srcC2': '色 2（明）', 'srcC3': '色 3',
    'gradAngle': 'グラデーション角度°',
    'blobCount': 'ブロブ数', 'blobScale': 'ブロブサイズ %',
    'blobIrregular': 'ブロブ不規則性',
    'hint.blobIrregular': '0=きれいな円、1=塊が集まった有機的な形',
    'blobSoft': 'ブロブソフトネス',
    'hint.blobSoft': '境界をぼかすブラー半径 (px)',
    'srcContrast': 'コントラスト', 'srcBright': '明るさ',
    'posterize': 'ポスタライズ',
    'hint.posterize': '0=オフ。トーン段階を制限してポップアート風に',

    'htOn': 'ハーフトーン有効', 'cell': '網点間隔 px', 'shape': 'ドット形状',
    'opt.shape.circle': '円', 'opt.shape.diamond': 'ダイヤ', 'opt.shape.square': '四角',
    'opt.shape.ellipse': '楕円', 'opt.shape.line': 'ライン',
    'dotGain': 'ドットゲイン',
    'hint.dotGain': 'インクの滲み — 高いほど暗部が潰れる',
    'dotMax': '最大ドットサイズ', 'dotMin': '最小ドット閾値',
    'sizeJitter': 'サイズジッター',
    'hint.sizeJitter': 'ドットサイズのランダムなムラ — 古い印刷の質感',
    'posJitter': '位置ジッター',
    'roughness': 'エッジの粗さ',
    'hint.roughness': 'ドットの縁がインク滲みのように荒れる',
    'inkOpacity': 'インク不透明度',
    'misreg': '版ズレ（ランダム）px',
    'hint.misreg': 'シード基準のランダムオフセット。下のチャンネル別オフセットと加算',
    'paper': '紙色', 'cInk': 'Cインク', 'mInk': 'Mインク', 'yInk': 'Yインク', 'kInk': 'Kインク',

    'turbAmt': 'タービュランス強度 px',
    'hint.turbAmt': 'サンプル座標をノイズで歪ませ、波／スキャン風の歪みに',
    'turbScale': 'タービュランススケール',
    'fleck': 'CMYフレック',
    'hint.fleck': 'ランダムなシアン／マゼンタ／イエローの微細なインク染み',
    'dust': 'ダスト／スペックル',
    'hint.dust': '紙色・インク色の微細な点ノイズ',

    'grainAmt': 'グレイン強度', 'grainSize': 'グレインサイズ px',
    'grainChroma': 'カラーグレイン',
    'hint.grainChroma': '0=モノクログレイン、1=RGB独立カラーノイズ',
  },
};

let cur = 'ko';

export function getLang(){ return cur; }

export function t(key){
  return DICT[cur][key] ?? DICT.ko[key] ?? key;
}

export function initLang(){
  try{
    const saved = localStorage.getItem('texlab-lang');
    if(LANGS.includes(saved)){ cur = saved; return cur; }
  }catch{}
  const nav = (navigator.language || 'ko').slice(0, 2);
  cur = LANGS.includes(nav) ? nav : 'en';
  return cur;
}

export function setLang(l){
  if(!LANGS.includes(l)) return;
  cur = l;
  try{ localStorage.setItem('texlab-lang', l); }catch{}
}

// static DOM: [data-i18n] → textContent, [data-i18n-title] → title attr
export function applyStatic(){
  document.documentElement.lang = cur;
  for(const el of document.querySelectorAll('[data-i18n]'))
    el.textContent = t(el.dataset.i18n);
  for(const el of document.querySelectorAll('[data-i18n-title]'))
    el.title = t(el.dataset.i18nTitle);
}
