// Catalog progression stays usable in memory when storage is unavailable.
(() => {
    const landing = document.querySelector("#landing-view");
    const puzzle = document.querySelector("#puzzle-view");
    const heading = document.querySelector("#puzzle-heading");
    const message = document.querySelector("#landing-message");
    const settings = document.querySelector(".settings");
    const previous = document.querySelector("#catalog-previous-button");
    const next = document.querySelector("#catalog-next-button");
    const buttons = [...document.querySelectorAll("[data-difficulty]")];
    const progress = Object.fromEntries(buttons.map(button => [
        button.dataset.difficulty,
        { currentPuzzle: 1, highestCompleted: 0 }
    ]));
    let selectedButton = null;
    let activePuzzle = null;
    const storageKey = "traceMazeProgressV1";
    let warnedAboutStorage = false;

    function warnAboutStorage() {
        if (warnedAboutStorage) return;
        warnedAboutStorage = true;
        console.warn("Trace Maze progress storage is unavailable; continuing in memory.");
    }

    function serializeProgress() {
        return JSON.stringify({ version: 1, difficulties: progress });
    }

    function restoreProgress() {
        let raw;
        try {
            raw = window.localStorage.getItem(storageKey);
        } catch {
            warnAboutStorage();
            return;
        }
        if (!raw) return;
        let saved;
        try {
            saved = JSON.parse(raw);
        } catch {
            return;
        }
        const isRecord = value => value !== null &&
            typeof value === "object" && !Array.isArray(value);
        if (!isRecord(saved) || saved.version !== 1 ||
            !isRecord(saved.difficulties)) return;

        for (const difficulty of Object.keys(progress)) {
            const entry = saved.difficulties[difficulty];
            if (!isRecord(entry)) continue;
            const count = getMazeV2CatalogCount(difficulty);
            const highestCompleted = Number.isSafeInteger(entry.highestCompleted)
                ? Math.max(0, Math.min(count, entry.highestCompleted)) : 0;
            const currentPuzzle = Number.isSafeInteger(entry.currentPuzzle)
                ? Math.max(1, Math.min(count, highestCompleted + 1, entry.currentPuzzle)) : 1;
            progress[difficulty] = { currentPuzzle, highestCompleted };
        }
    }

    restoreProgress();
    // Opening a restored puzzle or returning Home without changes needs no write.
    let lastSavedProgress = serializeProgress();

    function saveProgress() {
        const serialized = serializeProgress();
        if (serialized === lastSavedProgress) return;
        try {
            window.localStorage.setItem(storageKey, serialized);
            lastSavedProgress = serialized;
        } catch {
            // Leave it dirty so a later navigation (including Home) can retry.
            warnAboutStorage();
        }
    }

    function updateProgress() {
        buttons.forEach(button => {
            const difficulty = button.dataset.difficulty;
            button.querySelector(".prototype-progress").textContent =
                `${progress[difficulty].highestCompleted} / ${getMazeV2CatalogCount(difficulty)}`;
        });
        if (!activePuzzle) return;
        const { difficulty } = activePuzzle;
        const state = progress[difficulty];
        const count = getMazeV2CatalogCount(difficulty);
        heading.textContent =
            `${selectedButton.firstElementChild.textContent} \u2014 ${state.currentPuzzle} of ${count}`;
        previous.disabled = state.currentPuzzle <= 1;
        next.disabled = state.currentPuzzle >= count ||
            state.currentPuzzle > state.highestCompleted;
    }

    function releasePuzzle() {
        activePuzzle = null;
        window.mazeV2PreviewController?.destroy();
        window.mazeV2PreviewController = null;
    }

    function openPuzzle(button, puzzleNumber) {
        const difficulty = button.dataset.difficulty;
        const state = progress[difficulty];
        const count = getMazeV2CatalogCount(difficulty);
        // Guard navigation as well as disabling the controls.
        if (puzzleNumber < 1 || puzzleNumber > count ||
            puzzleNumber > state.highestCompleted + 1) return;
        releasePuzzle();
        settings.open = false;
        message.textContent = "";
        landing.hidden = true;
        // Make the board measurable before the existing renderer runs.
        puzzle.hidden = false;
        try {
            const candidate = loadMazeV2CatalogPuzzle(difficulty, puzzleNumber);
            if (!candidate) throw new Error("Catalog puzzle could not be loaded.");
            state.currentPuzzle = puzzleNumber;
            selectedButton = button;
            activePuzzle = {
                difficulty,
                candidate,
                controller: window.mazeV2PreviewController
            };
            updateProgress();
            saveProgress();
            heading.focus();
        } catch (error) {
            releasePuzzle();
            puzzle.hidden = true;
            landing.hidden = false;
            message.textContent = "Unable to open this puzzle. Please try again.";
            button.focus();
            console.error("Catalog navigation failed", error);
        }
    }

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            openPuzzle(button, progress[button.dataset.difficulty].currentPuzzle);
        });
    });

    document.querySelector(".game-board").addEventListener("maze-v2-complete", event => {
        // Ignore development previews and notifications from a departed puzzle.
        if (!activePuzzle || puzzle.hidden ||
            event.detail?.maze !== activePuzzle.candidate ||
            window.mazeV2PreviewController !== activePuzzle.controller) return;
        const state = progress[activePuzzle.difficulty];
        if (state.currentPuzzle === state.highestCompleted + 1) {
            state.highestCompleted = state.currentPuzzle;
        }
        updateProgress();
        saveProgress();
    });

    previous.addEventListener("click", () => {
        if (!activePuzzle || previous.disabled) return;
        openPuzzle(selectedButton, progress[activePuzzle.difficulty].currentPuzzle - 1);
    });
    next.addEventListener("click", () => {
        if (!activePuzzle || next.disabled) return;
        openPuzzle(selectedButton, progress[activePuzzle.difficulty].currentPuzzle + 1);
    });

    document.querySelector("#home-button").addEventListener("click", () => {
        saveProgress();
        releasePuzzle();
        settings.open = false;
        puzzle.hidden = true;
        landing.hidden = false;
        selectedButton?.focus();
    });

    // Development console helper; deliberately has no player-facing control.
    window.resetTraceMazeProgress = () => {
        releasePuzzle();
        for (const difficulty of Object.keys(progress)) {
            progress[difficulty] = { currentPuzzle: 1, highestCompleted: 0 };
        }
        try {
            window.localStorage.removeItem(storageKey);
        } catch {
            warnAboutStorage();
        }
        lastSavedProgress = serializeProgress();
        settings.open = false;
        puzzle.hidden = true;
        landing.hidden = false;
        message.textContent = "";
        previous.disabled = true;
        next.disabled = true;
        updateProgress();
        selectedButton?.focus();
    };

    updateProgress();
})();
