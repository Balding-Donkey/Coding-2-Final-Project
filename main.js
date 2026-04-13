// Error logging and output to get around the fact that I can't use the developer console
let textLog = document.getElementById("textLog");
function output(string) {
    textLog.innerHTML = textLog.innerHTML + string + "<br>";
}
window.addEventListener("error", (event) => {
    output("Error at " + event.filename + ":" + event.lineno + " - " + event.message);
});


// Import assets
let assets = {};
function loadAsset(name, path) {
    let image = new Image();
    image.src = "assets/" + path;
    assets[name] = image;
}
loadAsset("tiller", "partick tiler.png");
loadAsset("amongus", "sussy.png");
loadAsset("carrots", "Carrots.png");
loadAsset("tile", "Closed.png");
loadAsset("flag", "Flag_R.png");


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


let canvas = document.getElementById("canvas");
let mouseWorldPos = {x: 0, y: 0};
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", (event) => {
    let rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left - canvas.width / 2;
    mouseY = event.clientY - rect.top - canvas.height / 2;
    // mouseWorldPos = transformToWorldSpace(mouseX, mouseY); // Do this the game loop instead so that it happens when the camera is moved too
});

let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
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

class tile {
    constructor(sprite = null, collidable = false) {
        this.collidable = collidable;
        this.sprite = sprite;
    }
}

let tileTypes = {
    "air": new tile(null, false),
    "grass": new tile(assets["tile"], true),
    "dirt": new tile(assets["flag"], true),
    "flower": new tile(assets["carrots"], false),
}

const DEFAULT_TILE = {
    type: "grass"
};

let levelWidth = 100;
let levelHeight = 100;
let levelDepth = 1;
let levelTiles = new Array(levelDepth).fill(null).map(() => new Array(levelWidth).fill(null).map(() => new Array(levelHeight).fill(DEFAULT_TILE)));
for (let x = 0; x < levelWidth; x++) {
    for (let y = 0; y < levelHeight; y++) {
        if (Math.random() < 0.1) {
            levelTiles[0][x][y] = {type: "dirt"};
        }
        if (Math.random() < 0.01) {
            levelTiles[0][x][y] = {type: "flower"};
        }
    }
}


let cameraX = levelWidth / 2;
let cameraY = levelHeight / 2;
let cameraZoom = 50;


function drawCenteredRectangle(x, y, width, height) {
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
}

function drawCenteredImage(image, x, y, width, height) {
    ctx.drawImage(image, x - width / 2 + canvas.width / 2, y - height / 2 + canvas.height / 2, width, height);
}

function transformToWorldSpace(x, y) {
    x = x / cameraZoom + cameraX;
    y = y / cameraZoom + cameraY;
    return {x: x, y: y};
}

function transformFromWorldSpace(x, y, width=null, height=null) {
    x = (x - cameraX) * cameraZoom;
    y = (y - cameraY) * cameraZoom;
    if (width !== null) {
        width = width * cameraZoom;
    }
    if (height !== null) {
        height = height * cameraZoom;
    }
    return {x: x, y: y, width: width, height: height};
}

function drawInWorldSpace(x, y, width, height, image=null) {
    let transformed = transformFromWorldSpace(x, y, width, height);
    x = transformed.x;
    y = transformed.y;
    width = transformed.width;
    height = transformed.height;
    if (x + width / 2 < -canvas.width / 2 || x - width / 2 > canvas.width / 2 || y + height / 2 < -canvas.height / 2 || y - height / 2 > canvas.height / 2) {
        return;
    }

    // If there is no image we render a solid color rectangle instead
    if (image) {
        drawCenteredImage(image, x, y, width, height);
    } else {
        drawCenteredRectangle(x, y, width, height);
    }
}


function renderFrame() {
    // Clear the canvas for the new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render all pressed keys as text
    // let x = 0;
    // ctx.font = "20px Arial";
    // for (let key in keyDown) {
    //     if (keyDown[key]) {
    //         ctx.fillText(key, x, canvas.height / 2);
    //         x += 30;
    //     }
    // }

    // Draw the tiles
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            let tileType = levelTiles[0][x][y].type;
            drawInWorldSpace(x, y, 1, 1, tileTypes[tileType].sprite);
        }
    }
    screenPos = transformFromWorldSpace(mouseWorldPos.x, mouseWorldPos.y);
    // output("Screen position: " + screenPos.x + ", " + screenPos.y);
    drawCenteredImage(assets["tiller"], screenPos.x, screenPos.y, cameraZoom, cameraZoom);
}

let panSpeed = 0.1;
let zoomSpeed = 0.02;
function updateGame() {
    panSpeed = 5 / cameraZoom;
    cameraY += panSpeed * ((keyDown["s"] ?? false) - (keyDown["w"] ?? false));
    cameraX += panSpeed * ((keyDown["d"] ?? false) - (keyDown["a"] ?? false));
    if (keyDown["e"]) {
        cameraZoom *= 1 + zoomSpeed;
    }
    if (keyDown["q"]) {
        cameraZoom /= 1 + zoomSpeed;
    }
    mouseWorldPos = transformToWorldSpace(mouseX, mouseY);
}

function gameTick() {
    t += 1;
    updateGame();
    renderFrame();
    resetHitKeys();
    requestAnimationFrame(gameTick);
}

window.addEventListener("load", () => {
    requestAnimationFrame(gameTick);
});