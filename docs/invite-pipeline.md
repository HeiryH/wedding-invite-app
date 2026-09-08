# E-Invite Template Authoring Pipeline (Hermes kanban)

Autonomous, human-gated pipeline that authors new invite templates for this app end to
end — from a reference photo to a merged React component — using a Hermes kanban board
(`invite-pipeline`, in `~/.hermes/kanban.db`) to orchestrate a chain of AI worker tasks
across several specialized profiles. As of this writing it has produced one template in
progress: **Template10, "Twilight Banquet"** (slug `twilight-banquet`, PRO tier, WEDDING).

This file documents how the pipeline actually works today. It is a living reference — the
authoritative, always-current source for each stage's exact instructions is
`~/.hermes/scripts/kanban-task-templates/*.md`; this doc explains how those pieces fit
together, plus a running list of known issues.

## Timeline

- **2026-08-27** — Pipeline first wired up. 4 profiles (`manager`/`coder`/`reviewer`/
  `image-gen`), serial chain `spec → assets → code → review`, generation via Recraft.
- **2026-08-28** — Oversight addendum drafted (`~/Desktop/invite-pipeline-oversight-addendum.md`):
  add a `project-audit` final human gate comparing the finished result against the
  *original* approved brief (not just the immediately-prior stage), plus per-branch review
  gates. Later fully implemented (see below) — the addendum's design is now essentially
  what's running, though the "parallelize assets/code" half of it was not adopted; the
  pipeline is fully serial end to end instead.
- **2026-08-31** — Full 12-stage gated pipeline live (see **Stages** below), still on
  Recraft. First real run against the Twilight Banquet brief reached Gate 2 (`sheets`)
  before stalling.
- **2026-09-01/02** — Recraft replaced with OpenRouter's dedicated Images API (a new
  custom MCP server, `openrouter-images`), after benchmarking alternatives, because
  Recraft's custom-style Pro/Pro-Vector pricing tier ($0.10–0.12/image) — which this
  pipeline's per-template style-binding step requires — was the actual driver of "high
  credit usage." Re-ran style-bind and sheets on the new backend; caught and fixed a
  worktree-inheritance bug in the `advance` task template; ran the Twilight Banquet template
  all the way to Gate 4 (`visual-qa`), where green chroma contamination was discovered
  shipping in the committed assets, plus several pipeline-design gaps (see Known issues).
  Gate 4 stalled unresolved (`t_0e30af96`).
- **2026-09-03** — Style-lock redesign plus a fix pass. Root-caused the green chroma
  (painted into the artwork by the model, not a keying failure) and replaced the whole
  approach: a new `style-extract` stage writes a committed `spec/style.json` from the
  human's original reference; `generate_image` gained a `style_spec_path` parameter so the
  server, not the worker, composes every prompt's style block deterministically; the
  isolation plate switched from chroma-green to paper-white; cutout switched from an
  ImageMagick chroma floodfill to `rembg` alpha matting; a defect scorer now runs before
  crops are committed. Validated with a live probe render (0.000% chroma-green, clean cut).
  Also: removed the `blueprints` gate (it was approving pictures `assemble` couldn't build),
  added a second "unpredicted defects" pass to `visual-qa`, fixed the QA harness's itinerary
  payload (wrong field names, not a real product bug), patched Hermes itself so a
  completion claiming files that don't exist is rejected, fixed `template-intake.sh`'s
  hardcoded shared worktree and missing `style-extract` step, wrote a Design Brief to disk,
  committed `visual-qa.mjs`, registered a `kanban-watchdog` cron so a stalled card is no
  longer silent, and disabled the unreachable `recraft` MCP server. Full detail in Known
  issues below — most bullets there are now tagged **Fixed**/**Partly fixed** with what
  changed and what didn't. Later the same evening, the first real Sunny Safari run exposed
  the next layer of bugs (see 2026-09-04) — this date's fix pass was necessary but not
  sufficient.
- **2026-09-04** — **The scene contract**: backgrounds and props stopped being two lists
  that never touched. Root-caused two live-run defects on Sunny Safari (PARTY/safari
  reference): `welcome-bg.png` shipped as a redraw of the reference photo's own characters
  (a full-frame reference call was getting read by qwen-image-3 as "edit this image", not
  "match this style"), and 5 confirmed props on `itinerary` segmented into 17 crops
  (collective-noun prop names + a no-outline style lock fragmenting a sun into a disc plus
  loose ray dashes). Rebuilt around a written physical contract, `spec/scene.json` (bands,
  scale anchor, reserved `empty_band_pct`) that backgrounds and props both read without
  seeing each other's images. Concretely: `asset-research`/`asset-manifest` renamed
  `scene-research`/`scene-manifest` and now also propose/write this geometry;
  `blueprints` renamed `backgrounds`, section mockups deleted outright (never matched
  their own background, and can't be decomposed anyway), and `index.mjs` now **hard-refuses**
  a reference image on any full-frame scene call — structural, not a task-body instruction;
  `sheets` renamed `assets` and switched from one multi-object sheet per section to one
  generated image per confirmed prop (canvas-sized via the anchor formula), which also
  refunded its own gate — nothing left to pick from a contact sheet, so **the gate count
  dropped from 5 to 4**; `sheets-finalize` renamed `matte`; `assemble` computes prop scale
  from the anchor formula instead of eyeballing a (now-deleted) mockup image. Isolation
  plate switched again, from paper-white to a **per-theme computed key**
  (`derive-key.mjs`, `style.json` spec_version 2's `fill`/`background.mode:"computed-key"`)
  — measured on the live palette, white was only min ΔE 23.8 from the palette's own sky
  blue (the actual cause of fine linework failing to segment cleanly), a computed key
  reaches ΔE 134+. Two probes run live before building: dropping the reference on a scene
  call held the style with zero characters (justifying the hard refusal above); the model
  complied with the computed key and didn't contaminate the art (0.35%, edge-antialiasing
  noise). Resumed Sunny Safari from the approved `style-bind`; it ran the new chain for
  real through `scene-research → scene-manifest → section-spec → backgrounds → assets →
  matte → assemble → visual-qa`, and **that live run surfaced a second layer of new bugs
  this fix pass did not anticipate** — see Known issues: `matte`'s replacement keyer
  (`tools-matte/key-cut.py`, written by the worker mid-run after `rembg` failed outright on
  thin-dash props) leaves a measurable plate-tinted fringe on ~19 of 22 committed assets;
  `score-crops.py`'s contamination check has a blind spot that let it through (it only
  samples fully-opaque pixels, by design, to avoid false-flagging normal antialiasing —
  which means a *tinted* semi-transparent band is invisible to it); two style-lock
  violations (a glossy-3D sun highlight, an ink-outlined+airbrushed snake) reached
  `visual-qa` from `assets`' own generation despite that stage's per-image visual check;
  `assemble` dropped one of two confirmed leaf props; and one prop's desktop placement
  overlaps the itinerary list. Full detail below — this run stopped at the `visual-qa`
  gate, deliberately not auto-approved, for a human to decide the fix plan.

- **2026-09-06** — **Compose-then-decompose**: draw the props *into* the background instead
  of pasting them on. Root cause of the "stickers on a page" look the 2026-09-04 run
  shipped: a prop generated alone on an isolation plate has no information about what is
  beneath it, so it can have no contact with the ground, no occlusion, no shared light —
  by construction, not by bad prompting. The 2026-09-04 scene contract fixed *geometry*
  (sizes agree, nothing doubles); it never touched *integration*, which is a different axis.
  New `compose` stage (gated) renders the confirmed props into the approved plate in one
  call; new `decompose` stage (replaces `matte`) cuts them back out. `index.mjs` gained
  `compose_onto_scene` — the 2026-09-03 hard refusal stays in force and now requires an
  explicit declaration to pass, verified live over the MCP protocol in both directions
  (refused without the flag, through with it). **Gate count unchanged at 4, but the gates
  move**: the human approves a real composed picture, not a prop list and a text spec.
  - **Compose works — proven, $0.033.** One welcome call produced monkeys standing in the
    grass with a bush across one leg, a snake behind foliage, no text, no cast shadows.
    Artifacts + scripts in `docs/sunny-safari-probe-0c/`.
  - **The cheap extraction shortcut does not.** The plan was to diff the composed image
    against the plate — whatever changed is a prop. Measured: background drift is genuinely
    low where the model left things alone (mean ΔE 6.35, against a ΔE 8.6 tolerance
    established by a synthetic sweep), but **the model relocates scenery** — the sun moved
    to a new height and every bush was redistributed. Those changes are indistinguishable
    from props in a pixel diff, so the whole lower half merges into one region. A prose
    instruction not to move the sun was ignored, consistent with the standing finding that
    prose loses to the reference.
  - **A hand-run extraction attempt got 2 of 8 props out cleanly** and is written up in
    `decompose-task-body.md` as explicit do-not-repeat guidance: no single segmentation
    model covers both characters and objects (`isnet-anime` 75–93% on monkeys and 0.0–0.2%
    on drum/sun; `birefnet-general-lite` the reverse); culling mask pixels by background
    colour deletes any prop sharing the scenery's palette (it erased the red snake's
    yellow-ochre body on yellow grass, leaving floating diamonds); keeping only the largest
    connected component dismembers elongated props; biharmonic inpainting at reduced
    resolution yields mush. **The fill is hidden at rest** — every prop returns to the box
    it was cut from and covers its own hole — so fill quality only matters for Adjust-panel
    nudges, which is why `decompose` is told not to spend a generation call on it.
  - Open: whether a `designer` worker, checking each cut visually as it goes, succeeds where
    the blind hand-run loop failed. First live test is on the board as `compose: Sunny
    Safari (welcome only)` (`t_413e6c0e`), scoped to one section.

- **2026-09-06 (later) — the pipeline stopped generating images.** Recraft was re-adopted,
  outside the pipeline: the human pastes the approved `section-spec` into Recraft and its
  **custom-style binding holds one style across separate renders** — the exact capability
  the OpenRouter path never had, and the thing that every generation stage was built to work
  around. Recraft returns, per section, three mutually consistent images: the full design,
  the same scene with props removed, and a transparent sheet of the props.

  **Retired** (moved to `~/.hermes/scripts/kanban-task-templates/retired/`):
  `style-extract`, `style-bind`, `backgrounds`, `assets`, `matte`, and the same-day
  `compose`/`decompose` experiment. **Stage count 16 → 12, gates 4 → 3.** New `ingest` stage
  converts an art drop into placement data; `assemble` now reads position and scale from
  `ingest`'s `manifest.json` instead of computing them from `scene.json`'s anchor formula.

  **The locator that made this work**: `~/.hermes/scripts/crop-tools/ingest-art.py` differences
  `design.png` against `background.png` — the difference between them *is* the props.
  Measured on a ground-truth drop: **6/6 props located, four at IoU 0.96–1.00.** The same
  diff against OpenRouter output failed badly (a second render there moved the sun and
  reshuffled every bush, so scenery changes read as props); it works here only because
  Recraft holds the scene fixed. Scaled template matching survives as a fallback and managed
  only 3/6 on its own — worth knowing before anyone proposes it as the primary method.
  Sheet splitting groups nearby islands before cutting, because a prop is not always one
  blob: three dancing monkeys and a sun-plus-clouds over-segmented 6 props into 8 islands.

  **Board cleared** the same day: `t_413e6c0e` (compose) and `t_77fcb4c1` (the 2026-09-02
  visual-qa) were archived along with their advance tasks. The compose run reached a
  composed image the worker itself corrected once — it caught and fixed a prop floating in
  mid-air — but crashed three times on transient OpenRouter connectivity before it could
  gate, and the output did not pass human inspection. Its artifacts are kept in
  `docs/sunny-safari-probe-0c/`.

  **Still worth fixing, unrelated to this change**: three separate workers have now died
  mid-run on `APIConnectionError` to OpenRouter (2026-09-02 `assemble`, twice on 2026-09-06
  `compose`). Retries are 3 attempts inside ~80s with no meaningful backoff, and a crash-block
  notifies nobody except via the `kanban-watchdog` cron.

## How the kanban mechanics actually work

- **Board**: `invite-pipeline` (`hermes kanban --board invite-pipeline <cmd>`, or set it
  current with `hermes kanban boards switch invite-pipeline`).
- **Dispatcher**: the Hermes gateway (`hermes gateway run`, always-on background process)
  ticks every ~60s and does three things: reclaims stale worker locks, **promotes `todo`
  tasks to `ready` once all their parents are `done`**, and spawns a worker for every
  `ready` task.
- **The chain is NOT automatic on its own** — this is the single most important mechanic
  to understand operationally. Nothing fires when a task completes. The *only* thing that
  creates new tasks is the `advance` task type (`advance-task-body.md`), and the dispatcher
  only auto-promotes a task that **already exists** in `todo`. So the self-sustaining
  pattern requires an `advance` task for stage N+1 to be created **at the same time** as
  stage N (parented on it, sitting in `todo`) — not after N finishes. If a human/operator
  creates a gated stage task alone, without also creating its advance task in the same
  breath, the chain silently stalls the moment that gate is approved, and nobody notices
  until someone checks the board. This happened once during the 2026-09-01/02 backend
  switch (see **Known issues** below) and cost a manual recovery step.
- **Human gates**: a gated stage calls `hermes kanban block --kind needs_input` (state
  only — this does **not** reliably reach Telegram: 160-char truncation, and only fires if
  a subscription predates the event) followed by a separate `hermes -p default send --to
  telegram:204215691 "..."` call for the actual content (images via `"MEDIA:<path>"`,
  question text separately). The human's reply must be the literal slash command
  `/kanban complete <task-id> --result "..."` — free-text chat is not captured as a result.
  The `advance` task for that stage then reads the `result` field verbatim to decide
  approve vs. redo.
- **Worktree sharing**: every stage of one pipeline *run* must share one git worktree, so
  later stages can see earlier stages' uncommitted output (e.g. `code` needs `sheets`'s
  generated asset files). The in-progress Twilight Banquet run is currently
  `/Users/helmyheiry/wedding-invite-app/.worktrees/t_396364bc` on branch `wt/t_396364bc`
  (previously `.worktrees/rg-pilot`/`wt/rg-pilot` — see **Known issues**), both branched
  from `ae-unified` at `8c43862`. **As of 2026-09-03**, `template-intake.sh` creates a
  fresh worktree per run automatically (`.worktrees/<slug>-<date>` on `wt/<slug>-<date>`,
  off `ae-unified`) instead of the human needing to set one up — see the Known issues entry
  on the old hardcoded `rg-pilot` worktree for why this changed.

## Profiles (`~/.hermes/profiles/<name>/`)

Each profile has its own model, own MCP servers, own persistent memory — **profiles do
not inherit the root `~/.hermes/.env` or root MCP config**; each is configured
independently. Current models (openrouter provider throughout):

| Profile | Model | Used for | MCP servers |
|---|---|---|---|
| `researcher` | `z-ai/glm-5.3-flash` | **Template intake** (not templated — created ad hoc per new template, asks the human 4 questions: reference image, implementation family A/B, event type, tier; describes palette in words from the reference; writes the Design Brief, now to a real file as well as a comment); `scene-research`, `scene-manifest` (renamed from `asset-research`/`asset-manifest` 2026-09-04 — same job, now also proposes/writes `spec/scene.json`'s physical geometry) | none |
| `designer` | `z-ai/glm-5.3-flash` | `style-extract`, `style-bind`, `section-spec`, `backgrounds`, `assets`, `matte`, `assemble` — every generation and asset-handling stage (renamed 2026-09-04: `blueprints`→`backgrounds`, `sheets`→`assets`, `sheets-finalize`→`matte`) | `openrouter-images` (current), `recraft` (disabled 2026-09-03 — unreachable every recent session, nothing calls it) |
| `manager` | `minimax/minimax-m3` | `advance` (the orchestrator — see above), `code-review`, `audit` (the final human gate, now also totals spend) | none |
| `coder` | `deepseek/deepseek-v4-flash` | `code`, `migration`, `preview` | none |
| `image-reviewer` | `minimax/minimax-m3` | `visual-qa` (**Gate 4** as of 2026-09-04 — was Gate 3 briefly, Gate 5 in between; the gate count actually dropped 5→4 on 2026-09-04 when `assets` (formerly `sheets`) lost its own gate — screenshots the assembled template; two passes, expected-content and unpredicted-defects) | none |
| `reviewer` | `qwen/qwen3.7-flash` | **unused** — no current template assigns this profile; leftover from the original 4-profile setup | none |
| `image-gen` | `minimax/minimax-m3` | **unused** — ditto, superseded by `designer` calling `openrouter-images` directly | `recraft` (disabled 2026-09-03) |

## Stages (in order)

Each stage's exact instructions live in `~/.hermes/scripts/kanban-task-templates/<slug>-task-body.md`.
Gate = blocks for a human Telegram reply before continuing.

**Revised 2026-09-04** — see the Timeline entry for that date for the full "why". Renamed:
`asset-research`→`scene-research`, `asset-manifest`→`scene-manifest`, `blueprints`→
`backgrounds` (section mockups deleted), `sheets`→`assets` (per-prop generation, **lost its
own gate**), `sheets-finalize`→`matte`. **Gate count is now 4, not 5** — `visual-qa` is
**Gate 4**. Trust this table and each stage's own `## NEXT STAGE` section over any older
Telegram thread or cached number.

| # | Stage slug | Assignee | Gate? | What it does |
|---|---|---|---|---|
| 1 | `intake` (ad hoc, no template file) | `researcher` | yes (implicit) | Sources a reference image, describes the palette in words, writes the Design Brief to `docs/<slug>-design-brief.md` |
| 2 | `scene-research` — **Gate 1** | `researcher` | yes | Proposes, per section, candidate props and background scenes plus the physical geometry (`band`, `size_in_anchor_units`, `horizon_pct`, `empty_band_pct`). Human picks. No generation. |
| 3 | `scene-manifest` | `researcher` | no | Writes the picks to `spec/assets.json` (content) and `spec/scene.json` (geometry) |
| 4 | `section-spec` — **Gate 2** | `designer` | yes | Writes one full render specification per section (`spec/sections/<NN>-<section>.md`). **This document is the Recraft prompt** — it is written to be rendered, not merely read. Human confirms as text. |
| — | *human step* | — | — | Paste the approved spec into Recraft; render three consistent images per section (full design, background with props removed, transparent prop sheet); drop them in `docs/<slug>-art/<section>/` |
| 5 | `ingest` | `designer` | no | Splits the prop sheet, locates each prop by differencing design against background, writes `manifest.json` with each prop's measured box. Worker verifies every cutout visually before committing. |
| 6 | `assemble` | `designer` | no | Writes `data/stages.ts`/`data/assetSizes.ts`, registers the template. **Placement is read from `manifest.json`, not computed.** |
| 7 | `visual-qa` — **Gate 3** | `image-reviewer` | yes | Screenshots every section at both breakpoints and compares against `design.png` — a real target now, rather than against text |
| 8 | `code` | `coder` | no | Fills component gaps, registers the public render path (`/[eventType]/[slug]/page.tsx`) |
| 9 | `code-review` | `manager` | no | Reviews the diff; flags but does not block |
| 10 | `migration` | `coder` | no | Scaffolds (never applies) an EF migration inserting the `Templates` row |
| 11 | `preview` | `coder` | no | One line into `generate-template-previews.mjs`'s `CODES` array |
| 12 | `audit` — **final gate** | `manager` | yes | Compares the complete result against the *original* approved brief |

**Revised 2026-09-06.** The pipeline generates no images. `style-extract`, `style-bind`,
`backgrounds`, `assets`, `matte` and the same-day `compose`/`decompose` experiment are all
retired — see the Timeline entry for why. Trust this table and each stage's own
`## NEXT STAGE` section over any older Telegram thread, note, or profile memory.

## Image generation backend

### Why it changed

The pipeline originally called Recraft directly (`mcp__recraft__create_style` +
`generate_image`, a bound reusable `style_id`). Every new template needs a **custom
style** bound from its reference photo, which on Recraft's OpenRouter-resold pricing
lands in the **Pro/Pro Vector tier ($0.10–0.12/image)**, not the $0.035 base tier — that
gap was the actual source of "high credit usage," not per-image cost overall.

### What replaced it

A hand-written local MCP server, `~/.hermes/scripts/openrouter-images-mcp/` (Node,
`@modelcontextprotocol/sdk`), exposing one tool — `generate_image` — that calls
OpenRouter's **dedicated** Images API (`POST https://openrouter.ai/api/v1/images`; this is
a *different* protocol from the chat-completions "modalities" image path that Hermes's
built-in `image_gen/openrouter` plugin already speaks for models like `gpt-5.4-image-2` /
`gemini-3-pro-image` — those aren't on this endpoint at all). Registered on the root
Hermes profile and on `designer` via `hermes mcp add ... --env OPENROUTER_API_KEY=...`.

Benchmarked against the brief's actual reference photo before picking a model:

| Model | $/image | Verdict |
|---|---|---|
| Recraft V4 Styles (Pro tier, via OpenRouter) | $0.10–0.12 | what we moved off of |
| Seedream 4.5 | $0.04 | clean-outlined, flat fills — reads as vector/clip-art, not the brief's "broken, searching pen strokes" medium; also ignored a "no background" instruction outright once |
| Meta Muse Image | $0.01 | cheapest, but 6 days old at eval time — no track record, not tried on this brief |
| **qwen-image-3** | **$0.03** | **picked** — clearly closest to the reference's actual hand: sketchy incomplete linework, granular wash bleed, visible paper grain |

**qwen-image-3 accepts at most 3 reference images per call.** Verified the hard way on
2026-09-02 — a run passing 4–5 refs got HTTP 400: `Model 'qwen-image-3.0' supports 0~3
image content items. Got 4 image items.` (a second provider route reported
`input_references: must have between 0 and 4 items`, but 3 is what actually passes). This
was written up as a constraint on the old `blueprints` stage specifically (which composited
picked crops into a layout using at most 2 of them). **That stage is gone as of
2026-09-04** — `backgrounds` never attaches a reference at all (see below), and `assets`
generates one prop per call, so the 3-reference cap is currently slack, not binding,
anywhere in the live pipeline. Still worth knowing if a future stage composites multiple
references again.

**A full-frame reference call gets read as "edit this image," not "match this style" — now
enforced structurally.** Found 2026-09-03/04: `blueprints`' background-plate prompt said
"no foreground props, no characters" and the model ignored it, redrawing the reference
photo's own monkeys/drum/snakes into `welcome-bg.png` because a reference was attached to a
full-frame composition request. Probed 2026-09-04 with the reference dropped entirely on
an otherwise-identical call: the style spec alone reproduced the medium/hand/palette with
zero characters and zero bleed-through. `index.mjs`'s `generate_image` now **hard-refuses**
`style_background:"scene"` combined with a non-empty `reference_image_paths_or_urls` —
verified live over the real MCP protocol (the exact combination that produced
`welcome-bg.png` errors out before any API call; `style_background:"isolate"` with a
reference, the `assets` stage's normal case, is unaffected). This is a server-level
guarantee, not a task-body instruction a worker could paraphrase around.

**The isolation plate is a per-theme computed key as of 2026-09-04, not a fixed colour.**
White (the 2026-09-03 fix for green contamination) has its own failure mode: measured on
the live Sunny Safari palette, white's nearest palette neighbour (`#a7dee9`, powder sky
blue) was only min ΔE76 23.8 away — nearly indistinguishable, which is the actual cause of
fine linework (cloud rims, thin snake outlines) failing to segment cleanly in
`sheet-segment.sh`. `~/.hermes/scripts/openrouter-images-mcp/derive-key.mjs` grid-searches
sRGB space for the colour whose distance to its *nearest* palette entry (plus permanent
white/black guards) is maximized, and refuses to emit one below a ΔE 60 floor (that
palette is "too broad to key"; split it rather than force a value through). On Sunny
Safari's 8-colour palette this reaches `#0000ff` at ΔE 137.2. `stylelock.mjs` re-derives
this from `palette` on every validation and fails if the committed
`background.asset_background_hex` disagrees — same "models emit values, code emits text"
discipline `sample-palette.py` already followed for the palette itself. `sheet-segment.sh`
gained a `PLATE=key KEY_HEX=#rrggbb` mode (global `-transparent` keying, safe here in a way
it wasn't for white, precisely because the key is chosen to be far from every art colour by
construction) for the `grain_parity: false` sheet-fallback path.

**No persistent style object exists on this backend, in the Recraft sense.** Recraft's
`create_style` → reusable `style_id` has no direct equivalent — every single
`generate_image` call across the whole template (sheets, blueprints, backgrounds) must
re-attach the same `reference_image_paths_or_urls` list. **What changed 2026-09-03**: a
different kind of persistent style object now exists, just not one OpenRouter hosts. A
committed text file, `spec/style.json`, is written once by the new `style-extract` stage
(reading the human's original reference — never a generated image, which would chain style
drift one generation deep and, on a chroma-plate render, would sample the plate's own
colour into the palette) and passed via a new `style_spec_path` parameter on `generate_image`
itself (`~/.hermes/scripts/openrouter-images-mcp/stylelock.mjs`). The **server**, not the
worker, appends the locked style block (medium, line, wash, texture, palette, background
isolation clause, forbidden traits, no-text rule) to every prompt — deterministically:
shuffling the spec's palette array and re-casing every hex value produces a byte-identical
rendered block. A worker's `prompt` is now just the subject description; it can no longer
drift the style wording by paraphrasing it, because it never holds that wording at all. The
tool also returns `style_block_sha256` on every call so a run can prove every stage used the
same spec. Reference images are still required on every call as before — the spec makes the
*wording* deterministic, it doesn't replace anchoring to the approved photos.

**No real alpha/transparent cutout exists either — but this doesn't need it any more.**
OpenRouter documents a `background: transparent` request param at the general Images-API
level, but it's silently a no-op on both qwen-image-3 and Seedream — tested directly,
confirmed opaque output either way. Isolation used to go through solid-color chroma-key +
`sheet-segment.sh`; **superseded twice since**: 2026-09-03 moved the plate from green to
paper-white with `rembg` alpha matting (`~/.hermes/scripts/crop-tools/cutout.py`);
**2026-09-04 moved it again, from paper-white to a per-theme computed key** — see the
computed-key paragraph above for why (white measured too close to this palette's own sky
blue). `sheet-segment.sh` now takes `PLATE=white|green|key` (`white`/`key` flood/key
without punching holes through legitimate in-palette pixels *inside* the art — see the
computed-key paragraph for why `key` mode can key globally where `white` can't); it exists
only to *locate* objects for the `grain_parity: false` sheet-fallback path — the primary
`grain_parity: true` path (per-prop generation, 2026-09-04) doesn't sheet/segment at all.
**As of 2026-09-04, `rembg` (`cutout.py`) itself is a known weak point**, not the settled
answer this paragraph originally described — see Known issues: it fails outright on
sparse/thin-dash subjects and enclosed gaps, which a worker discovered and patched around
mid-run with a purpose-built keyer that has its own unresolved fringing defect.

**Green-screen phrasing was load-bearing on qwen-image-3 — retired along with the green
plate, and paper-white was retired in turn.** A short instruction ("isolated on solid
#00FF00 background") only produced a green *border* around a paper-colored card — did not
chroma-key cleanly. The verbose clause that fixed it is preserved in `stylelock.mjs`'s
`BACKGROUND_CLAUSE` map (`paper-white`/`chroma-green`/**`computed-key`** variants all exist
there — the first two only for a theme whose palette can't clear the ΔE-60 floor, or a
deliberate comparison run; `computed-key` is the 2026-09-04 default). A live probe
(2026-09-03) confirmed the verbose-wording discipline carries over cleanly to white: 100%
pure white across 1,172 border samples, 0.000% chroma-green, no cast shadow. A second live
probe (2026-09-04) confirmed it carries over to a computed key too: the model filled the
plate flat and edge-to-edge, and — measured directly, not eyeballed — 0.35% of sampled
pixels registered as contaminated, which is edge-antialiasing noise, not bleed-through.

**Output format is not reliable.** Both models have been observed picking their own file
extension (`.jpg`, `.png`) regardless of the requested `output_format` — every template
now reads the actual saved path back from the tool's response instead of assuming one.

### The `generate_image` tool, concretely

- `prompt` — as of 2026-09-03, the subject only when `style_spec_path` is set (see below);
  the server appends the locked style block.
- `style_spec_path` **(new 2026-09-03)** — absolute path to the run's `spec/style.json`.
  When set, validates the spec and appends its rendered style block to `prompt`. Returns
  `style_block_sha256` in the response so every call in a template can be proven consistent.
- `model` (defaults to `qwen/qwen-image-3`), `n`, `resolution` (`512`/`1K`/`2K`/`4K`
  — some models reject tiers below ~3.7MP, `2K` is the safe default), `aspect_ratio`,
  `output_format`, `background` (documented but not honored), `seed`.
- `reference_image_paths_or_urls`: absolute local paths or http(s) URLs. Local files are
  read and base64-inlined by the tool itself — no upload step.
- `save_dir` / `save_basename`: the tool writes the decoded image straight to disk and
  returns only the path + cost, never dumps base64 into a worker's context.
- **`save_dir` and every reference path must be absolute.** The MCP server is a separate
  long-running process from the calling worker's shell — a relative path resolves against
  wherever *it* started, not the caller's cwd (which also resets to `$HOME` between
  commands anyway on these workers). The tool validates this explicitly now and errors
  loudly rather than silently writing to the wrong place.

## Known issues / needs follow-up

### 2026-09-04 status at a glance

The scene-contract redesign (see Timeline) closed the reference-hijack and prop-fragment
bugs structurally — both verified fixed on a real Sunny Safari re-run, not just in
isolated probes. But that same live run surfaced a new layer of bugs underneath, all
**open, none fixed yet** — this run stopped at `visual-qa` deliberately rather than
auto-approving through them.

**Fixed today (verified live, not just probed):**
- Reference-image hijack on background plates (`welcome-bg.png` redrawing the reference
  photo's own characters) — `index.mjs` hard-refuses the combination now; the resumed run's
  `backgrounds` stage shipped 5 plates with zero references and zero characters.
- Prop-count fragmentation (5 confirmed `itinerary` props → 17 segmented crops) — per-prop
  generation means one image per confirmed prop, nothing left to segment.
- White-plate near-miss on this palette (min ΔE 23.8 from the palette's own sky blue) —
  computed key reaches ΔE 134+, verified via a live asset render with 0.35% measured
  contamination (antialiasing noise, not bleed-through).

**Open, found on today's live run, need a decision before the next `visual-qa` attempt:**
- **Chromakey fringing on ~19 of 22 committed props** — `matte`'s worker-written
  replacement keyer (`tools-matte/key-cut.py`, needed because `rembg` failed outright on
  two props — see below) leaves a measurable plate-tinted fringe. Root cause: the alpha
  ramp's unpremultiply divides by `t` (alpha fraction), which is numerically unstable right
  at the low-alpha edge of the ramp, so exactly the pixels that most need clean colour
  recovery get the least reliable one. Confirmed by direct pixel measurement, not just the
  reviewer's screenshot read: `welcome-01.webp` (dancing monkeys) is 4.26% soft-edge, of
  which 45.8% reads blue-tinted; `welcome-05.webp` (clouds+sun) is 2.44% soft-edge, of
  which 62.8% reads blue-tinted. **`score-crops.py` did not catch this** — see next bullet.
- **`score-crops.py`'s contamination check has a blind spot for tinted semi-transparent
  pixels.** It deliberately samples only fully-opaque pixels (`a >= 250`) so normal
  antialiasing halo at an object's edge doesn't false-flag — but that same exclusion means
  a *tinted* semi-transparent ramp (the fringing bug above) is invisible to it by
  construction. `matte` reported 24/24 pass, 0.0% contamination, on assets independently
  confirmed to have visible fringe on ~19/22. The soft-edge band check made this actively
  misleading in one case: `welcome-05`'s 2.44% undershoots the "healthy 3-5%" floor, so the
  scorer's own diagnostic said "edge too tight, may be clipping" — the opposite of the real
  problem. Needs a new check: whether a semi-transparent pixel's *unpremultiplied* colour,
  not just its alpha, still reads plate-tinted.
- **`rembg` (`cutout.py`) fails outright on sparse/thin-dash props and enclosed gaps.**
  Discovered mid-`matte` on `itinerary/footprint-trail` (0% opaque after rembg — the dash
  marks weren't recognized as a subject at all) and `rsvp/dash-dot-path` (1.2% opaque), plus
  rembg keeping small enclosed regions (the snake's coil gap, the space between the three
  monkeys) wrongly opaque on other props. The worker's own fix, `tools-matte/key-cut.py`
  (a direct ΔE-distance keyer against the sampled plate colour, safe here specifically
  because the computed key sits ΔE 137+ from every palette colour), is the right shape of
  solution — its ramp math is what introduced the fringing bug above. Worth promoting to
  the default cutter for `computed-key` specs once the ramp is fixed, rather than something
  a worker has to rediscover per run.
- **Style-lock violations reached `visual-qa` from `assets`' own generation**, despite that
  stage's per-image visual check (which did catch and regenerate 12/26 other defects this
  same run — environment fusion, a full-scene hijack, contamination — so it's working, just
  not exhaustively): the background sun has a glossy 3D inner highlight (forbidden trait,
  on the `backgrounds` plate, not caught by `empty-band-check.py` since that only measures
  busyness, not style compliance) and sits centred behind text instead of low in the sky;
  the rsvp question-mark snake has an ink contour outline and an airbrushed body (both
  forbidden traits) plus its own cyan halo.
- **`assemble` dropped one of two confirmed leaf props on `photobooth`** — only the
  upper-right leaf registered in the assembled template. Not yet root-caused (placement
  logic vs. a missing asset file vs. a slot-mapping miss).
- **Desktop: `footprint-trail` overlaps the itinerary schedule list.** Likely the prop's
  post-keying bbox behaving unexpectedly (footprint-trail is one of the two props that
  needed the custom keyer's narrowed ramp override), but not yet confirmed against the
  actual committed asset's dimensions.

None of the five open items above trace back to the scene-contract design itself — they're
all in the generation/cutting/placement mechanics one layer below it. The scene contract
(props+backgrounds agreeing on geometry via `spec/scene.json`) held throughout this run:
`visual-qa` reported no doubled props and no scale mismatches, which was the specific
failure mode the contract was built to prevent.

### 2026-09-03 status at a glance

A style-lock redesign plus a fix pass landed today, closing most of what's below. Each
bullet is now tagged inline (**Fixed**/**Partly fixed**/still open); this box is just the
scan-quickly version.

**Fixed today:**
- Green chroma contamination — root-caused (it was painted *into* the art, not a keying
  edge) and replaced: `spec/style.json` + paper-white plate + rembg alpha matting. Proven
  with a live probe: 0.000% chroma green, 100% flat white border, real soft alpha.
- Style prose retyped per call, and drifting — now server-composed from a committed spec
  (`style-extract` stage, `stylelock.mjs`).
- QA reviewer only checked "is what I expect present?" — added a second pass hunting
  defects nobody predicted.
- Blueprints Gate 3 approved a picture `assemble` couldn't build — gate removed, sketches
  demoted to mood reference.
- The empty-itinerary "product bug" — turned out to be the QA harness's synthetic payload
  using the wrong field names, not a real data-path bug. See the corrected entry below.
- Design Brief never written to disk — `template-intake.sh` now writes it before creating
  any stage task.
- `visual-qa.mjs` uncommitted — committed to `ae-unified` directly.
- A crashed/parked card notifying nobody — `kanban-watchdog` cron registered and verified
  against a real stalled card (it found the genuinely-stranded Gate 4, `t_0e30af96`).
- A completion could claim artifact files that don't exist — patched in Hermes itself
  (`hermes-agent` `main`, commit `e0d406032`), not just documented as a risk.
- `template-intake.sh` hardcoded a shared worktree (`rg-pilot`) — now creates one per run,
  named after the slug.
- Recraft MCP still configured despite being unreachable — disabled on both profiles that
  still listed it.

**Partly fixed** — real progress, real limit remains: blueprints-as-shopping-list (gate
removed, but the underlying 3-reference cap and asset-shortfall problem is untouched);
harness-PASS-means-little (task body now says so plainly, the script's three assertions are
unchanged); spend tracking (every generating stage now must sum and report it, but nothing
enforces that a worker actually does — still self-reported, just asked for everywhere
instead of one place); worker memory bleed (a committed spec now outranks memory for style
facts specifically, but profile memory itself is still shared across template runs).

**Still open, Hermes-internal:** the false-positive hallucinated-card guard.

**Still open, ours:** the Next.js "1 Issue" badge (Pass B now asks the reviewer to report
it, so the next run should at least produce a real description); `image-reviewer`'s model
choice was never formally re-confirmed as the right one for this job, though today's Pass
A/B work is more evidence it can see fine; `reviewer` profile is still orphaned (only
`image-gen`'s Recraft reference got cleaned up alongside `designer`'s).

**New from today, worth reading in full below:** the defect-scoring script's own
documented limit on detecting chroma contamination; the fact that `template-intake.sh`'s
new worktree-creation path hasn't been exercised on a real run yet; the Hermes artifact
guard's actual scope (`artifacts` field, non-scratch tasks, self-completing stages only —
gated stages aren't covered by it); and blueprints' background plates possibly inheriting
an isolation clause meant for cut-out assets, not full-bleed scenery (flagged in the task
body, untested).

---

- **⚠️ CONFIRMED SHIPPING (2026-09-02): un-keyed green is visible in the rendered
  template.** What was flagged below as a shadow-cleanup nicety turned out to be worse than
  described. The Gate 4 screenshots show **bright saturated green halos around the art in
  every stage** — most obvious as a yellow-green blob behind the string lights on
  `welcome`, `wishes` and `itinerary`, and as green fringing along the hedge edges. This is
  not subtle shadow residue; it is un-removed `#00FF00` chroma background baked into the
  committed crop assets, now rendering in the product. The `sheets-finalize` lint passed it
  (`0 fail, 10 dense-for-transparent warnings`) and the `visual-qa` reviewer rated the
  affected stages PASS, so **two separate quality gates looked straight at it and did not
  flag it**. It is asset-level, so no amount of placement tuning fixes it — the crops
  themselves need re-keying, or regenerating. Treat this as blocking for the template.
  Original entry follows.
- **Soft green drop-shadows on generated props don't chroma-key cleanly** (flagged
  2026-09-02). **Fixed 2026-09-03**, and the root cause was worse than "doesn't key
  cleanly": pixel analysis of the 14 committed crops showed 0.00% semi-transparent alpha on
  every one (a hard binary cut, not a soft fringe) plus up to 24% green-dominant pixels
  *inside* the kept art — an olive-tinted gift box, a green glow painted around a candle.
  The green was subject, not background; the model painted a green cast because it was told
  the world was green. No keyer, better fuzz value, or despill pass could have fixed that.
  Replaced the whole approach: paper-white plate (`spec/style.json`'s `background.mode`),
  `rembg` alpha matting (`crop-tools/cutout.py`) instead of the ImageMagick floodfill, and a
  pre-commit defect scorer (`crop-tools/score-crops.py`) in `sheets-finalize`. A live probe
  render (candle in a glass holder, the same subject type that shipped with a green halo)
  came back 0.000% chroma-green, 100% pure white across 1,172 border samples, with a clean
  rembg cut at 5.99% soft edge — against 0.00% soft edge from the old floodfill on the same
  art. Cost $0.033, matching the documented per-image rate.
- **Blueprints depict art that was never generated as an asset, so the render can never
  match them** (found 2026-09-02 — structural, and the root cause of most Gate 4 "mismatch"
  findings). A template has ~14 picked crops total, roughly 2 per section. The `blueprints`
  stage attaches at most 2 of them per call (qwen-image-3's 3-reference cap) and lets the
  model *paint* the rest of the composition freely — so the approved blueprint for `rsvp`
  shows a tall column of 6 candles and dense florals, and `itinerary` shows a full staircase
  running down to a chair with florals at its foot. Those pieces do not exist as crops.
  `assemble` can only place what exists, so it places one candle and a small greenery box.
  **The mismatch is guaranteed before anyone looks at it** — and worse, the human approves
  the blueprint at Gate 3 believing that is what will be built.
  **Partly fixed 2026-09-03.** Took the third option neither line above considered: stop
  asking the human to approve the blueprint as a build target at all. Gate 3 is removed;
  `blueprints-task-body.md` now states plainly that its layout sketches are "a mood
  reference, nothing more" and that layout comes from the crop list in code. This closes
  the false-promise problem — nobody approves a picture that can't be delivered — but does
  **not** close the underlying shortfall: 2 crops per section is still thin for what the
  model wants to paint, and the "generate the shopping list" idea (making the blueprint's
  extra elements into real assets after the fact) was never built. `assemble` still places
  only what exists.
- **The `visual-qa` harness checks presence, not composition — a PASS means almost
  nothing** (found 2026-09-02). `frontend/scripts/visual-qa.mjs` runs exactly three
  assertions per stage: `[data-stage]` elements exist (line 103), the bounding box is
  non-zero (line 118), and the screenshot is not a single uniform colour (line 148). Pass
  all three → PASS (line 151). Nothing checks whether art overlaps text, whether a slot
  actually has content, whether the reserved content zone is clear, or whether the colours
  are right. The script's own comment at line 127 concedes the weakness. On Twilight
  Banquet it reported **10/10 pass** while the itinerary stage had art covering its title,
  an empty programme list, and a green halo across the top. The real judgement came
  entirely from the model looking at the screenshots afterward — the harness contributed a
  smoke test, not QA.
  **Partly fixed 2026-09-03.** `visual-qa-task-body.md` now says explicitly that "a harness
  PASS means only 'it rendered'" and tells the reviewer never to report the pass count as a
  verdict. The script itself — its three assertions — is unchanged; the real fix (reserved-
  zone occupancy, slot-content non-empty, text/art overlap as actual code) still doesn't
  exist.
- **The QA reviewer checks "is what I expect present?", not "is anything wrong?"** (found
  2026-09-02). The `image-reviewer` model (`minimax/minimax-m3`) can genuinely see — it
  correctly described a "vintage BLUE CAMERA center-bottom, FLORAL VASE bottom-left, IVY
  FRAME", spotted the staircase covering the itinerary title, and caught the hedge burying
  the wish list. But it missed **bright un-keyed green chroma halos present in every single
  screenshot** — a far more obvious defect than the subtle details it did catch — and rated
  those same stages PASS. The failure shape matters more than the model choice: it was
  comparing the render against the blueprint (presence checking), which is exactly what the
  task body asked for, so it never scanned for defects nobody had predicted. That is the
  same blind spot as the harness, one level up. Swapping in a stronger vision model would
  not fix a stage framed as parity-checking. **Fixed 2026-09-03.** `visual-qa-task-body.md`
  now requires two separate passes over every screenshot: Pass A (expected content present)
  and Pass B (look for anything wrong that nobody predicted — colour casts, halos, baked-in
  text, error overlays, checked explicitly against `spec/style.json`'s `forbidden` list).
  Note Pass A no longer compares against the blueprint at all, per the entry above —
  blueprints stopped being a build target this same day. (This also answers the older "is
  `minimax/minimax-m3` vision-capable" flag below: it is — the failure was framing, not
  eyesight.)
- **A Next.js "1 Issue" error badge appears in every QA screenshot** (found 2026-09-02,
  still not investigated). Every captured screenshot shows the dev overlay reporting a
  runtime issue, and neither the harness nor the reviewer mentioned it. Unknown whether it
  is benign. **Not fixed 2026-09-03** — but `visual-qa-task-body.md`'s new Pass B explicitly
  tells the reviewer to look for "browser or framework error overlays anywhere in the
  capture" and names this exact badge as an example, so the next `visual-qa` run should
  produce a real description of it instead of silence. Still worth resolving before the
  template is considered done.
- **The itinerary slot renders empty even when itinerary data is seeded** (found
  2026-09-02). The QA harness payload set two itinerary items (Ceremony 10:00, Reception
  18:00); the stage rendered a faint `:` and nothing else, at both breakpoints.
  **Fixed 2026-09-03 — and the original diagnosis was wrong, worth correcting explicitly.**
  This was flagged as "a data-path bug… it would affect real weddings too." It didn't:
  `ItineraryListSlot` (`_shared/slots/CeremonySlots.tsx`) reads `item.itineraryItemId`,
  `item.label`, `item.detail` — and every real code path (`app/personalise/page.tsx`,
  `organizer-admin/customize/page.tsx`, `super-admin/authoring/[templateId]/page.tsx`)
  already writes exactly that shape. The QA harness's own synthetic payload
  (`visual-qa.mjs`) was seeding `{id, title, time}` instead, which matches none of those
  field names — so every field the slot tried to read was `undefined`, and it rendered
  empty by design, not by bug. The harness was testing a shape the product never produces.
  Fixed by correcting `visual-qa.mjs`'s payload to the real shape (and expanded to 4 rows
  so the list's height/overflow behaviour actually gets exercised). Real weddings were
  never at risk; this cost a wasted diagnosis cycle purely because the QA tool's test data
  didn't match its own product's types.
- **`assemble`'s build check (`tsc --noEmit`) cannot see CSS, so CSS build failures reach
  Gate 4** (found 2026-09-02, template fixed — see below). `assemble`'s task body says "do
  not complete with a broken build" but prescribes only `npx tsc --noEmit`. TypeScript does
  not parse `.module.css`, so a CSS Modules syntax error is *structurally invisible* to the
  one check that stage runs. On Twilight Banquet, `Template10.module.css` shipped a bare
  `.wrapper :global { ... }` block — `:global` needs an argument (`:global(p)`, as
  Template7 legitimately uses), and a bare one is rejected: `Ambiguous CSS module class not
  supported`. Every request to `/organizer-admin/preview` 500'd, nothing mounted, and
  `visual-qa` scored **0 pass / 6 fail** before anyone knew there was a problem — burning a
  full Gate 4 cycle (dev-server boot + 12 screenshot attempts) on a one-token error.
  `tsc` passing is not the same as the build working. **Fixed** by requiring a real
  `npx next build` in `assemble-task-body.md`; the underlying lesson (each stage's
  "verification" must actually exercise the thing it claims to verify) is worth applying to
  the other stages too. Note also the root cause was avoidable by construction: CSS custom
  properties inherit down the DOM, so `:global` was never needed to reach the shared slot
  components — declaring the tokens on the plain local `.wrapper` class is sufficient.
- **A crashed card notifies nobody — the pipeline stalls silently** (found 2026-09-02).
  Cards stall in two ways and only one of them reaches you. A **gate block** is sent by a
  *living* worker that calls `kanban block` and then pushes the images/question to Telegram
  itself — you hear about it. A **crash block** happens when the worker is already dead (on
  2026-09-02 `assemble` died three times on transient OpenRouter connectivity: 18 connection
  errors, 2× 502, 1 timeout) and the dispatcher's circuit breaker parks the card after
  repeated failures — or when the repeated-unblock loop-breaker gives up and parks a card in
  `triage` (this is how Gate 4, `t_0e30af96`, got stranded). Nothing is alive to message
  anyone, so **no notification goes out at all** and the pipeline sits idle until a human
  happens to check the board. The recovery itself is trivial once you know: `hermes kanban
  --board invite-pipeline unblock <task-id>` returns the card to `ready` and the dispatcher
  spawns a fresh worker with a proper lifecycle (`reclaim` first if a card is stuck
  `running` behind a dead worker). Note the CLI may suggest `hermes --resume <session-id>
  -p <profile>` — **do not use that for a kanban card**: it reopens the dead session as an
  interactive chat *outside* the kanban lifecycle, so the card never gets claimed or
  completed properly (that is exactly the "worker exited cleanly without calling
  kanban_complete or kanban_block — protocol violation" failure seen on run #85).
  **Fixed 2026-09-03.** `~/.hermes/scripts/kanban-watchdog.sh` registered as a
  `hermes cron create --no-agent --script` job (`*/15 * * * *`, delivers to
  `telegram:204215691`) — no LLM, stdout only, empty stdout = silent. Lists both `blocked`
  and `triage`, dedupes against `~/.hermes/state/kanban-watchdog.seen` keyed on
  `<id>:<status>` (so a card that changes status, e.g. `blocked`→`triage`, or that stalls
  again after being resolved once, is treated as new rather than suppressed forever), and
  prints the exact recovery command per card. **Verified against real data, not just a
  synthetic test**: the first run found the genuinely-stranded `t_0e30af96` (visual-qa Gate
  4, still unresolved from 2026-09-02) and reported it correctly; the second run was silent,
  confirming dedup. The two gotchas found while building it: `hermes kanban create
  --initial-status blocked` does **not** keep the dispatcher off a card (it claimed and
  spawned a worker on a dummy test card anyway — block it explicitly instead), and the
  watchdog drives the `hermes kanban` CLI rather than reading `kanban.db` directly, since
  the DB is genuinely locked while a worker runs.
- **Spend is self-reported as a guess, never summed from actual returns** (found
  2026-09-02). The `generate_image` tool returns a real `cost_usd` on every successful
  call, so exact accounting is available — but no stage template tells workers to capture
  and sum it, so they eyeball a total instead. The `blueprints` run reported "6 layout
  renders + 11 background renders ≈ $0.60"; on disk there are 16 renders (6 layouts + 6
  final backgrounds + 4 in `rejects/`), and at the verified $0.033/image for qwen-image-3 at
  2K that is **$0.528** — the render count is off by one and the figure is ~13% high. Small
  in isolation, but it means no stage's cost claim can be trusted and there was **no
  cumulative spend tracking across the pipeline at all** — each stage reported its own rough
  number and nothing aggregated them.
  **Partly fixed 2026-09-03.** `style-bind-task-body.md` and `sheets-task-body.md` now
  carry the same requirement `blueprints-task-body.md` already had — sum `cost_usd` from
  every call including rejected/regenerated attempts, state it in the gate message.
  `audit-task-body.md` gained a "Spend total" step that reads all three figures and adds
  them into one run cost, stated in both the ALIGNED and DRIFT Telegram messages, with an
  explicit instruction to flag rather than silently zero a stage that's missing its cost
  line. What's still not fixed: this is all still self-reporting off the honour system —
  nothing verifies a worker actually summed correctly, the way the new artifact-existence
  guard (below) verifies files actually exist. A worker that eyeballs it again would not be
  caught.
- **A stage that FAILS the hallucination guard still ends up `done`** (found 2026-09-02).
  The `blueprints` run `t_d59aa2b0` tried to complete claiming it had generated 6 layouts +
  6 background plates and sent them to Telegram. It had generated nothing: no
  `docs/<slug>-blueprints/` dir, no new commit, `result` NULL, no Telegram message. The
  guard **correctly** caught it (`completion_blocked_hallucination`, `phantom_cards:
  ['t_d59aa2b0']`) — and then the run was marked **`done`** anyway, with the placeholder
  summary `"Interpreting task brief; no files written yet."`. So catching the lie did not
  stop the card from reaching a success state.
  **Correction, 2026-09-03, before describing the fix.** Reading `hermes-agent`'s actual
  source (`hermes_cli/kanban_db.py`) showed the original write-up above was wrong about the
  mechanism. `complete_task`'s `created_cards` gate runs *before* any write transaction and
  never mutates task state on rejection — that part of Hermes was already correct, and still
  is. **The real hole was narrower and different**: the guard only ever checked *card ids* a
  worker explicitly listed in `created_cards`. It never checked *files* a worker claimed to
  have produced. `t_d59aa2b0`'s "6 layouts + 6 backgrounds, sent to Telegram" claim made no
  card-creation claim at all, so no guard applied to it in the first place — there was
  nothing to reject. It reached `done` because nothing was ever checking that claim, not
  because a check failed open.
  **Fixed 2026-09-03** on that corrected understanding. Patched `hermes-agent` directly
  (branch `fix/produced-files-guard`, merged to `main` at commit `e0d406032`): `complete_task`
  now also verifies `metadata["artifacts"]` — the existing (previously decorative-only, for
  non-scratch tasks) "deliverable file paths" field already documented in
  `kanban_complete`'s tool schema — actually exist on disk, for non-scratch (worktree)
  tasks, before completion is accepted. Missing files raise `ArtifactPreservationError`
  (reusing the exception scratch-workspace tasks already raised for the same reason, so the
  tool-layer handler needed no change) and emit an auditable
  `completion_blocked_missing_artifacts` event; the task stays un-`done`, same guarantee as
  `created_cards`. Two new tests
  (`test_complete_blocks_on_missing_artifacts_for_worktree_task`,
  `test_complete_does_not_re_verify_artifacts_for_scratch_task`) confirm both the new gate
  and that it doesn't double-fire for scratch tasks, which already had their own check.
  `style-extract`, `sheets-finalize`, `blueprints`, and `assemble` — the four
  self-completing generating stages — now pass `artifacts` with their real output paths.
  **What this does NOT cover, and shouldn't be assumed fixed**: gated stages (`style-bind`,
  `sheets`) complete via a human's literal `/kanban complete` Telegram reply, not a worker
  tool call, so this guard never runs for them — their existing "state exact paths in the
  gate message" convention is the only check there, and it's a human-readable one, not an
  enforced one. And `advance` tasks independently checking their parent's real output on
  disk/git remains genuinely necessary — treat `done` as a claim worth spot-checking, not a
  guaranteed fact, especially for anything that predates this patch or falls outside its
  scope.
- **The completion guard produces false "hallucinated card" flags** (found 2026-09-02, not
  fixed — this is Hermes-internal, not ours). Manager run `t_449932a5` was blocked twice
  with `completion_blocked_hallucination`, `phantom_cards: ['t_f116f23f','t_a1e52dc1']`,
  `verified_cards: []` — but **both cards genuinely existed**, correctly parented, correct
  worktree, full bodies. The run completed on its third attempt. So the guard failed to
  verify real cards rather than catching a real hallucination. Worth knowing because the
  flag is alarming and, taken at face value, points at the wrong problem; also because a
  guard that can false-positive can presumably block a legitimate completion outright.
- **`kanban_create` (agent tool) cannot set a branch, and its `body` is easy to drop**
  (found 2026-09-02, mitigated in the template). The tool exposes
  `workspace_kind`/`workspace_path` but **no branch parameter**, so worktree tasks made
  with it come out branch-less. On the sheets→sheets-finalize advance, a manager run
  created a body-less stub (`t_7c584e37`) with it, then wrongly concluded "the tool doesn't
  have a body parameter" (it does — verified in `kanban_tools.py`), deleted the stub, and
  recreated the card properly via CLI as `t_f116f23f`. `advance-task-body.md` now
  explicitly requires the CLI. **Secondary hazard seen the same run**: the dispatcher had
  already spawned a worker onto the stub before it was deleted; that worker correctly stood
  down as a duplicate, but the card vanished mid-run so it could neither complete nor block,
  and it sent a Telegram report describing a "blocked, safe to archive" card that by then
  did not exist. If a card must be deleted, check whether it has already been claimed.
- **The Design Brief is never written to disk by any stage** (found 2026-09-02). The
  `researcher`/intake stage posted the full brief as a *comment* on the intake task and
  saved only the reference *image* to `docs/<slug>-refs/`. But
  `sheets-finalize-task-body.md` passes `$WT/docs/<slug>-design-brief.md` to
  `asset-lint.sh` as its spec argument, and `style-bind-task-body.md` refers to the same
  path ("if the researcher wrote one"). Nothing ever wrote it. The `sheets-finalize` worker
  on the Twilight Banquet run figured this out on its own and transcribed the brief from the
  intake comment into a real file before linting — the right call, but it was improvised,
  not instructed, and a less careful worker could just as easily have skipped the lint,
  passed a nonexistent path (which exits 2 = "gate that didn't run," not a pass), or pulled
  a stale brief from memory.
  **Fixed 2026-09-03.** `template-intake.sh` now writes `$WT_PATH/docs/$SLUG-design-brief.md`
  itself, right after creating the run's worktree and before creating any stage task — see
  the worktree entry below for why that ordering (brief written into a *fresh*, correctly-
  named worktree) matters on its own. Every downstream stage that reads that path now finds
  a real file on a fresh run instead of depending on a worker's improvisation.
- **Worker profile memory is not scoped per template run** (found 2026-09-02). The
  `designer` profile carries persistent memory across *different* template authoring runs.
  On the Twilight Banquet `sheets-finalize` task the worker pulled up details from an
  unrelated earlier template ("Watercolor Wildflowers", task `t_ce2cbbd2`, brief living in
  the old `rg-pilot` worktree) while trying to locate this run's files, and briefly reasoned
  about whether those paths applied here. It self-corrected and did not act on the wrong
  data — but the same bleed on a less careful run could produce a wrong path, a stale
  palette, or assets attributed to the wrong template.
  **Partly fixed 2026-09-03, as a side effect rather than a direct fix.** `spec/style.json`
  now holds the style facts (medium, palette, forbidden traits) as a committed file in the
  run's own worktree — a worker that's about to lean on memory for "what's the palette here"
  now has a stronger, more specific, more current source sitting right there instead. And
  every run now gets a genuinely fresh, uniquely-named worktree (see below), so a stale path
  from an old run is less likely to even resolve to something that exists. Neither of these
  is a real fix for the underlying cause, though: `designer`'s memory is still shared across
  every template run, and a worker could still reason from it instead of the committed spec.
  Actual memory scoping was never built.
- **`advance` task worktree inheritance (fixed 2026-09-01, worth re-verifying on the next
  few runs)**: `advance-task-body.md`'s Step 3/4 used to have a bare `<worktree>`
  placeholder with no instruction on which worktree to use. One `advance` task guessed
  wrong (used its own new task's id instead of inheriting its parent's), silently forking
  the run into two disconnected worktrees for one stage before it was caught. The template
  now explicitly requires reading the parent's `workspace`/`branch` via `hermes kanban show`
  and copying it verbatim — but this is exactly the kind of thing worth spot-checking after
  every `advance` run for a while.
- **`template-intake.sh` hardcoded a single shared worktree, `rg-pilot`, for every run**
  (found while planning today's fix pass, 2026-09-03 — never previously flagged, and would
  have broken the very next run silently). A fresh template run would have written into the
  *same* worktree as whatever the last run left there, mixing two templates' uncommitted
  files — exactly the class of fault the entry above already caught once for a different
  cause. **Fixed 2026-09-03.** After the brief's `MACHINE:` line is parsed, the script now
  derives `WORKTREE="${SLUG}-$(date +%Y%m%d)"`, creates it fresh off `ae-unified` with
  `git worktree add ... -b "wt/$WORKTREE" ae-unified`, and fails loudly (creating nothing
  further) if that fails — no silent fallback to a shared directory. Also fixed in the same
  pass: the script used to create a `style-bind` task directly, skipping the new
  `style-extract` stage entirely, which would have meant `spec/style.json` never existed and
  every stage downstream that passes `style_spec_path` would have failed on a missing file.
  It now creates `style-extract` first. **Caveat: this path is untested end-to-end** — it
  has been read carefully and syntax-checked (`bash -n`), but the actual `git worktree add`
  call, the brief-writing, and the `style-extract` task creation have not been exercised
  against a real intake reply yet. Worth watching closely on the next real run.
- **No automatic chain continuation** (see mechanics section above) — every gate needs its
  `advance` task pre-created in `todo` *before* the gate is approved, or the chain silently
  stalls. Worth double-checking the board after creating any stage task by hand.
  `template-intake.sh` now correctly pre-creates the first `advance` task (pointed at
  `style-extract`, not the old `style-bind`) as part of the same 2026-09-03 fix — but this
  structural risk remains for every hand-created stage task regardless.
- **`image-reviewer`'s model (`minimax/minimax-m3`) has not been confirmed vision-capable**
  for the `visual-qa` gate's actual job (comparing screenshots). The original oversight
  addendum specified a vision-confirmed model (`openai/gpt-4o`) for this role; the profile
  as currently configured uses a different model. Worth verifying before trusting a
  `visual-qa` ALIGNED verdict.
- **`reviewer` and `image-gen` profiles are orphaned** — configured, unused by any current
  template, both still pointing partly at the legacy `recraft` MCP server.
  **Partly fixed 2026-09-03**: the `recraft` server is now `enabled: false` in both
  `designer/config.yaml` and `image-gen/config.yaml` (it was still failing to connect every
  session it was tried — `getaddrinfo ENOTFOUND mcp.recraft.ai` — see below). `image-gen`
  itself is still an orphaned, unused profile; that part wasn't cleaned up, only its dead
  MCP reference was.
- **`frontend/scripts/visual-qa.mjs` and its `package.json` script entry were uncommitted
  and only existed in the old `rg-pilot` worktree** — copied into the `t_396364bc` worktree
  on 2026-09-02 so the pipeline doesn't fail when it reaches Gate 4.
  **Fixed 2026-09-03.** Both files committed directly to `ae-unified`
  (`git commit 39348b2`, scoped to exactly these two files — the main checkout had a large
  amount of unrelated pre-existing uncommitted work sitting in it, left untouched). Every
  future worktree branched from `ae-unified`, including the fresh ones `template-intake.sh`
  now creates per run, inherits both.
- **Recraft MCP intermittently fails to connect** (`getaddrinfo ENOTFOUND mcp.recraft.ai`,
  observed 2026-09-02). **Fixed 2026-09-03** by disabling the server rather than debugging
  the connection — nothing in the active pipeline calls it, so there was nothing to gain
  from investigating further. See the orphaned-profiles entry above.
- **`score-crops.py` cannot reliably tell contamination from a template's own colour**
  (found while building the defect scorer, 2026-09-03 — a documented limit, not a bug).
  Tested directly: on a chroma-green plate, an olive-tinted gift box (real contamination —
  the green painted into the artwork) scored only 4.6% off-palette, because a template
  whose palette already contains sage/olive greens (as Twilight Banquet's does, for hedge
  and garland foliage) can't be distinguished pixel-by-pixel from a green cast landing near
  those same colours. A hue-band chroma-green test has the same problem in reverse — it
  flags legitimate ivy and foliage in the art as if it were contamination. The script's own
  docstring says this explicitly and the check is downgraded to a warning, chroma-plate-only.
  This is the actual argument for the paper-white plate being the real fix rather than a
  preference: on white, `off_palette_pct` becomes a clean, unambiguous contamination signal
  (a colour the reference never contained, at all) with no green-vs-foliage ambiguity to
  navigate. Don't expect the scorer to catch a contaminated green-plate crop reliably; expect
  the white plate to prevent contamination from happening in the first place.
- **Background plates may inherit an isolation clause meant for cut-out assets, not
  full-bleed scenery** (flagged while writing `blueprints-task-body.md`, 2026-09-03,
  untested). `spec/style.json`'s `background` field describes the flat plate every
  *asset* call renders on — correct for a candlestick or a chair, wrong for a background
  scene that's supposed to fill the whole frame. The task body works around this by telling
  the worker to state explicitly in the prompt that the background plate must be full-bleed,
  and to check the result and regenerate with firmer wording if a plate comes back looking
  like an isolated object floating on white instead of a scene. This has not been exercised
  against a real `blueprints` run yet — the probe render proved the isolation clause itself
  works correctly for an asset, not that the override reliably beats it for a background.
  Worth checking closely at the first `blueprints` run after this fix pass.
- **The live probe validated one object, not a full sheet** (2026-09-03, worth keeping in
  mind rather than treating the probe as proof the whole pipeline works). The white-plate
  probe (a candle in a glass holder) came back 0.000% chroma-green, 100% pure white border,
  clean rembg cut — genuinely strong evidence the approach works. But a `sheets` prompt asks
  for 12–16 objects arranged in a loose grid on one plate, which stresses "flat white
  edge-to-edge, no shadow" far harder than one subject does: more objects means more
  opportunities for the model to add a ground plane, drop shadows between objects, or let
  the plate drift off pure white in places. `sheets-task-body.md` already tells the worker
  to verify sheet 1 before assuming the plate holds for sheets 2 and 3 — that check is the
  real test, not this probe.

## File map

- Kanban board / task state: `~/.hermes/kanban.db` (board `invite-pipeline`)
- Stage instructions (source of truth): `~/.hermes/scripts/kanban-task-templates/*.md`
- Template intake entry point: `~/.hermes/scripts/template-intake.sh`,
  `~/.hermes/scripts/template-brief-prompt.md`
- Image generation MCP server: `~/.hermes/scripts/openrouter-images-mcp/` — `index.mjs`
  (the `generate_image` tool, incl. the 2026-09-04 scene+reference hard-refuse guard),
  `stylelock.mjs` (spec → deterministic prompt text), `style.schema.json` (the
  `spec/style.json` contract, spec_version 2), `derive-key.mjs` **(new 2026-09-04)** —
  computes the per-theme isolation-key colour from the palette, `schema-validate.mjs`
  (shared dependency-free JSON-Schema-subset validator, used by all three spec schemas
  below), `scene.schema.json` + `scene-validate.mjs` **(new 2026-09-04)** — the
  `spec/scene.json` contract and its cross-checks against `spec/assets.json`,
  `scene-defaults.json` **(new 2026-09-04)** — code-seeded band/`empty_band_pct` defaults
  scene-research proposes from, `assets.schema.json` + `assets-validate.mjs` (the
  `spec/assets.json` contract, now with `band`/`size_in_anchor_units` per prop)
- Style extraction: `~/.hermes/scripts/style-extract/sample-palette.py` (code-side palette
  sampling — never trust a model's reported hex values)
- Cutout / scoring: `~/.hermes/scripts/crop-tools/{cutout.py,score-crops.py,empty-band-check.py}`
  — all need `~/.hermes/scripts/rembg-venv/bin/python` (a dedicated Python 3.11 venv; the
  system Python had no ONNX runtime wheels, which `rembg` needs). `empty-band-check.py`
  **(new 2026-09-04)** — the mechanical "is the reserved zone actually quiet" check
  `backgrounds` runs on its own output. `score-crops.py` gained a `key_contamination_pct`
  check (ΔE to `asset_background_hex`) and a soft-edge health band 2026-09-04 — see Known
  issues for its current blind spot. Regression fixtures for both:
  `~/.hermes/scripts/crop-tools/fixtures/` (captured from the live Sunny Safari
  reference-hijack/fragmentation defects before they were deleted, so the exact bugs stay
  testable).
- **`tools-matte/key-cut.py`** — worker-written per-run, lives inside each worktree (e.g.
  `.worktrees/sunny-safari-20260903/tools-matte/key-cut.py`), not in `~/.hermes/scripts/`.
  Replaces `rembg` for props it fails on (sparse/thin-dash subjects, enclosed gaps) via a
  direct ΔE-distance keyer against the sampled plate colour. Has its own unresolved
  fringing defect as of 2026-09-04 — see Known issues before treating it as the settled
  answer.
- Mechanical helper scripts: `~/.hermes/scripts/{sheet-segment.sh,asset-lint.sh,setup-pro-preview-event.sh,kanban-watchdog.sh}`
  — `sheet-segment.sh` gained a `PLATE=key KEY_HEX=#rrggbb` mode 2026-09-04
- Watchdog cron: registered via `hermes cron` (job name `kanban-watchdog`); dedupe state at
  `~/.hermes/state/kanban-watchdog.seen`
- Per-run specs (committed, not gitignored): `spec/style.json`, `spec/assets.json`,
  `spec/scene.json` **(new 2026-09-04)**, `spec/sections/<NN>-<section>.md` — all inside
  each run's worktree
- Profiles: `~/.hermes/profiles/{researcher,designer,manager,coder,image-reviewer,reviewer,image-gen}/`
- Active worktree (Sunny Safari, in progress, stopped at `visual-qa` pending a fix-plan
  decision — see Known issues): `/Users/helmyheiry/wedding-invite-app/.worktrees/sunny-safari-20260903`
  (branch `wt/sunny-safari-20260903`). The Twilight Banquet worktree
  (`.worktrees/t_396364bc`) referenced elsewhere in this doc's older prose predates this
  run. Future runs get their own, created automatically by `template-intake.sh` as
  `.worktrees/<slug>-<date>`.
- Hermes core (patched 2026-09-03 for artifact-existence verification):
  `~/.hermes/hermes-agent/` — `hermes_cli/kanban_db.py`,
  `tests/hermes_cli/test_kanban_core_functionality.py`
- Original oversight design doc: `~/Desktop/invite-pipeline-oversight-addendum.md`
- This session's plan file (scene-contract redesign, full rationale + verification):
  `~/.claude/plans/validated-giggling-pumpkin.md`
