
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

function testTwoKeyCandidate() {
    const candidate =
        createPathBasedCandidate(24);

    const withTwoKeys =
        addTwoKeysToCandidate(candidate);

    if (!withTwoKeys) {
        console.log("Two-key candidate: failed");
        return;
    }

    const normalized =
        normalizeLevel(withTwoKeys);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Two-key target:",
        withTwoKeys.targetLength
    );

    console.log(
        "Two-key planned:",
        withTwoKeys.path.length - 1
    );

    console.log(
        "Two-key optimal:",
        optimal
    );

    console.log(
        "Two-key keys:",
        withTwoKeys.keys
    );

    console.log(
        "Two-key gates:",
        withTwoKeys.lockGroups
    );
}

function testTwoKeyRequirement() {
    const candidate =
        createPathBasedCandidate(24);

    const withTwoKeys =
        addTwoKeysToCandidate(candidate);

    if (!withTwoKeys) {
        console.log("Two-key requirement test: failed to create candidate");
        return;
    }

    for (let i = 0; i < withTwoKeys.keys.length; i++) {
        const broken =
            structuredClone(withTwoKeys);

        const key =
            broken.keys[i];

        const gateGroup =
            broken.lockGroups.find(
                group => group.keyId === key.id
            );

        if (!gateGroup) {
            console.log(
                `Two-key requirement ${key.id}: no matching gate`
            );
            continue;
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
            console.log(
                `Two-key requirement ${key.id}: gate not on path`
            );
            continue;
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
            console.log(
                `Two-key requirement ${key.id}: no valid late position`
            );
            continue;
        }

        broken.keys[i].position =
            lateKeyPosition;

        const normalized =
            normalizeLevel(broken);

        const optimal =
            findShortestPathLength(normalized);

        console.log(
            `Two-key requirement ${key.id}:`,
            optimal
        );
    }
}

function testMixedMechanicCandidate() {
    const candidate =
        createPathBasedCandidate(24);

    const mixed =
        addMechanicsToCandidate(
            candidate,
            {
                keys: 2,
                switches: 2,
                arrows: 1
            }
        );

    if (!mixed) {
        console.log(
            "Mixed mechanic candidate: failed"
        );
        return;
    }

    const normalized =
        normalizeLevel(mixed);

    const optimal =
        findShortestPathLength(normalized);

    console.log(
        "Mixed target:",
        mixed.targetLength
    );

    console.log(
        "Mixed planned:",
        mixed.path.length - 1
    );

    console.log(
        "Mixed optimal:",
        optimal
    );

    console.log(
        "Mixed keys:",
        mixed.keys
    );

    console.log(
        "Mixed key gates:",
        mixed.lockGroups
    );

    console.log(
        "Mixed switches:",
        mixed.switches
    );

    console.log(
        "Mixed switch gates:",
        mixed.switchGates
    );

    console.log(
        "Mixed arrows:",
        mixed.requiredArrows
    );
}

function testMixedMechanicRequirements() {
    const candidate =
        createPathBasedCandidate(24);

    const mixed =
        addMechanicsToCandidate(
            candidate,
            {
                keys: 2,
                switches: 2,
                arrows: 1
            }
        );

    if (!mixed) {
        console.log(
            "Mixed requirement test: failed to create candidate"
        );
        return;
    }

    console.log(
        "Mixed key groups required:",
        validateRequiredKeyGroups(mixed)
    );

    console.log(
        "Mixed switch groups required:",
        validateRequiredSwitchGroups(mixed)
    );

    console.log(
        "Mixed arrow valid:",
        validateRequiredArrow(mixed)
    );
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

testKeyGateCandidate();
testKeyRequirement();
testRequiredKeyValidation();

testTwoSwitchCandidate();


testTwoKeyRequirement();




testMixedMechanicCandidate();
testMixedMechanicRequirements();