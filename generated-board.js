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
