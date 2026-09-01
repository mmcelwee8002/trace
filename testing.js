
// ======================================
// TRACE AUTOMATION TESTS
// Temporary development/testing only.
// ======================================




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

function testKeyGateCandidate() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Key gate test: base generation failed"
        );
        return;
    }

    const keyCandidate =
        addKeyGateToCandidate(baseCandidate);

    if (keyCandidate === null) {
        console.log(
            "Key gate test: mechanic placement failed"
        );
        return;
    }

    const normalized =
        normalizeLevel(keyCandidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Key gate test target:",
        keyCandidate.targetLength
    );

    console.log(
        "Key gate test planned length:",
        keyCandidate.path.length - 1
    );

    console.log(
        "Key gate test optimal:",
        optimal
    );

    console.log(
        "Generated key:",
        keyCandidate.keys[0]
    );

    console.log(
        "Generated gate:",
        keyCandidate.lockGroups[0]
    );
}

function testKeyRequirement() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Key requirement test: base generation failed"
        );
        return;
    }

    const keyCandidate =
        addKeyGateToCandidate(baseCandidate);

    if (keyCandidate === null) {
        console.log(
            "Key requirement test: mechanic placement failed"
        );
        return;
    }

    const brokenCandidate =
        structuredClone(keyCandidate);

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

    const lateKeyIndex =
        Math.min(
            path.length - 2,
            gateIndex + 2
        );

    brokenCandidate.keys[0].position =
        path[lateKeyIndex];

    const normalized =
        normalizeLevel(brokenCandidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Key requirement test with key after gate:",
        optimal
    );
}

function testRequiredKeyValidation() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Required key validation test: base generation failed"
        );
        return;
    }

    const keyCandidate =
        addKeyGateToCandidate(baseCandidate);

    if (keyCandidate === null) {
        console.log(
            "Required key validation test: mechanic placement failed"
        );
        return;
    }

    const isRequired =
        validateRequiredKey(keyCandidate);

    console.log(
        "Required key validation:",
        isRequired
    );
}

function testAllCurrentMechanicsCandidate() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "All mechanics test: base generation failed"
        );
        return;
    }

    const candidate =
        addAllCurrentMechanicsToCandidate(
            baseCandidate
        );

    if (candidate === null) {
        console.log(
            "All mechanics test: placement failed"
        );
        return;
    }

    const normalized =
        normalizeLevel(candidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "All mechanics target:",
        candidate.targetLength
    );

    console.log(
        "All mechanics planned length:",
        candidate.path.length - 1
    );

    console.log(
        "All mechanics optimal:",
        optimal
    );

    console.log(
        "Key:",
        candidate.keys[0].position
    );

    console.log(
        "Key gate:",
        candidate.lockGroups[0].tiles[0]
    );

    console.log(
        "Switch:",
        candidate.switches[0].position
    );

    console.log(
        "Switch gate:",
        candidate.switchGates[0].tiles[0]
    );

    console.log(
        "Arrow:",
        candidate.requiredArrows[0]
    );
}

function testTwoSwitchCandidate() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Two-switch test: base generation failed"
        );
        return;
    }

    const candidate =
        addTwoSwitchesToCandidate(baseCandidate);

    if (candidate === null) {
        console.log(
            "Two-switch test: placement failed"
        );
        return;
    }

    const normalized =
        normalizeLevel(candidate);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Two-switch target:",
        candidate.targetLength
    );

    console.log(
        "Two-switch planned length:",
        candidate.path.length - 1
    );

    console.log(
        "Two-switch optimal:",
        optimal
    );

    console.log(
        "S1:",
        candidate.switches[0]
    );

    console.log(
        "Gate 1:",
        candidate.switchGates[0]
    );

    console.log(
        "S2:",
        candidate.switches[1]
    );

    console.log(
        "Gate 2:",
        candidate.switchGates[1]
    );
}

function testTwoSwitchRequirement() {
    const baseCandidate =
        createPathBasedCandidate(24);

    if (baseCandidate === null) {
        console.log(
            "Two-switch requirement test: base generation failed"
        );
        return;
    }

    const candidate =
        addTwoSwitchesToCandidate(baseCandidate);

    if (candidate === null) {
        console.log(
            "Two-switch requirement test: placement failed"
        );
        return;
    }

    const path = candidate.path;

    for (let i = 0; i < 2; i++) {
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

        const otherSwitchIndex =
            i === 0 ? 1 : 0;

        const otherSwitchPosition =
            brokenCandidate.switches[
                otherSwitchIndex
            ].position;

        let lateSwitchPosition = null;

        for (
            let pathIndex = gateIndex + 1;
            pathIndex < path.length - 1;
            pathIndex++
        ) {
            const position =
                path[pathIndex];

            const overlapsOtherSwitch =
                position[0] === otherSwitchPosition[0] &&
                position[1] === otherSwitchPosition[1];

            if (!overlapsOtherSwitch) {
                lateSwitchPosition = position;
                break;
            }
        }

        if (lateSwitchPosition === null) {
            console.log(
                `Two-switch requirement S${i + 1}: no valid test position`
            );
            continue;
        }

        brokenCandidate.switches[i].position =
            lateSwitchPosition;

        const normalized =
            normalizeLevel(brokenCandidate);

        const optimal =
            findShortestPathLength(normalized);

        console.log(
            `Two-switch requirement S${i + 1}:`,
            optimal
        );
    }
}



//testPathCandidate();
//testDynamicPath();
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
testKeyGateCandidate();
testKeyRequirement();
testRequiredKeyValidation();
testAllCurrentMechanicsCandidate();
testTwoSwitchCandidate();
testTwoSwitchRequirement();