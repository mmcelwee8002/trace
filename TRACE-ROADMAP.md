# Trace Roadmap

_Last updated: 2026-08-27_

## Current State

Trace is a mobile-first browser puzzle game built with vanilla HTML, CSS, and JavaScript.

Current foundation includes:

- Continuous single-touch / single-pointer tracing
- Orthogonal movement only
- No crossing walls
- Immediate one-step backtracking
- Releasing before completion resets the attempt
- Start and goal tiles
- Best score tracking
- BFS Optimal score
- Level progression and unlocking
- localStorage persistence
- Multiple board sizes, including 9×9, 10×10, 11×11, and 15×15
- Keys and locked gates
- Multiple independent keys and gates
- Left-handed / right-handed board orientation
- Default, High Contrast, and Color-Vision-Friendly themes
- Symbols in addition to color
- Shared `applyMove()` rule engine used by gameplay and solver
- Level normalization layer
- One-way arrow tiles
- Required one-way objectives: every arrow must be included in the active path before the goal can be entered

The campaign currently contains the original 15 retained levels. Experimental `2-06` levels should not be treated as permanent until a final one-way level is accepted.

---

# Near-Term Priorities

## 1. Finalize the First One-Way Level

Create a permanent Level 16 / internal ID `2-06`.

Goals:

- Teach one-way arrows clearly
- Use 2–3 arrows
- Every arrow must matter
- Avoid making it feel like ordered checkpoints
- Prefer multiple possible arrow orders when practical
- Solver must return a valid Optimal value
- The level should not be accepted if an arrow can be ignored or bypassed
- Test on mobile and in both handedness modes

Player-facing numbering should remain simple:

- Level 1
- Level 2
- ...
- Level 16

Internal IDs may remain chapter-based:

- `1-01`
- `1-02`
- ...
- `2-06`

Chapters can remain mostly behind the scenes unless a future level-select screen benefits from showing them.

---

## 2. Switch-Controlled Gates 

## completed

Recommended next mechanic after one-way tiles.

Possible behavior:

- Step on a switch to open a matching gate
- Switch effects remain part of the active continuous path state
- Backtracking should correctly restore the prior switch/gate state
- Solver and live gameplay must use the same shared rule logic
- Symbols and color should both communicate switch/gate state

Possible future variations:

- Toggle switch
- Temporary switch
- One switch opens Gate A and closes Gate B
- Multiple independent switch/gate groups

Start with the simplest version first.

---

## 3. Fragile Tiles

Concept:

- A fragile tile can be crossed normally
- Once the player moves forward off it, the route becomes more committed
- Exact backtracking behavior should be defined carefully before implementation

Goal:

Increase commitment and route planning without simply adding more walls.

---

## 4. Teleport Pairs

Concept:

- Enter one teleport tile
- Continue from its paired tile elsewhere on the board

Potential strengths:

- Non-obvious routes
- Strong visual variety
- Useful on larger boards

Requirements before implementation:

- Clear paired symbols
- Solver support
- Backtracking semantics
- Handedness-safe rendering

---

# Future Mechanic Backlog

- Break-through token
- ~~Temporary switches~~ — Implemented as switch-controlled gates
- Rotating gates
- Ice / sliding tiles
- Required zones
- Mutually exclusive gates

## Mechanic Design Principles

New mechanics should:

- Make the player think about the route before drawing
- Add meaningful decisions rather than visual clutter
- Work naturally with the continuous-touch rule
- Avoid copying ordered-number gameplay
- Be understandable from symbols and behavior
- Never rely on color alone
- Be supported by both live gameplay and the solver
- Work with left/right-handed mirroring
- Work across supported board sizes
- Remain readable on 15×15 boards

---

# Generator / Automation Roadmap

The generator should be built after approximately 3–4 strong mechanics exist.

Recommended progression:

**Walls → Keys/Gates → One-Way Arrows → Switch Gates → Fragile Tiles → Generator**

Accepted numbered levels should be retained permanently so everyone plays the same Level 20, Level 50, etc.

Daily and Endless modes can later use seeded or more dynamic generation.

## Generator Hard Rejection Rules

Reject a candidate if:

- `optimal === null`
- schema validation fails
- start or goal is invalid
- mechanic references are invalid
- a required mechanic is irrelevant or bypassable
- the candidate is too trivial
- the candidate is excessively long for its board size
- the board is mostly empty
- the layout is too similar to an existing level

For required one-way levels, the solver must find a solution that includes every required arrow.

## Automated Level Generation Rules

### Hard requirements
- Level must be solvable.
- Solver must return a numeric Optimal value.
- Start and goal must be reachable only through legal gameplay.
- No mechanic may be placed illegally or overlap incompatible tiles.
- Required mechanics must actually be required by every valid solution.
- Generated levels must respect the no-revisit path rule.

### Quality requirements
- Reject trivial straight-line or corridor-only solutions.
- Reject mechanics that can simply be bypassed.
- Prefer meaningful branching and route decisions.
- Avoid excessive empty space or meaningless wall noise.
- Difficulty should come from planning, not only path length.

### Difficulty signals
- Optimal move count.
- Number of solver states explored.
- Number of meaningful branch points.
- Number of required mechanics.
- Number of interacting mechanics.
- Required ordering between mechanics.
- Number of plausible routes that eventually fail.
- Distance between early decisions and their consequences.

### Mechanic architecture
Each mechanic should define:
- Schema/data representation.
- Placement rules.
- Validation rules.
- Runtime behavior through applyMove().
- Solver state requirements.
- Generator placement strategy.
- Test for whether the mechanic is actually required.
- Difficulty contribution.



## Generator Workflow

```text
Generate candidate
       ↓
Validate schema
       ↓
Run shared solver
       ↓
Optimal == null?
  Yes → Reject / regenerate
       ↓
Do required mechanics matter?
  No → Reject / regenerate
       ↓
Meets difficulty target?
  No → Reject / regenerate
       ↓
Too similar to existing level?
  Yes → Reject / regenerate
       ↓
Accept candidate
       ↓
Retain permanently
```

---

# Level Analytics / Difficulty Measurement

Before full generation, build an analyzer that can report:

- Board size
- Optimal moves
- Wall count / density
- Start-to-goal distance
- Number of keys
- Number of gates
- Number of arrows
- Number of switches
- Mechanic type
- Route complexity
- Board usage
- Possibly number of valid / optimal routes

---

# Accessibility & Controls

Already implemented:

- Left-handed mode
- Right-handed mode
- Horizontal board mirroring using coordinate transformation
- Default theme
- High Contrast theme
- Color-Vision-Friendly theme
- Symbols in addition to color
- Compact gear Settings control
- Settings persist with localStorage

Continue testing:

- 15×15 readability
- Arrow readability
- Gate state readability
- Color-independent understanding
- Mobile hand obstruction
- Narrow screens

---

# Settings / UI Backlog

Current compact Settings gear can remain in the upper-left beside the Trace title.

The settings panel may overlay the board while open.

Potential future improvements only if needed:

- Close Settings when tapping outside
- Add sound/haptic settings
- Add accessibility symbol-size option

---

# Progression / Presentation

Future polish:

- Level-select screen
- Replay completed levels
- Show Best
- Show Optimal
- Show completion state
- Possibly reward an Optimal solve
- Group levels internally by chapter / mechanic

Player-facing numbering should remain simple and sequential.

---

# Hint System

Future hint behavior should help without solving the entire puzzle.

Possible approach:

- Show the next useful direction or tile
- Single-use hint or cooldown
- Hint engine must understand all active mechanics

---

# Analytics / Playtesting Telemetry

Backlog item:

## Deploy Trace to Vercel + Basic Private Analytics

Initial metrics:

- Total visits
- Unique visitors / approximate unique players
- Returning visitors
- Mobile vs desktop
- Referrer/source
- Broad geography
- Traffic over time

Keep analytics private.

Later game-event analytics may include:

- Level started
- Level completed
- Restart count
- Hint usage
- Completion rate by level
- Average attempts
- Moves compared with Optimal
- Where players stop progressing

---

# Daily / Endless Modes

## Daily Trace

- Same seeded puzzle for everyone that day
- Shareable daily result
- Fixed daily seed

## Endless

- Dynamically generated puzzles
- Difficulty bands
- More experimental use of mechanics

---

# Mobile / Production Polish

Before release:

- Touch accuracy on all board sizes
- Pointer-cancel behavior
- Fast drag behavior
- Portrait and landscape testing
- Left/right-handed testing
- Settings usability
- Symbol readability
- Responsive spacing
- Short viewport behavior
- Optional animations
- Optional sound / haptics
- Accessibility review

---

# Release Backlog

- Final hosting decision
- Vercel deployment
- Domain
- Basic analytics
- Privacy/legal basics
- PWA/installable option if useful
- Performance testing
- Broader playtesting
- Monetization only after the gameplay loop proves compelling

---

# Recommended Development Order From Here

1. Finalize permanent Level 16 using one-way arrows
2. Add switch-controlled gates
3. Add fragile tiles
4. Consider teleport pairs
5. Build level analyzer / difficulty scoring
6. Build automated candidate generator
7. Generate and retain numbered levels
8. Build level-select / progression polish
9. Add hints
10. Add analytics before broader testing
11. Add Daily / Endless later

The goal is to stop inventing new mechanics once Trace has enough variety for the generator to create interesting combinations.


