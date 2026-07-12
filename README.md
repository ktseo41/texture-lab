# TEXTURE LAB_

**English** | [한국어](README.ko.md)

![TEXTURE LAB — CMYK halftone texture with ghosted text](docs/readme-hero.png)

A parametric web tool for generating **CMYK halftone · print grunge · grain gradient** textures — plus a text layer that gets screened into the pattern along with everything else.

**Live demo → https://ktseo41.github.io/texture-lab/**

## Features

- **CMYK halftone screening** — per-channel angles/offsets, 5 dot shapes, dot gain, jitter, edge roughness, plate misregistration
- **Source stage** — organic color blobs (1–5 colors), linear gradient, or your own uploaded image
- **Print grunge** — turbulence warp, CMY flecks, dust/speckle
- **Film grain** — mono or chroma noise, sized 1–6 px
- **Text layer** — drawn into the source, so it halftones/grains together with the artwork instead of sitting on top
- **Deterministic seeds** — the same seed always renders the same texture
- **Shareable URLs** — the whole state is encoded into `?p=`, so any texture is a link
- **Presets** — 5 factory presets + save your own (localStorage / JSON export)
- **PNG export** at any canvas size, Korean/English/Japanese UI

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/
npm run preview  # preview the build
```

## Architecture

```
src/
  engine/          render engine (fully separated from the UI)
    random.js      seeded hash · value noise — same seed, same result
    source.js      source stage: color blobs / linear gradient / uploaded image / text
    halftone.js    CMYK separation + per-channel rotated screens. Channel layers
                   are cached; misregistration is applied at composite time,
                   so no re-raster
    grain.js       film grain (noise cache) + dust / ink flecks
    pipeline.js    source → halftone → speckle → grain orchestration
  state/
    params.js      DEFAULTS + factory presets
    url.js         diff-from-defaults encoded to ?p= as base64url (share links)
    presetIO.js    preset JSON export / import
  ui/
    controls.js    declarative control defs → DOM, conditional visibility
  styles/
    base.css       structure / layout (theme-agnostic)
    themes.css     BRUTAL (brutalism) / PANEL (instrument panel) themes
```

Planned text-layer extensions (alignment options, box wrapping, rotation, fonts) are documented in [docs/text-layer-roadmap.md](docs/text-layer-roadmap.md).

## Deploying

Run `npm run build` and drop `dist/` on any static host (base is `./`, so GitHub Pages subpaths work).

- GitHub Pages: this repo auto-deploys on push to `main` via GitHub Actions
- Cloudflare Pages / Netlify / Vercel: connect the repo, build command `npm run build`, output `dist`
