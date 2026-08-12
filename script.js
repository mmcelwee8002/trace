
//Start the game

// ------------------------------------
// TRACE
// Version 0.1
// Create a 5x5 game board
// ------------------------------------

const BOARD_SIZE = 5;

let currentLevelIndex = 0;
let level = levels[currentLevelIndex];

// ======================================
// Game State
// ======================================

let currentPath = [];
let isDrawing = false;
let levelComplete = false;

const board = document.querySelector(".game-board");
const levelMessage =
document.querySelector(".level-message");
const restartButton =
    document.querySelector(".restart-button");
const nextButton =
    document.querySelector(".next-button");

const levelNumber =
    document.querySelector(".level-number");    
    
const levelTitle =
    document.querySelector(".level-title");

function createBoard() {
  board.innerHTML = "";

levelNumber.textContent =
    `Level ${currentLevelIndex + 1}`;  

levelTitle.textContent =
    level.title;    

board.style.gridTemplateColumns =
    `repeat(${level.size}, 1fr)`;

board.style.gridTemplateRows =
    `repeat(${level.size}, 1fr)`;

 for (let row = 0; row < level.size; row++) {
    for (let col = 0; col < level.size; col++) {
      const tile = document.createElement("div");

      tile.classList.add("tile");

   const isWall =
    level.walls.some(
        wall =>
            wall[0] === row &&
            wall[1] === col
    );

if (isWall) {
    tile.classList.add("wall");
    
}   

      tile.dataset.row = row;
      tile.dataset.col = col;

tile.addEventListener("pointerdown", handlePointerDown);


      // Start tile
      if (row === level.start[0] && col === level.start[1]) {
        tile.classList.add("start");
      }

      // Goal tile
      if (row === level.goal[0] && col === level.goal[1]) {
        tile.classList.add("goal");
      }

      board.appendChild(tile);
    }
  }
}

createBoard();

// ======================================
// Input
// ======================================

function handlePointerDown(event) {
        event.preventDefault();
        const tile = event.target;

        console.log(
        `Pointer down at: row ${tile.dataset.row}, col ${tile.dataset.col}`);

    if (!tile.classList.contains("start")) {
        return;
    }

    isDrawing = true;

currentPath = [
    {
        row: Number(tile.dataset.row),
        col: Number(tile.dataset.col)
    }
];

tile.classList.add("path");

console.log(currentPath);
}

function handlePointerMove(event) {
    if (!isDrawing) {
        return;
    }

    const element = document.elementFromPoint(
        event.clientX,
        event.clientY
    );
    
    const tile = element
        ? element.closest(".tile")
        : null;

if (!tile) {
    return;
}


tryAddTile(tile);
    
}

function handlePointerUp() {
    if (!isDrawing) {
        return;
    }

    isDrawing = false;

    if (levelComplete) {
        return;
    }

    document
        .querySelectorAll(".tile.path")
        .forEach(tile => {
            tile.classList.remove("path");
        });

    currentPath = [];
}

function isAdjacent(lastTile, newTile) {

    const rowDifference =
        Math.abs(lastTile.row - newTile.row);

    const colDifference =
        Math.abs(lastTile.col - newTile.col);

    return rowDifference + colDifference === 1;

}

function tryAddTile(tile) {
    const newTile = {
        row: Number(tile.dataset.row),
        col: Number(tile.dataset.col)
    };

if (tile.classList.contains("wall")) {
    return;
}

    // Check whether this tile is already in the path
    const existingIndex = currentPath.findIndex(pathTile =>
        pathTile.row === newTile.row &&
        pathTile.col === newTile.col
    );

    if (existingIndex !== -1) {
        const previousTileIndex =
            currentPath.length - 2;

        // Moving back onto the previous tile removes the last step
        if (existingIndex === previousTileIndex) {
            const removedTile =
                currentPath.pop();

            const removedTileElement =
                document.querySelector(
                    `.tile[data-row="${removedTile.row}"][data-col="${removedTile.col}"]`
                );

            removedTileElement.classList.remove("path");

            console.log("Backtracked");
        }

        return;
    }

    const lastTile =
        currentPath[currentPath.length - 1];

    // Only allow one tile up, down, left, or right
    if (!isAdjacent(lastTile, newTile)) {
        return;
    }

    tile.classList.add("path");
    currentPath.push(newTile);

    if (tile.classList.contains("goal")) {
        levelComplete = true;
        isDrawing = false;

        console.log("Level Complete!");

        levelMessage.textContent =
            "Level Complete!";
    }

    console.log(currentPath);
}


// ======================================
// Restart Level
// ======================================

function restartLevel() {
    isDrawing = false;
    levelComplete = false;
    currentPath = [];

    document
        .querySelectorAll(".tile.path")
        .forEach(tile => {
            tile.classList.remove("path");
        });

    levelMessage.textContent = "";
}

function loadNextLevel() {
    currentLevelIndex++;

    if (currentLevelIndex >= levels.length) {
        currentLevelIndex = 0;
    }

    level = levels[currentLevelIndex];

    restartLevel();
    createBoard();
}


document.addEventListener(
    "pointermove",
    handlePointerMove
);

document.addEventListener(
    "pointerup",
    handlePointerUp
);
restartButton.addEventListener(
    "click",
    restartLevel
);
nextButton.addEventListener(
    "click",
    loadNextLevel
);