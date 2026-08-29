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

const generatedFingerprints = new Set();


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
    const maxSearchWork = 100000;
    const path = [[start[0], start[1]]];
    let searchWork = 0;

    function shuffle(tiles) {
        for (let index = tiles.length - 1; index > 0; index--) {
            const randomIndex =
                Math.floor(Math.random() * (index + 1));

            [tiles[index], tiles[randomIndex]] =
                [tiles[randomIndex], tiles[index]];
        }

        return tiles;
    }

    function search(currentRow, currentCol) {
        if (searchWork >= maxSearchWork) {
            return false;
        }

        searchWork++;

        const movesUsed = path.length - 1;
        const remainingMoves = targetLength - movesUsed;
        const distanceToGoal =
            Math.abs(currentRow - goal[0]) +
            Math.abs(currentCol - goal[1]);

        if (
            distanceToGoal > remainingMoves ||
            (remainingMoves - distanceToGoal) % 2 !== 0 ||
            (distanceToGoal === 1 && remainingMoves > 1)
        ) {
            return false;
        }

        if (remainingMoves === 0) {
            return currentRow === goal[0] &&
                currentCol === goal[1];
        }

        const legalNeighbors = shuffle(
            getNeighbors(currentRow, currentCol, size)
                .filter(([row, col]) => {
                    const isUsed =
                        pathContains(path, row, col);
                    const isGoal =
                        row === goal[0] && col === goal[1];
                    const entersGoalEarly =
                        isGoal && remainingMoves !== 1;
                    const touchesEarlierPath =
                        getNeighbors(row, col, size).some(
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
                })
        );

        for (const [nextRow, nextCol] of legalNeighbors) {
            path.push([nextRow, nextCol]);

            if (search(nextRow, nextCol)) {
                return true;
            }

            path.pop();

            if (searchWork >= maxSearchWork) {
                break;
            }
        }

        return false;
    }

    const found = search(start[0], start[1]);
    createDynamicPath.lastSearchWork = searchWork;

    return found ? path : null;
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


function createPathBasedCandidate(targetLength = 24) {
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

        const lastTile = path[path.length - 1];
        const fallbackMatchesCandidate =
            size === 9 &&
            path.length - 1 === targetLength &&
            lastTile[0] === goal[0] &&
            lastTile[1] === goal[1] &&
            path.every(
                ([pathRow, pathCol]) =>
                    pathRow >= 0 &&
                    pathRow < size &&
                    pathCol >= 0 &&
                    pathCol < size
            );

        if (!fallbackMatchesCandidate) {
            return null;
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

function createUniquePathCandidate(
    targetLength = 24,
    maxAttempts = 100
) {
    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {
        const candidate =
            createPathBasedCandidate(targetLength);

        if (candidate === null) {
            continue;
        }

        if (isDuplicateCandidate(candidate)) {
            continue;
        }

        console.log(
            "Unique candidate found after attempts:",
            attempt
        );

        return candidate;
    }

    return null;
}



function testPathCandidate() {
    const candidate =
        createPathBasedCandidate();

    if (candidate === null) {
        console.log(
            "Path candidate: no valid path found"
        );
        return;
    }

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

function createCandidateFingerprint(candidate) {
    const normalizedWalls =
        [...candidate.walls]
            .map(([row, col]) => `${row},${col}`)
            .sort();

    return JSON.stringify({
        size: candidate.size,
        start: candidate.start,
        goal: candidate.goal,
        walls: normalizedWalls
    });
}

function isDuplicateCandidate(candidate) {
    const fingerprint =
        createCandidateFingerprint(candidate);

    if (generatedFingerprints.has(fingerprint)) {
        return true;
    }

    generatedFingerprints.add(fingerprint);
    return false;
}


function testDuplicateDetection() {
    generatedFingerprints.clear();

    const candidate =
        createPathBasedCandidate(24);

    if (candidate === null) {
        console.log(
            "Duplicate test: candidate generation failed"
        );
        return;
    }

    const firstCheck =
        isDuplicateCandidate(candidate);

    const secondCheck =
        isDuplicateCandidate(candidate);

    console.log(
        "Duplicate test first check:",
        firstCheck
    );

    console.log(
        "Duplicate test second check:",
        secondCheck
    );
}

function testUniqueCandidateGeneration() {
    generatedFingerprints.clear();

    const first =
        createUniquePathCandidate(24);

    const second =
        createUniquePathCandidate(24);

    if (first === null || second === null) {
        console.log(
            "Unique generation test failed"
        );
        return;
    }

    const firstFingerprint =
        createCandidateFingerprint(first);

    const secondFingerprint =
        createCandidateFingerprint(second);

    console.log(
        "Unique candidates are different:",
        firstFingerprint !== secondFingerprint
    );
}



automationReady();
testPathCandidate();
testDynamicPath();
testDuplicateDetection();
testUniqueCandidateGeneration();