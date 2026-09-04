function createMazeCandidate(size = 15) {
    if (
        !Number.isInteger(size) ||
        size < 5 ||
        size > 51 ||
        size % 2 === 0
    ) {
        return null;
    }

    const maxGenerationAttempts = 5;
    const coordinateKey = ([row, col]) => `${row},${col}`;
    const directions = [
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2]
    ];

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

    function findFarthest(openKeys, origin) {
        const queue = [[...origin]];
        const distances = new Map([[coordinateKey(origin), 0]]);
        const parents = new Map();
        let farthest = [...origin];

        for (let index = 0; index < queue.length; index++) {
            const current = queue[index];
            const currentKey = coordinateKey(current);
            const currentDistance = distances.get(currentKey);

            if (
                currentDistance >
                distances.get(coordinateKey(farthest))
            ) {
                farthest = [...current];
            }

            for (const [rowChange, colChange] of [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1]
            ]) {
                const neighbor = [
                    current[0] + rowChange,
                    current[1] + colChange
                ];
                const neighborKey = coordinateKey(neighbor);

                if (
                    !openKeys.has(neighborKey) ||
                    distances.has(neighborKey)
                ) {
                    continue;
                }

                distances.set(neighborKey, currentDistance + 1);
                parents.set(neighborKey, current);
                queue.push(neighbor);
            }
        }

        return { farthest, parents, distances };
    }

    for (
        let generationAttempt = 1;
        generationAttempt <= maxGenerationAttempts;
        generationAttempt++
    ) {
        const cellRows = (size - 1) / 2;
        const startCell = [
            1 + 2 * Math.floor(Math.random() * cellRows),
            1 + 2 * Math.floor(Math.random() * cellRows)
        ];
        const openKeys = new Set([coordinateKey(startCell)]);
        const visitedCells = new Set([coordinateKey(startCell)]);
        const stack = [[...startCell]];
        let generationWork = 0;

        while (stack.length > 0) {
            generationWork++;
            const current = stack[stack.length - 1];
            const unvisitedNeighbors = shuffled(directions)
                .map(([rowChange, colChange]) => [
                    current[0] + rowChange,
                    current[1] + colChange
                ])
                .filter(([row, col]) =>
                    row > 0 &&
                    row < size - 1 &&
                    col > 0 &&
                    col < size - 1 &&
                    !visitedCells.has(coordinateKey([row, col]))
                );

            if (unvisitedNeighbors.length === 0) {
                stack.pop();
                continue;
            }

            const next = unvisitedNeighbors[0];
            const connector = [
                (current[0] + next[0]) / 2,
                (current[1] + next[1]) / 2
            ];
            visitedCells.add(coordinateKey(next));
            openKeys.add(coordinateKey(connector));
            openKeys.add(coordinateKey(next));
            stack.push(next);
        }

        const arbitraryOpenTile = [...openKeys][0]
            .split(",")
            .map(Number);
        const firstSweep = findFarthest(
            openKeys,
            arbitraryOpenTile
        );
        const secondSweep = findFarthest(
            openKeys,
            firstSweep.farthest
        );
        const start = [...firstSweep.farthest];
        const goal = [...secondSweep.farthest];
        const path = [[...goal]];
        let pathCursor = coordinateKey(goal);
        const startKey = coordinateKey(start);

        while (pathCursor !== startKey) {
            const parent = secondSweep.parents.get(pathCursor);

            if (!parent) {
                break;
            }

            path.push([...parent]);
            pathCursor = coordinateKey(parent);
        }

        path.reverse();

        const walls = [];

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (!openKeys.has(coordinateKey([row, col]))) {
                    walls.push([row, col]);
                }
            }
        }

        const candidate = {
            id: "MAZE-EXPERIMENT",
            title: "Generated Maze",
            size,
            start,
            goal,
            walls,
            path,
            targetLength: path.length - 1,
            keys: [],
            lockGroups: [],
            switches: [],
            switchGates: [],
            requiredArrows: [],
            oneWays: [],
            generationWork: {
                attempts: generationAttempt,
                mazeSteps: generationWork,
                visitedCells: visitedCells.size
            }
        };
        const optimal = findShortestPathLength(
            normalizeLevel(candidate)
        );

        if (optimal === null) {
            continue;
        }

        candidate.finalOptimal = optimal;
        return candidate;
    }

    return null;
}
