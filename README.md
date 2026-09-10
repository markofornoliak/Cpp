# Learn C++

A complete, locally persisted C++17 learning application: 24 lessons across six chapters, 24 exercises, four executable projects, a CodeMirror editor, real Clang compilation, and progress that survives refresh.

Built with React, TypeScript, Vite, React Router, CodeMirror 6, and Lucide. The interface uses a small application-owned CSS design system. No account, backend, execution API, or private credentials are required.

## Run locally

Use Node.js 24 (CI uses Node 24), npm, and Git. Node 22.12+ is also permitted by the package engine declaration.

```bash
npm ci
npm run dev
```

Open the URL Vite prints, including `/Cpp/`. The `predev` hook prepares the pinned compiler artifacts on the first launch. Initial setup requires access to npm and the public `binji/wasm-clang` Git repository. Subsequent launches reuse the verified local files.

```bash
npm run check          # TypeScript, ESLint, Vitest/React Testing Library
npm run build          # Prepare/verify compiler assets, typecheck, production build
npm run preview        # Serve the production build
npm run test:runtime   # Real Clang: every solution and lesson example, plus failure cases
npm run format:check   # Formatting consistency
```

`npm run test` runs focused product tests without downloading or invoking a compiler. `npm run test:runtime` requires `npm run prepare:runtime` or a preceding build. The runtime suite runs compilers in disposable Node workers using exactly the same compiler binaries, WASI adapter, and execution core as the browser.

## What a learner can do

- Start at Welcome, resume from Home, and browse every chapter without artificial locks.
- Read short lessons with highlighted, compiling examples, objectives, takeaways, and previous/next navigation.
- Edit code, provide prepared standard input, run it, inspect stdout/stderr, and submit against sample and additional tests.
- Receive accepted, wrong-answer, compiler-error, runtime-error, timeout, cancelled, and unavailable states.
- Finish a lesson by passing its associated exercise. A successful Run alone never records completion.
- Build a calculator, guessing game, contact manager, and text statistics tool. Milestones are planning aids; passing the project's executable tests records completion.
- Reopen saved code and progress, adjust editor text size and wrapping, download a `.cpp` source file, or reset progress through a confirmation dialog.

## Architecture

| Area                        | Responsibility                                                                |
| --------------------------- | ----------------------------------------------------------------------------- |
| `src/app`                   | Application shell, hash routing, lazy route loading, navigation focus         |
| `src/pages`                 | Home, curriculum, lessons, practice list, projects, progress, settings        |
| `src/features/practice`     | CodeMirror editor, workspace lifecycle, execution feedback                    |
| `src/content`               | Typed curriculum, exercise tests, project briefs, stable IDs                  |
| `src/lib/progress-store.ts` | Versioned persistence, validation, progress transitions, cross-tab updates    |
| `src/services/execution.ts` | Replaceable `CodeExecutionService`, worker cancellation/deadlines, grading    |
| `public/runtime`            | Self-hosted WASI adapter, compiler loader, manifest, upstream license notices |
| `scripts`                   | Reproducible runtime preparation and real-compiler verification               |
| `validation/solutions.json` | Reference solutions used only for tests; excluded from the client bundle      |

The app uses `HashRouter`; internal URLs look like `/Cpp/#/lesson/variables`. Refreshing an internal route still requests the static `/Cpp/` entry point. Vite's production base is explicitly `/Cpp/`, including the compiler worker and assets.

## Real C++ execution

The compiler is the WebAssembly build of Clang/LLVM and LLD from [binji/wasm-clang](https://github.com/binji/wasm-clang), pinned to commit `648c4a89997a351eef75cdaec3ef5b89d4937dec`. It is an older Clang 8 toolchain, deliberately restricted to the tested C++17 curriculum. This is not a JavaScript C++ simulator and does not use a remote execution service.

`prepare-runtime.mjs` obtains the exact revision, verifies SHA-256 hashes for Clang, LLD, the memory filesystem, and the sysroot, and writes compressed files to the ignored `public/runtime/bin/` directory. Builds fail on missing or corrupt assets. The production output contains all required assets on the same origin; learners do not depend on GitHub raw downloads or a third-party CDN.

The compiler payload is approximately 19 MiB compressed (about 58 MiB uncompressed). It is loaded only after Run or Submit. The editor and syntax engine are route-loaded; the Welcome screen does not download a compiler. Cache Storage is optional: failure to cache does not prevent execution. SHA-256 is verified again in the browser, using WebCrypto where available and `@noble/hashes` on local HTTP origins. The loader supports hosts that deliver gzip bytes and hosts that already decode them via `Content-Encoding`.

Each request gets a disposable Web Worker. Source is compiled once and linked to Wasm. Every test runs a fresh program instance and a fresh in-memory filesystem. The program receives basic WASI calls and standard streams, with no DOM, network, host filesystem, or JavaScript execution capability.

Limits:

- Compiler loading: 90 seconds; compilation/linking: 30 seconds.
- Program execution: 3 seconds per test, enforced by terminating the worker.
- Program linear memory: 128 MiB; stack: 1 MiB; captured output: 64 KiB.
- Source: 30,000 characters; input: 20,000 characters per run.
- The compiler itself uses additional memory beyond the program's 128 MiB limit. Low-memory mobile devices may be unable to run it; the app reports failure and keeps the source saved.

Supported course examples include standard streams, strings, containers, algorithms, classes, virtual dispatch, references, pointers, smart pointers, moves, lambdas, templates, `constexpr`, and `std::optional`. Exceptions, threads, interactive stdin prompts, networking, OS integration, C++20/23/26 libraries, and external packages are not supported. Do not present this as a replacement for a current desktop C++ toolchain.

Submission compares normalized whitespace-delimited output. Additional expected outputs are hidden in the UI, but **a static client cannot keep tests secret from developer tools**. This is a self-study product, not a secure exam judge. Behavioral tests cannot prove that a learner used a particular construct or algorithm. Test success is recorded as observed behavior, not a formal proof of mastery. Invalid C++ memory access remains undefined behavior; Wasm isolation protects the host, not the correctness of the learner's program.

## Progress and privacy

Browser `localStorage`, key `learn-cpp.progress`, stores schema version 1. It holds completion timestamps, current/recent lessons, code drafts, project milestones, verified projects, and editor preferences. Module completion is derived from lesson completion rather than stored redundantly.

Reads validate IDs, dates, bounded draft sizes, and preferences. Malformed or unsupported versions fall back to a usable empty state with a visible warning. Unknown IDs are discarded. Storage failures keep the current session usable and display a warning instead of falsely claiming persistence. Future schema changes should add an explicit migration in `decodeProgress`; do not silently reinterpret a newer schema.

Progress is device/browser-local. There is no synchronization or recovery after clearing site data. No analytics, tracking, account UI, or code transmission is included. The reset dialog names the data it removes and preserves editor preferences.

## GitHub Pages

The release workflow is `.github/workflows/pages.yml`. Pull requests run all checks, build the production artifact, and execute all reference solutions and lesson examples with real Clang. Only `main` can deploy; pull-request workflows never publish unreviewed code.

Repository setup: in **Settings → Pages → Build and deployment**, choose **GitHub Actions**. Merge the reviewed PR into `main`, then the workflow validates, uploads `dist`, and deploys through the `github-pages` environment. The application is expected at:

`https://markofornoliak.github.io/Cpp/`

No custom domain, SPA 404 hack, secrets, or special cross-origin isolation headers are needed. The workflow can also be run manually from `main`. A build, static check, or real-runtime test failure prevents deployment. Publishing the first release requires merging the PR; this implementation does not merge it automatically.

## Accessibility and verification

Semantic navigation and forms, labelled controls, visible keyboard focus, a skip link, native dialog focus containment, reduced-motion support, and readable bounded content are built in. CodeMirror keeps Tab available for leaving the editor. The editor supports the usual undo, redo, selection, and editing shortcuts. Run feedback is announced through a live region.

See [QA.md](QA.md) for the verified checks, responsive review, simplification changes, and testing limits. Automated accessibility checks complement manual review and do not constitute WCAG certification. Cross-browser support should be smoke-tested on real Safari/Firefox devices before claiming those browsers have been certified.

## Extending the course

Add content to the dedicated JSON files and keep stable IDs. Link exercises and adjacent lessons, add a reference solution under `validation`, then run both test suites. New language/library features must be verified against the bundled compiler. Replace the implementation behind `CodeExecutionService` if a later release needs a newer compiler; the workspace and grading API do not need to change.

Upstream compiler and filesystem notices are retained in `public/runtime/LICENSE` and `LICENSE.llvm`. The memory filesystem adapter records its local modifications. The SHA-256 fallback's MIT license is copied beside its built modules. Do not remove these notices when distributing `dist`.
