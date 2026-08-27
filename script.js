// ------------------------------------
// TRACE - game setup and coordination
// ------------------------------------

const LEGACY_KEY_ID = "legacy-key";
const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const HANDEDNESS_STORAGE_KEY = "traceHandedness";
const THEME_STORAGE_KEY = "traceColorTheme";
const VALID_HANDEDNESS = ["right", "left"];
const VALID_THEMES = [
    "default",
    "high-contrast",
    "color-vision-friendly"
];

// ======================================
// Level normalization
// ======================================

// levels.js supports two authored key/gate formats. Everything below this
// function uses one format, without changing the original level objects.
function normalizeLevel(authoredLevel) {
    const keys = [];
    const gates = [];

    if (authoredLevel.key) {
        keys.push({
            id: LEGACY_KEY_ID,
            position: [...authoredLevel.key]
        });
    }

    (authoredLevel.keys || []).forEach(key => {
        keys.push({
            id: key.id,
            position: [...key.position]
        });
    });

    if (authoredLevel.locks) {
        gates.push({
            keyId: LEGACY_KEY_ID,
            tiles: authoredLevel.locks.map(tile => [...tile])
        });
    }

    (authoredLevel.lockGroups || []).forEach(group => {
        gates.push({
            keyId: group.keyId,
            tiles: group.tiles.map(tile => [...tile])
        });
    });

    const normalizedLevel = {
        id: authoredLevel.id,
        title: authoredLevel.title,
        size: authoredLevel.size,
        start: [...authoredLevel.start],
        goal: [...authoredLevel.goal],
        walls: authoredLevel.walls.map(wall => [...wall]),
        keys,
        gates
    };

    // Lookup maps avoid repeatedly scanning coordinate arrays during play.
    normalizedLevel.wallPositions = new Set(
        normalizedLevel.walls.map(positionKey)
    );
    normalizedLevel.keyByPosition = new Map(
        normalizedLevel.keys.map(key => [
            positionKey(key.position),
            key
        ])
    );
    normalizedLevel.gateByPosition = new Map();

    normalizedLevel.gates.forEach(group => {
        group.tiles.forEach(tile => {
            normalizedLevel.gateByPosition.set(
                positionKey(tile),
                group
            );
        });
    });

    return normalizedLevel;
}

const normalizedLevels = levels.map(normalizeLevel);

// ======================================
// Shared, DOM-independent game rules
// ======================================

function positionKey(position) {
    const row = Array.isArray(position)
        ? position[0]
        : position.row;
    const col = Array.isArray(position)
        ? position[1]
        : position.col;

    return `${row},${col}`;
}

function samePosition(first, second) {
    return first.row === second.row &&
        first.col === second.col;
}

function collectKeysOnPath(levelToCheck, path) {
    const foundKeys = new Set();

    path.forEach(position => {
        const key = levelToCheck.keyByPosition.get(
            positionKey(position)
        );

        if (key) {
            foundKeys.add(key.id);
        }
    });

    return foundKeys;
}

function createAttemptState(levelToStart) {
    const start = {
        row: levelToStart.start[0],
        col: levelToStart.start[1]
    };

    return {
        path: [start],
        collectedKeys: collectKeysOnPath(levelToStart, [start]),
        complete: false
    };
}

function isInsideBoard(levelToCheck, position) {
    return position.row >= 0 &&
        position.row < levelToCheck.size &&
        position.col >= 0 &&
        position.col < levelToCheck.size;
}

function isAdjacent(first, second) {
    const rowDifference =
        Math.abs(first.row - second.row);
    const colDifference =
        Math.abs(first.col - second.col);

    return rowDifference + colDifference === 1;
}

// This is the single source of truth for movement. It never reads or changes
// the DOM, so live play and the shortest-path solver can both call it.
function applyMove(levelToPlay, state, destination, options = {}) {
    const allowBacktrack = options.allowBacktrack !== false;
    const lastPosition = state.path[state.path.length - 1];
    const destinationKey = positionKey(destination);

    if (
        state.complete ||
        !isInsideBoard(levelToPlay, destination) ||
        !isAdjacent(lastPosition, destination) ||
        levelToPlay.wallPositions.has(destinationKey)
    ) {
        return { accepted: false, state };
    }

    const gate = levelToPlay.gateByPosition.get(destinationKey);

    if (gate && !state.collectedKeys.has(gate.keyId)) {
        return { accepted: false, state };
    }

    const existingIndex = state.path.findIndex(position =>
        samePosition(position, destination)
    );

    if (existingIndex !== -1) {
        const previousPositionIndex = state.path.length - 2;

        if (
            !allowBacktrack ||
            existingIndex !== previousPositionIndex
        ) {
            return { accepted: false, state };
        }

        const newPath = state.path.slice(0, -1);

        return {
            accepted: true,
            kind: "backtrack",
            state: {
                path: newPath,
                // Rebuilding inventory from the remaining path makes
                // backtracking off any key relock its matching gate.
                collectedKeys: collectKeysOnPath(
                    levelToPlay,
                    newPath
                ),
                complete: false
            }
        };
    }

    const newPath = [
        ...state.path,
        { row: destination.row, col: destination.col }
    ];
    const collectedKeys = new Set(state.collectedKeys);
    const foundKey =
        levelToPlay.keyByPosition.get(destinationKey);

    if (foundKey) {
        collectedKeys.add(foundKey.id);
    }

    const complete =
        destination.row === levelToPlay.goal[0] &&
        destination.col === levelToPlay.goal[1];

    return {
        accepted: true,
        kind: complete ? "complete" : "forward",
        state: {
            path: newPath,
            collectedKeys,
            complete
        }
    };
}

// ======================================
// Game state and saved progress
// ======================================

let currentLevelIndex = 0;
let level = normalizedLevels[currentLevelIndex];
let highestUnlockedLevel =
    Math.min(
        Number(
            localStorage.getItem("traceHighestUnlockedLevel")
        ) || 0,
        normalizedLevels.length - 1
    );
let attempt = null;
let isDrawing = false;
let levelComplete = false;
let bestMovesByLevel =
    JSON.parse(
        localStorage.getItem("traceBestMoves")
    ) || {};
let handedness = localStorage.getItem(HANDEDNESS_STORAGE_KEY);
let colorTheme = localStorage.getItem(THEME_STORAGE_KEY);

if (!VALID_HANDEDNESS.includes(handedness)) {
    handedness = "right";
}

if (!VALID_THEMES.includes(colorTheme)) {
    colorTheme = "default";
}

const board = document.querySelector(".game-board");
const levelMessage =
    document.querySelector(".level-message");
const restartButton =
    document.querySelector(".restart-button");
const previousButton =
    document.querySelector(".previous-button");
const nextButton =
    document.querySelector(".next-button");
const levelNumber =
    document.querySelector(".level-number");
const levelTitle =
    document.querySelector(".level-title");
const handednessSelect =
    document.querySelector("#handedness-select");
const themeSelect =
    document.querySelector("#theme-select");

// ======================================
// Accessibility and presentation settings
// ======================================

function applyTheme() {
    document.documentElement.dataset.theme = colorTheme;
    themeSelect.value = colorTheme;
}

function displayColumnToCanonical(displayColumn) {
    if (handedness === "left") {
        return level.size - 1 - displayColumn;
    }

    return displayColumn;
}

function handleHandednessChange(event) {
    handedness = event.target.value;
    localStorage.setItem(HANDEDNESS_STORAGE_KEY, handedness);

    // Rebuild only the presentation. The level model and active path retain
    // their original canonical coordinates.
    createBoard();
}

function handleThemeChange(event) {
    colorTheme = event.target.value;
    localStorage.setItem(THEME_STORAGE_KEY, colorTheme);
    applyTheme();
}

// ======================================
// Board rendering
// ======================================

function createBoard() {
    board.innerHTML = "";
    board.dataset.size = level.size;
    board.dataset.handedness = handedness;
    levelNumber.textContent =
        `Level ${currentLevelIndex + 1}`;
    levelTitle.textContent = level.title;

    const savedBest = bestMovesByLevel[level.id];
    const optimalMoves = findShortestPathLength(level);

    if (savedBest !== undefined) {
        levelMessage.textContent =
            `Best: ${savedBest} | Optimal: ${optimalMoves}`;
    } else {
        levelMessage.textContent =
            `Optimal: ${optimalMoves}`;
    }

    board.style.gridTemplateColumns =
        `repeat(${level.size}, 1fr)`;
    board.style.gridTemplateRows =
        `repeat(${level.size}, 1fr)`;

    for (let row = 0; row < level.size; row++) {
        for (
            let displayCol = 0;
            displayCol < level.size;
            displayCol++
        ) {
            const tile = document.createElement("div");
            const col = displayColumnToCanonical(displayCol);
            const coordinate = `${row},${col}`;
            const accessibleLabels = [];

            tile.classList.add("tile");
            // Input and path rendering always use canonical model coordinates.
            tile.dataset.row = row;
            tile.dataset.col = col;
            tile.dataset.displayCol = displayCol;

            if (level.wallPositions.has(coordinate)) {
                tile.classList.add("wall");
            }

            if (
                row === level.start[0] &&
                col === level.start[1]
            ) {
                tile.classList.add("start");
                accessibleLabels.push("Start");
            }

            if (
                row === level.goal[0] &&
                col === level.goal[1]
            ) {
                tile.classList.add("goal");
                accessibleLabels.push("Goal");
            }

            const keyAtPosition =
                level.keyByPosition.get(coordinate);

            if (keyAtPosition) {
                tile.classList.add("key");
                tile.dataset.keyId = keyAtPosition.id;
                accessibleLabels.push("Key");
            }

            const gateAtPosition =
                level.gateByPosition.get(coordinate);

            if (gateAtPosition) {
                tile.classList.add("lock");
                tile.dataset.keyId = gateAtPosition.keyId;
                accessibleLabels.push("Locked gate");
            }

            if (accessibleLabels.length > 0) {
                tile.setAttribute("role", "img");
                tile.setAttribute(
                    "aria-label",
                    accessibleLabels.join(", ")
                );
            }

            tile.addEventListener(
                "pointerdown",
                handlePointerDown
            );
            board.appendChild(tile);
        }
    }

    updateNavigationButtons();
    renderAttemptState();
}

function renderAttemptState() {
    const pathPositions = new Set(
        attempt ? attempt.path.map(positionKey) : []
    );
    const collectedKeys = attempt
        ? attempt.collectedKeys
        : new Set();

    document.querySelectorAll(".tile").forEach(tile => {
        const coordinate =
            `${tile.dataset.row},${tile.dataset.col}`;

        tile.classList.toggle(
            "path",
            pathPositions.has(coordinate)
        );

        if (tile.classList.contains("lock")) {
            const isUnlocked =
                collectedKeys.has(tile.dataset.keyId);

            tile.classList.toggle("unlocked", isUnlocked);
            tile.setAttribute(
                "aria-label",
                isUnlocked ? "Unlocked gate" : "Locked gate"
            );
        }
    });
}

// ======================================
// Pointer input
// ======================================

function handlePointerDown(event) {
    event.preventDefault();
    const tile = event.target;

    if (!tile.classList.contains("start")) {
        return;
    }

    isDrawing = true;
    attempt = createAttemptState(level);
    renderAttemptState();
}

function handlePointerMove(event) {
    if (!isDrawing) {
        return;
    }

    const element = document.elementFromPoint(
        event.clientX,
        event.clientY
    );
    const tile = element
        ? element.closest(".tile")
        : null;

    if (tile) {
        tryAddTile(tile);
    }
}

function handlePointerEnd() {
    if (!isDrawing) {
        return;
    }

    if (levelComplete) {
        isDrawing = false;
        return;
    }

    resetAttempt({ clearMessage: false });
}

function tryAddTile(tile) {
    const destination = {
        row: Number(tile.dataset.row),
        col: Number(tile.dataset.col)
    };
    const result = applyMove(level, attempt, destination);

    if (!result.accepted) {
        return;
    }

    attempt = result.state;
    renderAttemptState();

    if (attempt.complete) {
        completeCurrentLevel();
    }
}

// ======================================
// Shortest-path solver
// ======================================

function solverStateKey(levelToSolve, state) {
    const position = state.path[state.path.length - 1];
    const inventory = [...state.collectedKeys]
        .sort()
        .join("-");

    // Keep the original BFS visitation behavior: position plus collected keys.
    // applyMove still checks each candidate path's no-revisit rule.
    return `${positionKey(position)};${inventory}`;
}

function findShortestPathLength(levelToSolve) {
    const initialState = createAttemptState(levelToSolve);
    const queue = [initialState];
    const visited = new Set([
        solverStateKey(levelToSolve, initialState)
    ]);
    let queueIndex = 0;

    while (queueIndex < queue.length) {
        const current = queue[queueIndex];
        queueIndex++;

        if (current.complete) {
            return current.path.length - 1;
        }

        const currentPosition =
            current.path[current.path.length - 1];

        for (const [rowChange, colChange] of DIRECTIONS) {
            const destination = {
                row: currentPosition.row + rowChange,
                col: currentPosition.col + colChange
            };
            const result = applyMove(
                levelToSolve,
                current,
                destination,
                { allowBacktrack: false }
            );

            if (!result.accepted) {
                continue;
            }

            const stateKey = solverStateKey(
                levelToSolve,
                result.state
            );

            if (visited.has(stateKey)) {
                continue;
            }

            visited.add(stateKey);
            queue.push(result.state);
        }
    }

    return null;
}

// ======================================
// Completion, reset, and navigation
// ======================================

function completeCurrentLevel() {
    levelComplete = true;
    isDrawing = false;

    const playerMoves = attempt.path.length - 1;
    const optimalMoves = findShortestPathLength(level);
    const levelId = level.id;

    if (
        currentLevelIndex === highestUnlockedLevel &&
        highestUnlockedLevel < normalizedLevels.length - 1
    ) {
        highestUnlockedLevel++;
        localStorage.setItem(
            "traceHighestUnlockedLevel",
            highestUnlockedLevel
        );
    }

    updateNavigationButtons();

    const previousBest = bestMovesByLevel[levelId];
    const isNewBest =
        previousBest === undefined ||
        playerMoves < previousBest;

    if (isNewBest) {
        bestMovesByLevel[levelId] = playerMoves;
        localStorage.setItem(
            "traceBestMoves",
            JSON.stringify(bestMovesByLevel)
        );
    }

    const bestMoves = bestMovesByLevel[levelId];

    if (currentLevelIndex === normalizedLevels.length - 1) {
        levelMessage.textContent =
            `All Levels Complete! Moves: ${playerMoves} | Best: ${bestMoves} | Optimal: ${optimalMoves}`;
    } else if (playerMoves === optimalMoves) {
        levelMessage.textContent =
            `Perfect! Moves: ${playerMoves} | Best: ${bestMoves} | Optimal: ${optimalMoves}`;
    } else if (isNewBest) {
        levelMessage.textContent =
            `New Best! Moves: ${playerMoves} | Best: ${bestMoves} | Optimal: ${optimalMoves}`;
    } else {
        levelMessage.textContent =
            `Level Complete! Moves: ${playerMoves} | Best: ${bestMoves} | Optimal: ${optimalMoves}`;
    }
}

// Pointer-up, pointer-cancel, Restart, and level changes share this reset.
function resetAttempt(options = {}) {
    const clearMessage = options.clearMessage !== false;

    isDrawing = false;
    levelComplete = false;
    attempt = null;
    renderAttemptState();

    if (clearMessage) {
        levelMessage.textContent = "";
    }
}

function restartLevel() {
    resetAttempt();
}

function loadNextLevel() {
    if (currentLevelIndex < highestUnlockedLevel) {
        currentLevelIndex++;
    }

    if (currentLevelIndex >= normalizedLevels.length) {
        currentLevelIndex = normalizedLevels.length - 1;
    }

    level = normalizedLevels[currentLevelIndex];
    resetAttempt();
    createBoard();
}

function loadPreviousLevel() {
    if (currentLevelIndex > 0) {
        currentLevelIndex--;
    }

    level = normalizedLevels[currentLevelIndex];
    resetAttempt();
    createBoard();
}

function updateNavigationButtons() {
    previousButton.disabled = currentLevelIndex === 0;
    nextButton.disabled =
        currentLevelIndex >= highestUnlockedLevel ||
        currentLevelIndex >= normalizedLevels.length - 1;
}

document.addEventListener("pointermove", handlePointerMove);
document.addEventListener("pointerup", handlePointerEnd);
document.addEventListener("pointercancel", handlePointerEnd);
restartButton.addEventListener("click", restartLevel);
nextButton.addEventListener("click", loadNextLevel);
previousButton.addEventListener("click", loadPreviousLevel);
handednessSelect.addEventListener(
    "change",
    handleHandednessChange
);
themeSelect.addEventListener("change", handleThemeChange);

handednessSelect.value = handedness;
applyTheme();
createBoard();
