# Release verification

Reviewed 9–10 September 2026. Tests use the production Vite build under `/Cpp/`, plus focused unit/component tests and the real bundled compiler. This report describes checks performed; it is not a claim of cross-browser certification.

## Automated gates

- Reproducible dependency installation: `npm ci`.
- TypeScript, ESLint, Vitest/React Testing Library: `npm run check` — 18 tests across four files.
- Production build: `npm run build` — all four runtime SHA-256 checks passed; hash routing and `/Cpp/` asset URLs verified in the browser.
- Real compiler: `npm run test:runtime` — 28 reference solutions, 98 input/output cases, all 24 lesson examples, compiler failure, nonzero exit, infinite-loop termination, output limit, and UTF-8/stdout/stderr handling.
- Runtime dependency audit: `npm audit --omit=dev --audit-level=high` — zero vulnerabilities reported at review time.
- Formatting and final diff checks are required before the release commit.

Unit coverage includes malformed/old persistence, storage failure, reset, progress transitions, milestones versus verified completion, content relationships, whitespace grading, cancellation, worker failures, and accepted/wrong-answer workspace flows. Component tests replace the worker only to exercise UI transitions; the separate runtime suite uses genuine Clang/LLD Wasm.

## Browser checks

Verified on the available Chrome browser with the built application:

- Welcome → Start Learning → Home → lesson → exercise.
- Real editor input, Run stdout, accepted submission, next-lesson navigation.
- Sum of Two Numbers accepted all four tests using the production worker and standard input.
- Wrong answer, readable compiler error, runtime exit error, three-second timeout, and cancellation.
- A reload retained completed state and the exact source draft.
- Reset dialog cancellation and confirmation, zeroed progress, and preserved editor preferences.
- Project briefs, planning milestones, project workspaces, and executable project validation.
- Primary navigation, progress, settings, unknown routes, and direct hash-route loading.

Compiler loading is lazy. The browser review caught and fixed static-host gzip decoding differences and verified the SHA-256 fallback on local HTTP. The runtime remains entirely same-origin: user source is not sent to an execution API.

## Responsive and accessibility review

Ten representative routes were checked at **320, 375, 768, 1024, and 1440 CSS pixels** using a same-origin iframe viewport fixture against the built application: Home, Learn, Lesson, Practice list, coding workspace, Projects, project brief, Progress, Settings, and Not found.

All **50 route/width combinations** passed page-overflow checks and axe-core WCAG A/AA checks (`wcag2a`, `wcag2aa`, `wcag21aa`) after fixes. Scrollable code content was excluded from page-overflow detection; its containing page and keyboard access were checked separately. Scrollbars reduce each viewport's content width where present.

Visual screenshots were reviewed at 375, 768, 1024, and 1440 pixels. The mobile shell uses bottom navigation; the tablet shell uses a compact rail; desktop reading remains bounded and the wide coding workspace separates the task from the editor. Code lines scroll within their own surface.

The accessibility pass found and fixed an unnamed compact Settings link, insufficient contrast in a syntax token, and keyboard access to horizontal editor scrolling. The visual pass also corrected the line-number gutter alignment. Native dialogs use focus containment; editor Tab exits to the next control; focus indicators and reduced-motion styles are included.

A further ten-route audit at 320 pixels with 200% root text enlargement passed without page overflow or axe violations. This pass fixed long-word wrapping, constrained the continuation surface and buttons, and allowed mobile navigation labels to wrap.

The temporary QA fixture and axe browser script are not production assets and are removed by the final build.

## Simplification pass

After the first complete implementation, a separate pass removed repeated introductory labels, redundant curriculum metadata, decorative welcome labels, duplicate chapter decoration, and filler copy on Home. The homepage keeps one progress summary and one dominant continuation action. Secondary navigation is presented as simple rows. The revised screens were inspected again, and small metadata text and crowded letter spacing were adjusted for readability.

## Release boundaries

- GitHub Pages deployment is configured through Actions. The PR does not deploy or merge itself. First publication requires Pages source set to GitHub Actions and the reviewed PR merged into `main`.
- The toolchain is real Clang 8 with tested C++17 support, not a current desktop compiler. Exceptions, threads, OS features, interactive input, and C++20+ are outside this release.
- First compiler use downloads approximately 19 MiB compressed. Low-memory devices may be unable to run the compiler even though the reading application works.
- Tests are hidden in the UI, not cryptographically secret. This is a self-study application, not an exam judge.
- Progress is local to one browser/device. Clearing browser storage removes it; no account synchronization is promised.
- Automated accessibility testing does not replace assistive-technology evaluation. Safari, Firefox, actual low-memory phones, and screen-reader combinations have not been manually certified in this environment.
