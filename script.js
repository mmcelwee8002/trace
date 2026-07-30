
//Start the game

// ------------------------------------
// TRACE
// Version 0.1
// Create a 5x5 game board
// ------------------------------------

const BOARD_SIZE = 5;

const level = levels[0];


const board = document.querySelector(".game-board");

function createBoard() {
  board.innerHTML = "";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = document.createElement("div");

      tile.classList.add("tile");

      tile.dataset.row = row;
      tile.dataset.col = col;

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