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

function createPathBasedCandidate() {
    const size = 9;
    const targetLength = 24;
    const start = [8, 0];
    const goal = [0, 8];

    const path = [];

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
}






automationReady();
testPathCandidate();

