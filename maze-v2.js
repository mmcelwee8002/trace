const MAZE_V2_TOUCH_TOLERANCE = 1.2;
const MAZE_V2_TRACE_WIDTH_RATIO = 0.43;
const MAZE_V2_WALL_WIDTH = "2px";

function createMazeV2Candidate(rows = 12, cols = 12) {
    if (
        !Number.isInteger(rows) ||
        !Number.isInteger(cols) ||
        rows < 3 ||
        cols < 3 ||
        rows > 40 ||
        cols > 40
    ) {
        return null;
    }

    const cells = Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => ({
            row,
            col,
            walls: {
                top: true,
                right: true,
                bottom: true,
                left: true
            }
        }))
    );
    const directions = [
        { row: -1, col: 0, wall: "top", opposite: "bottom" },
        { row: 0, col: 1, wall: "right", opposite: "left" },
        { row: 1, col: 0, wall: "bottom", opposite: "top" },
        { row: 0, col: -1, wall: "left", opposite: "right" }
    ];
    const key = position => `${position.row},${position.col}`;
    const startCell = {
        row: Math.floor(Math.random() * rows),
        col: Math.floor(Math.random() * cols)
    };
    const visited = new Set([key(startCell)]);
    const stack = [startCell];
    let generationWork = 0;

    while (stack.length > 0) {
        generationWork++;
        const current = stack[stack.length - 1];
        const available = directions.filter(direction => {
            const row = current.row + direction.row;
            const col = current.col + direction.col;
            return row >= 0 && row < rows && col >= 0 && col < cols &&
                !visited.has(`${row},${col}`);
        });

        if (available.length === 0) {
            stack.pop();
            continue;
        }

        const direction = available[
            Math.floor(Math.random() * available.length)
        ];
        const next = {
            row: current.row + direction.row,
            col: current.col + direction.col
        };
        cells[current.row][current.col].walls[direction.wall] = false;
        cells[next.row][next.col].walls[direction.opposite] = false;
        visited.add(key(next));
        stack.push(next);
    }

    const maze = { rows, cols, cells };
    const start = findMazeV2FarthestCell(maze, startCell);
    const goal = findMazeV2FarthestCell(maze, start);
    const solution = solveMazeV2ShortestPath(maze, start, goal);

    if (!solution) {
        return null;
    }

    const candidate = {
        id: "MAZE-V2-EXPERIMENT",
        title: "Maze V2",
        rows,
        cols,
        cells,
        start,
        goal,
        key: null,
        gate: null,
        solutionLength: null,
        solution: null,
        keys: [],
        switches: [],
        gates: [],
        arrows: [],
        generationWork: {
            carveSteps: generationWork,
            visitedCells: visited.size
        }
    };

    if (!placeMazeV2KeyAndGate(candidate, solution)) {
        return null;
    }

    return candidate;
}

function mazeV2PositionsEqual(first, second) {
    return first?.row === second?.row && first?.col === second?.col;
}

function isMazeV2GateEdge(current, destination, maze) {
    if (!maze?.gate?.between) {
        return false;
    }

    const [first, second] = maze.gate.between.map(([row, col]) => ({
        row,
        col
    }));
    return (
        mazeV2PositionsEqual(current, first) &&
        mazeV2PositionsEqual(destination, second)
    ) || (
        mazeV2PositionsEqual(current, second) &&
        mazeV2PositionsEqual(destination, first)
    );
}

function placeMazeV2KeyAndGate(candidate, route) {
    const moveCount = route.length - 1;
    const keyMinimum = Math.max(1, Math.floor(moveCount * 0.35));
    const keyMaximum = Math.min(
        route.length - 3,
        Math.floor(moveCount * 0.5)
    );
    const gateMinimum = Math.max(
        keyMaximum + 1,
        Math.floor(moveCount * 0.65)
    );
    const gateMaximum = Math.min(
        route.length - 1,
        Math.floor(moveCount * 0.85)
    );
    const gateIndexes = [];

    for (let index = gateMinimum; index <= gateMaximum; index++) {
        gateIndexes.push(index);
    }

    for (let index = gateIndexes.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [gateIndexes[index], gateIndexes[swapIndex]] =
            [gateIndexes[swapIndex], gateIndexes[index]];
    }

    const maxGateChecks = Math.min(12, gateIndexes.length);
    const keyIndex = keyMinimum + Math.floor(
        Math.random() * Math.max(1, keyMaximum - keyMinimum + 1)
    );
    candidate.key = {
        id: "A",
        position: [route[keyIndex].row, route[keyIndex].col]
    };

    for (let check = 0; check < maxGateChecks; check++) {
        const gateIndex = gateIndexes[check];
        candidate.gate = {
            keyId: "A",
            between: [
                [route[gateIndex - 1].row, route[gateIndex - 1].col],
                [route[gateIndex].row, route[gateIndex].col]
            ]
        };
        const validation = validateMazeV2KeyAndGate(candidate);

        if (validation.valid) {
            candidate.solution = validation.solution;
            candidate.solutionLength = validation.solution.length - 1;
            candidate.keyPathIndex = keyIndex;
            candidate.gatePathIndex = gateIndex;
            candidate.gateRequired = validation.gateRequired;
            candidate.generationWork.gateCandidatesTested = check + 1;
            return true;
        }
    }

    candidate.key = null;
    candidate.gate = null;
    candidate.generationWork.gateCandidatesTested = maxGateChecks;
    return false;
}

function canMoveBetweenMazeCells(
    current,
    destination,
    maze,
    options = {}
) {
    if (!current || !destination || !maze?.cells) {
        return false;
    }

    const rowChange = destination.row - current.row;
    const colChange = destination.col - current.col;

    if (Math.abs(rowChange) + Math.abs(colChange) !== 1) {
        return false;
    }

    if (
        destination.row < 0 ||
        destination.row >= maze.rows ||
        destination.col < 0 ||
        destination.col >= maze.cols
    ) {
        return false;
    }

    if (
        isMazeV2GateEdge(current, destination, maze) &&
        (options.forceGateClosed || !options.hasKey)
    ) {
        return false;
    }

    const currentCell = maze.cells[current.row][current.col];
    const destinationCell =
        maze.cells[destination.row][destination.col];

    if (rowChange === -1) {
        return !currentCell.walls.top &&
            !destinationCell.walls.bottom;
    }

    if (rowChange === 1) {
        return !currentCell.walls.bottom &&
            !destinationCell.walls.top;
    }

    if (colChange === -1) {
        return !currentCell.walls.left &&
            !destinationCell.walls.right;
    }

    return !currentCell.walls.right &&
        !destinationCell.walls.left;
}

function solveMazeV2ShortestPath(maze, start, goal, options = {}) {
    const mechanicKey = maze?.key;
    const isKeyPosition = position =>
        mechanicKey &&
        position.row === mechanicKey.position[0] &&
        position.col === mechanicKey.position[1];
    const stateKey = state =>
        `${state.row},${state.col},${state.hasKey ? 1 : 0}`;
    const startState = {
        ...start,
        hasKey: Boolean(options.hasKey || isKeyPosition(start))
    };
    const queue = [startState];
    const parents = new Map();
    const visited = new Set([stateKey(startState)]);
    let farthest = { ...startState };

    for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        farthest = current;

        if (
            goal &&
            current.row === goal.row &&
            current.col === goal.col
        ) {
            const path = [{ row: current.row, col: current.col }];
            let cursorKey = stateKey(current);

            while (cursorKey !== stateKey(startState)) {
                const parent = parents.get(cursorKey);
                path.push({ row: parent.row, col: parent.col });
                cursorKey = stateKey(parent);
            }

            return path.reverse();
        }

        for (const [rowChange, colChange] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ]) {
            const destination = {
                row: current.row + rowChange,
                col: current.col + colChange,
                hasKey: current.hasKey
            };
            destination.hasKey = destination.hasKey ||
                Boolean(isKeyPosition(destination));
            const destinationKey = stateKey(destination);

            if (
                visited.has(destinationKey) ||
                !canMoveBetweenMazeCells(current, destination, maze, {
                    hasKey: current.hasKey,
                    forceGateClosed: options.forceGateClosed
                })
            ) {
                continue;
            }

            visited.add(destinationKey);
            parents.set(destinationKey, current);
            queue.push(destination);
        }
    }

    return goal ? null : [{ row: farthest.row, col: farthest.col }];
}

function validateMazeV2KeyAndGate(maze) {
    if (!maze?.key || !maze?.gate) {
        return { valid: false, gateRequired: false, solution: null };
    }

    const keyPosition = {
        row: maze.key.position[0],
        col: maze.key.position[1]
    };
    const keyReachable = solveMazeV2ShortestPath(
        maze,
        maze.start,
        keyPosition,
        { forceGateClosed: true }
    );
    const solution = solveMazeV2ShortestPath(
        maze,
        maze.start,
        maze.goal
    );
    const bypass = solveMazeV2ShortestPath(
        maze,
        maze.start,
        maze.goal,
        { forceGateClosed: true }
    );
    const gateRequired = bypass === null;

    return {
        valid: Boolean(keyReachable && solution && gateRequired),
        gateRequired,
        solution
    };
}

function findMazeV2FarthestCell(maze, origin) {
    const queue = [{ ...origin, distance: 0 }];
    const visited = new Set([`${origin.row},${origin.col}`]);
    let farthest = queue[0];

    for (let index = 0; index < queue.length; index++) {
        const current = queue[index];

        if (current.distance > farthest.distance) {
            farthest = current;
        }

        for (const [rowChange, colChange] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ]) {
            const destination = {
                row: current.row + rowChange,
                col: current.col + colChange
            };
            const destinationKey =
                `${destination.row},${destination.col}`;

            if (
                visited.has(destinationKey) ||
                !canMoveBetweenMazeCells(current, destination, maze)
            ) {
                continue;
            }

            visited.add(destinationKey);
            queue.push({
                ...destination,
                distance: current.distance + 1
            });
        }
    }

    return { row: farthest.row, col: farthest.col };
}

function renderMazeV2Preview(
    maze,
    boardElement,
    touchTolerance = MAZE_V2_TOUCH_TOLERANCE,
    traceWidthRatio = MAZE_V2_TRACE_WIDTH_RATIO
) {
    if (!maze || !boardElement) {
        return null;
    }

    if (window.mazeV2PreviewController) {
        window.mazeV2PreviewController.destroy();
    }

    boardElement.innerHTML = "";
    boardElement.dataset.mazeV2 = "true";
    boardElement.style.display = "grid";
    boardElement.style.gridTemplateColumns =
        `repeat(${maze.cols}, minmax(0, 1fr))`;
    boardElement.style.gridTemplateRows =
        `repeat(${maze.rows}, minmax(0, 1fr))`;
    boardElement.style.gap = "0";
    boardElement.style.padding = "10px";
    boardElement.style.position = "relative";
    boardElement.style.background = "var(--maze-v2-background)";

    const effectiveTouchTolerance = Math.min(
        1.5,
        touchTolerance + Math.max(maze.rows, maze.cols, 12) * 0.01 - 0.12
    );
    let activePath = [];
    let isTracing = false;
    let completed = false;
    let keyCollected = false;
    let keyCheckpointPath = [];
    let keyMarker = null;
    const svgNamespace = "http://www.w3.org/2000/svg";
    const traceSvg = document.createElementNS(svgNamespace, "svg");
    const tracePolyline = document.createElementNS(
        svgNamespace,
        "polyline"
    );
    const traceDot = document.createElementNS(svgNamespace, "circle");
    const gateLine = document.createElementNS(svgNamespace, "line");
    traceSvg.classList.add("maze-v2-trace");
    traceSvg.setAttribute("viewBox", `0 0 ${maze.cols} ${maze.rows}`);
    traceSvg.setAttribute("preserveAspectRatio", "none");
    traceSvg.style.position = "absolute";
    traceSvg.style.inset = "10px";
    traceSvg.style.width = "calc(100% - 20px)";
    traceSvg.style.height = "calc(100% - 20px)";
    traceSvg.style.pointerEvents = "none";
    traceSvg.style.zIndex = "1";
    tracePolyline.setAttribute("fill", "none");
    tracePolyline.setAttribute("stroke", "var(--maze-v2-trace-color)");
    tracePolyline.setAttribute("stroke-width", traceWidthRatio);
    tracePolyline.setAttribute("stroke-linecap", "round");
    tracePolyline.setAttribute("stroke-linejoin", "round");
    traceDot.setAttribute("fill", "var(--maze-v2-trace-color)");
    traceDot.setAttribute("r", traceWidthRatio / 2);
    traceDot.style.display = "none";
    const [gateFirst, gateSecond] = maze.gate.between.map(
        ([row, col]) => ({ row, col })
    );
    const gateMidpoint = {
        row: (gateFirst.row + gateSecond.row) / 2 + 0.5,
        col: (gateFirst.col + gateSecond.col) / 2 + 0.5
    };
    const gateHalfLength = 0.36;

    if (gateFirst.row === gateSecond.row) {
        gateLine.setAttribute("x1", gateMidpoint.col);
        gateLine.setAttribute("x2", gateMidpoint.col);
        gateLine.setAttribute("y1", gateMidpoint.row - gateHalfLength);
        gateLine.setAttribute("y2", gateMidpoint.row + gateHalfLength);
    } else {
        gateLine.setAttribute("x1", gateMidpoint.col - gateHalfLength);
        gateLine.setAttribute("x2", gateMidpoint.col + gateHalfLength);
        gateLine.setAttribute("y1", gateMidpoint.row);
        gateLine.setAttribute("y2", gateMidpoint.row);
    }

    gateLine.setAttribute("stroke", "var(--maze-v2-gate-color)");
    gateLine.setAttribute("stroke-width", "0.16");
    gateLine.setAttribute("stroke-linecap", "round");
    traceSvg.append(tracePolyline, traceDot, gateLine);
    boardElement.appendChild(traceSvg);

    for (let row = 0; row < maze.rows; row++) {
        for (let col = 0; col < maze.cols; col++) {
            const cell = maze.cells[row][col];
            const element = document.createElement("div");
            element.className = "maze-v2-cell";
            element.dataset.row = row;
            element.dataset.col = col;
            element.style.boxSizing = "border-box";
            element.style.position = "relative";
            element.style.display = "grid";
            element.style.placeItems = "center";
            element.style.background = "transparent";
            element.style.borderTop = cell.walls.top
                ? `${MAZE_V2_WALL_WIDTH} solid var(--maze-v2-wall-color)`
                : `${MAZE_V2_WALL_WIDTH} solid transparent`;
            element.style.borderLeft = cell.walls.left
                ? `${MAZE_V2_WALL_WIDTH} solid var(--maze-v2-wall-color)`
                : `${MAZE_V2_WALL_WIDTH} solid transparent`;
            element.style.borderRight =
                col === maze.cols - 1 && cell.walls.right
                    ? `${MAZE_V2_WALL_WIDTH} solid var(--maze-v2-wall-color)`
                    : "0";
            element.style.borderBottom =
                row === maze.rows - 1 && cell.walls.bottom
                    ? `${MAZE_V2_WALL_WIDTH} solid var(--maze-v2-wall-color)`
                    : "0";

            if (row === maze.start.row && col === maze.start.col) {
                element.innerHTML = "<span>&#9679;</span>";
                element.style.color = "var(--maze-v2-start-color)";
                element.style.fontSize = "clamp(0.9rem, 4vw, 1.65rem)";
            } else if (row === maze.goal.row && col === maze.goal.col) {
                element.innerHTML = "<span>&#9733;</span>";
                element.style.color = "var(--maze-v2-goal-color)";
                element.style.fontSize = "clamp(1rem, 4.2vw, 1.75rem)";
            } else if (
                row === maze.key.position[0] &&
                col === maze.key.position[1]
            ) {
                element.innerHTML = "<span>&#128273;</span>";
                element.style.color = "var(--maze-v2-key-color)";
                element.style.fontSize = "clamp(1rem, 4vw, 1.7rem)";
            }

            element.style.fontWeight = "900";
            element.style.zIndex = "2";
            const marker = element.querySelector("span");

            if (marker) {
                marker.style.position = "relative";
                marker.style.zIndex = "2";

                if (
                    row === maze.key.position[0] &&
                    col === maze.key.position[1]
                ) {
                    keyMarker = marker;
                }
            }

            boardElement.appendChild(element);
        }
    }

    function renderPath() {
        const points = activePath.map(position =>
            `${position.col + 0.5},${position.row + 0.5}`
        );
        tracePolyline.setAttribute("points", points.join(" "));

        if (activePath.length === 1) {
            traceDot.setAttribute("cx", activePath[0].col + 0.5);
            traceDot.setAttribute("cy", activePath[0].row + 0.5);
            traceDot.style.display = "block";
        } else {
            traceDot.style.display = "none";
        }

        gateLine.style.opacity = keyCollected ? "0.16" : "1";
        gateLine.setAttribute(
            "stroke",
            keyCollected
                ? "var(--maze-v2-gate-open-color)"
                : "var(--maze-v2-gate-color)"
        );

        if (keyMarker) {
            keyMarker.style.opacity = keyCollected ? "0.3" : "1";
        }
    }

    function resetToStart() {
        activePath = [];
        isTracing = false;
        completed = false;
        keyCollected = false;
        keyCheckpointPath = [];
        renderPath();
    }

    function resetToCheckpoint() {
        activePath = keyCheckpointPath.map(position => ({ ...position }));
        isTracing = false;
        completed = false;
        renderPath();
    }

    function positionFromPointer(event) {
        const rect = boardElement.getBoundingClientRect();
        const contentWidth = rect.width - 20;
        const contentHeight = rect.height - 20;
        const cellWidth = contentWidth / maze.cols;
        const cellHeight = contentHeight / maze.rows;
        const localX = event.clientX - rect.left - 10;
        const localY = event.clientY - rect.top - 10;
        const col = Math.floor(localX / cellWidth);
        const row = Math.floor(localY / cellHeight);

        if (row < 0 || row >= maze.rows || col < 0 || col >= maze.cols) {
            return null;
        }

        const centerX = (col + 0.5) * cellWidth;
        const centerY = (row + 0.5) * cellHeight;
        const withinTolerance =
            Math.abs(localX - centerX) <=
                cellWidth * 0.5 * effectiveTouchTolerance &&
            Math.abs(localY - centerY) <=
                cellHeight * 0.5 * effectiveTouchTolerance;

        return withinTolerance ? { row, col } : null;
    }

    function tryPosition(position) {
        if (!position || !isTracing || completed) {
            return;
        }

        const current = activePath[activePath.length - 1];

        if (
            position.row === current.row &&
            position.col === current.col
        ) {
            return;
        }

        const previous = activePath[activePath.length - 2];

        if (
            previous &&
            previous.row === position.row &&
            previous.col === position.col &&
            (!keyCollected ||
                activePath.length > keyCheckpointPath.length)
        ) {
            activePath.pop();
            renderPath();
            return;
        }

        if (
            activePath.some(item =>
                item.row === position.row && item.col === position.col
            ) ||
            !canMoveBetweenMazeCells(current, position, maze, {
                hasKey: keyCollected
            })
        ) {
            return;
        }

        activePath.push(position);

        if (
            !keyCollected &&
            position.row === maze.key.position[0] &&
            position.col === maze.key.position[1]
        ) {
            keyCollected = true;
            keyCheckpointPath = activePath.map(item => ({ ...item }));
        }

        renderPath();

        if (
            position.row === maze.goal.row &&
            position.col === maze.goal.col
        ) {
            completed = true;
            isTracing = false;
        }
    }

    function handlePointerDown(event) {
        const position = positionFromPointer(event);

        const requiredOrigin = keyCollected
            ? {
                row: maze.key.position[0],
                col: maze.key.position[1]
            }
            : maze.start;

        if (!position ||
            position.row !== requiredOrigin.row ||
            position.col !== requiredOrigin.col) {
            return;
        }

        event.preventDefault();
        boardElement.setPointerCapture?.(event.pointerId);
        activePath = keyCollected
            ? keyCheckpointPath.map(item => ({ ...item }))
            : [{ ...position }];
        isTracing = true;
        completed = false;
        renderPath();
    }

    function handlePointerMove(event) {
        if (!isTracing) {
            return;
        }

        event.preventDefault();
        tryPosition(positionFromPointer(event));
    }

    function handlePointerEnd() {
        if (isTracing && !completed) {
            if (keyCollected) {
                resetToCheckpoint();
            } else {
                resetToStart();
            }
        }
    }

    function handleRestart(event) {
        if (
            boardElement.dataset.mazeV2 !== "true" ||
            !boardElement.querySelector(".maze-v2-cell")
        ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        resetToStart();
    }

    boardElement.addEventListener("pointerdown", handlePointerDown);
    boardElement.addEventListener("pointermove", handlePointerMove);
    boardElement.addEventListener("pointerup", handlePointerEnd);
    boardElement.addEventListener("pointercancel", handlePointerEnd);
    const restartButton = document.querySelector(".restart-button");
    restartButton?.addEventListener("click", handleRestart, true);

    const controller = {
        reset: resetToStart,
        isKeyCheckpointActive: () => keyCollected,
        destroy() {
            boardElement.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
            boardElement.removeEventListener(
                "pointermove",
                handlePointerMove
            );
            boardElement.removeEventListener(
                "pointerup",
                handlePointerEnd
            );
            boardElement.removeEventListener(
                "pointercancel",
                handlePointerEnd
            );
            restartButton?.removeEventListener(
                "click",
                handleRestart,
                true
            );
            delete boardElement.dataset.mazeV2;
        }
    };

    window.mazeV2PreviewController = controller;
    return controller;
}
