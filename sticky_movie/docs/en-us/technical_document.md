# sticky_movie Technical Document

## Architecture
- Type: client-side single-page app
- Files:
  - index.html: UI structure
  - styles.css: layout and styling
  - app.js: logic and state handling

## Layout Implementation (v1.0.0)
- Below `page-header`, the main workspace places video area and comment input panel.
- The bottom section renders the comment list table as a full-width card.
- Report editing is implemented as a left-side `70vw` overlay drawer.
- Report overlay top offset is aligned to the bottom edge of `page-header`.
- Report open/close behavior is controlled by `reportToggleTab`, `reportCloseButton`, backdrop click, and `Escape`.

## Core Components
1. State Management (`app.js`)
- Global state object tracks:
  - player instance and readiness
  - timer control for segment playback
  - row numbering
  - memo collections by category

2. YouTube Integration
- Uses YouTube IFrame API (`YT.Player`).
- Handles lifecycle events:
  - onReady
  - onStateChange
  - onError
- Supports seek + timed pause playback.
- Video settings are grouped in `section1` (`details`) with only `videoId` and `sleepTime` as inputs.

3. Comment Table Engine
- Dynamic table generation through DOM APIs.
- Row-level controls:
  - play
  - delete
- Row `type` cell is edited with `select` dropdown.
- Filters are available for category/type/event/comment with reset action.
- Serialization through `getComments()`.

4. Markdown Engine
- Generator:
  - transforms report fields + memo data to markdown text.
- Parser:
  - extracts headings, bullet sections, and timeline blocks.
  - restores form fields and comment rows.

5. Persistence Layer
- JSON file import/export.
- localStorage cache with:
  - versioned payload
  - max size guard
  - automatic save/restore for reload resilience

## Official Release Folder
- Added `v1.0.0/` as the official release folder.
- The folder is based on current `beta_v1.5` implementation.

## Data Structures
1. JSON Export
- `video_id`: string
- `comments`: indexed object of rows

2. Comment Row
- seek, sleep, comment, category, event, type

3. Cache Payload
- version
- savedAt
- form snapshot

## Error Handling
- JSON parse validation.
- Markdown load failure feedback.
- Player readiness checks before operations.
- YouTube API error status messaging.

## Technical Notes
- Application is framework-free JavaScript.
- Designed for direct hosting in static environments.
- Avoids server-side dependencies.
