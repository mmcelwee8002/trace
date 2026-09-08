/* Development-only Node script: node generate-maze-v2-catalog.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectDirectory = __dirname;
const generatorPath = path.join(projectDirectory, "maze-v2.js");
const catalogPath = path.join(projectDirectory, "maze-v2-catalog.js");
vm.runInThisContext(fs.readFileSync(generatorPath, "utf8"), {
    filename: generatorPath
});

const difficulties = ["easy", "medium", "hard", "extreme"];
const puzzlesPerDifficulty = 10;
const maximumAttemptsPerDifficulty = 100;
const fingerprints = new Set();
const catalog = Object.fromEntries(
    difficulties.map(difficulty => [difficulty, []])
);

function wallMask(cell) {
    return (cell.walls.top ? 1 : 0) |
        (cell.walls.right ? 2 : 0) |
        (cell.walls.bottom ? 4 : 0) |
        (cell.walls.left ? 8 : 0);
}

function topologyFingerprint(candidate) {
    return `${candidate.rows}x${candidate.cols}:` +
        candidate.cells.flat().map(wallMask).join("");
}

function validateFrozenSourceCandidate(generated) {
    if (!generated?.candidate) {
        return false;
    }

    const validation = validateMazeV2CandidateForMode(
        generated.candidate,
        generated.mechanicMode
    );
    return validation.valid &&
        validation.solution?.length - 1 ===
            generated.candidate.solutionLength;
}

function freezeCandidate(generated, difficulty, puzzleNumber) {
    const candidate = generated.candidate;
    const freezePosition = position => position
        ? [position.row, position.col]
        : null;
    return {
        id: `${difficulty}-${String(puzzleNumber).padStart(3, "0")}`,
        puzzleNumber,
        difficultyProfile: difficulty,
        mechanicMode: generated.mechanicMode,
        rows: candidate.rows,
        cols: candidate.cols,
        wallMasks: candidate.cells.flat().map(wallMask),
        start: freezePosition(candidate.start),
        goal: freezePosition(candidate.goal),
        checkpoint: freezePosition(candidate.checkpoint),
        checkpointPathIndex: candidate.checkpointPathIndex,
        key: candidate.key,
        gate: candidate.gate,
        switch: candidate.switch,
        switchGate: candidate.switchGate,
        keyPathIndex: candidate.keyPathIndex ?? null,
        gatePathIndex: candidate.gatePathIndex ?? null,
        switchPathIndex: candidate.switchPathIndex ?? null,
        switchGatePathIndex: candidate.switchGatePathIndex ?? null,
        optimal: candidate.solutionLength,
        topologyScore: generated.topologyScore,
        finalScore: generated.finalScore
    };
}

for (const difficulty of difficulties) {
    let attempts = 0;

    while (
        catalog[difficulty].length < puzzlesPerDifficulty &&
        attempts < maximumAttemptsPerDifficulty
    ) {
        attempts++;
        const generated = generateMazeV2ForDifficulty(difficulty);

        if (!validateFrozenSourceCandidate(generated)) {
            continue;
        }

        const fingerprint = topologyFingerprint(generated.candidate);

        if (fingerprints.has(fingerprint)) {
            continue;
        }

        fingerprints.add(fingerprint);
        const puzzleNumber = catalog[difficulty].length + 1;
        catalog[difficulty].push(
            freezeCandidate(generated, difficulty, puzzleNumber)
        );
    }

    if (catalog[difficulty].length !== puzzlesPerDifficulty) {
        throw new Error(
            `Catalog generation failed for ${difficulty}: ` +
            `${catalog[difficulty].length}/${puzzlesPerDifficulty} ` +
            `after ${attempts} attempts.`
        );
    }
}

const currentSource = fs.readFileSync(catalogPath, "utf8");
const generatedData = JSON.stringify(catalog, null, 2);
const nextSource = currentSource.replace(
    /\/\/ MAZE_V2_CATALOG_DATA_START[\s\S]*?\/\/ MAZE_V2_CATALOG_DATA_END/,
    `// MAZE_V2_CATALOG_DATA_START\n${generatedData}\n` +
        "// MAZE_V2_CATALOG_DATA_END"
);

if (nextSource === currentSource) {
    throw new Error("Catalog data markers were not found.");
}

fs.writeFileSync(catalogPath, nextSource, "utf8");

const mechanicDistribution = {};
const tierDistribution = {};

for (const entries of Object.values(catalog)) {
    for (const entry of entries) {
        mechanicDistribution[entry.mechanicMode] =
            (mechanicDistribution[entry.mechanicMode] || 0) + 1;
        tierDistribution[entry.finalScore.tier] =
            (tierDistribution[entry.finalScore.tier] || 0) + 1;
    }
}

console.log("Maze V2 catalog generated", {
    counts: Object.fromEntries(
        difficulties.map(difficulty => [
            difficulty,
            catalog[difficulty].length
        ])
    ),
    total: Object.values(catalog).flat().length,
    mechanicDistribution,
    finalTierDistribution: tierDistribution,
    exactDuplicates: 0
});
