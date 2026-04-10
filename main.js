// Error logging and output to get around the fact that I can't use the developer console
let textLog = document.getElementById("textLog");
function output(string) {
    textLog.innerHTML = textLog.innerHTML + string + "<br>";
}
window.addEventListener("error", (event) => {
    output("Error at " + event.filename + ":" + event.lineno + " - " + event.message);
});


// Keyboard input
let keyDown = {};
let keyPressed = {};
let keyHit = {};
window.addEventListener("keydown", (event) => {
    if (!keyDown[event.key]) {
        keyHit[event.key] = true;
    }
    keyDown[event.key] = true;
    keyPressed[event.key] = true;
});
window.addEventListener("keyup", (event) => {
    keyDown[event.key] = false;
});

function resetHitKeys() {
    for (let key in keyPressed) {
        keyPressed[key] = false;
    }
    for (let key in keyHit) {
        keyHit[key] = false;
    }
}

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let t = 0;

// // Object classes, will set up later
// class dynamicObject {
//     constructor() {
//         this.x = 0;
//         this.y = 0;
//     }

//     update() {
//         return
//     }
// }

// class physicalObject extends dynamicObject {
//     constructor() {
//         super();
//         this.vx = 0;
//         this.vy = 0;
//     }

//     update() {
//         this.x += this.vx;
//         this.y += this.vy;
//     }
// }

// class player extends physicalObject {
//     constructor() {
//         super();
//     }

//     update() {
//         return
//     }
// }

let levelWidth = 20;
let levelHeight = 20;
const DEFAULT_TILE = "grass";
let levelTiles = new Array(levelWidth).fill(null).map(() => new Array(levelHeight).fill(DEFAULT_TILE));
levelTiles[0][5] = "dirt";
output(levelTiles);

let cameraX = 0;
let cameraY = 0;
let cameraZoom = 50;



function drawRectangle(x, y, width, height) {
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
}

let tileCtx = {
    x: 0,
    y: 0,
    width: 50,
    height: 50
}
function drawRectangleInTileContext(x, y, width, height) {
    drawRectangle(tileCtx.x + x * tileCtx.width, tileCtx.y + y * tileCtx.height, width * tileCtx.width, height * tileCtx.height);
}

class tile {
    constructor() {
        this.collidable = false;
        this.layer = 0;
    }

    draw(x, y) {
        return
    }
}


// function drawTile(x, y, tileType) {
//     tileCtx.x = cameraX;
//     tileCtx.y = cameraY;
//     tileCtx.width = cameraZoom;
//     tileCtx.height = cameraZoom;
//     tileTypes[tileType].draw(x, y);
// }

function renderFrame() {
    // Clear the canvas for the new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = 0;
    ctx.font = "20px Arial";
    // Render all pressed keys as text
    for (let key in keyDown) {
        if (keyDown[key]) {
            ctx.fillText(key, x, canvas.height / 2);
            x += 30;
        }
    }

    // Draw the tiles
    // for (let x = 0; x < levelWidth; x++) {
    //     for (let y = 0; y < levelHeight; y++) {
    //         let tileType = levelTiles[x][y];
    //         tileTypes[tileType].draw(x, y);
    //     }
    // }
}

function updateGame() {
    // output(t);
}

function gameTick() {
    t += 1;
    updateGame();
    renderFrame();
    resetHitKeys();
    requestAnimationFrame(gameTick);
}

requestAnimationFrame(gameTick);