// Existing variables
var blockSize = 25;
var rows = 20;
var cols = 20;
var board;
var context;

var resetEnv = document.querySelector('.reset');
var resetButton = document.querySelector('.reset-button');

// Snake head
var snakeX = blockSize * 10;
var snakeY = blockSize * 10;

var velocityX = 0;
var velocityY = 0;

var snakeBody = [];

// Food
var foodX;
var foodY;

// Game state
var gameOver = false;

var intro = document.querySelector('.intro');
var closeIntro = document.querySelector('.close-button');

// Close intro when the close button is clicked
closeIntro.addEventListener('click', () => {
    intro.classList.add('closed');
});

// Close intro on click anywhere in the document
document.addEventListener('click', () => {
    intro.classList.add('closed');
});

// Close intro when Enter or ArrowDown is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === "Enter" || event.key === "ArrowDown") {
        intro.classList.add('closed');
    }
});

window.onload = function () {
    board = document.getElementById("board");
    board.height = rows * blockSize;
    board.width = cols * blockSize;
    context = board.getContext("2d"); // Used for drawing on the boards

    placeFood();
    document.addEventListener("keyup", changeDirection);
    resetButton.addEventListener("click", resetGame);
    document.addEventListener('keydown', (event) => {
        if (event.key === "Enter") {
            resetGame();
        }
    });

    setInterval(update, 1000 / 15); // updates 15 times a second
}

function update() {
    if (gameOver) {
        resetEnv.classList.add('active'); // Show reset message
        return;
    }

    context.clearRect(0, 0, board.width, board.height); // Clear canvas
    drawGrid(); // Draw grid

    context.fillStyle = "navy"; // Background color
    context.fillRect(0, 0, board.width, board.height);

    if (snakeX === foodX && snakeY === foodY) {
        snakeBody.push([foodX, foodY]);
        placeFood();
    }

    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }

    if (snakeBody.length) {
        snakeBody[0] = [snakeX, snakeY];
    }

    context.fillStyle = "lime"; // Snake color
    context.shadowColor = "rgba(0, 0, 0, 0.5)"; // Soft shadow
    context.shadowBlur = 10; // Shadow blur
    snakeX += velocityX * blockSize;
    snakeY += velocityY * blockSize;
    context.fillRect(snakeX, snakeY, blockSize, blockSize);
    context.shadowColor = "transparent"; // Reset shadow for body
    for (let i = 0; i < snakeBody.length; i++) {
        context.fillRect(snakeBody[i][0], snakeBody[i][1], blockSize, blockSize);
    }

    // Game Over Conditions
    if (snakeX < 0 || snakeX >= cols * blockSize || snakeY < 0 || snakeY >= rows * blockSize) {
        gameOver = true;
    }

    for (let i = 0; i < snakeBody.length; i++) {
        if (snakeX === snakeBody[i][0] && snakeY === snakeBody[i][1]) {
            gameOver = true;
        }
    }

    context.fillStyle = "red"; // Food color
    context.fillRect(foodX, foodY, blockSize, blockSize);
}

function drawGrid() {
    context.strokeStyle = "rgba(75, 143, 0, 0.6)"; // Light green with low opacity
    context.lineWidth = 0.5; // Make the lines thinner
    for (let j = 0; j <= cols; j++) {
        context.beginPath();
        context.moveTo(j * blockSize, 0);
        context.lineTo(j * blockSize, rows * blockSize);
        context.stroke();
    }
    for (let j = 0; j <= rows; j++) {
        context.beginPath();
        context.moveTo(0, j * blockSize);
        context.lineTo(cols * blockSize, j * blockSize);
        context.stroke();
    }
}

function placeFood() {
    foodX = Math.floor(Math.random() * cols) * blockSize;
    foodY = Math.floor(Math.random() * rows) * blockSize;
}

function changeDirection(e) {
    if (e.code == "ArrowUp" && velocityY != 1) {
        velocityX = 0;
        velocityY = -1;
        highlightButton('up');
    } else if (e.code == "ArrowDown" && velocityY != -1) {
        velocityX = 0;
        velocityY = 1;
        highlightButton('down');
    } else if (e.code == "ArrowRight" && velocityX != -1) {
        velocityX = 1;
        velocityY = 0;
        highlightButton('right');
    } else if (e.code == "ArrowLeft" && velocityX != 1) {
        velocityX = -1;
        velocityY = 0;
        highlightButton('left');
    }
}

function highlightButton(direction) {
    // Remove highlighting from all buttons first
    document.querySelectorAll('.arrows button').forEach(btn => {
        btn.classList.remove('clicked');
    });
    
    // Highlight the appropriate button
    switch (direction) {
        case 'up':
            document.querySelector('.up-arrow').classList.add('clicked');
            break;
        case 'down':
            document.querySelector('.down-arrow').classList.add('clicked');
            break;
        case 'left':
            document.querySelector('.left').classList.add('clicked');
            break;
        case 'right':
            document.querySelector('.right').classList.add('clicked');
            break;
    }
}

function resetGame() {
    resetEnv.classList.remove('active'); // Hide reset message
    gameOver = false; // Reset game state
    resetElements(); // Reset the game elements
}

function resetElements() {
    velocityX = 0;
    velocityY = 0;

    snakeBody = [];

    snakeX = blockSize * 10;
    snakeY = blockSize * 10;

    placeFood(); // Place food again
}

var buttonRight = document.querySelector('.right').addEventListener('click', () => handleDirectionChange('right'));
var buttonLeft = document.querySelector('.left').addEventListener('click', () => handleDirectionChange('left'));
var buttonUp = document.querySelector('.up-arrow').addEventListener('click', () => handleDirectionChange('up'));
var buttonDown = document.querySelector('.down-arrow').addEventListener('click', () => handleDirectionChange('down'));

function handleDirectionChange(direction) {
    switch (direction) {
        case 'up':
            console.log('Moving Up');
            velocityX = 0;
            velocityY = -1;
            highlightButton('up');
            break;
        case 'down':
            console.log('Moving Down');
            velocityX = 0;
            velocityY = 1;
            highlightButton('down');
            break;
        case 'left':
            console.log('Moving Left');
            velocityX = -1;
            velocityY = 0;
            highlightButton('left');
            break;
        case 'right':
            console.log('Moving Right');
            velocityX = 1;
            velocityY = 0;
            highlightButton('right');
            break;
    }
}
