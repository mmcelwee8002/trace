
//Start the game

// ------------------------------------
// TRACE
// Version 0.1
// Create a 5x5 game board
// ------------------------------------

const BOARD_SIZE = 5;

const level = levels[0];

// ======================================
// Game State
// ======================================

let currentPath = [];
let isDrawing = false;

const board = document.querySelector(".game-board");

function createBoard() {
  board.innerHTML = "";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = document.createElement("div");

      tile.classList.add("tile");

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

    const tile = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest(".tile");

    if (!tile) {
        return;
    }

    console.log(
        tryAddTile(tile)
    );
}

function handlePointerUp() {

    isDrawing = false;

}

function tryAddTile(tile) {
    console.log(
        "Trying to add:",
        tile.dataset.row,
        tile.dataset.col
    );
}

document.addEventListener(
    "pointermove",
    handlePointerMove
);

document.addEventListener(
    "pointerup",
    handlePointerUp
);