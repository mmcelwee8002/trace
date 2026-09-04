let currentGeneratedPreviewDifficulty = null;

function loadGeneratedPreview(difficulty = "medium") {
    const candidate =
        createCandidateForDifficulty(difficulty);

    if (!candidate) {
        console.error(
            `Generated preview failed for difficulty: ${difficulty}`
        );
        return null;
    }

    const previewLevel = {
        ...candidate,
        id: `generated-preview-${difficulty}`,
        title: `Generated ${difficulty} preview`,
        oneWays: (candidate.requiredArrows ?? []).map(
            arrow => ({
                position: [...arrow.position],
                direction: arrow.direction
            })
        )
    };

    let normalizedPreview;

    try {
        normalizedPreview =
            loadTemporaryLevelPreview(previewLevel);
    } catch (error) {
        console.error(
            `Generated preview could not be loaded for difficulty: ${difficulty}`,
            error
        );
        return null;
    }

    const mechanicSummary = [];

    if ((candidate.keys?.length ?? 0) > 0) {
        mechanicSummary.push("Key");
    }

    if ((candidate.switches?.length ?? 0) > 0) {
        mechanicSummary.push("Switch");
    }

    if ((candidate.requiredArrows?.length ?? 0) > 0) {
        mechanicSummary.push("Arrow");
    }

    document.querySelector(".game-message").textContent =
        mechanicSummary.join(" | ");

    const optimal =
        findShortestPathLength(normalizedPreview);
    const branchCount = candidate.branches?.length ?? 0;

    currentGeneratedPreviewDifficulty = difficulty;
    window.currentGeneratedPreview = candidate;
    window.currentGeneratedPreviewDifficulty = difficulty;

    console.log("Generated preview:", {
        difficulty,
        boardSize: candidate.size,
        plannedLength: candidate.path.length - 1,
        optimal,
        keys: candidate.keys?.length ?? 0,
        switches: candidate.switches?.length ?? 0,
        arrows: candidate.requiredArrows?.length ?? 0,
        branches: branchCount
    });

    return candidate;
}

function loadOpenBoardPreview(difficulty = "medium") {
    const candidate =
        createOpenBoardCandidateForDifficulty(difficulty);

    if (!candidate) {
        console.error(
            `Open-board preview failed for difficulty: ${difficulty}`
        );
        return null;
    }

    const previewLevel = {
        ...candidate,
        id: `open-board-preview-${difficulty}`,
        title: `Open-board ${difficulty} preview`,
        oneWays: (candidate.requiredArrows ?? []).map(
            arrow => ({
                position: [...arrow.position],
                direction: arrow.direction
            })
        )
    };

    let normalizedPreview;

    try {
        normalizedPreview =
            loadTemporaryLevelPreview(previewLevel);
    } catch (error) {
        console.error(
            `Open-board preview could not be loaded for difficulty: ${difficulty}`,
            error
        );
        return null;
    }

    const mechanicSummary = [];

    if ((candidate.keys?.length ?? 0) > 0) {
        mechanicSummary.push("Key");
    }

    if ((candidate.switches?.length ?? 0) > 0) {
        mechanicSummary.push("Switch");
    }

    if ((candidate.requiredArrows?.length ?? 0) > 0) {
        mechanicSummary.push("Arrow");
    }

    document.querySelector(".game-message").textContent =
        mechanicSummary.join(" | ");

    const finalOptimal = findShortestPathLength(normalizedPreview);
    const boardTileCount = candidate.size * candidate.size;
    const walkableFraction = boardTileCount > 0
        ? (boardTileCount - candidate.walls.length) / boardTileCount
        : 0;

    window.currentGeneratedPreview = candidate;
    window.currentGeneratedPreviewDifficulty = difficulty;

    console.log("Open-board preview:", {
        difficulty,
        "board size": candidate.size,
        "reference path length": candidate.path.length - 1,
        "final Optimal": finalOptimal,
        "walkable fraction": walkableFraction,
        keys: candidate.keys?.length ?? 0,
        switches: candidate.switches?.length ?? 0,
        arrows: candidate.requiredArrows?.length ?? 0,
        "generation work": {
            openBoard: candidate.openBoardWork,
            mechanicPlacement: candidate.mechanicPlacementWork
        }
    });

    return candidate;
}

function loadMazePreview() {
    const candidate = createMazeCandidate(15);

    if (!candidate) {
        console.error("Maze preview generation failed");
        return null;
    }

    const previewLevel = {
        ...candidate,
        id: "generated-maze-preview",
        title: "Generated Maze Preview"
    };

    let normalizedPreview;

    try {
        normalizedPreview =
            loadTemporaryLevelPreview(previewLevel);
    } catch (error) {
        console.error("Maze preview could not be loaded", error);
        return null;
    }

    const optimal = findShortestPathLength(normalizedPreview);
    const boardTileCount = candidate.size * candidate.size;
    const walkableTileCount =
        boardTileCount - candidate.walls.length;

    window.currentGeneratedPreview = candidate;
    window.currentGeneratedPreviewDifficulty = "maze";

    console.log("Maze preview:", {
        "board size": candidate.size,
        "walkable tile count": walkableTileCount,
        "wall count": candidate.walls.length,
        Optimal: optimal,
        "generation work/attempts": candidate.generationWork
    });

    return candidate;
}

function loadMazeV2Preview() {
    const candidate = createMazeV2Candidate(12, 12);

    if (!candidate) {
        console.error("Maze V2 preview generation failed");
        return null;
    }

    const solution = solveMazeV2ShortestPath(
        candidate,
        candidate.start,
        candidate.goal
    );

    if (
        !solution ||
        solution.length - 1 !== candidate.solutionLength
    ) {
        console.error("Maze V2 preview validation failed");
        return null;
    }

    const boardElement = document.querySelector(".game-board");
    const controller = renderMazeV2Preview(
        candidate,
        boardElement,
        MAZE_V2_TOUCH_TOLERANCE
    );

    if (!controller) {
        console.error("Maze V2 preview rendering failed");
        return null;
    }

    const titleElement = document.querySelector(".level-title");
    const numberElement = document.querySelector(".level-number");
    const gameMessage = document.querySelector(".game-message");
    const levelMessage = document.querySelector(".level-message");

    if (titleElement) {
        titleElement.textContent = candidate.title;
    }

    if (numberElement) {
        numberElement.textContent = "Experimental Preview";
    }

    if (gameMessage) {
        gameMessage.textContent =
            "Trace from the circle to the star without crossing a wall.";
    }

    if (levelMessage) {
        levelMessage.textContent = "";
    }

    window.currentMazeV2Preview = candidate;

    console.log("Maze V2 preview", {
        rows: candidate.rows,
        columns: candidate.cols,
        start: candidate.start,
        goal: candidate.goal,
        "solution length": candidate.solutionLength,
        "generation work": candidate.generationWork
    });

    return candidate;
}

function exportCurrentMazeCandidate() {
    const candidate = window.currentGeneratedPreview;

    if (
        window.currentGeneratedPreviewDifficulty !== "maze" ||
        !candidate ||
        candidate.size !== 15 ||
        !Array.isArray(candidate.walls)
    ) {
        console.error(
            "Maze export failed: no current maze preview is available"
        );
        return null;
    }

    const authoredMaze = {
        id: "2-07",
        title: candidate.title || "Generated Maze",
        instructions: "Start at the circle. Then reach the star.",
        size: candidate.size,
        start: [...candidate.start],
        goal: [...candidate.goal],
        walls: candidate.walls.map(wall => [...wall]),
        keys: [],
        lockGroups: [],
        switches: [],
        switchGates: [],
        requiredArrows: [],
        oneWays: []
    };
    const normalized = normalizeLevel(authoredMaze);
    const optimal = findShortestPathLength(normalized);
    const exportData = {
        authoredMaze,
        optimal
    };

    window.currentMazeAuthoredExport = exportData;
    console.log(
        "Maze authored export:",
        JSON.stringify(exportData, null, 2)
    );

    return exportData;
}

function regenerateGeneratedPreview() {
    if (!currentGeneratedPreviewDifficulty) {
        console.error(
            "No generated preview difficulty has been selected yet."
        );
        return null;
    }

    return loadGeneratedPreview(
        currentGeneratedPreviewDifficulty
    );
}
