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
    const normalizeCoords = (coords = []) =>
        coords
            .map(([row, col]) => `${row},${col}`)
            .sort();

    const normalizeKeys = (keys = []) =>
        keys
            .map(key => ({
                id: key.id,
                position: `${key.position[0]},${key.position[1]}`
            }))
            .sort((a, b) => a.id.localeCompare(b.id));

    const normalizeLockGroups = (groups = []) =>
        groups
            .map(group => ({
                keyId: group.keyId,
                tiles: normalizeCoords(group.tiles)
            }))
            .sort((a, b) => a.keyId.localeCompare(b.keyId));

    const normalizeSwitches = (switches = []) =>
        switches
            .map(sw => ({
                id: sw.id,
                position: `${sw.position[0]},${sw.position[1]}`
            }))
            .sort((a, b) => a.id.localeCompare(b.id));

    const normalizeSwitchGates = (groups = []) =>
        groups
            .map(group => ({
                switchId: group.switchId,
                tiles: normalizeCoords(group.tiles)
            }))
            .sort((a, b) =>
                a.switchId.localeCompare(b.switchId)
            );

    return JSON.stringify({
        size: candidate.size,
        start: candidate.start,
        goal: candidate.goal,
        walls: normalizeCoords(candidate.walls),

        keys: normalizeKeys(candidate.keys),
        lockGroups:
            normalizeLockGroups(candidate.lockGroups),

        switches:
            normalizeSwitches(candidate.switches),
        switchGates:
            normalizeSwitchGates(candidate.switchGates),

        requiredArrows:
            candidate.requiredArrows ?? []
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

function addSwitchGateToCandidate(
    candidate,
    maxAttempts = 50
) {
    if (!candidate || !candidate.path) {
        return null;
    }

    const path = candidate.path;

    if (path.length < 10) {
        return null;
    }

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {
        const minSwitchIndex = 2;

        const maxSwitchIndex =
            Math.floor(path.length * 0.45);

        const switchIndex =
            minSwitchIndex +
            Math.floor(
                Math.random() *
                (maxSwitchIndex - minSwitchIndex + 1)
            );

        const minGateIndex =
            switchIndex + 3;

        const maxGateIndex =
            path.length - 2;

        if (minGateIndex > maxGateIndex) {
            continue;
        }

        const gateIndex =
            minGateIndex +
            Math.floor(
                Math.random() *
                (maxGateIndex - minGateIndex + 1)
            );

        const switchPosition =
            path[switchIndex];

        const gatePosition =
            path[gateIndex];

        const updated =
            structuredClone(candidate);

        updated.switches = [
            {
                id: "S1",
                position: switchPosition
            }
        ];

        updated.switchGates = [
            {
                switchId: "S1",
                tiles: [
                    gatePosition
                ]
            }
        ];

        if (!validateRequiredSwitch(updated)) {
            continue;
        }

        console.log(
            "Valid switch placement found after attempts:",
            attempt
        );

        return updated;
    }

    return null;
}


function validateRequiredSwitch(candidate) {
    if (
        !candidate ||
        !candidate.path ||
        !candidate.switches ||
        !candidate.switchGates ||
        candidate.switches.length === 0 ||
        candidate.switchGates.length === 0
    ) {
        return false;
    }

    const normalized =
        normalizeLevel(candidate);

    const normalOptimal =
        findShortestPathLength(normalized);

    if (normalOptimal === null) {
        return false;
    }

    const brokenCandidate =
        structuredClone(candidate);

    const path =
        brokenCandidate.path;

    const gatePosition =
        brokenCandidate.switchGates[0].tiles[0];

    const gateIndex =
        path.findIndex(
            ([row, col]) =>
                row === gatePosition[0] &&
                col === gatePosition[1]
        );

    if (gateIndex === -1) {
        return false;
    }

    const lateSwitchIndex =
        Math.min(
            path.length - 2,
            gateIndex + 2
        );

    if (lateSwitchIndex <= gateIndex) {
        return false;
    }

    brokenCandidate.switches[0].position =
        path[lateSwitchIndex];

    const brokenNormalized =
        normalizeLevel(brokenCandidate);

    const brokenOptimal =
        findShortestPathLength(
            brokenNormalized
        );

    return brokenOptimal === null;
}

function addRequiredArrowToCandidate(candidate) {
    if (!candidate || !candidate.path) {
        return null;
    }

    const path = candidate.path;

    if (path.length < 6) {
        return null;
    }

    // Keep the arrow away from Start and Goal.
    const minIndex = 2;
    const maxIndex = path.length - 3;

    const arrowIndex =
        minIndex +
        Math.floor(
            Math.random() *
            (maxIndex - minIndex + 1)
        );

    const current =
        path[arrowIndex];

    const next =
        path[arrowIndex + 1];

    const rowChange =
        next[0] - current[0];

    const colChange =
        next[1] - current[1];

    let direction = null;

    if (rowChange === -1) {
        direction = "up";
    } else if (rowChange === 1) {
        direction = "down";
    } else if (colChange === -1) {
        direction = "left";
    } else if (colChange === 1) {
        direction = "right";
    }

    if (direction === null) {
        return null;
    }

    const updated =
        structuredClone(candidate);

    updated.requiredArrows = [
    {
        position: current,
        direction
    }
];

if (!validateRequiredArrow(updated)) {
    return null;
}

return updated;
}


function validateRequiredArrow(candidate) {
    if (
        !candidate ||
        !candidate.path ||
        !candidate.requiredArrows ||
        candidate.requiredArrows.length === 0
    ) {
        return false;
    }

    const arrow =
        candidate.requiredArrows[0];

    const path = candidate.path;

    const arrowIndex =
        path.findIndex(
            ([row, col]) =>
                row === arrow.position[0] &&
                col === arrow.position[1]
        );

    if (
        arrowIndex === -1 ||
        arrowIndex >= path.length - 1
    ) {
        return false;
    }

    const current =
        path[arrowIndex];

    const next =
        path[arrowIndex + 1];

    const rowChange =
        next[0] - current[0];

    const colChange =
        next[1] - current[1];

    let expectedDirection = null;

    if (rowChange === -1) {
        expectedDirection = "up";
    } else if (rowChange === 1) {
        expectedDirection = "down";
    } else if (colChange === -1) {
        expectedDirection = "left";
    } else if (colChange === 1) {
        expectedDirection = "right";
    }

    if (
        expectedDirection === null ||
        arrow.direction !== expectedDirection
    ) {
        return false;
    }

    const normalized =
        normalizeLevel(candidate);

    const optimal =
        findShortestPathLength(normalized);

    return (
        optimal !== null &&
        optimal === path.length - 1
    );
}

function addSwitchAndArrowToCandidate(candidate) {
    if (!candidate) {
        return null;
    }

    const withSwitch =
        addSwitchGateToCandidate(candidate);

    if (withSwitch === null) {
        return null;
    }

    const withArrow =
        addRequiredArrowToCandidate(withSwitch);

    if (withArrow === null) {
        return null;
    }

    const normalized =
        normalizeLevel(withArrow);

    const optimal =
        findShortestPathLength(normalized);

    if (
        optimal === null ||
        optimal !== withArrow.path.length - 1
    ) {
        return null;
    }

    return withArrow;
}

//Test Functions 

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

function testMechanicFingerprint() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Mechanic fingerprint test: candidate generation failed"
        );
        return;
    }

    const withSwitch =
        structuredClone(baseCandidate);

    withSwitch.switches = [
        {
            id: "S1",
            position: [6, 2]
        }
    ];

    withSwitch.switchGates = [
        {
            switchId: "S1",
            tiles: [
                [4, 4]
            ]
        }
    ];

    const baseFingerprint =
        createCandidateFingerprint(
            baseCandidate
        );

    const switchFingerprint =
        createCandidateFingerprint(
            withSwitch
        );

    console.log(
        "Mechanic fingerprints are different:",
        baseFingerprint !== switchFingerprint
    );
}

function testSwitchGateCandidate() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Switch gate test: base candidate generation failed"
        );
        return;
    }

    const switchCandidate =
        addSwitchGateToCandidate(baseCandidate);

    if (switchCandidate === null) {
        console.log(
            "Switch gate test: mechanic placement failed"
        );
        return;
    }

    const normalized =
        normalizeLevel(switchCandidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Switch gate test target:",
        switchCandidate.targetLength
    );

    console.log(
        "Switch gate test planned length:",
        switchCandidate.path.length - 1
    );

    console.log(
        "Switch gate test optimal:",
        optimal
    );

    console.log(
        "Switch position:",
        switchCandidate.switches[0].position
    );

    console.log(
        "Gate position:",
        switchCandidate.switchGates[0].tiles[0]
    );
}

function testSwitchRequirement() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Switch requirement test: base generation failed"
        );
        return;
    }

    const switchCandidate =
        addSwitchGateToCandidate(baseCandidate);

    if (switchCandidate === null) {
        console.log(
            "Switch requirement test: mechanic placement failed"
        );
        return;
    }

    const brokenCandidate =
        structuredClone(switchCandidate);

    const path =
        brokenCandidate.path;

    const lateSwitchIndex =
        Math.floor(path.length * 0.9);

    brokenCandidate.switches[0].position =
        path[lateSwitchIndex];

    const normalized =
        normalizeLevel(brokenCandidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Switch requirement test with switch after gate:",
        optimal
    );
}


function testRequiredSwitchValidation() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Required switch validation test: base generation failed"
        );
        return;
    }

    const switchCandidate =
        addSwitchGateToCandidate(baseCandidate);

    if (switchCandidate === null) {
        console.log(
            "Required switch validation test: mechanic placement failed"
        );
        return;
    }

    const isRequired =
        validateRequiredSwitch(switchCandidate);

    console.log(
        "Required switch validation:",
        isRequired
    );
}

function testRequiredArrowCandidate() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Required arrow test: base generation failed"
        );
        return;
    }

    const arrowCandidate =
        addRequiredArrowToCandidate(baseCandidate);

    if (arrowCandidate === null) {
        console.log(
            "Required arrow test: arrow placement failed"
        );
        return;
    }

    const normalized =
        normalizeLevel(arrowCandidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Required arrow test target:",
        arrowCandidate.targetLength
    );

    console.log(
        "Required arrow test planned length:",
        arrowCandidate.path.length - 1
    );

    console.log(
        "Required arrow test optimal:",
        optimal
    );

    console.log(
        "Required arrow:",
        arrowCandidate.requiredArrows[0]
    );
}

function testRequiredArrowRequirement() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Required arrow requirement test: base generation failed"
        );
        return;
    }

    const arrowCandidate =
        addRequiredArrowToCandidate(baseCandidate);

    if (arrowCandidate === null) {
        console.log(
            "Required arrow requirement test: arrow placement failed"
        );
        return;
    }

    const brokenCandidate =
        structuredClone(arrowCandidate);

    const arrow =
        brokenCandidate.requiredArrows[0];

    const oppositeDirection = {
        up: "down",
        down: "up",
        left: "right",
        right: "left"
    };

    arrow.direction =
        oppositeDirection[arrow.direction];

    const normalized =
        normalizeLevel(brokenCandidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Required arrow requirement test with reversed arrow:",
        optimal
    );
}

function testRequiredArrowValidation() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Required arrow validation test: base generation failed"
        );
        return;
    }

    const arrowCandidate =
        addRequiredArrowToCandidate(baseCandidate);

    if (arrowCandidate === null) {
        console.log(
            "Required arrow validation test: arrow placement failed"
        );
        return;
    }

    const isValid =
        validateRequiredArrow(arrowCandidate);

    console.log(
        "Required arrow validation:",
        isValid
    );
}

function testSwitchAndArrowCandidate() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Combined mechanic test: base generation failed"
        );
        return;
    }

    const combinedCandidate =
        addSwitchAndArrowToCandidate(baseCandidate);

    if (combinedCandidate === null) {
        console.log(
            "Combined mechanic test: placement failed"
        );
        return;
    }

    const normalized =
        normalizeLevel(combinedCandidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Combined mechanic target:",
        combinedCandidate.targetLength
    );

    console.log(
        "Combined mechanic planned length:",
        combinedCandidate.path.length - 1
    );

    console.log(
        "Combined mechanic optimal:",
        optimal
    );

    console.log(
        "Combined switch:",
        combinedCandidate.switches[0]
    );

    console.log(
        "Combined gate:",
        combinedCandidate.switchGates[0]
    );

    console.log(
        "Combined arrow:",
        combinedCandidate.requiredArrows[0]
    );
}


automationReady();
testPathCandidate();
testDynamicPath();
testDuplicateDetection();
testUniqueCandidateGeneration();
testMechanicFingerprint();
testSwitchGateCandidate();
testSwitchRequirement();
testRequiredSwitchValidation();
testRequiredArrowCandidate();
testRequiredArrowRequirement();
testRequiredArrowValidation();
testSwitchAndArrowCandidate();