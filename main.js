const canvas1 = document.getElementById("maze1");
const canvas2 = document.getElementById("maze2");

const ctx1 = canvas1.getContext("2d");
const ctx2 = canvas2.getContext("2d");

const SIZE = 25;
const ROWS = 20;
const COLS = 20;

let maze1 = [];
let maze2 = [];

let gameMode = "bot";

let timer = 60;
let gameInterval;
let botInterval;

let exit1 = {};
let exit2 = {};

let player1Score = 0;
let player2Score = 0;

const p1 = { x: 1, y: 1, color: "#00e5ff" };
const p2 = { x: 1, y: 1, color: "#ff006e" };

document.getElementById("botBtn").onclick = () => {
    gameMode = "bot";
    startGame();
};

document.getElementById("friendBtn").onclick = () => {
    gameMode = "friend";
    document.getElementById("enemyTitle").innerText = "PLAYER 2";
    startGame();
};

function generateMaze() {
    let maze = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => 1)
    );

    function carve(x, y) {
        maze[y][x] = 0;

        let dirs = [
            [0, -2],
            [0, 2],
            [-2, 0],
            [2, 0]
        ];

        dirs.sort(() => Math.random() - 0.5);

        for (let [dx, dy] of dirs) {
            let nx = x + dx;
            let ny = y + dy;

            if (
                nx > 0 && ny > 0 &&
                nx < COLS - 1 && ny < ROWS - 1 &&
                maze[ny][nx] === 1
            ) {
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(1, 1);

    return maze;
}

function randomExit(maze) {
    while (true) {
        let x = Math.floor(Math.random() * COLS);
        let y = Math.floor(Math.random() * ROWS);

        if (maze[y][x] === 0 && (x !== 1 || y !== 1)) {
            return { x, y };
        }
    }
}

function drawMaze(ctx, maze) {
    ctx.clearRect(0, 0, 500, 500);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            ctx.fillStyle = maze[y][x] === 1 ? "#8a2be2" : "#0b1023";

            ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
    }
}

function drawExit(ctx, exit) {
    ctx.fillStyle = "#00ff88";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ff88";

    ctx.fillRect(exit.x * SIZE, exit.y * SIZE, SIZE, SIZE);
}

function drawPlayer(ctx, p) {
    ctx.beginPath();
    ctx.fillStyle = p.color;

    ctx.arc(
        p.x * SIZE + SIZE / 2,
        p.y * SIZE + SIZE / 2,
        SIZE / 3,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function render() {
    drawMaze(ctx1, maze1);
    drawMaze(ctx2, maze2);

    drawExit(ctx1, exit1);
    drawExit(ctx2, exit2);

    drawPlayer(ctx1, p1);
    drawPlayer(ctx2, p2);
}

function movePlayer(p, maze, dx, dy) {
    let nx = p.x + dx;
    let ny = p.y + dy;

    if (maze[ny] && maze[ny][nx] === 0) {
        p.x = nx;
        p.y = ny;

        createParticles(p);

        render();

        checkWinner();
    }
}

function checkWinner() {
    if (p1.x === exit1.x && p1.y === exit1.y) {
        player1Score++;
        endGame("PLAYER 1");
    }

    if (p2.x === exit2.x && p2.y === exit2.y) {
        player2Score++;
        endGame(gameMode === "bot" ? "BOT" : "PLAYER 2");
    }
}

function endGame(winner){

    clearInterval(gameInterval);
    clearInterval(botInterval);

    const endScreen = document.getElementById("endScreen");
    const endText = document.getElementById("endText");

    endText.innerText = winner + " WINS!";

    endScreen.classList.remove("hidden");

    // restart
    document.getElementById("restartBtn").onclick = () => {
        endScreen.classList.add("hidden");
        resetGame();
        startGame();
    };

    // home
    document.getElementById("homeBtn").onclick = () => {
        endScreen.classList.add("hidden");
        resetGame();
        showMenu();
    };
}

function updateTimer() {
    timer--;
    document.getElementById("timer").innerText = timer;

    if (timer <= 0) endGame("NO ONE");
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findPath(maze, start, end) {
    let open = [];
    let closed = [];

    open.push({
        x: start.x,
        y: start.y,
        g: 0,
        f: 0,
        parent: null
    });

    while (open.length) {
        open.sort((a, b) => a.f - b.f);
        let current = open.shift();

        if (current.x === end.x && current.y === end.y) {
            let path = [];
            while (current) {
                path.push(current);
                current = current.parent;
            }
            return path.reverse();
        }

        closed.push(current);

        for (let [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ]) {
            let nx = current.x + dx;
            let ny = current.y + dy;

            if (!maze[ny] || maze[ny][nx] === 1) continue;

            if (closed.find(n => n.x === nx && n.y === ny)) continue;

            let g = current.g + 1;
            let h = heuristic({ x: nx, y: ny }, end);

            let existing = open.find(n => n.x === nx && n.y === ny);

            if (!existing || g < existing.g) {
                open.push({
                    x: nx,
                    y: ny,
                    g,
                    f: g + h,
                    parent: current
                });
            }
        }
    }

    return [];
}

function botMove() {
    let path = findPath(maze2, p2, exit2);

    if (path.length > 1) {
        let next = path[1];
        p2.x = next.x;
        p2.y = next.y;

        createParticles(p2);

        render();

        checkWinner();
    }
}

function createParticles(p) {
    for (let i = 0; i < 10; i++) {
        let d = document.createElement("div");
        d.className = "particle";
        d.style.left = p.x * SIZE + "px";
        d.style.top = p.y * SIZE + "px";
        d.style.background = p.color;

        document.body.appendChild(d);

        setTimeout(() => d.remove(), 600);
    }
}

function startGame(){

    resetUI(); // ⚠️ MUHIM (old state tozalanadi)

    const menu = document.getElementById("menu");
    const gameArea = document.getElementById("gameArea");

    menu.style.display = "none";

    gameArea.classList.remove("hidden");

    gameArea.style.display = "block";
    gameArea.style.visibility = "visible";
    gameArea.style.opacity = "1";

    maze1 = generateMaze();
    maze2 = generateMaze();

    exit1 = randomExit(maze1);
    exit2 = randomExit(maze2);

    p1.x = p1.y = 1;
    p2.x = p2.y = 1;

    timer = 60;

    render();

    clearInterval(gameInterval);
    clearInterval(botInterval);

    gameInterval = setInterval(updateTimer, 1000);

    if(gameMode === "bot"){
        botInterval = setInterval(botMove, 200);
    }
}

document.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") movePlayer(p1, maze1, 0, -1);
    if (e.key === "ArrowDown") movePlayer(p1, maze1, 0, 1);
    if (e.key === "ArrowLeft") movePlayer(p1, maze1, -1, 0);
    if (e.key === "ArrowRight") movePlayer(p1, maze1, 1, 0);

    if (gameMode === "friend") {
        if (e.key === "w") movePlayer(p2, maze2, 0, -1);
        if (e.key === "s") movePlayer(p2, maze2, 0, 1);
        if (e.key === "a") movePlayer(p2, maze2, -1, 0);
        if (e.key === "d") movePlayer(p2, maze2, 1, 0);
    }
});

function resetUI(){
    const menu = document.getElementById("menu");
    const gameArea = document.getElementById("gameArea");

    // menu qaytadi
    menu.style.display = "flex";
    menu.style.visibility = "visible";
    menu.style.opacity = "1";

    // game area yashirinadi
    gameArea.classList.add("hidden");

    // winner text reset (agar bor bo‘lsa)
    const w = document.getElementById("winner");
    if(w) w.innerText = "NONE";

    // timer reset
    const t = document.getElementById("timer");
    if(t) t.innerText = "60";

    document.getElementById("homeBtn").onclick = () => {
    resetUI();
};
}

function hardResetGame(){

    clearInterval(gameInterval);
    clearInterval(botInterval);

    location.reload(); // eng toza reset
}


function startCountdownRestart(){

    const countdown = document.getElementById("countdown");
    const endScreen = document.getElementById("endScreen");

    let count = 3;

    countdown.innerText = count;

    let interval = setInterval(() => {

        count--;

        if(count > 0){
            countdown.innerText = count;
        }

        if(count === 0){

            countdown.innerText = "GO!";

        }

        if(count < 0){

            clearInterval(interval);

            endScreen.classList.add("hidden");

            resetGame();

            startGame();
        }

    }, 700);
}


function resetGame(){

    clearInterval(gameInterval);
    clearInterval(botInterval);

    timer = 60;

    p1.x = 1; p1.y = 1;
    p2.x = 1; p2.y = 1;

    maze1 = [];
    maze2 = [];

    const w = document.getElementById("winner");
    if(w) w.innerText = "NONE";
}