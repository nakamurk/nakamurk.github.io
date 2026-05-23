# sticky_movie Requirements Document

Target version: v1.0.0 (official release)

## 1. Purpose
Provide a lightweight tool to review YouTube match footage with time-based comments and coaching report generation.

## 2. Stakeholders
- Coach / reviewer
- Referee (report target)
- Maintainer of static site repository

## 3. Functional Requirements
1. Video Requirements
- FR-001: System shall accept YouTube ID/URL input.
- FR-002: System shall load selected video into embedded player.
- FR-003: System shall place video settings inside a "Settings" toggle and expose only video ID/URL and play duration inputs.

2. Commenting Requirements
- FR-101: System shall allow creating comment rows with seek and duration.
- FR-102: System shall support category selection (first half, second half, other).
- FR-103: System shall allow editing comment/event/type text fields.
- FR-104: System shall play and stop video segment by row settings.
- FR-105: System shall allow deleting comment rows.

3. Data Import/Export Requirements
- FR-201: System shall export comments as JSON.
- FR-202: System shall import JSON and reconstruct comments.
- FR-203: System shall generate markdown coaching report.
- FR-204: System shall import markdown and restore report data.
- FR-205: System shall save markdown as downloadable file.

4. Report Requirements
- FR-301: System shall maintain report metadata fields.
- FR-302: System shall maintain bullet sections for coaching contents.
- FR-303: System shall update bullet sections when markdown is loaded.
- FR-304: System shall map loaded data (markdown or JSON) to bullet input fields (`reportSummary`, `reportRegulation`, `reportPreInterview`, `reportGoodPoints`, `reportSelfComment`, `reportShared`, `reportUnshared`, `reportOther`).
- FR-305: System shall display coaching report editing as a left-side overlay with 70% width.
- FR-306: System shall render the report overlay starting from below `page-header`.

6. Screen Layout Requirements
- FR-501: System shall place video area and comment input panel below `page-header`.
- FR-502: System shall render the comment list below them at 100% width.

5. Local Persistence Requirements
- FR-401: System shall auto-save form updates to local cache.
- FR-402: System shall attempt cache restore on initialization.
- FR-403: System shall preserve user edits across page reload (F5) as much as possible.

7. Filter Requirements
- FR-601: System shall provide filtering by category/type/event/comment.
- FR-602: System shall provide type filter as a dropdown.
- FR-603: System shall provide filter reset action.

## 4. Non-Functional Requirements
- NFR-001: App shall run as static files without build tooling.
- NFR-002: App shall be usable on desktop and mobile widths.
- NFR-003: App shall provide user-facing status messages on failure.
- NFR-004: App shall avoid data loss on accidental reload where possible (cache).

## 5. Assumptions and Constraints
- AC-001: User has internet access to YouTube resources.
- AC-002: Browser supports modern JavaScript and localStorage.
- AC-003: Deployment target is static hosting.

## 6. Out of Scope
- Authentication and user accounts.
- Server-side storage and synchronization.
- Multi-user collaboration.
