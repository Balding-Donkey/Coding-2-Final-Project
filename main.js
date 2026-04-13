// Error logging and output to get around the fact that I can't use the developer console
let textLog = document.getElementById("textLog");
function output(string) {
    textLog.innerHTML = textLog.innerHTML + string + "<br>";
}
window.addEventListener("error", (event) => {
    output("Error at " + event.filename + ":" + event.lineno + " - " + event.message);
});

let log = document.getElementById("log");
let logButton = document.getElementById("loggleToggle");
logButton.addEventListener("click", () => {
    if (log.style.display === "none") {
        log.style.display = "block";
    } else {
        log.style.display = "none";
    }
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

// Import assets
let assets = {};
function loadAsset(name, path) {
    let image = new Image();
    image.src = path;
    assets[name] = image;
}
loadAsset("tiller", "assets/partick tiler.png");
loadAsset("amongus", "assets/sussy.png");



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



let cameraX = 0;
let cameraY = 0;
let cameraZoom = 50;


function drawCenteredRectangle(x, y, width, height) {
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
}

function drawCenteredImage(image, x, y, width, height) {
    ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
}

function drawTile(x, y, width, height, image=null) {
    // Transform based on camera parameters
    x = x * cameraZoom - cameraX;
    y = y * cameraZoom - cameraY;
    width = width * cameraZoom;
    height = height * cameraZoom;
    // If there is no image we render a solid color rectangle instead
    if (image) {
        drawCenteredImage(image, x, y, width, height);
    } else {
        drawCenteredRectangle(x, y, width, height);
    }
}

class tile {
    constructor(sprite = null, collidable = false) {
        this.collidable = collidable;
        this.sprite = sprite;
    }
}

let tileTypes = {
    "air": new tile(null, false),
    "grass": new tile(assets["tiller"], true),
    "dirt": new tile(assets["amongus"], true)
}


let levelWidth = 20;
let levelHeight = 20;
const DEFAULT_TILE = {
    type: "grass"
};
const DEFAULT_BACK_TILE = {
    type: "air"
};
let levelTiles = new Array(levelWidth).fill(null).map(() => new Array(levelHeight).fill(DEFAULT_TILE));
let backTiles = new Array(levelWidth).fill(null).map(() => new Array(levelHeight).fill(DEFAULT_BACK_TILE));
levelTiles[8][5] = {
    type: "dirt"
};
output(levelTiles);



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
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            let tileType = levelTiles[x][y].type;
            drawTile(x, y, 1, 1, tileTypes[tileType].sprite);
        }
    }
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