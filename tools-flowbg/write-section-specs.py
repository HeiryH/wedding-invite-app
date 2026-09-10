#!/usr/bin/env python3
"""Compose spec/sections/<NN>-<section>.md for rose-horizon.

The [STYLE LOCK] block is captured from stylelock.mjs directly rather than retyped, per
section-spec-task-body.md ("do not retype it by hand, run the command and paste its output
verbatim"). The RENDER SPECIFICATION wrapper is the locked wording from that same task body,
reproduced exactly — only the background phrase, typography and CONTENT block vary.
"""
import json
import pathlib
import subprocess

WT = pathlib.Path("/Users/helmyheiry/wedding-invite-app/.worktrees/rose-horizon-20260908")
SPEC = WT / "spec"

style_lock = subprocess.run(
    ["node", str(pathlib.Path.home() / ".hermes/scripts/openrouter-images-mcp/stylelock.mjs"),
     str(SPEC / "style.json"), "--background", "scene", "--text", "forbid"],
    capture_output=True, text=True, check=True,
).stdout.strip()

assets = json.loads((SPEC / "assets.json").read_text())
scene = json.loads((SPEC / "scene.json").read_text())

TYPOGRAPHY = ("a soft high-contrast display serif for names and headings, in #4a362e "
              "(deep espresso brown)")

WRAPPER = """RENDER SPECIFICATION
Render a screenshot of one vertical section of a mobile web page, viewed in
a phone browser in portrait. Full bleed, edge to edge. No device frame, no
phone bezel, no hand holding a phone, no browser chrome, no address bar, no
status bar, no drop shadow around the canvas.

Background: {background}.
Layout: strict single column, content inset 7% from the left and right edges,
generous vertical breathing room between elements.
Type scale is real mobile scale: headings large but not poster-sized, body
text at comfortable phone reading size, never tiny.

Typography: {typography}. Small labels in
letter-spaced small capitals. All text is crisp, correctly spelled,
horizontally centred unless stated otherwise, and never overlaps illustration.

Illustrations sit behind and around the text as decoration — in corners, along
edges, flanking headings — never on top of it and never obscuring it.
Every illustrated element uses the STYLE LOCK medium and palette above."""

# decoration placement + content lines, per section
SECTIONS = {
    "welcome": {
        "decoration": """The floral arch silhouette occupies the background band: its crown spans
the full width across the very top edge of the frame, and its two legs run
down the extreme outer left and right margins, so the arch frames the frame
without any part of it crossing the reserved content zone.
The cream rose bloom sits in the foreground-frame band at the top-left corner,
overlapping the arch's left leg.
The baby's breath sprig sits in the foreground-frame band tucked into the
top-right corner, smaller than the roses.
The blush-pink rose bloom sits in the foreground-frame band at the
bottom-right corner, at the very bottom edge.
The reserved content zone from 19% to 61% of the frame height must stay
completely clear of illustration — real names, date and venue text render
there as live DOM.""",
        "content": [
            ("THE WEDDING OF — small caps label", "heroTheme"),
            ("Aisyah & Danial — large heading, the couple's names", "coupleNames"),
            ("SATURDAY, 14 FEBRUARY 2026 — small caps", "heroDate"),
            ("Dewan Perdana, Kuala Lumpur / 11:00 AM – 4:00 PM — body text, two lines",
             "ceremonyDetails"),
            ("a small downward scroll cue at the very bottom", "scrollCue"),
        ],
    },
    "walimah": {
        "decoration": """The rose-wreathed crescent moon and star sits in the midground band,
horizontally centred, above the title at roughly 18% of the frame height.
The dusty blue-grey rose bloom sits in the foreground-frame band at the
top-right corner.
The cream rose bloom sits in the foreground-frame band at the bottom-left
corner, at the very bottom edge.
The reserved content zone from 30% to 70% of the frame height must stay
completely clear of illustration.""",
        "content": [
            ("Walimatul Urus — large heading", "walimahTitle"),
            ("a short paragraph of ceremony text, three to four lines of body copy",
             "walimahBody"),
        ],
    },
    "rsvp": {
        "decoration": """The envelope with a rose wax seal sits in the midground band, horizontally
centred, above the title at roughly 22% of the frame height.
The cream rose bloom sits in the foreground-frame band at the top-left corner.
The blush-pink rose bloom sits in the foreground-frame band at the
bottom-right corner, at the very bottom edge.
The reserved content zone from 32% to 76% of the frame height must stay
completely clear of illustration — the live RSVP form renders there.""",
        "content": [
            ("RSVP — large heading", "rsvpTitle"),
            ("Kindly let us know if you can join us — one line of body copy", "rsvpPrompt"),
            ("the RSVP form: name field, attendance choice, guest count, submit button",
             "rsvpForm"),
        ],
    },
    "itinerary": {
        "decoration": """The rose-ringed hourglass sits in the midground band, horizontally centred,
above the title at roughly 20% of the frame height.
The baby's breath sprig sits in the foreground-frame band at the top-right
corner, small.
The blush-pink rose bloom sits in the foreground-frame band at the bottom-left
corner, at the very bottom edge.
The reserved content zone from 33% to 78% of the frame height must stay
completely clear of illustration — the schedule rows render there.""",
        "content": [
            ("Atur Cara — large heading", "itineraryTitle"),
            ("a vertical schedule list of four time-and-event rows, each a time in small caps "
             "on the left and an event name beside it", "itineraryList"),
        ],
    },
    "wishes": {
        "decoration": """The open scroll with a feather quill sits in the midground band, horizontally
centred, above the title at roughly 22% of the frame height.
The baby's breath sprig sits in the foreground-frame band at the top-left
corner, small.
The dusty blue-grey rose bloom sits in the foreground-frame band at the
bottom-right corner, at the very bottom edge.
The reserved content zone from 34% to 78% of the frame height must stay
completely clear of illustration — the wish form and wish list render there.""",
        "content": [
            ("Ucapan — large heading", "wishTitle"),
            ("Leave a message for the couple — one line of body copy", "wishPrompt"),
            ("a short message form: name field, message field, send button", "wishForm"),
            ("a list of two or three submitted wishes below the form", "wishList"),
        ],
    },
    "photobooth": {
        "decoration": """The floral-corner picture frame sits in the midground band, horizontally
centred, in the upper area at roughly 16% of the frame height.
The small bird silhouette sits in the midground band near the top-right,
noticeably smaller than everything else.
The cream rose bloom sits in the foreground-frame band at the bottom-left
corner, at the very bottom edge.
The reserved content zone from 23% to 69% of the frame height must stay
completely clear of illustration — the photo grid renders there.""",
        "content": [
            ("a photo booth block: a grid of guest photo thumbnails with an upload button "
             "beneath it", "photoBooth"),
        ],
    },
}

order = assets["sections"]
(SPEC / "sections").mkdir(parents=True, exist_ok=True)

for i, section in enumerate(order, start=1):
    plan = assets["sectionPlan"][section]
    geom = scene["sections"][section]
    body = SECTIONS[section]

    content_lines = "\n".join(f"  {text} [{slot}]" for text, slot in body["content"])
    props_note = "\n".join(
        f"  - {p['name']} — band: {p['band']}, {p['size_in_anchor_units']}x anchor "
        f"({p['kind']})" for p in plan["props"]
    )

    text = f"""[STYLE LOCK]
{style_lock}

{WRAPPER.format(background=plan["background"], typography=TYPOGRAPHY)}

CONTENT — render exactly this and nothing more:

{body["decoration"]}

Centred beneath, in order with generous spacing:
{content_lines}

---
Confirmed props for this section (spec/assets.json) — no others may appear:
{props_note}

Geometry (spec/scene.json): scale anchor = {scene['scale_anchor']['name']} at
{scene['scale_anchor']['height_pct']}% of frame height at band multiplier 1.0;
bands {json.dumps(geom['bands'])}; reserved content zone {geom['empty_band_pct']}%.
"""
    path = SPEC / "sections" / f"{i:02d}-{section}.md"
    path.write_text(text)
    print(f"wrote {path.relative_to(WT)} ({len(plan['props'])} props, {len(body['content'])} content lines)")
