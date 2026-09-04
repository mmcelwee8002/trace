const MAZE_V2_TOUCH_TOLERANCE = 1.2;

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

    return {
        id: "MAZE-V2-EXPERIMENT",
        title: "Maze V2",
        rows,
        cols,
        cells,
        start,
        goal,
        solutionLength: solution.length - 1,
        solution,
        keys: [],
        switches: [],
        gates: [],
        arrows: [],
        generationWork: {
            carveSteps: generationWork,
            visitedCells: visited.size
        }
    };
}

function canMoveBetweenMazeCells(current, destination, maze) {
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

function solveMazeV2ShortestPath(maze, start, goal) {
    const key = position => `${position.row},${position.col}`;
    const queue = [{ ...start }];
    const parents = new Map();
    const visited = new Set([key(start)]);
    let farthest = { ...start };

    for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        farthest = current;

        if (
            goal &&
            current.row === goal.row &&
            current.col === goal.col
        ) {
            const path = [{ ...current }];
            let cursorKey = key(current);

            while (cursorKey !== key(start)) {
                const parent = parents.get(cursorKey);
                path.push({ ...parent });
                cursorKey = key(parent);
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
                col: current.col + colChange
            };
            const destinationKey = key(destination);

            if (
                visited.has(destinationKey) ||
                !canMoveBetweenMazeCells(current, destination, maze)
            ) {
                continue;
            }

            visited.add(destinationKey);
            parents.set(destinationKey, current);
            queue.push(destination);
        }
    }

    return goal ? null : [{ ...farthest }];
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
    touchTolerance = MAZE_V2_TOUCH_TOLERANCE
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

    const elements = new Map();
    const positionKey = position => `${position.row},${position.col}`;
    const effectiveTouchTolerance = Math.min(
        1.5,
        touchTolerance + Math.max(maze.rows, maze.cols, 12) * 0.01 - 0.12
    );
    let activePath = [];
    let isTracing = false;
    let completed = false;

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
            element.style.background = "var(--tile-background)";
            element.style.borderTop = cell.walls.top
                ? "2px solid var(--wall-border)"
                : "2px solid transparent";
            element.style.borderLeft = cell.walls.left
                ? "2px solid var(--wall-border)"
                : "2px solid transparent";
            element.style.borderRight =
                col === maze.cols - 1 && cell.walls.right
                    ? "2px solid var(--wall-border)"
                    : "0";
            element.style.borderBottom =
                row === maze.rows - 1 && cell.walls.bottom
                    ? "2px solid var(--wall-border)"
                    : "0";

            if (row === maze.start.row && col === maze.start.col) {
                element.innerHTML = "&#9679;";
                element.style.color = "var(--start-background)";
                element.style.fontSize = "clamp(0.7rem, 3vw, 1.3rem)";
            } else if (row === maze.goal.row && col === maze.goal.col) {
                element.innerHTML = "&#9733;";
                element.style.color = "var(--goal-background)";
                element.style.fontSize = "clamp(0.8rem, 3vw, 1.4rem)";
            }

            elements.set(`${row},${col}`, element);
            boardElement.appendChild(element);
        }
    }

    function renderPath() {
        const pathKeys = new Set(activePath.map(positionKey));

        elements.forEach((element, key) => {
            element.style.background = pathKeys.has(key)
                ? "color-mix(in srgb, var(--path-color) 42%, transparent)"
                : "var(--tile-background)";
        });
    }

    function resetAttempt() {
        activePath = [];
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
            previous.col === position.col
        ) {
            activePath.pop();
            renderPath();
            return;
        }

        if (
            activePath.some(item =>
                item.row === position.row && item.col === position.col
            ) ||
            !canMoveBetweenMazeCells(current, position, maze)
        ) {
            return;
        }

        activePath.push(position);
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

        if (
            !position ||
            position.row !== maze.start.row ||
            position.col !== maze.start.col
        ) {
            return;
        }

        event.preventDefault();
        boardElement.setPointerCapture?.(event.pointerId);
        activePath = [{ ...position }];
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
            resetAttempt();
        }
    }

    boardElement.addEventListener("pointerdown", handlePointerDown);
    boardElement.addEventListener("pointermove", handlePointerMove);
    boardElement.addEventListener("pointerup", handlePointerEnd);
    boardElement.addEventListener("pointercancel", handlePointerEnd);

    const controller = {
        reset: resetAttempt,
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
            delete boardElement.dataset.mazeV2;
        }
    };

    window.mazeV2PreviewController = controller;
    return controller;
}
