# Trace Roadmap

_Last updated: 2026-09-06_

## Product Direction

Trace is a mobile-first browser puzzle game built with vanilla HTML, CSS, and JavaScript.

The game has shifted from a traditional authored-level campaign into a **maze-first puzzle collection** built around continuous tracing.

Core identity:

- Trace continuously from Start to Goal
- No crossing maze walls
- Orthogonal movement through maze cells
- Backtracking is part of normal play
- Lifting before a valid checkpoint resets to the last saved point
- Difficulty should come from navigation, planning, false routes, topology, and mechanic interaction — not from making lanes physically difficult to trace

The current primary architecture is **Maze V2**, which uses walls between cells rather than blocked wall tiles.

The product name remains **Trace**. “Maze V2” is development terminology only.

---

# Current Game Model

## Maze V2 Foundation

Maze V2 currently includes:

- Maze cells with top/right/bottom/left wall states
- Randomized DFS/backtracking maze generation
- Dedicated Maze V2 shortest-path solver
- Start circle and purple goal star
- Continuous pointer/touch tracing
- Orthogonal movement only
- No crossing walls
- No skipping cells
- Immediate backtracking along the active trace
- SVG polyline trace with rounded joins/caps
- Mobile touch tolerance larger than the visible trace
- Default, High Contrast, and Color-Vision-Friendly themes
- Temporary Maze V2 preview workflow for development/mobile testing

### Current Mobile Baseline

**10×10 is the current default square maze size for phone play.**

This was chosen after testing 12×12, 11×11, 10×10, and 9×9. The goal is to keep the overall board footprint roughly the same while giving the player physically wider lanes.

Custom maze sizes remain supported for future difficulty tuning and alternate shapes.

### Touch / Rendering Principle

Maintain this hierarchy:

1. Invisible touch area — widest
2. Visible corridor — middle
3. Drawn trace — narrowest

Difficulty should not come from requiring unusually precise finger movement.

---

# Current Mechanics

## Checkpoints

Checkpoint behavior is implemented for long maze attempts.

Rules:

- Before reaching a checkpoint, lifting resets to Start
- Reaching a checkpoint saves progress
- After reaching it, lifting restores to that checkpoint
- Backtracking remains available
- Restart clears checkpoint progress and returns to Start

Checkpoint purpose:

Reduce frustration on long mobile traces while preserving the continuous-tracing identity.

## Key + Gate

Implemented and working.

Behavior:

- A key appears earlier on the required route
- A matching gate blocks a later maze edge
- Collecting the key permanently opens the gate for that attempt
- The key itself acts as the checkpoint
- Lifting after collecting the key restores to the key position
- Restart clears the key and recloses the gate
- Solver/validation confirms the key and gate are required

Visual language:

- Large recognizable key symbol
- Gate visually distinct from switch-controlled gates

## Switch + Gate

Implemented and working.

Behavior:

- Crossing switch `S1` opens its matching gate
- The switch remains active only while `S1` remains in the active traced path
- Backtracking past `S1` closes the gate immediately
- Lifting/resetting rebuilds switch state from the preserved checkpoint path
- Restart closes the gate
- A regular checkpoint remains because the switch is not a checkpoint

Visual language:

- Boxed `S1` control panel
- Inactive state uses dark panel with magenta identification
- Active state uses illuminated cyan
- Closed gate visibly crosses the corridor
- Open gate hides the blocking bar completely, leaving only a small hinge/identifier

## Current Mechanic Rule

- **Key = collectible, permanent unlock, checkpoint**
- **Switch = remote/path-dependent control, not a checkpoint**
- If a key exists, the key should normally replace the generic checkpoint
- If no key exists, use a regular checkpoint where needed

---

# New Player Flow

Trace should move away from a traditional numbered campaign and weekly level releases.

## Main Menu

The loading/home screen should eventually offer four primary choices:

- **Easy**
- **Medium**
- **Hard**
- **Extreme**

Each difficulty contains a fixed library of generated, validated puzzles.

### Initial Content Target

Tentative target:

- Easy: 300–350 puzzles
- Medium: 300–350 puzzles
- Hard: 300–350 puzzles
- Extreme: 300–350 puzzles

A 350-per-difficulty library would provide **1,400 total puzzles**.

These should be generated ahead of time, validated, selected, and frozen rather than regenerated randomly during normal play.

Benefits:

- The same puzzle number is identical for every player
- Progress can be stored reliably
- Favorites can reference exact puzzles
- Bugs can be reproduced by puzzle ID
- Duplicate and quality checks happen before release
- Generator changes do not silently alter existing puzzles

## Progress Display

Player-facing progression should be simple, for example:

- `Easy — 42 of 350`
- `Hard — 117 of 350`

The game does not need to emphasize traditional “Level 117” campaign language.

Overall completion may later show:

- `435 / 1400 puzzles traced`

## Puzzle Navigation

Recommended controls:

- **Previous** — revisit the prior available/completed puzzle
- **Restart** — restart the current puzzle
- **Next** — enabled after solving the current puzzle

The old Undo button is not needed because Trace already supports natural backtracking and checkpoint reset behavior.

## Favorites / Saved Puzzles

Future feature:

Allow a player to favorite a puzzle they enjoy and return to it later.

Possible display:

- Easy 72
- Medium 16
- Hard 204
- Extreme 9

This feature becomes straightforward because the normal puzzle catalog is fixed rather than dynamically regenerated.

---

# Difficulty System

Difficulty should be determined by a combination of **maze topology, route ambiguity, mechanics, path length, and board shape**.

Do not make harder modes difficult merely by shrinking the physical lanes.

## Easy

Primary goals:

- Square mazes only
- Phone-friendly lane width
- Shorter/clearer routes
- Fewer deceptive branches
- Few or no combined mechanics
- Generous checkpoint placement when needed
- Teach the Trace interaction naturally

## Medium

May introduce:

- Square and rectangular boards
- Longer routes
- More false paths and dead ends
- More ambiguous navigation
- One meaningful mechanic at a time
- Key/gate or switch/gate puzzles

## Hard

May include:

- Square, rectangle, and circular boards
- More deceptive topology
- Longer consequences between decisions
- Mechanic combinations
- Key + switch in the same puzzle
- Stronger route ordering requirements

## Extreme

May include:

- All supported shapes
- Long and highly ambiguous routes
- Multiple interacting mechanics
- More deceptive false routes
- Less obvious visual guidance
- Strong validation so difficulty comes from reasoning rather than unfair execution

## Important Principle

Shape is one difficulty variable, not the definition of difficulty.

A square can be hard. A circle can be easy. The overall puzzle structure determines the category.

---

# Board Shapes Roadmap

## 1. Square

Current primary format.

Perfect the 10×10 phone experience and generation/validation pipeline before expanding aggressively.

## 2. Rectangle

Recommended first alternate shape.

Reasons:

- Closest to current Maze V2 geometry
- Can reuse most cell-wall logic
- Adds strong visual variety without requiring a new movement model

## 3. Circle

Planned for Medium/Hard and above once rectangular/square generation is stable.

A circular maze may use either:

- clipped/structured cell geometry, or
- a true radial maze model

A true radial maze may require different geometry, rendering, and solver representation than the current rectangular grid.

The visible circle may be slightly larger than the square footprint if needed to preserve comfortable lane width.

## 4. Triangle

Later shape after circle.

Likely requires separate geometry/rendering rules and should not be attempted until the core catalog pipeline is stable.

## Possible Future Shape Experiments

- Square inside circle
- Mixed/compound silhouettes

These are optional future ideas, not near-term priorities.

---

# Immediate Development Priorities

## 1. Lock 10×10 Square Maze Baseline

Status: **Current baseline selected**

Continue normal phone testing to verify:

- lane comfort
- trace readability
- wall visibility
- checkpoint readability
- key readability
- switch/gate readability
- no precision frustration

Do not tune touch tolerance or trace width again unless testing shows a real need.

## 2. Combine Key + Switch in One Maze

Next major gameplay task.

Requirements:

- One key + matching key gate
- One switch + matching switch gate
- Key remains the checkpoint
- Switch is not a checkpoint
- Switch remains active only while it is present in the active trace
- Gates use distinct visual language
- Solver must model both mechanic states correctly
- Validator must prove both mechanics are required
- Reject placements that allow either mechanic to be bypassed
- Test backtracking across switch and key states carefully
- Test on phone before expanding generation

## 3. Define Difficulty Metrics for Maze V2

Before generating hundreds of puzzles, build a meaningful difficulty analyzer.

Potential signals:

- Board shape
- Rows/columns or geometry size
- Optimal route length
- Number of intersections
- Number of dead ends
- Number of plausible wrong turns
- Average depth of false routes
- Distance between decision and consequence
- Start-to-goal direct distance vs solved route length
- Number of required mechanics
- Number of interacting mechanics
- Required mechanic ordering
- Solver state count
- Checkpoint placement
- Route overlap / similarity to existing puzzles

Do not rely on Optimal length alone.

## 4. Build Maze V2 Batch Generation + Selection

The generator should become a **puzzle factory** used before publication.

Normal player gameplay should use the frozen catalog, not uncontrolled live procedural generation.

Generate substantially more candidates than needed, then select the strongest set for each difficulty.

Example approach:

- Generate 1,000+ candidates for a difficulty
- Reject invalid or weak boards
- Score survivors
- Remove exact duplicates
- Remove near-duplicates / repetitive-feeling layouts
- Select the best 300–350
- Freeze them into the catalog

---

# Generator Hard Rejection Rules

Reject a Maze V2 candidate if:

- Solver cannot find a valid solution
- Schema/maze-wall consistency fails
- Start or goal is invalid
- Start equals goal
- A gate references an invalid edge
- Mechanic references are invalid
- A required mechanic can be bypassed
- A key is not reachable before its required gate
- A switch is irrelevant to the solved route
- Goal is reachable while a required gate is forced closed
- Puzzle is too trivial for its intended difficulty
- Physical lane requirements would be uncomfortable on the target device
- Candidate is an exact duplicate
- Candidate is too similar to existing accepted puzzles

---

# Generator / Catalog Workflow

```text
Generate Maze V2 candidate
          ↓
Validate maze structure
          ↓
Place mechanics for target difficulty
          ↓
Run mechanic-aware solver
          ↓
Unsolvable?
   Yes → Reject
          ↓
Do all required mechanics matter?
   No → Reject
          ↓
Analyze topology + difficulty
          ↓
Outside target difficulty?
   Yes → Reject
          ↓
Duplicate / near-duplicate?
   Yes → Reject
          ↓
Quality score candidate
          ↓
Add to candidate pool
          ↓
Select strongest library
          ↓
Freeze puzzle into catalog
```

---

# Puzzle Catalog Architecture

Each frozen puzzle should eventually have a stable identifier independent of display wording.

Conceptually:

```text
Difficulty: hard
Index: 47
ID: hard-047
Shape: square
```

A frozen puzzle should preserve all information required to reproduce it exactly:

- maze geometry / walls
- start
- goal
- checkpoint if applicable
- key(s)
- key gate(s)
- switch(es)
- switch gate(s)
- shape
- difficulty metadata
- validated Optimal value if retained for internal analysis

Previously published puzzles should never silently regenerate or change.

---

# Legacy Trace Architecture

The original tile-based campaign and generation system should remain intact while Maze V2 is developed, but it is no longer the planned primary player flow.

Legacy systems include:

- authored tile-grid campaign
- old wall-tile levels
- BFS/applyMove architecture
- keys/gates
- arrows
- switch-controlled gates
- original generated-path automation
- fixed legacy maze level `2-07`

Do not delete legacy code casually. It may remain useful as:

- regression reference
- source of mechanic logic
- source of validation ideas
- fallback during development

Once the Maze V2 catalog architecture is proven and stable, legacy cleanup can be planned separately.

---

# Mechanics Backlog

Do not rush new mechanics. Maze topology itself now provides substantial challenge.

Possible future mechanics:

- One-way arrows adapted to Maze V2
- Fragile / commitment behavior
- Break-through token
- Rotating gates
- Ice / sliding behavior
- Required zones
- Mutually exclusive gates
- Teleport pairs

## Mechanic Design Principles

Any new mechanic should:

- Add meaningful planning rather than visual clutter
- Work naturally with continuous tracing
- Be understandable without relying only on color
- Have clear backtracking semantics
- Have solver support
- Have generator placement rules
- Have a validator proving it is actually required when intended
- Remain readable and finger-friendly on phones

---

# Accessibility & Controls

Already available or established in Trace:

- Left-handed / right-handed support in the legacy game
- Default theme
- High Contrast theme
- Color-Vision-Friendly theme
- Symbols in addition to color
- Compact Settings control
- Settings persistence through localStorage

Maze V2 should continue to preserve or regain equivalent accessibility support as it becomes the main architecture.

Continue testing:

- mobile hand obstruction
- narrow screens
- high contrast readability
- color-independent mechanic recognition
- trace visibility
- wall visibility
- alternate-shape readability

Potential future settings:

- sound on/off
- haptics on/off
- larger symbols if needed

---

# Progress Persistence

Use localStorage initially for:

- selected difficulty
- highest unlocked/completed puzzle per difficulty
- completed puzzle state if needed
- favorites
- accessibility/theme settings

Design the data shape so it can later migrate to account/cloud storage if justified.

Accounts are not required for the initial product concept.

---

# Analytics / Playtesting Telemetry

Before broad release, useful private metrics may include:

- total visits
- approximate unique players
- returning players
- mobile vs desktop
- difficulty selected
- puzzle started
- puzzle completed
- restart count
- checkpoint reset count
- completion rate by puzzle
- average attempts
- favorite rate
- where players stop progressing

Analytics should help identify unfair or boring puzzles rather than drive artificial engagement.

---

# Daily / Endless Modes

These are no longer near-term priorities because the four large fixed difficulty libraries already provide extensive replay value.

They remain optional future extensions.

## Daily Trace — Optional Future

- Same seeded/frozen puzzle for everyone that day
- Shareable result
- Could pull from a dedicated validated daily catalog

## Endless — Optional Future

- Dynamically generated puzzles after the fixed catalog is exhausted or as a separate experimental mode
- Must use the same solver/validation rules as the main catalog

Do not build either until the core four-difficulty experience proves compelling.

---

# Mobile / Production Polish

Before release:

- touch accuracy on supported board shapes/sizes
- pointer-cancel behavior
- fast drag behavior
- portrait testing
- landscape testing if supported
- phone safe-area behavior
- settings usability
- symbol readability
- responsive spacing
- short viewport behavior
- resume/reload behavior
- performance with large puzzle catalog
- optional animation polish
- optional sound/haptics
- accessibility review

---

# Release Backlog

- Finalize square Maze V2 gameplay
- Add combined key + switch puzzle support
- Define difficulty scoring
- Build batch generator and validators
- Add rectangle generation
- Add circle architecture when ready
- Generate/curate fixed puzzle libraries
- Build four-difficulty home screen
- Build progress tracking
- Build Previous / Restart / Next navigation
- Add Favorites
- Broader phone playtesting
- Basic analytics
- Hosting/domain decision
- Privacy/legal basics
- PWA/installable option if useful
- Performance testing
- Monetization only after the gameplay loop proves compelling

---

# Native App / Store Readiness

Trace should remain portable so the web game can later be packaged for iOS and Android without rebuilding the core rules.

Preserve separation between:

- puzzle data
- game rules
- solver/validation
- generation
- rendering
- pointer/touch controls
- themes/accessibility
- progression storage

Before native packaging, review:

- iPhone/Android safe areas and notches
- gesture conflicts
- offline play
- localStorage migration
- app icons and splash screens
- app lifecycle/resume behavior
- iOS/Android packaging
- store requirements
- privacy disclosures if analytics/accounts are added

Potential distribution path:

1. Web
2. Progressive Web App
3. Native wrapper/package
4. App Store / Google Play

---

# Recommended Development Order From Here

1. **Keep 10×10 as the current square phone baseline**
2. **Combine key + switch in one Maze V2 puzzle**
3. Validate combined mechanic behavior and backtracking on phone
4. Build Maze V2 topology/difficulty analyzer
5. Define Easy / Medium / Hard / Extreme acceptance profiles
6. Build batch generation and candidate scoring
7. Add exact and near-duplicate rejection
8. Add rectangular maze support
9. Prototype circular maze architecture
10. Build frozen puzzle catalog format
11. Generate and curate the first large puzzle libraries
12. Build four-difficulty home screen and progress counters
13. Add Previous / Restart / Next navigation
14. Add Favorites / saved puzzles
15. Expand shapes/mechanics only after the core catalog feels varied enough
16. Add analytics before broader public testing
17. Consider Daily / Endless only after the primary game succeeds

---

# Current Guiding Principle

**Trace should be difficult because the player has to think about where to trace — not because tracing itself is physically difficult.**

The near-term goal is no longer to invent enough mechanics for a weekly campaign. It is to build a strong maze system, define reliable difficulty, and create a large curated library of puzzles that can sustain long-term play.
