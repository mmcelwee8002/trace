function automationReady() {
    console.log("Trace automation ready");

    console.log(
        "applyMove available:",
        typeof applyMove === "function"
    );

    console.log(
        "solver available:",
        typeof findShortestPathLength === "function"
    );

    console.log(
        "normalizer available:",
        typeof normalizeLevel === "function"
    );
}

function createRandomWallCandidate() {
    const size = 9;

    const start = [8, 0];
    const goal = [0, 8];

    const walls = [];

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {

            const isStart =
                row === start[0] &&
                col === start[1];

            const isGoal =
                row === goal[0] &&
                col === goal[1];

            if (isStart || isGoal) {
                continue;
            }

            const shouldBeWall =
                Math.random() < 0.25;

            if (shouldBeWall) {
                walls.push([row, col]);
            }
        }
    }

    return {
        id: "AUTO-RANDOM",
        title: "Random Test",
        size,
        start,
        goal,
        walls,

        switches: [],
        switchGates: [],

        keys: [],
        lockGroups: [],

        requiredArrows: []
    };
}

function createStructuredWallCandidate() {
    const size = 9;

    const start = [8, 0];
    const goal = [0, 8];

    const walls = [];

    const segmentCount = 10;

    for (let i = 0; i < segmentCount; i++) {
        const horizontal =
            Math.random() < 0.5;

        const length =
            2 + Math.floor(Math.random() * 4);

        const startRow =
            Math.floor(Math.random() * size);

        const startCol =
            Math.floor(Math.random() * size);

        for (let step = 0; step < length; step++) {
            const row =
                horizontal
                    ? startRow
                    : startRow + step;

            const col =
                horizontal
                    ? startCol + step
                    : startCol;

            if (
                row < 0 ||
                row >= size ||
                col < 0 ||
                col >= size
            ) {
                continue;
            }

            const isStart =
                row === start[0] &&
                col === start[1];

            const isGoal =
                row === goal[0] &&
                col === goal[1];

            if (isStart || isGoal) {
                continue;
            }

            const alreadyWall =
                walls.some(
                    wall =>
                        wall[0] === row &&
                        wall[1] === col
                );

            if (!alreadyWall) {
                walls.push([row, col]);
            }
        }
    }

    return {
        id: "AUTO-STRUCTURED",
        title: "Structured Test",
        size,
        start,
        goal,
        walls,

        switches: [],
        switchGates: [],

        keys: [],
        lockGroups: [],

        requiredArrows: []
    };
}


function getNeighbors(row, col, size) {
    const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
    ];

    return neighbors.filter(
        ([r, c]) =>
            r >= 0 &&
            r < size &&
            c >= 0 &&
            c < size
    );
}

function pathContains(path, row, col) {
    return path.some(
        ([r, c]) =>
            r === row &&
            c === col
    );
}


function createDynamicPath(size, start, goal, targetLength) {
    const maxAttempts = 200;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const path = [
            [start[0], start[1]]
        ];

        let currentRow = start[0];
        let currentCol = start[1];

        while (path.length - 1 < targetLength) {
            const neighbors =
                getNeighbors(
                    currentRow,
                    currentCol,
                    size
                );

            const unusedNeighbors =
                neighbors.filter(
                    ([row, col]) => {
                        const isUsed =
                            pathContains(
                                path,
                                row,
                                col
                            );

                        const entersGoalEarly =
                            row === goal[0] &&
                            col === goal[1] &&
                            path.length !== targetLength;

                        const touchesEarlierPath =
                            getNeighbors(
                                row,
                                col,
                                size
                            ).some(
                                ([neighborRow, neighborCol]) =>
                                    pathContains(
                                        path,
                                        neighborRow,
                                        neighborCol
                                    ) &&
                                    !(
                                        neighborRow === currentRow &&
                                        neighborCol === currentCol
                                    )
                            );

                        return !isUsed &&
                            !entersGoalEarly &&
                            !touchesEarlierPath;
                    }
                );

            if (unusedNeighbors.length === 0) {
                break;
            }

            const next =
                unusedNeighbors[
                Math.floor(
                    Math.random() *
                    unusedNeighbors.length
                )
                ];

            currentRow = next[0];
            currentCol = next[1];

            path.push([
                currentRow,
                currentCol
            ]);
        }

        const lastTile =
            path[path.length - 1];

        const endsAtGoal =
            lastTile[0] === goal[0] &&
            lastTile[1] === goal[1];

        if (
            path.length - 1 === targetLength &&
            endsAtGoal
        ) {
            console.log(
                "Dynamic path found after attempts:",
                attempt
            );

            return path;
        }
    }

    return null;
}
function testDynamicPath() {
    const path =
        createDynamicPath(
            9,
            [8, 0],
            [0, 8],
            24
        );

    if (path === null) {
        console.log(
            "Dynamic path: no valid path found"
        );
        return;
    }

    console.log(
        "Dynamic path length:",
        path.length - 1
    );

    console.log(
        "Dynamic path:",
        path
    );
}

function chooseBoardSize(targetLength) {
    if (targetLength <= 28) {
        return 9;
    }

    if (targetLength <= 40) {
        return 11;
    }

    return 15;
}



function createPathBasedCandidate(targetLength = 44) {
    const size = chooseBoardSize(targetLength);
    const start = [size - 1, 0];
    const goal = [0, size - 1];

    let path =
        createDynamicPath(
            size,
            start,
            goal,
            targetLength
        );

    // Retain the old hard-coded routes as a safe fallback while
    // the dynamic path generator is being verified.
    if (path === null) {
        path = [];

        let row = start[0];
        let col = start[1];

        path.push([row, col]);

        function walkTo(targetRow, targetCol) {
            while (row !== targetRow) {
                row += targetRow > row ? 1 : -1;
                path.push([row, col]);
            }

            while (col !== targetCol) {
                col += targetCol > col ? 1 : -1;
                path.push([row, col]);
            }
        }

        if (targetLength <= 24) {
            walkTo(4, 0);
            walkTo(4, 6);
            walkTo(8, 6);
            walkTo(8, 8);
            walkTo(0, 8);
        } else {
            walkTo(6, 0);
            walkTo(6, 6);
            walkTo(8, 6);
            walkTo(8, 8);
            walkTo(4, 8);
            walkTo(4, 2);
            walkTo(2, 2);
            walkTo(2, 6);
            walkTo(0, 6);
            walkTo(0, 8);
        }
    }

    const walls = [];

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {

            const isPathTile =
                path.some(
                    tile =>
                        tile[0] === r &&
                        tile[1] === c
                );

            if (!isPathTile) {
                walls.push([r, c]);
            }
        }
    }

    return {
        id: "AUTO-PATH",
        title: "Path Test",
        size,
        start,
        goal,
        walls,

        switches: [],
        switchGates: [],

        keys: [],
        lockGroups: [],

        requiredArrows: [],
        targetLength,
        path
    };
}


function testPathCandidate() {
    const candidate =
        createPathBasedCandidate();

    const normalized =
        normalizeLevel(candidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Path candidate target:",
        candidate.targetLength
    );

    console.log(
        "Path candidate planned length:",
        candidate.path.length - 1
    );

    console.log(
        "Path candidate solver optimal:",
        optimal
    );

    console.log(
        "Path candidate walls:",
        candidate.walls.length
    );
console.log(
    "Path candidate board size:",
    candidate.size
);



}






automationReady();
testPathCandidate();
testDynamicPath();
