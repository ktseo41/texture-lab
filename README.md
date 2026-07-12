# TEXTURE LAB

CMYK 할프톤 · 프린트 그런지 · 그레인 그라디언트 텍스처를 파라미터로 생성/변형하는 웹 도구.

## 개발

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 에 정적 빌드
npm run preview  # 빌드 결과 미리보기
```

## 구조

```
src/
  engine/          렌더 엔진 (UI와 완전 분리)
    random.js      시드 해시 · value noise — 같은 시드는 항상 같은 결과
    source.js      소스 스테이지: 컬러 블롭 / 리니어 그라디언트 / 업로드 이미지
    halftone.js    CMYK 분판 + 채널별 회전 스크린. 채널 레이어 캐시,
                   판 어긋남은 합성 시점에 적용되어 재래스터 없음
    grain.js       필름 그레인(노이즈 캐시) + 먼지/잉크 플레이크
    pipeline.js    source → halftone → speckle → grain 오케스트레이션
  state/
    params.js      DEFAULTS + 팩토리 프리셋
    url.js         기본값 대비 diff를 base64url로 ?p=에 인코딩 (공유 링크)
    presetIO.js    프리셋 JSON 내보내기/가져오기
  ui/
    controls.js    선언적 컨트롤 정의 → DOM, 조건부 표시
  styles/
    base.css       구조/레이아웃 (테마 무관)
    themes.css     BRUTAL(브루탈리즘) / PANEL(계기판) 두 테마
```

## 배포

`npm run build` 후 `dist/`를 아무 정적 호스팅에 올리면 끝 (base가 `./`라
GitHub Pages 서브패스에서도 동작).

- GitHub Pages: repo 푸시 → Settings → Pages → GitHub Actions(Vite 템플릿)
- Cloudflare Pages / Netlify / Vercel: repo 연결, build command `npm run build`, output `dist`
