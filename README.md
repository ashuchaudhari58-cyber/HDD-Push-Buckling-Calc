# HDD Push & Buckling Studio

React web app for horizontal directional drilling (HDD) **pipe push installation**: crossing profile geometry,
installation push force, axial stress, constrained buckling and thruster clamp checks, for **steel (API 5L)** and
**HDPE (PE80 / PE100)** pipe. It has a full step-by-step calculation trace, project save and revisions, and a printable A4 report.

## Calculation engines (reproduce the TESPL workbooks exactly)

| Engine | Source workbook | File |
|---|---|---|
| Profile geometry: AB, BC, CD, DE, EF and node coordinates | `crossing_profile_geometry_calculator.xlsx` | `src/engine/profile.js` |
| Setback / cover helper for river, canal, road and rail crossings | HDD Profile Studio logic | `src/engine/profile.js` |
| Method S: segmental push force with capstan curves | `Push force Calculation.xlsx` | `src/engine/pushSegmental.js` |
| Method C: capstan carry-through (ASTM F1962 / PPI) | `HDPE_Push_Clamp_Calc_V1.xlsx` | `src/engine/pushCapstan.js` |
| Buckling: Dawson–Paslay and Gao et al. (2010) | both workbooks | `src/engine/buckling.js` |
| Thruster clamp check | `HDPE_Push_Clamp_Calc_V1.xlsx` → Clamp_Check | `src/engine/clamp.js` |

`npm test` compares every engine with the workbooks' cached cell values to 1 × 10⁻⁹ relative. The Overview page also
re-runs the verification cases live.

## Run locally

Node.js 20+ is required (a portable Node 24 is installed at `C:\Users\ASHUTOSH\tools\node`).

```bash
npm install
npm run dev        # http://localhost:5178
npm test           # engine regression tests
npm run build      # production build in dist/
```

The folder name contains `&`, which breaks npm's Windows `.cmd` shims, so the scripts call Vite through
`node node_modules/vite/bin/vite.js`. Use the npm scripts rather than `npx vite`.

## Photos

Put source photos in `.work/images-raw/<slot>.jpg`, together with `credits.json`. Then run `npm run images`, which
writes WebP files (1920 px and 720 px) to `public/images/` and updates `src/data/image-credits.json`, the data behind
the in-app **Image credits** page.

## Logo

The logo source (white background) lives at `.work/brand/logo-source.png`. `npm run logo` removes the outer background and writes `public/brand/logo*.{webp,png}` (header, favicon, hero, report cover).

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` tests, builds and publishes `dist/` on every push to `main`. In the repository, set
**Settings → Pages → Source: GitHub Actions**. The build uses relative paths (`base: './'`) and hash routing, so it
works from any sub-path.

## Structure

```
src/engine/     calculation engines, validation, presets, calculation trace (no UI code)
src/state/      project store: working copy, browser library, revisions, import/export
src/components/ layout, form controls, SVG profile / force chart / cross-section, simulation
src/pages/      Overview, Project, Inputs, Profile, Steps, Results, Stress & buckling, Clamp,
                Validation, Basis, Report, Projects, Credits
legacy/         previous single-file calculator (kept for cross-checking)
docs/           UI redesign brief and design language
```

Engineering results depend on the input data, assumptions, calculation methodology and applicable project criteria.
The software does not replace project-specific engineering review.
