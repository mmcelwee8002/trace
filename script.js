
//Start the game

// ------------------------------------
// TRACE
// Version 0.1
// Create a 5x5 game board
// ------------------------------------

const BOARD_SIZE = 5;

let currentLevelIndex = 0;
let level = levels[currentLevelIndex];
let highestUnlockedLevel =
    Math.min(
        Number(
            localStorage.getItem("traceHighestUnlockedLevel")
        ) || 0,
        levels.length - 1
    );

// ======================================
// Game State
// ======================================

let currentPath = [];
let isDrawing = false;
let levelComplete = false;
let bestMovesByLevel =
    JSON.parse(
        localStorage.getItem("traceBestMoves")
    ) || {};

const board = document.querySelector(".game-board");
const levelMessage =
document.querySelector(".level-message");
const restartButton =
    document.querySelector(".restart-button");

const previousButton =
    document.querySelector(".previous-button");

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

const savedBest =
    bestMovesByLevel[level.id];

const optimalMoves =
    findShortestPathLength(level);

if (savedBest !== undefined) {
    levelMessage.textContent =
        `Best: ${savedBest} | Optimal: ${optimalMoves}`;
} else {
    levelMessage.textContent =
        `Optimal: ${optimalMoves}`;
}

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
updateNavigationButtons();
}

createBoard();

// ======================================
// Input
// ======================================

function handlePointerDown(event) {
        event.preventDefault();
        const tile = event.target;



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

//shortest path

function findShortestPathLength(level) {
    const start = level.start;
    const goal = level.goal;

    const queue = [
        {
            row: start[0],
            col: start[1],
            moves: 0
        }
    ];

    const visited = new Set();

    visited.add(`${start[0]},${start[1]}`);

    while (queue.length > 0) {
        const current = queue.shift();

        // Reached the goal
        if (
            current.row === goal[0] &&
            current.col === goal[1]
        ) {
            return current.moves;
        }

        // Up, down, left, right
        const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ];

        for (const direction of directions) {
            const newRow =
                current.row + direction[0];

            const newCol =
                current.col + direction[1];

            // Stay inside the board
            if (
                newRow < 0 ||
                newRow >= level.size ||
                newCol < 0 ||
                newCol >= level.size
            ) {
                continue;
            }

            // Don't walk through walls
            const isWall = level.walls.some(
                wall =>
                    wall[0] === newRow &&
                    wall[1] === newCol
            );

            if (isWall) {
                continue;
            }

            const key = `${newRow},${newCol}`;

            // Don't check the same tile twice
            if (visited.has(key)) {
                continue;
            }

            visited.add(key);

            queue.push({
                row: newRow,
                col: newCol,
                moves: current.moves + 1
            });
        }
    }

    // No possible route
    return null;
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

    const playerMoves =
        currentPath.length - 1;

    const optimalMoves =
        findShortestPathLength(level);

    const levelId =
        level.id;

if (
    currentLevelIndex === highestUnlockedLevel &&
    highestUnlockedLevel < levels.length - 1
) {
    highestUnlockedLevel++;

    localStorage.setItem(
        "traceHighestUnlockedLevel",
        highestUnlockedLevel
    );
}

    const previousBest =
        bestMovesByLevel[levelId];

const isNewBest =
    previousBest === undefined ||
    playerMoves < previousBest;

    if (
        previousBest === undefined ||
        playerMoves < previousBest
    ) 
  if (isNewBest) {
    bestMovesByLevel[levelId] =
        playerMoves;

    localStorage.setItem(
    "traceBestMoves",
    JSON.stringify(bestMovesByLevel)
    );
    }

    const bestMoves =
        bestMovesByLevel[levelId];

if (playerMoves === optimalMoves) {
    levelMessage.textContent =
        `Perfect! Moves: ${playerMoves} | Best: ${bestMoves} | Optimal: ${optimalMoves}`;
} else if (isNewBest) {
    levelMessage.textContent =
        `New Best! Moves: ${playerMoves} | Best: ${bestMoves} | Optimal: ${optimalMoves}`;
} else {
    levelMessage.textContent =
        `Level Complete! Moves: ${playerMoves} | Best: ${bestMoves} | Optimal: ${optimalMoves}`;
}
}
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
    if (currentLevelIndex < highestUnlockedLevel) {
        currentLevelIndex++;
    }

    if (currentLevelIndex >= levels.length) {
        currentLevelIndex = levels.length - 1;
    }

    level = levels[currentLevelIndex];

    restartLevel();
    createBoard();
}

function loadPreviousLevel() {
    if (currentLevelIndex > 0) {
        currentLevelIndex--;
    }

    level = levels[currentLevelIndex];

    restartLevel();
    createBoard();
}

function updateNavigationButtons() {
    previousButton.disabled =
        currentLevelIndex === 0;

    nextButton.disabled =
    currentLevelIndex >= highestUnlockedLevel ||
    currentLevelIndex >= levels.length - 1;
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
previousButton.addEventListener(
    "click",
    loadPreviousLevel
);