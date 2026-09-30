// Development-only, deterministic generation trial. Never writes the catalog.
// node trial-maze-v2.js [source=maze-v2.js] [count=50] [suite=targeted|regression|unchanged]
const fs = require("fs");
const assert = require("assert/strict");
const crypto = require("crypto");
const source = process.argv[2] || "maze-v2.js";
const count = Number(process.argv[3] || 50);
const suite = process.argv[4] || "targeted";
assert(["targeted", "regression", "unchanged"].includes(suite));
const apiNames = ["chooseMazeV2MechanicModeForDifficulty", "createMazeV2Candidate",
    "createMazeV2GrowingTreeTopologyCandidate", "generateMazeV2ForDifficulty",
    "validateMazeV2CandidateForMode", "scoreMazeV2ProjectedSingleMechanic"];
const load = new Function("Math", "console", fs.readFileSync(source, "utf8") +
    "\nreturn {" + apiNames.map(name =>
        `get ${name}() { return typeof ${name} === 'undefined' ? undefined : ${name}; }, ` +
        `set ${name}(value) { ${name} = value; }`).join(",") + "};");
assert(Number.isInteger(count) && count > 0);
const groups = suite === "targeted"
    ? [["extreme", "key"], ["extreme", "switch"]]
    : suite === "unchanged"
    ? [...["easy", "medium", "hard"].map(tier => [tier, null]), ["extreme", "key-switch"]]
    : ["easy", "medium", "hard", "extreme"].map(tier => [tier, null]);
const seen = new Set();
for (const [difficulty, forcedMode] of groups) {
    const stats = { difficulty, mode: forcedMode || "recipe", requests: count,
        successes: 0, candidateAttempts: 0, mazeSamples: 0, retries: 0,
        firstAttempt: 0, maxAttempts: 0, scores: [], valid: 0,
        solvable: 0, duplicates: 0, modes: {}, signatures: [] };
    for (let index = 0; index < count; index++) {
        // Each request has its own seed; failures cannot shift later requests.
        const groupOffset = ["easy", "medium", "hard", "extreme"].indexOf(difficulty) * 10000 +
            (forcedMode === "switch" ? 1000 : 0);
        let state = (0x54524143 + groupOffset + index) >>> 0;
        const math = Object.create(Math);
        // Mulberry32, seeded independently for every request.
        math.random = () => {
            state = (state + 0x6D2B79F5) >>> 0;
            let t = state;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
        const ctx = load(math, { warn() {} });
        if (forcedMode) ctx.chooseMazeV2MechanicModeForDifficulty = () => forcedMode;
        const originalCandidate = ctx.createMazeV2Candidate;
        const originalTree = ctx.createMazeV2GrowingTreeTopologyCandidate;
        let attempts = 0;
        let projectedScore;
        let referenceRoute;
        ctx.createMazeV2Candidate = (...args) => {
            attempts++;
            const candidate = originalCandidate(...args);
            if (candidate && ctx.scoreMazeV2ProjectedSingleMechanic &&
                (forcedMode === "key" || forcedMode === "switch")) {
                projectedScore = ctx.scoreMazeV2ProjectedSingleMechanic(candidate, forcedMode).score;
                referenceRoute = JSON.stringify(candidate.solution);
            }
            return candidate;
        };
        ctx.createMazeV2GrowingTreeTopologyCandidate = (...args) => {
            stats.mazeSamples++;
            return originalTree(...args);
        };
        const generated = ctx.generateMazeV2ForDifficulty(difficulty, { requireScoreBand: true });
        stats.candidateAttempts += attempts;
        stats.retries += attempts - 1;
        stats.maxAttempts = Math.max(stats.maxAttempts, attempts);
        if (!generated) continue;
        const c = generated.candidate;
        const validation = ctx.validateMazeV2CandidateForMode(c, generated.mechanicMode);
        assert(validation.valid);
        assert.equal(validation.solution.length - 1, c.solutionLength);
        assert.equal(generated.finalScore.tier.toLowerCase(), difficulty);
        assert.equal(generated.generationAttempts, attempts);
        assert.equal(c.rows, 10);
        assert.equal(c.cols, 10);
        if (forcedMode) assert.equal(generated.mechanicMode, forcedMode);
        if (forcedMode === "key" || forcedMode === "switch") {
            if (ctx.scoreMazeV2ProjectedSingleMechanic) {
                assert.equal(projectedScore, generated.finalScore.score);
                assert.equal(referenceRoute, JSON.stringify(c.solution));
            }
        }
        stats.successes++;
        stats.valid++;
        stats.solvable++;
        stats.firstAttempt += attempts === 1;
        stats.scores.push(generated.finalScore.score);
        stats.modes[generated.mechanicMode] = (stats.modes[generated.mechanicMode] || 0) + 1;
        // Topology-only duplicate check is stronger than exact puzzle equality.
        const topology = JSON.stringify(c.cells.map(row => row.map(cell => cell.walls)));
        if (seen.has(topology)) stats.duplicates++;
        seen.add(topology);
        stats.signatures.push(crypto.createHash("sha256").update(JSON.stringify(c)).digest("hex"));
    }
    stats.scoreRange = stats.scores.length ? [Math.min(...stats.scores), Math.max(...stats.scores)] : null;
    stats.outputDigest = crypto.createHash("sha256").update(stats.signatures.join(",")).digest("hex");
    delete stats.scores;
    delete stats.signatures;
    console.log(JSON.stringify(stats));
}
