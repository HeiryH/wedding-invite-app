/**
 * The invitation's viewport zoom — two distinct numbers, deliberately kept separate.
 *
 * `INVITE_REQUESTED_SCALE` is the literal `initial-scale` written into the `<meta viewport>` tag
 * (see `app/[eventType]/layout.tsx`). This is what a guest's real browser actually receives.
 *
 * `INVITE_EFFECTIVE_SCALE` is what the browser *does* with that request — i.e. the real
 * `deviceWidthCSSpx / layoutViewportWidthCSSpx` ratio the page ends up rendering at. These are NOT
 * the same number: the naive expectation for `width=device-width, initial-scale=0.9` is a layout
 * viewport of `deviceWidth / 0.9`, but a real measurement (`ViewportProbe` on an iPhone 17 Pro,
 * iOS 18.7 Safari) showed `visualViewport.scale` reading back **0.765**, not 0.9 — cross-checked
 * against `.stage`'s own real `getBoundingClientRect()` height, so this isn't a measurement-tool
 * artifact. Why Safari computes 0.765 from a request of 0.9 isn't nailed down (a device-density-
 * dependent adjustment is one candidate) — with only one data point, it's unknown whether this
 * relationship holds on other devices, or whether it's even linear (i.e. whether *requesting*
 * 0.765 would produce an effective 0.765, or trigger the same kind of adjustment again and land
 * somewhere else entirely). That uncertainty is exactly why these two constants must stay separate:
 * `INVITE_REQUESTED_SCALE` must stay whatever value is confirmed to render correctly on a real
 * device (currently 0.9 — do not "correct" this from a measurement of the *effective* scale), while
 * `INVITE_EFFECTIVE_SCALE` is the number everything that emulates the guest's rendering — the
 * Adjust Editor preview, which has no viewport meta to honour (iframes ignore it) — must reproduce.
 *
 * Single source of truth so the invitation's real viewport and the editor's emulated one can never
 * drift apart again — see `PreviewPanel.tsx`'s `layoutW`/`layoutH`. Re-measure both constants with
 * `components/dev/ViewportProbe.tsx` (`visual.scale` in its report) whenever this is in doubt — see
 * `docs/FIX_QUEUE.md` Issue 2.
 */
export const INVITE_REQUESTED_SCALE = 0.9;
export const INVITE_EFFECTIVE_SCALE = 0.765;

/** @deprecated Use `INVITE_EFFECTIVE_SCALE` (editor emulation math) or `INVITE_REQUESTED_SCALE`
 *  (the real meta tag) explicitly — this alias existed before the two were known to differ. */
export const INVITE_INITIAL_SCALE = INVITE_EFFECTIVE_SCALE;
