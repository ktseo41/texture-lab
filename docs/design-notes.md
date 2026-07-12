# TEXTURE LAB — UI 디자인 노트

이 문서는 UI가 어떤 근거로 구성됐는지 기록한다. 코드만 봐서는 알 수 없는 "왜 이렇게 생겼는가"를 남기는 것이 목적.

## 1. 스타일 계보 — 어디서 온 문법인가

BRUTAL 테마는 특정 실물 레퍼런스를 트레이싱한 것이 아니라, LLM(Fable 5)이 학습 지식에 있는 **네오브루탈리즘(neubrutalism)** 웹 디자인 관행의 전형적 문법을 조합해 작성했다. 사용한 문법 요소:

- 2px 이상의 검은 하드 보더, `border-radius: 0`
- 블러 없는 오프셋 솔리드 섀도 (`box-shadow: 3px 3px 0 #111`)
- 클릭 시 섀도 방향으로 밀리는 버튼 (`:active`에서 `translate(3px,3px)` + 섀도 제거)
- 고채도 원색 액센트 — 인쇄 프로세스 옐로(`#f7d500`), 도구 주제(CMYK 할프톤)와 연결
- 모노스페이스 대문자 레이블, 번호 매긴 섹션(01~05)
- 오프화이트/크래프트지 배경(`#dedad0`, `#f4f1e8`) — "인쇄소" 무드

이 문법은 Gumroad 리디자인·Figma 마케팅 페이지 이후 유행한 네오브루탈리즘 관례이고, 더 거슬러가면 brutalistwebsites.com에 아카이빙된 웹 브루탈리즘에서 온 요소다. 즉 **잘 알려진 스타일 문법을 따른 것이지, 실제 레퍼런스를 옆에 놓고 검증하며 만든 것은 아니다.** 제작 과정에서 레퍼런스에 가까웠던 행위는 스크린샷을 찍어 렌더 결과를 보면서 의도한 인상이 나오는지 반복 확인한 것 정도("렌더링하고 보면서 반복"의 축소판).

초기에는 INSTRUMENT(계기판) 테마도 있었다 — 빈티지 랙 장비/오실로스코프 관습(포스포 그린, 앰버 LED, 베젤)을 같은 방식으로 기억에서 꺼내 쓴 것. 테마 스위치 유지 비용 대비 가치가 낮아 BRUTAL 단일 테마로 정리하고 제거했다. (필요하면 git 히스토리 `3f9004e`에서 복원 가능.)

## 2. 타이포그래피

문제: 초기 버전은 `--mono`가 "IBM Plex Mono"를 **선언만 하고 로드하지 않아** 시스템 모노스페이스로 폴백됐고, 한글 레이블은 시스템 기본 한글 폰트의 가는 자면으로 렌더돼 가독성이 나빴다.

결정:

| 역할 | 폰트 | 이유 |
| --- | --- | --- |
| `--font` (레이블·힌트·셀렉트·본문 한글) | Pretendard Variable (+ Pretendard JP) | 한글 UI 가독성 표준. weight 500~600으로 얇음 문제 해결. JP 변형으로 일본어 i18n까지 커버 |
| `--mono` (버튼·수치·상태바·섹션 번호) | IBM Plex Mono (500/600/700, 실제 로드) | 브루탈리즘의 "기계 문서" 무드 유지. 한글 글리프는 Pretendard로 폴백 |
| 마스트헤드 h1 | Pretendard 800 (영문 "TEXTURE LAB") | 헬베티카 계열 그로테스크 대문자 — 브루탈리즘 헤드라인 관례 |

로드는 jsdelivr(Pretendard variable dynamic-subset, KR/JP)과 Google Fonts(IBM Plex Mono)의 CDN CSS. 가독성 보정: 레이블 10.5px mono → 12px Pretendard 600, 힌트 10px → 11px 500, `--dim`을 `#444 → #3a3a3a`로 소폭 진하게.

## 3. i18n (ko / en / ja)

- `src/i18n.js` 단일 모듈, 키-값 사전 3개. 키 규칙: 레이블 = 파라미터 키(`cell`), 힌트 = `hint.<키>`, 셀렉트 옵션 = `opt.<키>.<값>`, 섹션 = `sec.<이름>`, 토스트 = `toast.<이름>`.
- 정적 HTML은 `data-i18n`(textContent) / `data-i18n-title`(title 속성)로 마킹, `applyStatic()`이 일괄 적용.
- 동적 컨트롤은 `controls.js`가 생성 시 `t()`로 라벨링하고, 언어 전환 시 `relabelControls()`가 다시 쓴다.
- 언어 결정: localStorage(`texlab-lang`) > `navigator.language`(ko/ja는 해당 언어, 그 외 en) > ko.
- 미번역 잔여: 프리셋 이름(`params.js`의 PRESETS 키가 곧 표시명이자 식별자라 번역하면 URL/JSON 호환이 깨짐 — 분리하려면 id/표시명 구조 변경 필요).

## 4. 패널 리사이즈

`#resizer`(7px, `cursor: col-resize`)를 스테이지와 패널 사이에 두고 Pointer Events(`setPointerCapture`)로 드래그. 폭은 280~640px로 클램프, `texlab-panelw`로 localStorage에 저장. BRUTAL 테마에서는 리사이저 자체가 검은 세로 룰이며 hover/드래그 시 액센트 옐로로 바뀐다 — 기존 `#panel`의 3px 검은 보더를 리사이저가 대체.
