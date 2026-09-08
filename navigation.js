// Catalog progression lasts only for this page session.
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
        releasePuzzle();
        settings.open = false;
        puzzle.hidden = true;
        landing.hidden = false;
        selectedButton?.focus();
    });

    updateProgress();
})();
