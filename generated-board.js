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
        mechanicSummary.join(" • ");

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
