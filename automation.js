

const generatedFingerprints = new Set();

const difficultyProfiles = {
    easy: {
        targetLength: 20,
        keys: 0,
        switches: 1,
        arrows: 0,
        branchCount: 0,
        maxBranchLength: 0,
        openFraction: 0.05,
        minOpenRegionSize: 1,
        maxOpenRegionSize: 2
    },
    medium: {
        targetLength: 28,
        keys: 1,
        switches: 1,
        arrows: 1,
        branchCount: 2,
        maxBranchLength: 3,
        openFraction: 0.20,
        minOpenRegionSize: 2,
        maxOpenRegionSize: 4
    },
    hard: {
        targetLength: 36,
        keys: 2,
        switches: 1,
        arrows: 1,
        branchCount: 3,
        maxBranchLength: 4,
        openFraction: 0.35,
        minOpenRegionSize: 3,
        maxOpenRegionSize: 6
    },
    extreme: {
        targetLength: 44,
        keys: 2,
        switches: 2,
        arrows: 1,
        branchCount: 4,
        maxBranchLength: 5,
        openFraction: 0.50,
        minOpenRegionSize: 4,
        maxOpenRegionSize: 8
    }
};

const experimentalOpenBoardProfiles = {
    easy: { targetWalkableFraction: 0.40 },
    medium: { targetWalkableFraction: 0.55 },
    hard: {
        targetWalkableFraction: 0.65,
        keys: 1,
        switches: 0,
        arrows: 1
    },
    extreme: { targetWalkableFraction: 0.75 }
};

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
        normalizeGeneratedCandidate(candidate);

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

    return optimal !== null;
}

function addKeyGateToCandidate(
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
        const minKeyIndex = 2;

        const maxKeyIndex =
            Math.floor(path.length * 0.45);

        const keyIndex =
            minKeyIndex +
            Math.floor(
                Math.random() *
                (maxKeyIndex - minKeyIndex + 1)
            );

        const minGateIndex =
            keyIndex + 3;

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

        const keyPosition =
            path[keyIndex];

        const gatePosition =
            path[gateIndex];

        const updated =
            structuredClone(candidate);

        updated.keys = [
            {
                id: "A",
                position: keyPosition
            }
        ];

        updated.lockGroups = [
            {
                keyId: "A",
                tiles: [
                    gatePosition
                ]
            }
        ];

        if (!validateRequiredKey(updated)) {
            continue;
        }

        console.log(
            "Valid key placement found after attempts:",
            attempt
        );

        return updated;
    }

    return null;
}

function validateRequiredKey(candidate) {
    if (
        !candidate ||
        !candidate.path ||
        !candidate.keys ||
        !candidate.lockGroups ||
        candidate.keys.length === 0 ||
        candidate.lockGroups.length === 0
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
        brokenCandidate.lockGroups[0].tiles[0];

    const gateIndex =
        path.findIndex(
            ([row, col]) =>
                row === gatePosition[0] &&
                col === gatePosition[1]
        );

    if (gateIndex === -1) {
        return false;
    }

    const lateKeyIndex =
        Math.min(
            path.length - 2,
            gateIndex + 2
        );

    if (lateKeyIndex <= gateIndex) {
        return false;
    }

    brokenCandidate.keys[0].position =
        path[lateKeyIndex];

    const brokenNormalized =
        normalizeLevel(brokenCandidate);

    const brokenOptimal =
        findShortestPathLength(
            brokenNormalized
        );

    return brokenOptimal === null;
}

function addTwoSwitchesToCandidate(
    candidate,
    maxAttempts = 50
) {
    if (!candidate || !candidate.path) {
        return null;
    }

    const path = candidate.path;

    if (path.length < 16) {
        return null;
    }

    const sameTile = (a, b) =>
        a[0] === b[0] &&
        a[1] === b[1];

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {
        const updated =
            structuredClone(candidate);

        const s1Index =
            2 +
            Math.floor(
                Math.random() *
                Math.max(
                    1,
                    Math.floor(path.length * 0.25) - 1
                )
            );

        const g1Min =
            s1Index + 3;

        const g1Max =
            Math.floor(path.length * 0.5);

        if (g1Min > g1Max) {
            continue;
        }

        const g1Index =
            g1Min +
            Math.floor(
                Math.random() *
                (g1Max - g1Min + 1)
            );

        const s2Min =
            g1Index + 2;

        const s2Max =
            Math.floor(path.length * 0.7);

        if (s2Min > s2Max) {
            continue;
        }

        const s2Index =
            s2Min +
            Math.floor(
                Math.random() *
                (s2Max - s2Min + 1)
            );

        const g2Min =
            s2Index + 3;

        const g2Max =
            path.length - 2;

        if (g2Min > g2Max) {
            continue;
        }

        const g2Index =
            g2Min +
            Math.floor(
                Math.random() *
                (g2Max - g2Min + 1)
            );

        const s1Position =
            path[s1Index];

        const g1Position =
            path[g1Index];

        const s2Position =
            path[s2Index];

        const g2Position =
            path[g2Index];

        const positions = [
            s1Position,
            g1Position,
            s2Position,
            g2Position
        ];

        let hasConflict = false;

        for (
            let i = 0;
            i < positions.length;
            i++
        ) {
            for (
                let j = i + 1;
                j < positions.length;
                j++
            ) {
                if (
                    sameTile(
                        positions[i],
                        positions[j]
                    )
                ) {
                    hasConflict = true;
                }
            }
        }

        if (hasConflict) {
            continue;
        }

        updated.switches = [
            {
                id: "S1",
                position: s1Position
            },
            {
                id: "S2",
                position: s2Position
            }
        ];

        updated.switchGates = [
            {
                switchId: "S1",
                tiles: [
                    g1Position
                ]
            },
            {
                switchId: "S2",
                tiles: [
                    g2Position
                ]
            }
        ];

        const normalized =
            normalizeLevel(updated);

        const optimal =
            findShortestPathLength(normalized);

        if (
            optimal === null ||
            optimal !== path.length - 1
        ) {
            continue;
        }

        if (!validateRequiredSwitchGroups(updated)) {
            continue;
        }

        console.log(
            "Valid two-switch placement found after attempts:",
            attempt
        );

        return updated;
    }

    return null;
}


function addTwoKeysToCandidate(
    candidate,
    maxAttempts = 50
) {
    if (!candidate || !candidate.path) {
        return null;
    }

    const path = candidate.path;

    if (path.length < 16) {
        return null;
    }

    const sameTile = (a, b) =>
        a[0] === b[0] &&
        a[1] === b[1];

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {
        const updated =
            structuredClone(candidate);

        const k1Index =
            2 +
            Math.floor(
                Math.random() *
                Math.max(
                    1,
                    Math.floor(path.length * 0.25) - 1
                )
            );

        const g1Min =
            k1Index + 3;

        const g1Max =
            Math.floor(path.length * 0.5);

        if (g1Min > g1Max) {
            continue;
        }

        const g1Index =
            g1Min +
            Math.floor(
                Math.random() *
                (g1Max - g1Min + 1)
            );

        const k2Min =
            g1Index + 2;

        const k2Max =
            Math.floor(path.length * 0.7);

        if (k2Min > k2Max) {
            continue;
        }

        const k2Index =
            k2Min +
            Math.floor(
                Math.random() *
                (k2Max - k2Min + 1)
            );

        const g2Min =
            k2Index + 3;

        const g2Max =
            path.length - 2;

        if (g2Min > g2Max) {
            continue;
        }

        const g2Index =
            g2Min +
            Math.floor(
                Math.random() *
                (g2Max - g2Min + 1)
            );

        const k1Position =
            path[k1Index];

        const g1Position =
            path[g1Index];

        const k2Position =
            path[k2Index];

        const g2Position =
            path[g2Index];

        const positions = [
            k1Position,
            g1Position,
            k2Position,
            g2Position
        ];

        let hasConflict = false;

        for (
            let i = 0;
            i < positions.length;
            i++
        ) {
            for (
                let j = i + 1;
                j < positions.length;
                j++
            ) {
                if (
                    sameTile(
                        positions[i],
                        positions[j]
                    )
                ) {
                    hasConflict = true;
                }
            }
        }

        if (hasConflict) {
            continue;
        }

        updated.keys = [
            {
                id: "A",
                position: k1Position
            },
            {
                id: "B",
                position: k2Position
            }
        ];

        updated.lockGroups = [
            {
                keyId: "A",
                tiles: [
                    g1Position
                ]
            },
            {
                keyId: "B",
                tiles: [
                    g2Position
                ]
            }
        ];

        const normalized =
            normalizeLevel(updated);

        const optimal =
            findShortestPathLength(normalized);

        if (
            optimal === null ||
            optimal !== path.length - 1
        ) {
            continue;
        }
        if (!validateRequiredKeyGroups(updated)) {
            continue;
        }


        console.log(
            "Valid two-key placement found after attempts:",
            attempt
        );

        return updated;
    }

    return null;
}

function validateRequiredSwitchGroups(candidate) {
    if (
        !candidate ||
        !candidate.path ||
        !candidate.switches ||
        !candidate.switchGates ||
        candidate.switches.length < 2 ||
        candidate.switchGates.length < 2
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

    const path = candidate.path;

    for (let i = 0; i < candidate.switches.length; i++) {
        const brokenCandidate =
            structuredClone(candidate);

        const gatePosition =
            brokenCandidate.switchGates[i].tiles[0];

        const gateIndex =
            path.findIndex(
                ([row, col]) =>
                    row === gatePosition[0] &&
                    col === gatePosition[1]
            );

        if (gateIndex === -1) {
            return false;
        }

        const otherSwitchPositions =
            brokenCandidate.switches
                .filter((_, index) => index !== i)
                .map(sw => sw.position);

        let lateSwitchPosition = null;

        for (
            let pathIndex = gateIndex + 1;
            pathIndex < path.length - 1;
            pathIndex++
        ) {
            const position =
                path[pathIndex];

            const conflicts =
                otherSwitchPositions.some(
                    other =>
                        other[0] === position[0] &&
                        other[1] === position[1]
                );

            if (!conflicts) {
                lateSwitchPosition = position;
                break;
            }
        }

        if (lateSwitchPosition === null) {
            return false;
        }

        brokenCandidate.switches[i].position =
            lateSwitchPosition;

        const brokenNormalized =
            normalizeLevel(brokenCandidate);

        const brokenOptimal =
            findShortestPathLength(
                brokenNormalized
            );

        if (brokenOptimal !== null) {
            return false;
        }
    }

    return true;
}

function validateRequiredKeyGroups(candidate) {
    if (
        !candidate ||
        !candidate.path ||
        !candidate.keys ||
        !candidate.lockGroups ||
        candidate.keys.length < 2 ||
        candidate.lockGroups.length < 2
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

    for (let i = 0; i < candidate.keys.length; i++) {
        const broken =
            structuredClone(candidate);

        const key =
            broken.keys[i];

        const gateGroup =
            broken.lockGroups.find(
                group => group.keyId === key.id
            );

        if (!gateGroup) {
            return false;
        }

        const gatePosition =
            gateGroup.tiles[0];

        const gateIndex =
            broken.path.findIndex(
                ([row, col]) =>
                    row === gatePosition[0] &&
                    col === gatePosition[1]
            );

        if (gateIndex === -1) {
            return false;
        }

        const otherKeyPositions =
            broken.keys
                .filter((_, index) => index !== i)
                .map(otherKey => otherKey.position);

        let lateKeyPosition = null;

        for (
            let pathIndex = gateIndex + 1;
            pathIndex < broken.path.length - 1;
            pathIndex++
        ) {
            const position =
                broken.path[pathIndex];

            const conflicts =
                otherKeyPositions.some(
                    other =>
                        other[0] === position[0] &&
                        other[1] === position[1]
                );

            if (!conflicts) {
                lateKeyPosition = position;
                break;
            }
        }

        if (!lateKeyPosition) {
            return false;
        }

        broken.keys[i].position =
            lateKeyPosition;

        const brokenNormalized =
            normalizeLevel(broken);

        const brokenOptimal =
            findShortestPathLength(
                brokenNormalized
            );

        if (brokenOptimal !== null) {
            return false;
        }
    }

    return true;
}

function addMechanicsToCandidate(
    candidate,
    options = {},
    maxAttempts = 50
) {
    if (!candidate || !candidate.path) {
        return null;
    }

    const {
        keys = 0,
        switches = 0,
        arrows = 0
    } = options;

    const sameTile = (a, b) =>
        a[0] === b[0] &&
        a[1] === b[1];

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {
        let updated =
            structuredClone(candidate);

        if (keys === 1) {
            updated =
                addKeyGateToCandidate(updated);
        } else if (keys === 2) {
            updated =
                addTwoKeysToCandidate(updated);
        }

        if (!updated) {
            continue;
        }

        if (switches === 1) {
            updated =
                addSwitchGateToCandidate(updated);
        } else if (switches === 2) {
            updated =
                addTwoSwitchesToCandidate(updated);
        }

        if (!updated) {
            continue;
        }

        for (
            let i = 0;
            i < arrows;
            i++
        ) {
            updated =
                addRequiredArrowToCandidate(updated);

            if (!updated) {
                break;
            }
        }

        if (!updated) {
            continue;
        }

        const occupiedPositions = [];

        if (updated.keys) {
            occupiedPositions.push(
                ...updated.keys.map(
                    key => key.position
                )
            );
        }

        if (updated.lockGroups) {
            occupiedPositions.push(
                ...updated.lockGroups.flatMap(
                    group => group.tiles
                )
            );
        }

        if (updated.switches) {
            occupiedPositions.push(
                ...updated.switches.map(
                    sw => sw.position
                )
            );
        }

        if (updated.switchGates) {
            occupiedPositions.push(
                ...updated.switchGates.flatMap(
                    group => group.tiles
                )
            );
        }

        if (updated.requiredArrows) {
            occupiedPositions.push(
                ...updated.requiredArrows.map(
                    arrow => arrow.position
                )
            );
        }

        let hasConflict = false;

        for (
            let i = 0;
            i < occupiedPositions.length;
            i++
        ) {
            for (
                let j = i + 1;
                j < occupiedPositions.length;
                j++
            ) {
                if (
                    sameTile(
                        occupiedPositions[i],
                        occupiedPositions[j]
                    )
                ) {
                    hasConflict = true;
                }
            }
        }

        if (hasConflict) {
            continue;
        }

        const normalized =
            normalizeLevel(updated);

        const optimal =
            findShortestPathLength(normalized);

        if (
            optimal === null ||
            optimal !== updated.path.length - 1
        ) {
            continue;
        }

        console.log(
            "Valid mixed mechanic placement found after attempts:",
            attempt
        );

        return updated;
    }

    return null;
}

function createCandidateForDifficulty(difficulty) {
    createCandidateForDifficulty.lastFailureReason = null;

    if (!Object.hasOwn(difficultyProfiles, difficulty)) {
        createCandidateForDifficulty.lastFailureReason =
            "invalid-difficulty";
        return null;
    }

    const profile = difficultyProfiles[difficulty];
    const candidate =
        createUniquePathCandidate(profile.targetLength);

    if (!candidate) {
        createCandidateForDifficulty.lastFailureReason =
            "base-generation";
        return null;
    }

    let completedCandidate =
        addMechanicsToCandidate(candidate, {
            keys: profile.keys,
            switches: profile.switches,
            arrows: profile.arrows
        });

    if (!completedCandidate) {
        createCandidateForDifficulty.lastFailureReason =
            "mechanic-placement";
        return null;
    }

    completedCandidate = openCandidateSpace(
        completedCandidate,
        {
            openFraction: profile.openFraction,
            minOpenRegionSize: profile.minOpenRegionSize,
            maxOpenRegionSize: profile.maxOpenRegionSize,
            difficulty
        }
    );

    if (!completedCandidate) {
        createCandidateForDifficulty.lastFailureReason =
            openCandidateSpace.lastFailureReason ||
            "open-space";
        logOpenSpaceRejection(
            difficulty,
            createCandidateForDifficulty.lastFailureReason,
            openCandidateSpace.lastDiagnostics
        );
        return null;
    }
    return completedCandidate;
}

function normalizeGeneratedCandidate(candidate) {
    return normalizeLevel({
        ...candidate,
        oneWays: candidate.requiredArrows ??
            candidate.oneWays ??
            []
    });
}

function validateGeneratedMechanics(candidate) {
    validateGeneratedMechanics.lastFailureReason = null;

    const keyCount = candidate.keys?.length ?? 0;
    const switchCount = candidate.switches?.length ?? 0;
    const arrowCount =
        candidate.requiredArrows?.length ?? 0;

    if (
        keyCount === 1 &&
        !validateRequiredKey(candidate)
    ) {
        validateGeneratedMechanics.lastFailureReason =
            "key-validation";
        return false;
    }

    if (
        keyCount >= 2 &&
        !validateRequiredKeyGroups(candidate)
    ) {
        validateGeneratedMechanics.lastFailureReason =
            "key-validation";
        return false;
    }

    if (
        switchCount === 1 &&
        !validateRequiredSwitch(candidate)
    ) {
        validateGeneratedMechanics.lastFailureReason =
            "switch-validation";
        return false;
    }

    if (
        switchCount >= 2 &&
        !validateRequiredSwitchGroups(candidate)
    ) {
        validateGeneratedMechanics.lastFailureReason =
            "switch-validation";
        return false;
    }

    if (
        arrowCount > 0 &&
        !validateRequiredArrow(candidate)
    ) {
        validateGeneratedMechanics.lastFailureReason =
            "arrow-validation";
        return false;
    }

    return true;
}

function logOpenSpaceRejection(
    difficulty,
    reason,
    diagnostics = {}
) {
    if (difficulty !== "hard" && difficulty !== "extreme") {
        return;
    }

    const labels = {
        "key-validation": "key validation",
        "switch-validation": "switch validation",
        "arrow-validation": "arrow validation",
        "optimal-below-minimum": "Optimal below minimum",
        "solver-null": "solver returned null",
        "open-fraction": "could not reach requested open fraction"
    };

    console.error(
        `Open-space rejection: ${labels[reason] || reason}`,
        {
            difficulty,
            referencePathLength:
                diagnostics.referencePathLength ?? null,
            requestedOpenFraction:
                diagnostics.requestedOpenFraction ?? null,
            actualOpenFraction:
                diagnostics.actualOpenFraction ?? null,
            finalOptimal:
                diagnostics.finalOptimal ?? null,
            minimumOptimal:
                diagnostics.minimumOptimal ?? null
        }
    );
}

function logOpenSpaceWork(difficulty, diagnostics) {
    if (difficulty !== "hard" && difficulty !== "extreme") {
        return;
    }

    console.log("Open-space work:", {
        "proposals tried": diagnostics.proposalsTried,
        "proposals accepted": diagnostics.proposalsAccepted,
        "rejected by Optimal threshold":
            diagnostics.rejectedByOptimalThreshold,
        "rejected by solver/null":
            diagnostics.rejectedBySolverNull,
        "rejected by mechanic validation":
            diagnostics.rejectedByMechanicValidation,
        "rejected by topology/eligibility":
            diagnostics.rejectedByTopology,
        "achieved fraction": diagnostics.actualOpenFraction,
        "final Optimal": diagnostics.finalOptimal
    });
}

function openCandidateSpace(
    candidate,
    options = {}
) {
    openCandidateSpace.lastFailureReason = null;
    openCandidateSpace.lastDiagnostics = null;

    if (!candidate?.path || !candidate?.walls) {
        openCandidateSpace.lastFailureReason = "open-space";
        return null;
    }

    const {
        openFraction = 0.25,
        maxOpenRegionProposals = 15,
        minOpenRegionSize = 2,
        maxOpenRegionSize = 4,
        difficulty = null
    } = options;

    if (
        typeof openFraction !== "number" ||
        openFraction < 0 ||
        openFraction > 1 ||
        !Number.isInteger(maxOpenRegionProposals) ||
        maxOpenRegionProposals < 1 ||
        !Number.isInteger(minOpenRegionSize) ||
        !Number.isInteger(maxOpenRegionSize) ||
        minOpenRegionSize < 1 ||
        maxOpenRegionSize < minOpenRegionSize
    ) {
        openCandidateSpace.lastFailureReason = "open-space";
        return null;
    }

    const baseline = structuredClone(candidate);
    const updated = structuredClone(candidate);
    const coordinateKey = ([row, col]) =>
        `${row},${col}`;
    const referencePathLength = updated.path.length - 1;
    const minimumOptimalRatio = 0.65;
    const minimumOptimal = Math.floor(
        referencePathLength * minimumOptimalRatio
    );
    const targetOpenCount = Math.floor(
        updated.walls.length * openFraction
    );
    const initialWallCount = updated.walls.length;
    const protectedPositions = [
        updated.start,
        updated.goal,
        ...(updated.keys ?? []).map(key => key.position),
        ...(updated.lockGroups ?? []).flatMap(
            group => group.tiles
        ),
        ...(updated.switches ?? []).map(
            item => item.position
        ),
        ...(updated.switchGates ?? []).flatMap(
            group => group.tiles
        ),
        ...(updated.requiredArrows ?? []).map(
            arrow => arrow.position
        )
    ];
    const protectedKeys = new Set(
        protectedPositions.map(coordinateKey)
    );
    const openedSpaceTiles = [];
    const triedRegionKeys = new Set();
    let proposalsTried = 0;
    let proposalsAccepted = 0;
    let rejectedByOptimalThreshold = 0;
    let rejectedBySolverNull = 0;
    let rejectedByMechanicValidation = 0;
    let rejectedByTopology = 0;
    let topologyExhausted = false;

    const baselineOptimal = findShortestPathLength(
        normalizeGeneratedCandidate(baseline)
    );

    if (
        baselineOptimal === null ||
        baselineOptimal < minimumOptimal ||
        !validateGeneratedMechanics(baseline)
    ) {
        openCandidateSpace.lastFailureReason =
            baselineOptimal === null
                ? "solver-null"
                : baselineOptimal < minimumOptimal
                    ? "optimal-below-minimum"
                    : validateGeneratedMechanics.lastFailureReason ||
                        "mechanic-validation";
        return null;
    }

    while (
        openedSpaceTiles.length < targetOpenCount &&
        proposalsTried < maxOpenRegionProposals
    ) {
        const wallKeys = new Set(
            updated.walls.map(coordinateKey)
        );
        const openedSpaceKeys = new Set(
            openedSpaceTiles.map(coordinateKey)
        );
        const frontier = updated.walls.filter(position => {
            const key = coordinateKey(position);

            if (protectedKeys.has(key)) {
                return false;
            }

            const openNeighborCount = getNeighbors(
                position[0],
                position[1],
                updated.size
            ).filter(neighbor =>
                !wallKeys.has(coordinateKey(neighbor))
            ).length;

            return openNeighborCount >= 1;
        });

        if (frontier.length === 0) {
            topologyExhausted = true;
            break;
        }

        const nearbyFrontier = frontier.filter(position =>
            getNeighbors(
                position[0],
                position[1],
                updated.size
            ).some(neighbor =>
                openedSpaceKeys.has(coordinateKey(neighbor))
            )
        );
        const seedCandidates = nearbyFrontier.length > 0
            ? nearbyFrontier
            : frontier;
        const seed = seedCandidates[
            Math.floor(Math.random() * seedCandidates.length)
        ];
        const remainingOpenCount =
            targetOpenCount - openedSpaceTiles.length;
        const regionSizeRange =
            maxOpenRegionSize - minOpenRegionSize + 1;
        const regionTargetSize = Math.min(
            remainingOpenCount,
            minOpenRegionSize +
                Math.floor(Math.random() * regionSizeRange)
        );
        const region = [[...seed]];
        const regionKeys = new Set([
            coordinateKey(seed)
        ]);

        while (region.length < regionTargetSize) {
            const growthCandidates = region
                .flatMap(position =>
                    getNeighbors(
                        position[0],
                        position[1],
                        updated.size
                    )
                )
                .filter(position => {
                    const key = coordinateKey(position);
                    return wallKeys.has(key) &&
                        !protectedKeys.has(key) &&
                        !regionKeys.has(key) &&
                        getNeighbors(
                            position[0],
                            position[1],
                            updated.size
                        ).every(neighbor =>
                            wallKeys.has(coordinateKey(neighbor))
                        );
                });

            if (growthCandidates.length === 0) {
                break;
            }

            const next = growthCandidates[
                Math.floor(
                    Math.random() * growthCandidates.length
                )
            ];
            region.push([...next]);
            regionKeys.add(coordinateKey(next));
        }

        const regionKey = [...regionKeys].sort().join("|");
        proposalsTried++;

        if (triedRegionKeys.has(regionKey)) {
            rejectedByTopology++;
            continue;
        }

        triedRegionKeys.add(regionKey);

        const trial = structuredClone(updated);
        trial.walls = trial.walls.filter(
            wall => !regionKeys.has(coordinateKey(wall))
        );
        trial.referencePathLength = referencePathLength;

        const optimal = findShortestPathLength(
            normalizeGeneratedCandidate(trial)
        );

        if (optimal === null) {
            rejectedBySolverNull++;
            continue;
        }

        if (optimal < minimumOptimal) {
            rejectedByOptimalThreshold++;
            continue;
        }

        if (!validateGeneratedMechanics(trial)) {
            rejectedByMechanicValidation++;
            continue;
        }

        updated.walls = trial.walls;
        openedSpaceTiles.push(...region.map(position => [...position]));
        proposalsAccepted++;
    }

    updated.referencePathLength = referencePathLength;
    updated.minimumOptimalRatio = minimumOptimalRatio;
    updated.minimumOptimal = minimumOptimal;
    updated.openedSpaceTiles = openedSpaceTiles;

    const finalOptimal = findShortestPathLength(
        normalizeGeneratedCandidate(updated)
    );

    const finalMechanicsValid =
        finalOptimal !== null &&
        finalOptimal >= minimumOptimal &&
        validateGeneratedMechanics(updated);
    const finalCandidateValid = finalMechanicsValid;

    const result = finalCandidateValid
        ? updated
        : baseline;
    const resultOptimal = finalCandidateValid
        ? finalOptimal
        : baselineOptimal;
    const acceptedOpenings = finalCandidateValid
        ? openedSpaceTiles.length
        : 0;
    const acceptedProposals = finalCandidateValid
        ? proposalsAccepted
        : 0;

    if (!finalCandidateValid && proposalsAccepted > 0) {
        if (finalOptimal === null) {
            rejectedBySolverNull += proposalsAccepted;
        } else if (finalOptimal < minimumOptimal) {
            rejectedByOptimalThreshold += proposalsAccepted;
        } else {
            rejectedByMechanicValidation += proposalsAccepted;
        }
    }
    const achievedOpenFraction = initialWallCount > 0
        ? acceptedOpenings / initialWallCount
        : 0;

    result.referencePathLength = referencePathLength;
    result.minimumOptimalRatio = minimumOptimalRatio;
    result.minimumOptimal = minimumOptimal;
    result.openedSpaceTiles = finalCandidateValid
        ? openedSpaceTiles
        : [];
    result.finalOptimal = resultOptimal;

    openCandidateSpace.lastDiagnostics = {
        difficulty,
        referencePathLength,
        requestedOpenFraction: openFraction,
        actualOpenFraction: achievedOpenFraction,
        finalOptimal: resultOptimal,
        minimumOptimal,
        proposalsTried,
        proposalsAccepted: acceptedProposals,
        rejectedByOptimalThreshold,
        rejectedBySolverNull,
        rejectedByMechanicValidation,
        rejectedByTopology,
        topologyExhausted,
        reachedRequestedOpenFraction:
            acceptedOpenings >= targetOpenCount
    };
    result.openSpaceWork = {
        proposalsTried,
        proposalsAccepted: acceptedProposals,
        rejectedByOptimalThreshold,
        rejectedBySolverNull,
        rejectedByMechanicValidation,
        rejectedByTopology,
        topologyExhausted,
        requestedOpenFraction: openFraction,
        actualOpenFraction: achievedOpenFraction,
        finalOptimal: resultOptimal
    };

    logOpenSpaceWork(
        difficulty,
        openCandidateSpace.lastDiagnostics
    );

    return result;
}

function createOpenBoardBase(candidate, options = {}) {
    if (!candidate?.path || !candidate?.walls) {
        return null;
    }

    const {
        targetWalkableFraction = 0.55,
        minimumOptimalRatio = 0.65,
        maxRegionProposals = 12,
        minRegionSize = 6,
        maxRegionSize = 14
    } = options;

    if (
        typeof targetWalkableFraction !== "number" ||
        targetWalkableFraction < 0 ||
        targetWalkableFraction > 1 ||
        typeof minimumOptimalRatio !== "number" ||
        minimumOptimalRatio < 0 ||
        minimumOptimalRatio > 1 ||
        !Number.isInteger(maxRegionProposals) ||
        maxRegionProposals < 1 ||
        !Number.isInteger(minRegionSize) ||
        !Number.isInteger(maxRegionSize) ||
        minRegionSize < 1 ||
        maxRegionSize < minRegionSize
    ) {
        return null;
    }

    const updated = structuredClone(candidate);
    const referenceWalls = candidate.walls.map(wall => [...wall]);
    const referencePathLength = candidate.path.length - 1;
    const minimumOptimal = Math.floor(
        referencePathLength * minimumOptimalRatio
    );
    const boardTileCount = updated.size * updated.size;
    const targetWalkableCount = Math.ceil(
        boardTileCount * targetWalkableFraction
    );
    const coordinateKey = ([row, col]) => `${row},${col}`;
    const triedRegions = new Set();
    let proposalsTried = 0;
    let proposalsAccepted = 0;
    let solverNullRejections = 0;
    let optimalRejections = 0;

    function shuffled(values) {
        const result = [...values];

        for (let index = result.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(
                Math.random() * (index + 1)
            );
            [result[index], result[randomIndex]] =
                [result[randomIndex], result[index]];
        }

        return result;
    }

    while (
        boardTileCount - updated.walls.length < targetWalkableCount &&
        proposalsTried < maxRegionProposals
    ) {
        const wallKeys = new Set(updated.walls.map(coordinateKey));
        const frontier = updated.walls.filter(position =>
            getNeighbors(
                position[0],
                position[1],
                updated.size
            ).some(neighbor => !wallKeys.has(coordinateKey(neighbor)))
        );

        if (frontier.length === 0) {
            break;
        }

        const seed = frontier[
            Math.floor(Math.random() * frontier.length)
        ];
        const remainingNeeded =
            targetWalkableCount -
            (boardTileCount - updated.walls.length);
        const sizeRange = maxRegionSize - minRegionSize + 1;
        const desiredSize = Math.min(
            remainingNeeded,
            minRegionSize + Math.floor(Math.random() * sizeRange)
        );
        const region = [[...seed]];
        const regionKeys = new Set([coordinateKey(seed)]);

        while (region.length < desiredSize) {
            const growthCandidates = shuffled(
                region.flatMap(position =>
                    getNeighbors(
                        position[0],
                        position[1],
                        updated.size
                    )
                )
            ).filter(position => {
                const key = coordinateKey(position);
                return wallKeys.has(key) && !regionKeys.has(key);
            });

            if (growthCandidates.length === 0) {
                break;
            }

            const next = growthCandidates[0];
            region.push([...next]);
            regionKeys.add(coordinateKey(next));
        }

        const regionKey = [...regionKeys].sort().join("|");
        proposalsTried++;

        if (triedRegions.has(regionKey)) {
            continue;
        }

        triedRegions.add(regionKey);

        const trial = structuredClone(updated);
        trial.walls = trial.walls.filter(
            wall => !regionKeys.has(coordinateKey(wall))
        );

        const optimal = findShortestPathLength(
            normalizeGeneratedCandidate(trial)
        );

        if (optimal === null) {
            solverNullRejections++;
            continue;
        }

        if (optimal < minimumOptimal) {
            optimalRejections++;
            continue;
        }

        updated.walls = trial.walls;
        proposalsAccepted++;
    }

    const finalOptimal = findShortestPathLength(
        normalizeGeneratedCandidate(updated)
    );

    if (finalOptimal === null || finalOptimal < minimumOptimal) {
        return null;
    }

    updated.referencePathLength = referencePathLength;
    updated.referenceWalls = referenceWalls;
    updated.minimumOptimalRatio = minimumOptimalRatio;
    updated.minimumOptimal = minimumOptimal;
    updated.finalOptimal = finalOptimal;
    updated.openBoardWork = {
        targetWalkableFraction,
        achievedWalkableFraction:
            (boardTileCount - updated.walls.length) / boardTileCount,
        proposalsTried,
        proposalsAccepted,
        solverNullRejections,
        optimalRejections
    };

    return updated;
}

function addMechanicsToOpenBoardCandidate(
    candidate,
    options = {}
) {
    const work = {
        proposals: 0,
        solverCalls: 0,
        keyValidations: 0,
        switchValidations: 0,
        arrowValidations: 0,
        result: "fail"
    };
    addMechanicsToOpenBoardCandidate.lastWork = work;

    if (!candidate?.path || !candidate?.referenceWalls) {
        return null;
    }

    const {
        keys = 0,
        switches = 0,
        arrows = 0,
        maxPlacementProposals = 6,
        placementAttemptsPerProposal = 3,
        useBoundedStructuralPlacement = false
    } = options;

    if (
        !Number.isInteger(maxPlacementProposals) ||
        maxPlacementProposals < 1 ||
        !Number.isInteger(placementAttemptsPerProposal) ||
        placementAttemptsPerProposal < 1
    ) {
        return null;
    }

    const path = candidate.path;
    const coordinateKey = ([row, col]) => `${row},${col}`;
    const wallKeys = new Set(candidate.walls.map(coordinateKey));
    const reachabilityCache = new Map();
    const randomIndex = (minimum, maximum) =>
        minimum + Math.floor(
            Math.random() * (maximum - minimum + 1)
        );

    function canReach(from, to, blockedPositions = []) {
        const blockedKeys = new Set(
            blockedPositions.map(coordinateKey)
        );
        const startKey = coordinateKey(from);
        const targetKey = coordinateKey(to);
        const cacheKey = `${startKey}>${targetKey}|${
            [...blockedKeys].sort().join(";")
        }`;

        if (reachabilityCache.has(cacheKey)) {
            return reachabilityCache.get(cacheKey);
        }

        if (blockedKeys.has(startKey) || blockedKeys.has(targetKey)) {
            reachabilityCache.set(cacheKey, false);
            return false;
        }

        const queue = [[...from]];
        const visited = new Set([startKey]);

        for (let index = 0; index < queue.length; index++) {
            const current = queue[index];

            if (coordinateKey(current) === targetKey) {
                reachabilityCache.set(cacheKey, true);
                return true;
            }

            for (const neighbor of getNeighbors(
                current[0],
                current[1],
                candidate.size
            )) {
                const key = coordinateKey(neighbor);

                if (
                    wallKeys.has(key) ||
                    blockedKeys.has(key) ||
                    visited.has(key)
                ) {
                    continue;
                }

                visited.add(key);
                queue.push(neighbor);
            }
        }

        reachabilityCache.set(cacheKey, false);
        return false;
    }

    let cachedChokepointIndexes = null;

    function createTopologyKeyPairs(count) {
        if (count === 0) {
            return { pairs: [], rejection: null };
        }

        if (cachedChokepointIndexes === null) {
            cachedChokepointIndexes = [];
            const maxChokepointCandidates = 15;
            const structurallyLikelyIndexes = [];

            for (let index = 3; index < path.length - 2; index++) {
                const walkableDegree = getNeighbors(
                    path[index][0],
                    path[index][1],
                    candidate.size
                ).filter(neighbor =>
                    !wallKeys.has(coordinateKey(neighbor))
                ).length;

                if (walkableDegree <= 3) {
                    structurallyLikelyIndexes.push({
                        index,
                        walkableDegree,
                        tieBreaker: Math.random()
                    });
                }
            }

            structurallyLikelyIndexes.sort((first, second) =>
                first.walkableDegree - second.walkableDegree ||
                first.tieBreaker - second.tieBreaker
            );
            const indexesToTest = structurallyLikelyIndexes
                .slice(0, maxChokepointCandidates)
                .map(item => item.index);

            for (const index of indexesToTest) {
                if (
                    !canReach(
                        candidate.start,
                        candidate.goal,
                        [path[index]]
                    )
                ) {
                    cachedChokepointIndexes.push(index);
                }
            }

            console.log("Chokepoint analysis:", {
                "candidates considered":
                    structurallyLikelyIndexes.length,
                "candidates tested": indexesToTest.length,
                "valid chokepoints":
                    cachedChokepointIndexes.length,
                "work limit reached":
                    structurallyLikelyIndexes.length >
                    maxChokepointCandidates
            });
        }

        const chokepointIndexes = cachedChokepointIndexes;

        if (chokepointIndexes.length < count) {
            return { pairs: null, rejection: "no chokepoint found" };
        }

        const shuffledChokepoints = [...chokepointIndexes]
            .sort(() => Math.random() - 0.5);

        if (count === 1) {
            const maxKeyPositionCandidates = 8;

            for (const gateIndex of shuffledChokepoints.slice(
                0,
                maxKeyPositionCandidates
            )) {
                const keyIndex = Math.max(2, gateIndex - 2);

                if (
                    canReach(
                        candidate.start,
                        path[keyIndex],
                        [path[gateIndex]]
                    )
                ) {
                    return {
                        pairs: [{
                            id: "A",
                            sourceIndex: keyIndex,
                            gateIndex
                        }],
                        rejection: null
                    };
                }
            }

            return {
                pairs: null,
                rejection: "key not reachable before gate"
            };
        }

        let gatePairsTested = 0;
        const maxGatePairs = 15;

        for (const firstGate of shuffledChokepoints) {
            const laterGates = shuffledChokepoints.filter(
                index => index >= firstGate + 3
            );

            for (const secondGate of laterGates) {
                if (gatePairsTested >= maxGatePairs) {
                    return {
                        pairs: null,
                        rejection: "key not reachable before gate"
                    };
                }

                gatePairsTested++;
                const blockedGates = [path[firstGate], path[secondGate]];
                const firstKeyIndex = Math.max(2, firstGate - 2);
                const secondKeyIndexes = [
                    firstGate + 1,
                    Math.floor((firstGate + secondGate) / 2),
                    secondGate - 1
                ].filter((index, position, values) =>
                    index > firstGate &&
                    index < secondGate &&
                    values.indexOf(index) === position
                );

                if (
                    !canReach(
                        candidate.start,
                        path[firstKeyIndex],
                        blockedGates
                    )
                ) {
                    continue;
                }

                for (const secondKeyIndex of secondKeyIndexes) {
                    const reachableAfterFirstGate = canReach(
                        candidate.start,
                        path[secondKeyIndex],
                        [path[secondGate]]
                    );
                    const reachableBeforeFirstGate = canReach(
                        candidate.start,
                        path[secondKeyIndex],
                        blockedGates
                    );

                    if (
                        reachableAfterFirstGate &&
                        !reachableBeforeFirstGate
                    ) {
                        return {
                            pairs: [
                                {
                                    id: "A",
                                    sourceIndex: firstKeyIndex,
                                    gateIndex: firstGate
                                },
                                {
                                    id: "B",
                                    sourceIndex: secondKeyIndex,
                                    gateIndex: secondGate
                                }
                            ],
                            rejection: null
                        };
                    }
                }
            }
        }

        return {
            pairs: null,
            rejection: "key not reachable before gate"
        };
    }

    function describeKeyRejection(trial) {
        for (const group of trial.lockGroups ?? []) {
            if (
                canReach(
                    trial.start,
                    trial.goal,
                    group.tiles
                )
            ) {
                return `${group.keyId} bypassable`;
            }
        }

        for (const key of trial.keys ?? []) {
            const group = (trial.lockGroups ?? []).find(
                item => item.keyId === key.id
            );

            if (
                !group ||
                !canReach(trial.start, key.position, group.tiles)
            ) {
                return "key not reachable before gate";
            }
        }

        return "independent key requirement failed";
    }

    function createTopologySwitchPairs(count, excludedIndexes) {
        if (count !== 1) {
            return {
                pairs: createOrderedPairSet(count, "switch"),
                rejection: null
            };
        }

        const availableChokepoints = (
            cachedChokepointIndexes ?? []
        ).filter(index => !excludedIndexes.has(index));

        if (availableChokepoints.length === 0) {
            return {
                pairs: null,
                rejection: "no downstream chokepoint"
            };
        }

        for (const gateIndex of availableChokepoints
            .sort(() => Math.random() - 0.5)) {
            const sourceCandidates = [
                gateIndex - 2,
                Math.floor(gateIndex / 2),
                2
            ].filter((index, position, values) =>
                index >= 2 &&
                index < gateIndex &&
                !excludedIndexes.has(index) &&
                values.indexOf(index) === position
            );

            for (const sourceIndex of sourceCandidates) {
                if (
                    canReach(
                        candidate.start,
                        path[sourceIndex],
                        [path[gateIndex]]
                    )
                ) {
                    return {
                        pairs: [{
                            id: "S1",
                            sourceIndex,
                            gateIndex
                        }],
                        rejection: null
                    };
                }
            }
        }

        return {
            pairs: null,
            rejection: "switch not reachable before gate"
        };
    }

    function describeSwitchRejection(trial) {
        const group = trial.switchGates?.[0];
        const gameSwitch = trial.switches?.[0];

        if (!group || !gameSwitch) {
            return "independent switch requirement failed";
        }

        if (canReach(trial.start, trial.goal, group.tiles)) {
            return "gate bypassable";
        }

        if (!canReach(trial.start, gameSwitch.position, group.tiles)) {
            return "switch not reachable before gate";
        }

        return "independent switch requirement failed";
    }

    function createOrderedPairSet(count, prefix) {
        if (count === 0) {
            return [];
        }

        if (count === 1) {
            const sourceIndex = randomIndex(
                2,
                Math.floor(path.length * 0.45)
            );
            const gateIndex = randomIndex(
                sourceIndex + 3,
                path.length - 2
            );
            return [{
                id: prefix === "key" ? "A" : "S1",
                sourceIndex,
                gateIndex
            }];
        }

        const firstSource = randomIndex(
            2,
            Math.max(2, Math.floor(path.length * 0.25))
        );
        const firstGate = randomIndex(
            firstSource + 3,
            Math.floor(path.length * 0.5)
        );
        const secondSource = randomIndex(
            firstGate + 2,
            Math.floor(path.length * 0.7)
        );
        const secondGate = randomIndex(
            secondSource + 3,
            path.length - 2
        );

        return [
            {
                id: prefix === "key" ? "A" : "S1",
                sourceIndex: firstSource,
                gateIndex: firstGate
            },
            {
                id: prefix === "key" ? "B" : "S2",
                sourceIndex: secondSource,
                gateIndex: secondGate
            }
        ];
    }

    function createStructuralProposal() {
        const maxStructuralPlacementAttempts = 10;

        for (
            let attempt = 0;
            attempt < maxStructuralPlacementAttempts;
            attempt++
        ) {
            console.log("Stage: key proposal start");
            const keyPlacement = createTopologyKeyPairs(keys);
            console.log("Stage: key proposal complete");

            if (!keyPlacement.pairs) {
                return keyPlacement;
            }

            const keyPairs = keyPlacement.pairs;
            const keyIndexes = new Set(
                keyPairs.flatMap(pair => [
                    pair.sourceIndex,
                    pair.gateIndex
                ])
            );
            const switchPlacement = switches === 0
                ? { pairs: [], rejection: null }
                : createTopologySwitchPairs(
                    switches,
                    keyIndexes
                );

            if (!switchPlacement.pairs) {
                return {
                    proposal: null,
                    rejection: switchPlacement.rejection,
                    rejectionType: "switch"
                };
            }

            const switchPairs = switchPlacement.pairs;
            const occupiedIndexes = new Set();
            const allPairs = [...keyPairs, ...switchPairs];
            let hasConflict = false;

            for (const pair of allPairs) {
                if (
                    occupiedIndexes.has(pair.sourceIndex) ||
                    occupiedIndexes.has(pair.gateIndex)
                ) {
                    hasConflict = true;
                    break;
                }

                occupiedIndexes.add(pair.sourceIndex);
                occupiedIndexes.add(pair.gateIndex);
            }

            if (hasConflict) {
                continue;
            }

            let arrowIndex = null;

            if (arrows > 0) {
                console.log("Stage: arrow placement start");
                const arrowCandidates = [];
                const maxArrowPositionCandidates = 12;

                for (let index = 2; index < path.length - 2; index++) {
                    if (!occupiedIndexes.has(index)) {
                        arrowCandidates.push(index);

                        if (
                            arrowCandidates.length >=
                            maxArrowPositionCandidates
                        ) {
                            break;
                        }
                    }
                }

                if (arrowCandidates.length === 0) {
                    console.log("Stage: arrow placement complete");
                    continue;
                }

                arrowIndex = arrowCandidates[
                    Math.floor(Math.random() * arrowCandidates.length)
                ];
                console.log("Stage: arrow placement complete");
            }

            const proposal = structuredClone(candidate);
            proposal.keys = keyPairs.map(pair => ({
                id: pair.id,
                position: [...path[pair.sourceIndex]]
            }));
            proposal.lockGroups = keyPairs.map(pair => ({
                keyId: pair.id,
                tiles: [[...path[pair.gateIndex]]]
            }));
            proposal.switches = switchPairs.map(pair => ({
                id: pair.id,
                position: [...path[pair.sourceIndex]]
            }));
            proposal.switchGates = switchPairs.map(pair => ({
                switchId: pair.id,
                tiles: [[...path[pair.gateIndex]]]
            }));
            proposal.requiredArrows = [];

            if (arrowIndex !== null) {
                const current = path[arrowIndex];
                const next = path[arrowIndex + 1];
                const rowChange = next[0] - current[0];
                const colChange = next[1] - current[1];
                const direction = rowChange === -1
                    ? "up"
                    : rowChange === 1
                        ? "down"
                        : colChange === -1
                            ? "left"
                            : "right";
                proposal.requiredArrows = [{
                    position: [...current],
                    direction
                }];
            }

            return {
                proposal,
                rejection: null,
                rejectionType: null
            };
        }

        return { proposal: null, rejection: "key not reachable before gate" };
    }

    function runWithCountedSolver(callback) {
        const originalSolver = findShortestPathLength;

        findShortestPathLength = (...args) => {
            work.solverCalls++;
            return originalSolver(...args);
        };

        try {
            return callback();
        } finally {
            findShortestPathLength = originalSolver;
        }
    }

    if (!useBoundedStructuralPlacement) {
        for (
            let proposal = 1;
            proposal <= maxPlacementProposals;
            proposal++
        ) {
            work.proposals++;
            const placementGuide = structuredClone(candidate);
            placementGuide.walls = candidate.referenceWalls.map(
                wall => [...wall]
            );
            const placed = runWithCountedSolver(() =>
                addMechanicsToCandidate(
                    placementGuide,
                    { keys, switches, arrows },
                    placementAttemptsPerProposal
                )
            );

            if (!placed) {
                continue;
            }

            const trial = structuredClone(candidate);
            trial.keys = structuredClone(placed.keys ?? []);
            trial.lockGroups = structuredClone(
                placed.lockGroups ?? []
            );
            trial.switches = structuredClone(placed.switches ?? []);
            trial.switchGates = structuredClone(
                placed.switchGates ?? []
            );
            trial.requiredArrows = structuredClone(
                placed.requiredArrows ?? []
            );
            const validation = runWithCountedSolver(() => {
                const optimal = findShortestPathLength(
                    normalizeGeneratedCandidate(trial)
                );

                if (
                    optimal === null ||
                    optimal < trial.minimumOptimal
                ) {
                    return { valid: false, optimal };
                }

                work.keyValidations += keys > 0 ? 1 : 0;
                work.switchValidations += switches > 0 ? 1 : 0;
                work.arrowValidations += arrows > 0 ? 1 : 0;
                return {
                    valid: validateGeneratedMechanics(trial),
                    optimal
                };
            });

            if (!validation.valid) {
                continue;
            }

            trial.finalOptimal = validation.optimal;
            work.result = "success";
            trial.mechanicPlacementWork = { ...work };
            return trial;
        }

        return null;
    }

    for (
        let proposal = 1;
        proposal <= maxPlacementProposals;
        proposal++
    ) {
        work.proposals++;
        const structuralResult = createStructuralProposal();
        const trial = structuralResult.proposal;

        if (!trial) {
            console.log(
                structuralResult.rejectionType === "switch"
                    ? "Switch placement rejection:"
                    : "Key placement rejection:",
                structuralResult.rejection
            );
            continue;
        }

        console.log("Stage: final validation start");
        const validation = runWithCountedSolver(() => {
            const optimal = findShortestPathLength(
                normalizeGeneratedCandidate(trial)
            );

            if (optimal === null || optimal < trial.minimumOptimal) {
                return { valid: false, optimal };
            }

            if (keys > 0) {
                work.keyValidations++;

                if (
                    !(keys === 1
                        ? validateRequiredKey(trial)
                        : validateRequiredKeyGroups(trial))
                ) {
                    console.log(
                        "Key placement rejection:",
                        describeKeyRejection(trial)
                    );
                    return { valid: false, optimal };
                }
            }

            if (switches > 0) {
                work.switchValidations++;

                if (
                    !(switches === 1
                        ? validateRequiredSwitch(trial)
                        : validateRequiredSwitchGroups(trial))
                ) {
                    console.log(
                        "Switch placement rejection:",
                        describeSwitchRejection(trial)
                    );
                    return { valid: false, optimal };
                }
            }

            if (arrows > 0) {
                work.arrowValidations++;

                if (!validateRequiredArrow(trial)) {
                    return { valid: false, optimal };
                }
            }

            return { valid: true, optimal };
        });
        console.log("Stage: final validation complete");

        if (!validation.valid) {
            continue;
        }

        trial.finalOptimal = validation.optimal;
        work.result = "success";
        trial.mechanicPlacementWork = { ...work };
        return trial;
    }

    return null;
}

function createOpenBoardCandidateForDifficulty(difficulty) {
    const emptyMechanicWork = {
        proposals: 0,
        solverCalls: 0,
        keyValidations: 0,
        switchValidations: 0,
        arrowValidations: 0,
        result: "fail"
    };
    const logMechanicWork = work => {
        console.log("Open-board mechanic work:", {
            proposals: work.proposals,
            "solver calls": work.solverCalls,
            "key validations": work.keyValidations,
            "switch validations": work.switchValidations,
            "arrow validations": work.arrowValidations,
            result: work.result
        });
    };

    if (
        !Object.hasOwn(difficultyProfiles, difficulty) ||
        !Object.hasOwn(experimentalOpenBoardProfiles, difficulty)
    ) {
        logMechanicWork(emptyMechanicWork);
        return null;
    }

    const profile = difficultyProfiles[difficulty];
    const openProfile = experimentalOpenBoardProfiles[difficulty];
    const experimentalMechanicCounts = {
        keys: Object.hasOwn(openProfile, "keys")
            ? openProfile.keys
            : profile.keys,
        switches: Object.hasOwn(openProfile, "switches")
            ? openProfile.switches
            : profile.switches,
        arrows: Object.hasOwn(openProfile, "arrows")
            ? openProfile.arrows
            : profile.arrows
    };
    const referenceCandidate = createUniquePathCandidate(
        profile.targetLength
    );

    if (!referenceCandidate) {
        logMechanicWork(emptyMechanicWork);
        return null;
    }

    const openBoard = createOpenBoardBase(referenceCandidate, {
        targetWalkableFraction: openProfile.targetWalkableFraction,
        minimumOptimalRatio: 0.65
    });

    if (!openBoard) {
        logMechanicWork(emptyMechanicWork);
        return null;
    }

    const completedCandidate = addMechanicsToOpenBoardCandidate(
        openBoard,
        {
            keys: experimentalMechanicCounts.keys,
            switches: experimentalMechanicCounts.switches,
            arrows: experimentalMechanicCounts.arrows,
            maxPlacementProposals:
                difficulty === "hard" || difficulty === "extreme"
                    ? 3
                    : 6,
            useBoundedStructuralPlacement:
                difficulty === "hard" || difficulty === "extreme"
        }
    );

    logMechanicWork(
        addMechanicsToOpenBoardCandidate.lastWork ||
            emptyMechanicWork
    );

    return completedCandidate;
}

// Disabled: experimental aggressive open-space strategy retained only
// for reference while the conservative opener remains active.
if (false) {
function createOpenCandidateSpace(
    candidate,
    options = {}
) {
    createOpenCandidateSpace.lastFailureReason = null;
    createOpenCandidateSpace.lastDiagnostics = null;

    if (!candidate?.path || !candidate?.walls) {
        createOpenCandidateSpace.lastFailureReason = "open-space";
        return null;
    }

    const {
        targetOpenness = 0.65,
        maxRegionProposals = 15,
        minRegionSize = 6,
        maxRegionSize = 12,
        difficulty = null
    } = options;
    const effectiveMinRegionSize = difficulty === "extreme"
        ? Math.max(minRegionSize, 8)
        : minRegionSize;
    const effectiveMaxRegionSize = difficulty === "extreme"
        ? Math.max(maxRegionSize, 16)
        : maxRegionSize;

    if (
        typeof targetOpenness !== "number" ||
        targetOpenness < 0 ||
        targetOpenness > 1 ||
        !Number.isInteger(maxRegionProposals) ||
        maxRegionProposals < 1 ||
        !Number.isInteger(effectiveMinRegionSize) ||
        !Number.isInteger(effectiveMaxRegionSize) ||
        effectiveMinRegionSize < 1 ||
        effectiveMaxRegionSize < effectiveMinRegionSize
    ) {
        createOpenCandidateSpace.lastFailureReason = "open-space";
        return null;
    }

    const coordinateKey = ([row, col]) => `${row},${col}`;
    const baseline = structuredClone(candidate);
    let working = structuredClone(candidate);
    const referencePathLength = working.path.length - 1;
    const minimumOptimalRatio = 0.65;
    const minimumOptimal = Math.floor(
        referencePathLength * minimumOptimalRatio
    );
    const boardTileCount = working.size * working.size;
    const targetWalkableCount = Math.ceil(
        boardTileCount * targetOpenness
    );
    const protectedPositions = [
        working.start,
        working.goal,
        ...(working.keys ?? []).map(key => key.position),
        ...(working.lockGroups ?? []).flatMap(
            group => group.tiles
        ),
        ...(working.switches ?? []).map(item => item.position),
        ...(working.switchGates ?? []).flatMap(
            group => group.tiles
        ),
        ...(working.requiredArrows ?? []).map(
            arrow => arrow.position
        )
    ];
    const protectedKeys = new Set(
        protectedPositions.map(coordinateKey)
    );
    const aggressivelyOpenedKeys = new Set();
    const triedRegionKeys = new Set();
    let proposalsTried = 0;
    let proposalsAccepted = 0;
    let rejectedBySolverNull = 0;
    let rejectedByOptimalThreshold = 0;
    let rejectedByMechanicValidation = 0;

    function shuffled(values) {
        const result = [...values];

        for (let index = result.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(
                Math.random() * (index + 1)
            );
            [result[index], result[randomIndex]] =
                [result[randomIndex], result[index]];
        }

        return result;
    }

    function isFullyValid(value) {
        const optimal = findShortestPathLength(
            normalizeGeneratedCandidate(value)
        );

        return {
            optimal,
            valid:
                optimal !== null &&
                optimal >= minimumOptimal &&
                validateGeneratedMechanics(value)
        };
    }

    const baselineValidation = isFullyValid(baseline);

    if (!baselineValidation.valid) {
        createOpenCandidateSpace.lastFailureReason =
            baselineValidation.optimal === null
                ? "solver-null"
                : baselineValidation.optimal < minimumOptimal
                    ? "optimal-below-minimum"
                    : validateGeneratedMechanics.lastFailureReason ||
                        "mechanic-validation";
        return null;
    }

    while (
        boardTileCount - working.walls.length < targetWalkableCount &&
        proposalsTried < maxRegionProposals
    ) {
        const wallKeys = new Set(working.walls.map(coordinateKey));
        const eligibleWalls = working.walls.filter(
            position => !protectedKeys.has(coordinateKey(position))
        );
        const frontier = eligibleWalls.filter(position =>
            getNeighbors(
                position[0],
                position[1],
                working.size
            ).some(neighbor => !wallKeys.has(coordinateKey(neighbor)))
        );

        if (frontier.length === 0) {
            break;
        }

        const preferredFrontier = frontier.filter(position =>
            getNeighbors(
                position[0],
                position[1],
                working.size
            ).some(neighbor =>
                aggressivelyOpenedKeys.has(coordinateKey(neighbor))
            )
        );
        const seedPool = preferredFrontier.length > 0
            ? preferredFrontier
            : frontier;
        const seed = seedPool[
            Math.floor(Math.random() * seedPool.length)
        ];
        const remainingNeeded =
            targetWalkableCount -
            (boardTileCount - working.walls.length);
        const sizeRange =
            effectiveMaxRegionSize - effectiveMinRegionSize + 1;
        const desiredRegionSize = Math.min(
            remainingNeeded,
            effectiveMinRegionSize +
                Math.floor(Math.random() * sizeRange)
        );
        const region = [[...seed]];
        const regionKeys = new Set([coordinateKey(seed)]);

        while (region.length < desiredRegionSize) {
            const growthCandidates = shuffled(
                region.flatMap(position =>
                    getNeighbors(
                        position[0],
                        position[1],
                        working.size
                    )
                )
            ).filter(position => {
                const key = coordinateKey(position);
                return wallKeys.has(key) &&
                    !protectedKeys.has(key) &&
                    !regionKeys.has(key);
            });

            if (growthCandidates.length === 0) {
                break;
            }

            const next = growthCandidates[0];
            region.push([...next]);
            regionKeys.add(coordinateKey(next));
        }

        const regionKey = [...regionKeys].sort().join("|");
        proposalsTried++;

        if (triedRegionKeys.has(regionKey)) {
            continue;
        }

        triedRegionKeys.add(regionKey);

        const trial = structuredClone(working);
        trial.walls = trial.walls.filter(
            wall => !regionKeys.has(coordinateKey(wall))
        );
        trial.referencePathLength = referencePathLength;
        const validation = isFullyValid(trial);

        if (validation.optimal === null) {
            rejectedBySolverNull++;
            continue;
        }

        if (validation.optimal < minimumOptimal) {
            rejectedByOptimalThreshold++;
            continue;
        }

        if (!validation.valid) {
            rejectedByMechanicValidation++;
            continue;
        }

        working = trial;
        regionKeys.forEach(key => aggressivelyOpenedKeys.add(key));
        proposalsAccepted++;
    }

    const finalValidation = isFullyValid(working);
    const fallbackUsed =
        !finalValidation.valid || proposalsAccepted === 0;
    const result = fallbackUsed ? baseline : working;
    const finalOptimal = fallbackUsed
        ? baselineValidation.optimal
        : finalValidation.optimal;
    const achievedOpenness =
        (boardTileCount - result.walls.length) / boardTileCount;

    result.referencePathLength = referencePathLength;
    result.minimumOptimalRatio = minimumOptimalRatio;
    result.minimumOptimal = minimumOptimal;
    result.finalOptimal = finalOptimal;
    result.aggressiveOpenSpace = {
        targetOpenness,
        achievedOpenness,
        proposalsTried,
        proposalsAccepted: fallbackUsed ? 0 : proposalsAccepted,
        rejectedBySolverNull,
        rejectedByOptimalThreshold,
        rejectedByMechanicValidation,
        finalOptimal,
        fallbackUsed
    };
    createOpenCandidateSpace.lastDiagnostics =
        result.aggressiveOpenSpace;

    if (difficulty === "hard" || difficulty === "extreme") {
        console.log("Aggressive open-space:", {
            "target openness": targetOpenness,
            "achieved openness": achievedOpenness,
            "proposals tried": proposalsTried,
            "proposals accepted":
                result.aggressiveOpenSpace.proposalsAccepted,
            "final Optimal": finalOptimal,
            "fallback used": fallbackUsed
        });
    }

    return result;
}
}

function addBranchesToCandidate(
    candidate,
    options = {}
) {
    if (!candidate?.path || !candidate?.walls) {
        return null;
    }

    const {
        branchCount = 2,
        maxBranchLength = 3,
        maxAttempts = 100
    } = options;

    if (
        !Number.isInteger(branchCount) ||
        !Number.isInteger(maxBranchLength) ||
        !Number.isInteger(maxAttempts) ||
        branchCount < 0 ||
        maxBranchLength < 1 ||
        maxAttempts < 1
    ) {
        return null;
    }

    const updated = structuredClone(candidate);
    updated.branches = updated.branches ?? [];

    const coordinateKey = ([row, col]) =>
        `${row},${col}`;
    const sameTile = (a, b) =>
        a[0] === b[0] && a[1] === b[1];
    const directionBetween = (from, to) => [
        to[0] - from[0],
        to[1] - from[1]
    ];
    const sameDirection = (first, second) =>
        first && second &&
        first[0] === second[0] &&
        first[1] === second[1];
    const shuffle = values => {
        for (
            let index = values.length - 1;
            index > 0;
            index--
        ) {
            const randomIndex = Math.floor(
                Math.random() * (index + 1)
            );

            [values[index], values[randomIndex]] =
                [values[randomIndex], values[index]];
        }

        return values;
    };

    const pathKeys = new Set(
        updated.path.map(coordinateKey)
    );
    const mechanicPositions = [
        updated.start,
        updated.goal,
        ...(updated.keys ?? []).map(
            key => key.position
        ),
        ...(updated.lockGroups ?? []).flatMap(
            group => group.tiles
        ),
        ...(updated.switches ?? []).map(
            item => item.position
        ),
        ...(updated.switchGates ?? []).flatMap(
            group => group.tiles
        ),
        ...(updated.requiredArrows ?? []).map(
            arrow => arrow.position
        )
    ];
    const forbiddenKeys = new Set(
        mechanicPositions.map(coordinateKey)
    );
    const plannedLength = updated.path.length - 1;
    const minimumBranchLength = Math.min(
        2,
        maxBranchLength
    );
    let addedBranches = 0;

    const getOpenKeys = walls => {
        const wallKeys = new Set(walls.map(coordinateKey));
        const openKeys = new Set();

        for (let row = 0; row < updated.size; row++) {
            for (let col = 0; col < updated.size; col++) {
                const key = `${row},${col}`;

                if (!wallKeys.has(key)) {
                    openKeys.add(key);
                }
            }
        }

        return openKeys;
    };

    const hasTurn = (root, branch) => {
        const route = [root, ...branch];

        for (let index = 2; index < route.length; index++) {
            const previousDirection = directionBetween(
                route[index - 2],
                route[index - 1]
            );
            const nextDirection = directionBetween(
                route[index - 1],
                route[index]
            );

            if (!sameDirection(previousDirection, nextDirection)) {
                return true;
            }
        }

        return false;
    };

    const validateBranchTopology = (
        root,
        branch,
        existingOpenKeys
    ) => {
        const branchKeys = new Set(
            branch.map(coordinateKey)
        );

        if (branchKeys.size !== branch.length) {
            return false;
        }

        let pathConnections = 0;

        for (let index = 0; index < branch.length; index++) {
            const position = branch[index];
            const key = coordinateKey(position);

            if (forbiddenKeys.has(key)) {
                return false;
            }

            if (
                index > 0 &&
                !getNeighbors(
                    position[0],
                    position[1],
                    updated.size
                ).some(neighbor =>
                    sameTile(neighbor, branch[index - 1])
                )
            ) {
                return false;
            }

            const neighbors = getNeighbors(
                position[0],
                position[1],
                updated.size
            );
            const pathNeighbors = neighbors.filter(neighbor =>
                pathKeys.has(coordinateKey(neighbor))
            );

            pathConnections += pathNeighbors.length;

            if (
                index === 0
                    ? pathNeighbors.length !== 1 ||
                        !sameTile(pathNeighbors[0], root)
                    : pathNeighbors.length !== 0
            ) {
                return false;
            }

            const openNeighborCount = neighbors.filter(neighbor => {
                const neighborKey = coordinateKey(neighbor);
                return existingOpenKeys.has(neighborKey) ||
                    branchKeys.has(neighborKey);
            }).length;
            const expectedOpenNeighbors =
                branch.length === 1
                    ? 1
                    : index === 0
                        ? 2
                        : index === branch.length - 1
                            ? 1
                            : 2;

            if (openNeighborCount !== expectedOpenNeighbors) {
                return false;
            }
        }

        return pathConnections === 1;
    };

    const findBranch = (
        root,
        targetLength,
        existingOpenKeys,
        wallKeys,
        requireTurn
    ) => {
        const branch = [];
        const branchKeys = new Set();

        const search = previous => {
            if (branch.length === targetLength) {
                return (
                    (!requireTurn || hasTurn(root, branch)) &&
                    validateBranchTopology(
                        root,
                        branch,
                        existingOpenKeys
                    )
                );
            }

            const previousDirection = branch.length > 0
                ? directionBetween(
                    branch.length === 1
                        ? root
                        : branch[branch.length - 2],
                    previous
                )
                : null;
            const choices = shuffle(
                getNeighbors(
                    previous[0],
                    previous[1],
                    updated.size
                )
            ).filter(position => {
                const key = coordinateKey(position);

                if (
                    !wallKeys.has(key) ||
                    forbiddenKeys.has(key) ||
                    branchKeys.has(key)
                ) {
                    return false;
                }

                const neighbors = getNeighbors(
                    position[0],
                    position[1],
                    updated.size
                );
                const existingOpenNeighbors = neighbors.filter(
                    neighbor => existingOpenKeys.has(
                        coordinateKey(neighbor)
                    )
                );
                const branchNeighbors = neighbors.filter(
                    neighbor => branchKeys.has(
                        coordinateKey(neighbor)
                    )
                );

                if (branch.length === 0) {
                    return (
                        existingOpenNeighbors.length === 1 &&
                        sameTile(existingOpenNeighbors[0], root) &&
                        branchNeighbors.length === 0
                    );
                }

                return (
                    existingOpenNeighbors.length === 0 &&
                    branchNeighbors.length === 1 &&
                    sameTile(branchNeighbors[0], previous)
                );
            });

            choices.sort((first, second) => {
                if (!previousDirection) {
                    return 0;
                }

                const firstTurns = !sameDirection(
                    previousDirection,
                    directionBetween(previous, first)
                );
                const secondTurns = !sameDirection(
                    previousDirection,
                    directionBetween(previous, second)
                );

                return Number(secondTurns) - Number(firstTurns);
            });

            for (const next of choices) {
                branch.push(next);
                branchKeys.add(coordinateKey(next));

                if (search(next)) {
                    return true;
                }

                branch.pop();
                branchKeys.delete(coordinateKey(next));
            }

            return false;
        };

        return search(root) ? branch : null;
    };

    for (
        let attempt = 0;
        attempt < maxAttempts &&
        addedBranches < branchCount;
        attempt++
    ) {
        if (updated.path.length < 5) {
            break;
        }

        const eligibleRootIndexes = [];

        for (
            let index = 2;
            index <= updated.path.length - 3;
            index++
        ) {
            const root = updated.path[index];
            const distanceFromStart =
                Math.abs(root[0] - updated.start[0]) +
                Math.abs(root[1] - updated.start[1]);
            const distanceFromGoal =
                Math.abs(root[0] - updated.goal[0]) +
                Math.abs(root[1] - updated.goal[1]);

            if (
                distanceFromStart > 1 &&
                distanceFromGoal > 1
            ) {
                eligibleRootIndexes.push(index);
            }
        }

        if (eligibleRootIndexes.length === 0) {
            break;
        }

        const rootIndex = eligibleRootIndexes[
            Math.floor(
                Math.random() * eligibleRootIndexes.length
            )
        ];
        const root = updated.path[rootIndex];
        const existingOpenKeys = getOpenKeys(updated.walls);
        const wallKeys = new Set(
            updated.walls.map(coordinateKey)
        );
        let proposedBranch = null;

        for (
            let length = maxBranchLength;
            length >= minimumBranchLength && !proposedBranch;
            length--
        ) {
            if (length >= 3) {
                proposedBranch = findBranch(
                    root,
                    length,
                    existingOpenKeys,
                    wallKeys,
                    true
                );
            }

            if (!proposedBranch) {
                proposedBranch = findBranch(
                    root,
                    length,
                    existingOpenKeys,
                    wallKeys,
                    false
                );
            }
        }

        if (!proposedBranch) {
            continue;
        }

        const proposedKeys = new Set(
            proposedBranch.map(coordinateKey)
        );
        const trial = structuredClone(updated);
        trial.walls = trial.walls.filter(
            wall => !proposedKeys.has(coordinateKey(wall))
        );
        trial.branches.push(proposedBranch);

        const optimal = findShortestPathLength(
            normalizeLevel(trial)
        );

        if (
            optimal === null ||
            optimal !== plannedLength
        ) {
            continue;
        }

        updated.walls = trial.walls;
        updated.branches = trial.branches;
        addedBranches++;
    }

    const finalOptimal = findShortestPathLength(
        normalizeLevel(updated)
    );

    return finalOptimal === plannedLength
        ? updated
        : null;
}

function scoreCandidateQuality(candidate) {
    const path = candidate?.path ?? [];
    const boardSize = candidate?.size ?? 0;
    const targetLength = candidate?.targetLength ?? 0;
    const keyCount = candidate?.keys?.length ?? 0;
    const switchCount = candidate?.switches?.length ?? 0;
    const arrowCount =
        candidate?.requiredArrows?.length ?? 0;
    const mechanicCount =
        keyCount + switchCount + arrowCount;
    const branchCount = candidate?.branches?.length ?? 0;
    const branchTileCount =
        (candidate?.branches ?? []).reduce(
            (total, branch) => total + branch.length,
            0
        );
    const pathMoves = Math.max(path.length - 1, 0);
    const boardArea = boardSize * boardSize;
    const walkableTileCount = Math.max(
        boardArea - (candidate?.walls?.length ?? boardArea),
        0
    );
    const openSpaceFraction = boardArea > 0
        ? walkableTileCount / boardArea
        : 0;
    const referencePathLength =
        candidate?.referencePathLength ?? pathMoves;
    const finalOptimal = candidate
        ? candidate.finalOptimal ??
            findShortestPathLength(
                normalizeGeneratedCandidate(candidate)
            )
        : null;
    const optimalReferenceRatio =
        finalOptimal !== null && referencePathLength > 0
            ? finalOptimal / referencePathLength
            : 0;
    const pathCoverage = boardArea > 0
        ? path.length / boardArea
        : 0;

    const pathIndexByPosition = new Map(
        path.map((position, index) => [
            `${position[0]},${position[1]}`,
            index
        ])
    );

    const mechanicPositions = [
        ...(candidate?.keys ?? []).map(
            key => key.position
        ),
        ...(candidate?.lockGroups ?? []).flatMap(
            group => group.tiles
        ),
        ...(candidate?.switches ?? []).map(
            item => item.position
        ),
        ...(candidate?.switchGates ?? []).flatMap(
            group => group.tiles
        ),
        ...(candidate?.requiredArrows ?? []).map(
            arrow => arrow.position
        )
    ];

    const mechanicIndexes = [
        ...new Set(
            mechanicPositions
                .map(position =>
                    pathIndexByPosition.get(
                        `${position[0]},${position[1]}`
                    )
                )
                .filter(index => index !== undefined)
        )
    ].sort((a, b) => a - b);

    const gaps = mechanicIndexes
        .slice(1)
        .map((index, gapIndex) =>
            index - mechanicIndexes[gapIndex]
        );

    const mechanicSpacing =
        gaps.length > 0 && pathMoves > 0
            ? gaps.reduce(
                (total, gap) => total + gap,
                0
            ) / gaps.length / pathMoves
            : 0;

    const clusterDistance = Math.max(
        2,
        Math.floor(pathMoves * 0.1)
    );
    const clusteredCount = gaps.filter(
        gap => gap < clusterDistance
    ).length;
    const endpointDistance = Math.max(
        2,
        Math.floor(pathMoves * 0.1)
    );
    const endpointCount = mechanicIndexes.filter(
        index =>
            index < endpointDistance ||
            pathMoves - index < endpointDistance
    ).length;

    const score =
        pathMoves * 0.5 +
        mechanicCount * 5 +
        mechanicSpacing * 20 +
        pathCoverage * 20 -
        clusteredCount * 4 -
        endpointCount * 3 +
        Math.min(
            branchCount * 1.5 + branchTileCount * 0.5,
            6
        );

    return {
        score: Number(score.toFixed(2)),
        targetLength,
        boardSize,
        keyCount,
        switchCount,
        arrowCount,
        mechanicCount,
        branchCount,
        branchTileCount,
        walkableTileCount,
        openSpaceFraction:
            Number(openSpaceFraction.toFixed(4)),
        finalOptimal,
        referencePathLength,
        optimalReferenceRatio:
            Number(optimalReferenceRatio.toFixed(4)),
        mechanicSpacing:
            Number(mechanicSpacing.toFixed(4)),
        pathCoverage:
            Number(pathCoverage.toFixed(4))
    };
}

function generateCandidateBatch(
    difficulty,
    count = 25
) {
    if (
        !Object.hasOwn(difficultyProfiles, difficulty) ||
        !Number.isInteger(count) ||
        count <= 0
    ) {
        return [];
    }

    const results = [];
    const batchFingerprints = new Set();
    const maxAttempts = Math.max(count * 4, count);

    for (
        let attempt = 0;
        attempt < maxAttempts && results.length < count;
        attempt++
    ) {
        const candidate =
            createCandidateForDifficulty(difficulty);

        if (!candidate) {
            continue;
        }

        const fingerprint =
            createCandidateFingerprint(candidate);

        if (batchFingerprints.has(fingerprint)) {
            continue;
        }

        batchFingerprints.add(fingerprint);
        results.push({
            candidate,
            quality: scoreCandidateQuality(candidate)
        });
    }

    return results.sort(
        (a, b) => b.quality.score - a.quality.score
    );
}

function selectBestCandidates(
    difficulty,
    desiredCount = 10,
    poolSize = 25
) {
    if (
        !Number.isInteger(desiredCount) ||
        desiredCount <= 0
    ) {
        return [];
    }

    return generateCandidateBatch(
        difficulty,
        poolSize
    ).slice(0, desiredCount);
}



