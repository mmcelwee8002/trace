

const generatedFingerprints = new Set();

const difficultyProfiles = {
    easy: {
        targetLength: 20,
        keys: 0,
        switches: 1,
        arrows: 0,
        branchCount: 0,
        maxBranchLength: 0
    },
    medium: {
        targetLength: 28,
        keys: 1,
        switches: 1,
        arrows: 1,
        branchCount: 2,
        maxBranchLength: 3
    },
    hard: {
        targetLength: 36,
        keys: 2,
        switches: 1,
        arrows: 1,
        branchCount: 3,
        maxBranchLength: 4
    },
    extreme: {
        targetLength: 44,
        keys: 2,
        switches: 2,
        arrows: 1,
        branchCount: 4,
        maxBranchLength: 5
    }
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
    if (!Object.hasOwn(difficultyProfiles, difficulty)) {
        return null;
    }

    const profile = difficultyProfiles[difficulty];
    const candidate =
        createUniquePathCandidate(profile.targetLength);

    if (!candidate) {
        return null;
    }

    let completedCandidate =
        addMechanicsToCandidate(candidate, {
            keys: profile.keys,
            switches: profile.switches,
            arrows: profile.arrows
        });

    if (!completedCandidate) {
        return null;
    }

    if (profile.branchCount > 0) {
        completedCandidate = addBranchesToCandidate(
            completedCandidate,
            {
                branchCount: profile.branchCount,
                maxBranchLength: profile.maxBranchLength
            }
        );

        if (!completedCandidate) {
            return null;
        }
    }

    const normalized =
        normalizeLevel(completedCandidate);
    const optimal =
        findShortestPathLength(normalized);

    if (
        optimal === null ||
        optimal !== completedCandidate.path.length - 1
    ) {
        return null;
    }

    if (
        profile.keys === 2 &&
        !validateRequiredKeyGroups(completedCandidate)
    ) {
        return null;
    }

    if (
        profile.switches === 2 &&
        !validateRequiredSwitchGroups(completedCandidate)
    ) {
        return null;
    }

    if (
        profile.arrows > 0 &&
        !validateRequiredArrow(completedCandidate)
    ) {
        return null;
    }

    return completedCandidate;
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
    const mechanicKeys = new Set(
        mechanicPositions.map(coordinateKey)
    );
    const existingBranchKeys = new Set(
        updated.branches.flatMap(branch =>
            branch.map(coordinateKey)
        )
    );

    const plannedLength = updated.path.length - 1;
    let addedBranches = 0;

    for (
        let attempt = 0;
        attempt < maxAttempts &&
        addedBranches < branchCount;
        attempt++
    ) {
        if (updated.path.length < 5) {
            break;
        }

        const rootIndex = 2 + Math.floor(
            Math.random() * (updated.path.length - 4)
        );
        const root = updated.path[rootIndex];
        const desiredLength = 1 + Math.floor(
            Math.random() * maxBranchLength
        );
        const wallKeys = new Set(
            updated.walls.map(coordinateKey)
        );
        const proposedBranch = [];
        const proposedKeys = new Set();
        let previous = root;

        for (
            let step = 0;
            step < desiredLength;
            step++
        ) {
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
                    mechanicKeys.has(key) ||
                    existingBranchKeys.has(key) ||
                    proposedKeys.has(key)
                ) {
                    return false;
                }

                const plannedNeighbors = getNeighbors(
                    position[0],
                    position[1],
                    updated.size
                ).filter(neighbor =>
                    pathKeys.has(coordinateKey(neighbor))
                );

                if (
                    step === 0
                        ? plannedNeighbors.length !== 1 ||
                            !sameTile(plannedNeighbors[0], root)
                        : plannedNeighbors.length !== 0
                ) {
                    return false;
                }

                const existingBranchNeighbors =
                    getNeighbors(
                        position[0],
                        position[1],
                        updated.size
                    ).filter(neighbor =>
                        existingBranchKeys.has(
                            coordinateKey(neighbor)
                        )
                    );

                if (existingBranchNeighbors.length > 0) {
                    return false;
                }

                const proposedNeighbors = getNeighbors(
                    position[0],
                    position[1],
                    updated.size
                ).filter(neighbor =>
                    proposedKeys.has(coordinateKey(neighbor))
                );

                return step === 0
                    ? proposedNeighbors.length === 0
                    : proposedNeighbors.length === 1 &&
                        sameTile(proposedNeighbors[0], previous);
            });

            if (choices.length === 0) {
                break;
            }

            const next = choices[0];
            proposedBranch.push(next);
            proposedKeys.add(coordinateKey(next));
            previous = next;
        }

        if (proposedBranch.length === 0) {
            continue;
        }

        const proposedKeySet = new Set(
            proposedBranch.map(coordinateKey)
        );
        const trial = structuredClone(updated);
        trial.walls = trial.walls.filter(
            wall => !proposedKeySet.has(coordinateKey(wall))
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
        proposedBranch.forEach(position =>
            existingBranchKeys.add(coordinateKey(position))
        );
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



