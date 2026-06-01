# sticky_movie Specification

## Overview
sticky_movie is a browser-based tool for annotating specific segments of YouTube videos and generating coaching reports.

## Scope
- Target version: v1.0.1 (official release)
- Runtime: single-page web app (no build process)
- Main usage: referee/coaching review workflow

## Functional Specification
0. Screen Layout
- The main workspace shall place video area and comment input panel below `page-header`.
- The bottom row shall display ④ comment list at 100% width.
- The coaching report shall be displayed as a left-side overlay with 70% width, opened by a toggle button.
- The coaching report overlay shall start below `page-header`.
- Settings shall be displayed as a JavaScript-controlled overlay.
- Settings overlay width shall be `90vw`.

1. Video Load
- Accept YouTube video ID or URL input.
- Normalize URL formats and load via YouTube IFrame API.
- Support manual load trigger.
- The settings screen shall include only video ID/URL and play duration inputs.

2. Comment Annotation
- Add comment rows with:
  - start time (seek)
  - play duration (sleep)
  - comment text
  - category (first half / second half / other)
  - event
  - type
  - team (home / visitor)
- Play segment per row.
- Delete row.
- Allow selecting `type` from a dropdown in comment input.
- Allow editing `type` in each row via dropdown.
- Include `turnover` as a label option.

2.5 Shortcut Feature (v1.0.1)
- Provide shortcut settings inside settings overlay.
- Shortcut settings includes:
  - enable/disable toggle
  - allow-in-text-input toggle
  - override-browser-default toggle
  - bindings table (combo, action, target, value, description)
  - `Add Binding` / `Apply Settings` / `Reset to Default`
- Supported actions:
  - `clickButton`
  - `focusElement`
  - `expandSelect`
  - `selectRadio`
  - `toggleCheckbox`
  - `setCheckbox`
- `expandSelect` temporarily expands `type` dropdown to near full list visibility, then collapses on change or blur.
- Default shortcuts:
  - actions: `Ctrl+Enter`, `Shift+J`, `Shift+K`, `Shift+?`
  - category: `Alt+1`, `Alt+2`, `Alt+3`
  - team: `Alt+H`, `Alt+V`
  - labels: `Alt+T`, `Alt+M`, `Alt+R`, `Alt+P`, `Alt+F`, `Alt+S`, `Alt+L`, `Shift+T`

3. Data I/O
- JSON load and save.
- Markdown load, generate, and save.
- Automatic cache save/restore in browser localStorage.

3.5 Comment List Filters
- Provide filtering by category/type/event/comment.
- Use dropdown for type filter.
- Provide filter reset action.

4. Coaching Report
- Maintain report metadata:
  - title, KO, venue, weather, referee, coach, source
- Maintain bullet sections:
  - summary, regulation, pre-interview, good points,
  - self comment, shared, unshared, other
- Build markdown report output.

5. Markdown Import Behavior
- Parse markdown sections and restore report fields.
- Restore comment rows from memo sections where possible.
- Update bullet sections from markdown content.
- If source is YouTube URL/ID, update video field and load player target.

## Non-Functional Specification
- Responsive layout for desktop/mobile.
- No backend dependency.
- Error messages shown in status area.

## Constraints
- Requires browser environment with JavaScript enabled.
- YouTube playback depends on IFrame API availability and origin constraints.
