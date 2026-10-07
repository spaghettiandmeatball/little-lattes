# Little Latte

A cozy latte-art pouring experiment built with Three.js, TypeScript and Vite. This is stage 1 of the build guide: try the core pour before committing to puzzle content.

## Run locally

Requires Node.js 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks TypeScript and creates `dist/`; `npm run preview` serves that build. `npm test` checks volume accounting and tuning validation.

## Play

- Mouse: hold the primary button and move over the cup. Release to reposition. Adjust flow with the slider or mouse wheel over the play area.
- Touch: drag on the cup with one finger while holding **Hold to pour** with another. The touch control also works with a mouse or keyboard. Left-handed mode mirrors the flow row.
- Choose Drawing, Accessible, or Technique. Technique exposes high/low pour height.
- Milk is finite; pouring outside the cup spends milk too. Refill keeps the artwork; Fresh cup clears it. Finish stops input and allows 0.8 seconds of settling.
- Studio settings expose 256/512 surface grids, sound, unlimited milk, per-preset tuning, local save, and JSON import/export. Switching presets or grid quality starts a fresh cup.

## Implementation

`src/fluid.ts` maintains ping-pong GPU textures: encoded surface velocity and visible foam concentration. It performs bounded semi-Lagrangian advection, limited diffusion, momentum injection and stylized height-dependent foam deposition. This is an art-directed approximation, with no incompressibility pressure solve. The unsigned-byte field favors portability; thin strokes and low-velocity quantization need visual testing across GPUs.

`src/model.ts` owns the volume ledger and validated presets. `src/scene.ts` owns the full-screen café, perspective camera, cup, pitcher, stream and ray-to-surface coordinate mapping. `src/main.ts` coordinates pointer IDs, fixed 60 Hz steps, UI, storage and optional synthesized sound. Catch-up is capped at 0.1 seconds; focus loss cancels pouring. Render pixel ratio is capped at 2.

The first scene uses procedural placeholders. For later GLB replacements use world units: coffee radius 1, coffee plane z=0, camera facing -z. Cup/pitcher asset loading and formal pivot/spout metadata are still future work.

## Next gates

1. Test dots, lines, curves and high-speed strokes on desktop and real phones/tablets. Confirm touch reach and whether an offset marker is needed.
2. Benchmark 256/512 grids and observe drift, control latency and repeatability. Tune deposition before authoring targets.
3. Add recorded achievable target fields, fixed-resolution scoring, six puzzles and local progress.
4. Add endless orders, then the two obstacle puzzles.

Puzzle scoring, endless orders, obstacles, attempt recording are not implemented yet. No real-device performance claim is made. Local settings only; no analytics.

## GitHub

This folder is its own Git repository. Dependencies and generated builds are ignored. Create an empty GitHub repository, then:

```sh
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
git push -u origin codex/latte-art-prototype
```

No remote has been configured or content published. A license should be chosen before public release.

## References

- [Three.js render targets](https://threejs.org/docs/pages/WebGLRenderTarget.html)
- [GPU Gems: Fast Fluid Dynamics](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu)

See `docs/build-plan.md` for the original proposal and staged acceptance gates.

## Café world pass

The canvas now fills the viewport with a 3D wood counter, a full ceramic cup, café fixtures, plants, warm directional light and shadows. Controls float over the scene. Finishing a cup lowers the camera; starting fresh restores the stable pouring angle. Desktop and 390×844 portrait layouts were visually checked in the browser; real-device touch and performance testing remain outstanding.

