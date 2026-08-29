// ------------------------------------
// TRACE - game setup and coordination
// ------------------------------------

const LEGACY_KEY_ID = "legacy-key";
const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const ONE_WAY_DIRECTIONS = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1]
};
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
    const oneWays = validateAndCopyOneWays(authoredLevel);
    const switchMechanics =
        validateAndCopySwitchMechanics(authoredLevel);

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
        gates,
        oneWays,
        switches: switchMechanics.switches,
        switchGates: switchMechanics.switchGates
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
    normalizedLevel.oneWayByPosition = new Map(
        normalizedLevel.oneWays.map(oneWay => [
            positionKey(oneWay.position),
            oneWay
        ])
    );
    normalizedLevel.switchByPosition = new Map(
        normalizedLevel.switches.map(gameSwitch => [
            positionKey(gameSwitch.position),
            gameSwitch
        ])
    );
    normalizedLevel.switchGateByPosition = new Map();

    normalizedLevel.gates.forEach(group => {
        group.tiles.forEach(tile => {
            normalizedLevel.gateByPosition.set(
                positionKey(tile),
                group
            );
        });
    });

    normalizedLevel.switchGates.forEach(group => {
        group.tiles.forEach(tile => {
            normalizedLevel.switchGateByPosition.set(
                positionKey(tile),
                group
            );
        });
    });

    return normalizedLevel;
}

// Switch validation rejects broken references before gameplay or generation.
function validateAndCopySwitchMechanics(authoredLevel) {
    const authoredSwitches = authoredLevel.switches || [];
    const authoredSwitchGates = authoredLevel.switchGates || [];
    const wallPositions = new Set(
        authoredLevel.walls.map(positionKey)
    );
    const switchIds = new Set();
    const switchPositions = new Set();
    const gateSwitchIds = new Set();
    const gatePositions = new Set();

    if (!Array.isArray(authoredSwitches)) {
        throw new Error(
            `Level ${authoredLevel.id}: switches must be an array.`
        );
    }

    if (!Array.isArray(authoredSwitchGates)) {
        throw new Error(
            `Level ${authoredLevel.id}: switchGates must be an array.`
        );
    }

    const switches = authoredSwitches.map((gameSwitch, index) => {
        const id = gameSwitch && gameSwitch.id;
        const position = gameSwitch && gameSwitch.position;

        if (typeof id !== "string" || id.trim() === "") {
            throw new Error(
                `Level ${authoredLevel.id}: switch ${index + 1} needs a valid ID.`
            );
        }

        if (switchIds.has(id)) {
            throw new Error(
                `Level ${authoredLevel.id}: duplicate switch ID ${id}.`
            );
        }

        validateSwitchCoordinate(
            authoredLevel,
            position,
            `switch ${id}`
        );

        const coordinate = positionKey(position);

        if (wallPositions.has(coordinate)) {
            throw new Error(
                `Level ${authoredLevel.id}: switch ${id} cannot be placed on a wall.`
            );
        }

        if (switchPositions.has(coordinate)) {
            throw new Error(
                `Level ${authoredLevel.id}: duplicate switch position ${coordinate}.`
            );
        }

        switchIds.add(id);
        switchPositions.add(coordinate);

        return { id, position: [...position] };
    });

    const switchGates = authoredSwitchGates.map((group, index) => {
        const switchId = group && group.switchId;
        const tiles = group && group.tiles;

        if (!switchIds.has(switchId)) {
            throw new Error(
                `Level ${authoredLevel.id}: switch gate ${index + 1} references an unknown switch.`
            );
        }

        if (gateSwitchIds.has(switchId)) {
            throw new Error(
                `Level ${authoredLevel.id}: duplicate gate group for switch ${switchId}.`
            );
        }

        if (!Array.isArray(tiles)) {
            throw new Error(
                `Level ${authoredLevel.id}: gates for switch ${switchId} must be an array.`
            );
        }

        const copiedTiles = tiles.map((tile, tileIndex) => {
            validateSwitchCoordinate(
                authoredLevel,
                tile,
                `gate ${tileIndex + 1} for switch ${switchId}`
            );

            const coordinate = positionKey(tile);

            if (wallPositions.has(coordinate)) {
                throw new Error(
                    `Level ${authoredLevel.id}: switch gate ${coordinate} cannot be placed on a wall.`
                );
            }

            if (gatePositions.has(coordinate)) {
                throw new Error(
                    `Level ${authoredLevel.id}: duplicate switch gate at ${coordinate}.`
                );
            }

            gatePositions.add(coordinate);
            return [...tile];
        });

        gateSwitchIds.add(switchId);
        return { switchId, tiles: copiedTiles };
    });

    return { switches, switchGates };
}

function validateSwitchCoordinate(authoredLevel, position, label) {
    const validShape =
        Array.isArray(position) &&
        position.length === 2 &&
        position.every(Number.isInteger);

    if (!validShape) {
        throw new Error(
            `Level ${authoredLevel.id}: ${label} has an invalid position.`
        );
    }

    const [row, col] = position;

    if (
        row < 0 ||
        row >= authoredLevel.size ||
        col < 0 ||
        col >= authoredLevel.size
    ) {
        throw new Error(
            `Level ${authoredLevel.id}: ${label} is out of bounds.`
        );
    }
}

// Invalid mechanic data is rejected before a level can be played or solved.
// This same validation can later be reused by an automatic level generator.
function validateAndCopyOneWays(authoredLevel) {
    const oneWays = authoredLevel.oneWays || [];
    const wallPositions = new Set(
        authoredLevel.walls.map(positionKey)
    );
    const usedPositions = new Set();

    if (!Array.isArray(oneWays)) {
        throw new Error(
            `Level ${authoredLevel.id}: oneWays must be an array.`
        );
    }

    return oneWays.map((oneWay, index) => {
        const position = oneWay && oneWay.position;
        const direction = oneWay && oneWay.direction;
        const hasValidPosition =
            Array.isArray(position) &&
            position.length === 2 &&
            position.every(Number.isInteger);

        if (!hasValidPosition) {
            throw new Error(
                `Level ${authoredLevel.id}: one-way ${index + 1} has an invalid position.`
            );
        }

        const [row, col] = position;

        if (
            row < 0 ||
            row >= authoredLevel.size ||
            col < 0 ||
            col >= authoredLevel.size
        ) {
            throw new Error(
                `Level ${authoredLevel.id}: one-way ${index + 1} is out of bounds.`
            );
        }

        if (ONE_WAY_DIRECTIONS[direction] === undefined) {
            throw new Error(
                `Level ${authoredLevel.id}: one-way ${index + 1} has an unsupported direction.`
            );
        }

        const coordinate = positionKey(position);

        if (wallPositions.has(coordinate)) {
            throw new Error(
                `Level ${authoredLevel.id}: a one-way tile cannot be placed on a wall.`
            );
        }

        if (usedPositions.has(coordinate)) {
            throw new Error(
                `Level ${authoredLevel.id}: duplicate one-way tile at ${coordinate}.`
            );
        }

        usedPositions.add(coordinate);

        return {
            position: [...position],
            direction
        };
    });
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

function collectOneWaysOnPath(levelToCheck, path) {
    const visitedOneWays = new Set();

    path.forEach(position => {
        const coordinate = positionKey(position);

        if (levelToCheck.oneWayByPosition.has(coordinate)) {
            visitedOneWays.add(coordinate);
        }
    });

    return visitedOneWays;
}

function collectSwitchesOnPath(levelToCheck, path) {
    const activeSwitches = new Set();

    path.forEach(position => {
        const gameSwitch = levelToCheck.switchByPosition.get(
            positionKey(position)
        );

        if (gameSwitch) {
            activeSwitches.add(gameSwitch.id);
        }
    });

    return activeSwitches;
}

function createAttemptState(levelToStart) {
    const start = {
        row: levelToStart.start[0],
        col: levelToStart.start[1]
    };

    return {
        path: [start],
        collectedKeys: collectKeysOnPath(levelToStart, [start]),
        visitedOneWays: collectOneWaysOnPath(
            levelToStart,
            [start]
        ),
        activeSwitches: collectSwitchesOnPath(
            levelToStart,
            [start]
        ),
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

function followsOneWayDirection(oneWay, from, destination) {
    const [requiredRowChange, requiredColChange] =
        ONE_WAY_DIRECTIONS[oneWay.direction];

    return destination.row - from.row === requiredRowChange &&
        destination.col - from.col === requiredColChange;
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

    const switchGate =
        levelToPlay.switchGateByPosition.get(destinationKey);

    if (
        switchGate &&
        !state.activeSwitches.has(switchGate.switchId)
    ) {
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
                visitedOneWays: collectOneWaysOnPath(
                    levelToPlay,
                    newPath
                ),
                activeSwitches: collectSwitchesOnPath(
                    levelToPlay,
                    newPath
                ),
                complete: false
            }
        };
    }

    // Entering is unrestricted. Once standing on a one-way tile, only a new
    // forward step must follow its arrow. Legal backtracking returned above.
    const currentOneWay = levelToPlay.oneWayByPosition.get(
        positionKey(lastPosition)
    );

    if (
        currentOneWay &&
        !followsOneWayDirection(
            currentOneWay,
            lastPosition,
            destination
        )
    ) {
        return { accepted: false, state };
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

    const visitedOneWays = new Set(state.visitedOneWays);

    if (levelToPlay.oneWayByPosition.has(destinationKey)) {
        visitedOneWays.add(destinationKey);
    }

    const activeSwitches = new Set(state.activeSwitches);
    const foundSwitch =
        levelToPlay.switchByPosition.get(destinationKey);

    if (foundSwitch) {
        activeSwitches.add(foundSwitch.id);
    }

    const isGoal =
        destination.row === levelToPlay.goal[0] &&
        destination.col === levelToPlay.goal[1];

    // The goal is blocked until every required arrow is in the active path.
    // Return the original state so the player can keep tracing elsewhere.
    if (
        isGoal &&
        visitedOneWays.size < levelToPlay.oneWays.length
    ) {
        return { accepted: false, state };
    }

    const complete = isGoal;

    return {
        accepted: true,
        kind: complete ? "complete" : "forward",
        state: {
            path: newPath,
            collectedKeys,
            visitedOneWays,
            activeSwitches,
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
const gameMessage =
    document.querySelector(".game-message");
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

function canonicalDirectionToDisplay(direction) {
    if (handedness !== "left") {
        return direction;
    }

    if (direction === "left") {
        return "right";
    }

    if (direction === "right") {
        return "left";
    }

    return direction;
}

function directionArrow(direction) {
    return {
        up: "↑",
        down: "↓",
        left: "←",
        right: "→"
    }[direction];
}

function updateTileAccessibleLabel(tile) {
    const labels = [];

    if (tile.classList.contains("start")) {
        labels.push("Start");
    }

    if (tile.classList.contains("goal")) {
        labels.push("Goal");
    }

    if (tile.classList.contains("key")) {
        labels.push("Key");
    }

    if (tile.classList.contains("lock")) {
        labels.push(
            tile.classList.contains("unlocked")
                ? "Unlocked gate"
                : "Locked gate"
        );
    }

    if (tile.classList.contains("one-way")) {
        labels.push(
            `Required one-way tile, move ${tile.dataset.direction}`
        );
    }

    if (tile.classList.contains("switch")) {
        labels.push(`Switch ${tile.dataset.switchId}`);
    }

    if (tile.classList.contains("switch-gate")) {
        const gateState = tile.classList.contains("switch-gate-open")
            ? "Open"
            : "Closed";

        labels.push(
            `${gateState} switch gate for ${tile.dataset.switchId}`
        );
    }

    if (labels.length > 0) {
        tile.setAttribute("role", "img");
        tile.setAttribute("aria-label", labels.join(", "));
    }
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

function levelInstructions(levelToDescribe) {
    const instructions = ["Start at the circle."];

    if (levelToDescribe.oneWays.length > 0) {
        instructions.push("Visit every arrow.");
    }

    if (levelToDescribe.switches.length > 0) {
        instructions.push(
            "Keep switches in your path to open matching gates."
        );
    }

    instructions.push("Then reach the star.");
    return instructions.join(" ");
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
    gameMessage.textContent = levelInstructions(level);

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
            }

            if (
                row === level.goal[0] &&
                col === level.goal[1]
            ) {
                tile.classList.add("goal");
            }

            const keyAtPosition =
                level.keyByPosition.get(coordinate);

            if (keyAtPosition) {
                tile.classList.add("key");
                tile.dataset.keyId = keyAtPosition.id;
            }

            const gateAtPosition =
                level.gateByPosition.get(coordinate);

            if (gateAtPosition) {
                tile.classList.add("lock");
                tile.dataset.keyId = gateAtPosition.keyId;
            }

            const oneWayAtPosition =
                level.oneWayByPosition.get(coordinate);

            if (oneWayAtPosition) {
                const displayDirection =
                    canonicalDirectionToDisplay(
                        oneWayAtPosition.direction
                    );

                tile.classList.add("one-way");
                tile.dataset.direction = displayDirection;
                tile.dataset.arrow = directionArrow(displayDirection);
            }

            const switchAtPosition =
                level.switchByPosition.get(coordinate);

            if (switchAtPosition) {
                tile.classList.add("switch");
                tile.dataset.switchId = switchAtPosition.id;
                tile.dataset.switchLabel = switchAtPosition.id;
            }

            const switchGateAtPosition =
                level.switchGateByPosition.get(coordinate);

            if (switchGateAtPosition) {
                tile.classList.add("switch-gate");
                tile.dataset.switchId =
                    switchGateAtPosition.switchId;
                tile.dataset.switchLabel =
                    switchGateAtPosition.switchId;
            }

            updateTileAccessibleLabel(tile);

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
    const activeSwitches = attempt
        ? attempt.activeSwitches
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
        }

        if (tile.classList.contains("switch-gate")) {
            tile.classList.toggle(
                "switch-gate-open",
                activeSwitches.has(tile.dataset.switchId)
            );
        }

        updateTileAccessibleLabel(tile);
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
    const visitedOneWays = [...state.visitedOneWays]
        .sort()
        .join("|");
    const activeSwitches = [...state.activeSwitches]
        .sort()
        .join("-");
    const usedPath = levelToSolve.switches.length > 0
        ? state.path
            .map(positionKey)
            .sort()
            .join("|")
        : "";

    // Switch routes can reach the same position and mechanic state through
    // different used cells. Those histories have different legal futures
    // because Trace never allows an older path cell to be revisited.
    return `${positionKey(position)};${inventory};` +
        `${visitedOneWays};${activeSwitches};${usedPath}`;
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
