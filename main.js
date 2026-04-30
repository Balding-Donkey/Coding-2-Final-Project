// Error logging and output to get around the fact that I can't use the developer console
let textLog = document.getElementById("textLog");
function output(string) {
    textLog.innerHTML = textLog.innerHTML + string + "<br>";
}
output("Script loaded successfully"); // If this does not appear then if means the script didn't run
window.addEventListener("error", (event) => {
    output("Error at " + event.filename + ":" + event.lineno + " - " + event.message);
});


// Math
function logBase(base, x) {
    return Math.log(x) / Math.log(base)
}


// Import assets
let assets = {};
function loadAsset(name, path) {
    let image = new Image();
    image.src = "assets/" + path;
    assets[name] = image;
}
// Placeholder assets
loadAsset("tiller", "partick tiler.png");
loadAsset("amongus", "sussy.png");
loadAsset("carrots", "Carrots.png");
loadAsset("tile", "Closed.png");
loadAsset("flag", "Flag_R.png");


let log = document.getElementById("log");
let logButton = document.getElementById("loggleToggle");
// Allows you to hide and show the log
logButton.addEventListener("click", () => {
    if (log.style.display === "none") {
        log.style.display = "block";
    } else {
        log.style.display = "none";
    }
});

// Canvas setup
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // Allows for pixelated graphics to be scaled properly
let t = 0; // The amount of frames that have run so far
let canvasWidth = canvas.width; // Should be the actual width of the element, but can be changed to "look outside" the canvas
let canvasHeight = canvas.height; // Same as above
ctx.translate((canvas.width - canvasWidth) / 2, (canvas.height - canvasHeight) / 2); // Only has an effect if the canvasWidth or canvasHeight variables differ from the actual size


// Keyboard input
let keyDown = {}; // A map of keys that are currently held down
let keyPressed = {}; // A map of keys which have been pressed this frame, behaves like typing, so holding one will cause it to fire repeatedly
let keyHit = {}; // A map of which keys have been hit this frame (true for one frame)

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

// Mouse input
let mouseWorldPos = {x: 0, y: 0}; // The position of the mouse, relative to ingame coordinates
let mouseGridPos = {x: 0, y: 0}; // The position of the mouse rounded to the grid
let mouseX = 0; // The screenspace X position of the mouse
let mouseY = 0; // The screenspace Y position of the mouse

canvas.addEventListener("mousemove", (event) => {
    let rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left - canvasWidth / 2;
    mouseY = event.clientY - rect.top - canvasHeight / 2;
    // mouseWorldPos = transformToWorldSpace(mouseX, mouseY); // Do this in the game loop instead so that it happens when the camera is moved too
});

let mouseDown = false; // Whether the user is currently holding the primary mouse button
let mouseClicked = false; // Whether the user clicked the primary mouse button this frame (true for one frame)
// Uses canvas so that offscreen clicks won't be registered.
canvas.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
        return;
    }
    mouseDown = true;
    mouseClicked = true;
});
/* Uses document instead of canvas so the click won't stay registered if the user moses the mouse off the canvas.
This still allows the user to keep the mouse held by switching tabs, which is an intentional choice. */
document.addEventListener("mouseup", (event) => {
    if (event.button !== 0) {
        return;
    }
    mouseDown = false;
});

// Reset keys hit and mouse clicked each frame
function resetInput() {
    mouseClicked = false;
    for (let key in keyPressed) {
        keyPressed[key] = false;
    }
    for (let key in keyHit) {
        keyHit[key] = false;
    }
}

let userInput = {
    "moveUp": false,
    "moveDown": false,
    "moveLeft": false,
    "moveRight": false,
    "jump": false,
    "zoomIn": false,
    "zoomOut": false,
};
function updateBindableInputs() {
    // Handles inputs with multiple or changeable binds
    // Binds being set by variables will be added later
    userInput["moveUp"] = ((keyDown["w"] ?? false) || (keyDown["ArrowUp"] ?? false));
    userInput["moveDown"] = ((keyDown["s"] ?? false) || (keyDown["ArrowDown"] ?? false));
    userInput["moveLeft"] = ((keyDown["a"] ?? false) || (keyDown["ArrowLeft"] ?? false));
    userInput["moveRight"] = ((keyDown["d"] ?? false) || (keyDown["ArrowRight"] ?? false));
    userInput["jumpStart"] = ((keyHit[" "] ?? false));
    userInput["jumpHold"] = ((keyDown[" "] ?? false));
    userInput["zoomIn"] = (keyDown["e"] ?? false);
    userInput["zoomOut"] = (keyDown["q"] ?? false);
}



// Tiles

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

const DEFAULT_TILE = {type: "air"};

let levelWidth = 100;
let levelHeight = 100;
let levelDepth = 1;
let levelTiles = new Array(levelDepth).fill(null).map(() => new Array(levelWidth).fill(null).map(() => new Array(levelHeight).fill(DEFAULT_TILE)));
for (let x = 0; x < levelWidth; x++) {
    for (let y = 0; y < levelHeight; y++) {
        if (Math.random() < 0.2) {
            levelTiles[0][x][y] = {type: "dirt"};
        }
        if (Math.random() < 0.02) {
            levelTiles[0][x][y] = {type: "flower"};
        }
    }
}



// Objects

class dynamicObject {
    // Base class for objects that can move, does not include physics
    constructor() {
        // Constants
        this.width = 1;
        this.height = 1;

        // Variables
        this.x = 0;
        this.y = 0;
}

    update() {
        return
    }

    render() {
        return
    }
}

function isSolidAt(z, x, y) {
    // Returns whether tile in a given position is solid
    x = Math.round(x)
    y = Math.round(y)

    // If the position is outside the level, treat it as not solid.
    if (x < 0 || x >= levelWidth || y < 0 || y >= levelHeight) {
        return false
    }
    return tileTypes[levelTiles[z][x][y].type].collidable
}

function collisionGrid(z, x, y, width, height) {
    // Returns a list of tile positions in a given rectangle and whether they are solid
    // Also returns whether at least one was solid, for convenience
    let results = {tiles: [], collided: false,};
    for (let v = (Math.round(x - width / 2)); v <= (Math.round(x + width / 2)); v++) {
        for (let w = (Math.round(y - height / 2)); w <= (Math.round(y + height / 2)); w++) {
            let solid = isSolidAt(0, v, w);
            if (solid) {
                results.collided = true;
            }
            results.tiles.push({
                solid: solid,
                x: v,
                y: w,
            });
        }
    }
    return results
}
const MARGIN = 2 ** -40 // The minimum distance from a physical object from a tile, prevents the object from being pushed in a direction perpendicular to the tile it is touching

function collisionX(object) {
    object.touching.left = false;
    object.touching.right = false;
    // Move the object
    object.x += object.vx;
    // Find where the object is now intersecting with tiles
    let collisionResults = collisionGrid(0, object.x, object.y, object.width, object.height);
    if (collisionResults.collided) {
        object.vx = 0;
        // Iterate through all of the tiles
        for (let i = 0; i < collisionResults.tiles.length; i++) {
            let tile = collisionResults.tiles[i];
            if (tile.solid) {
                // If the tile is to the left of the object, move the object right
                if (tile.x < object.x) {
                    object.x = tile.x + 0.5 + MARGIN + object.width / 2;
                    object.touching.left = true;
                // Otherwise, move it left
                } else {
                    object.x = tile.x - 0.5 - MARGIN - object.width / 2;
                    object.touching.right = true;
                }
            }
        }
    }
}

function collisionY(object) {
    // Very similar to collisionX, but uses different variables. Maybe there's a way to condense these into one function?
    object.touching.up = false;
    object.touching.down = false;
    object.y += object.vy;
    let collisionResults = collisionGrid(0, object.x, object.y, object.width, object.height);
    if (collisionResults.collided) {
        object.vy = 0;
        for (let i = 0; i < collisionResults.tiles.length; i++) {
            let tile = collisionResults.tiles[i];
            if (tile.solid) {
                if (tile.y < object.y) {
                    object.y = tile.y + 0.5 + MARGIN + object.height / 2;
                    object.touching.up = true;
                } else {
                    object.y = tile.y - 0.5 - MARGIN - object.height / 2;
                    object.touching.down = true;
                }
            }
        }
    }
}

class physicalObject extends dynamicObject {
    // Base class for objects that collide with walls and experience gravity
    constructor() {
        super();
        // Constants
        this.gravityY = 0.025;
        this.friction = 0.7;
        this.airResistance = 0.8;

        // Variables
        this.vx = 0;
        this.vy = 0;
        this.touching = {
            left: false,
            right: false,
            up: false,
            down: false,
        } // Each value is true if the object is being pushed into a tile in that direction. It will not be true if the object is visibly touching the tile but not being pushed into it.
    }

    update() {
        super.update();
        // this.vy *= this.friction;
        // Move along the axis which has higher velocity first
        if (Math.abs(this.vx) > Math.abs(this.vy)) {
            collisionX(this);
            collisionY(this);
        } else {
            collisionY(this);
            collisionX(this);
        }
        if (this.touching.down || this.touching.up) {
            this.vx *= this.friction;
        } else {
            this.vx *= this.airResistance;
        }
    }

    render() {
        return
    }
}

class playerObject extends physicalObject {
    // Player object controlled by the user
    constructor() {
        super();
        // Constant Overrides
        this.width = 0.8;
        this.height = 1.5;

        // Constants
        this.walkSpeed = 0.08; // The maximum speed the player will move at
        this.acceleration = (this.walkSpeed * (1 - this.friction) / this.friction); // This formula calculates the acceleration needed to reach the max speed with the specified friction
        this.fallSpeed = 0.5;

        // Variables
        this.freeFlight = false;

        // Constants (Jumping)
        this.jumpGravity = 0.01; // The gravity used during a jump
        this.jumpLength = 10; // The amount of frames the player can hold jump for
        this.jumpPower = 0.25; // The velocity of the jump
        this.coyoteFrames = 5; // The amount of frames after falling off a ledge that the player can still jump
        this.jumpBufferFrames = 5; // The amount of frames that the player can press jump early
        this.jumpBoost = 1.1; // Speed multiplier applied when the player jumps
        this.airBoost = 1.5; // Multiplier for natural max speed while in the air
        this.airControl = (this.airBoost * this.walkSpeed * (1 - this.airResistance) / this.airResistance);

        // Variables (Jumping)
        this.jumpTime = 0;
        // this.jumpState = 0;
        this.floorTimeDistance = 0; // The amount of coyote frames remaining
        this.jumpBuffer = 0;
    }

    update() {
        if (userInput.jumpStart) {
            this.jumpBuffer = this.jumpBufferFrames;
        } else {
            this.jumpBuffer -= 1;
        }
        if (this.freeFlight) {
            this.x = cameraX;
            this.y = cameraY;
        } else {
            if (this.touching.down) {
                this.floorTimeDistance = this.coyoteFrames;
                this.jumpTime = this.jumpLength
                this.vx += this.acceleration * (userInput["moveRight"] - userInput["moveLeft"]);
            } else {
                this.floorTimeDistance -= 1;
                this.vx += this.airControl * (userInput["moveRight"] - userInput["moveLeft"]);
            }

            if ((this.jumpBuffer > 0 && this.floorTimeDistance > 0) || (userInput.jumpHold && this.jumpTime > 0 && this.jumpTime < this.jumpLength)) {
                if (this.jumpBuffer > 0 && this.floorTimeDistance > 0) {
                    this.vx *= this.jumpBoost;
                }
                this.vy = -this.jumpPower;
                this.floorTimeDistance = 0;
                this.jumpTime -= 1;
                this.jumpBuffer = 0
            } else if (!userInput.jumpHold && this.floorTimeDistance <= 0) {
                this.jumpTime = 0;
            }

            // Limit the speed the player can fall at
            this.vy = Math.min(this.vy, this.fallSpeed);
            
            // Apply a lower gravity while jumping (Unused)
            if (false && (this.vy < 0 && userInput.jumpHold)) {
                this.vy += this.jumpGravity;
            } else {
                this.vy += this.gravityY;
            }

            super.update();

            if (this.touching.up) {
                this.jumpTime = 0;
            }
        }
    }

    render() {
        drawInWorldSpace(this.x, this.y, this.width, this.height, assets["tiller"]);
    }
}


// Required objects
let player = new playerObject();
let levelObjects = [player];


// Camera variables
let cameraX = levelWidth / 2;
let cameraY = levelHeight / 2;
let defaultZoom = 48;
let cameraZoom = defaultZoom;


// Rendering

function drawCenteredRectangle(x, y, width, height) {
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
}

function drawCenteredImage(image, x, y, width, height) {
    ctx.drawImage(image, x - width / 2 + canvasWidth / 2, y - height / 2 + canvasHeight / 2, width, height);
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
    if (x + width / 2 < -canvasWidth / 2 || x - width / 2 > canvasWidth / 2 || y + height / 2 < -canvasHeight / 2 || y - height / 2 > canvasHeight / 2) {
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
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the tiles
    for (let x = 0; x < levelWidth; x++) {
        for (let y = 0; y < levelHeight; y++) {
            let tileType = levelTiles[0][x][y].type;
            let tileSprite = tileTypes[tileType].sprite;
            if (tileSprite === null) {
                continue
            }
            drawInWorldSpace(x, y, 1, 1, tileSprite);
        }
    }

    for (let i = 0; i < levelObjects.length; i++) {
        levelObjects[i].render();
    }

    // Render all pressed keys as text, debug
    // let x = 0;
    // ctx.font = "20px Arial";
    // for (let key in keyDown) {
    //     if (keyDown[key]) {
    //         ctx.fillText(key, x, canvasHeight / 2);
    //         x += 30;
    //     }
    // }
    // ctx.fillText(JSON.stringify(player.touching), 0, 100) // Debug
}



// Basic game logic

let panSpeed = 0;
let zoomSpeed = 0.02;
let freeCam = false;

function updateGame() {
    // Update objects
    for (let i = 0; i < levelObjects.length; i++) {
        levelObjects[i].update();
    }

    // Free camera movement
    if (freeCam) {
        panSpeed = 0.2 * Math.sqrt(defaultZoom / cameraZoom);
        cameraY += panSpeed * (userInput["moveDown"] - userInput["moveUp"]);
        cameraX += panSpeed * (userInput["moveRight"] - userInput["moveLeft"]);
        if (userInput["zoomIn"]) {
            cameraZoom *= 1 + zoomSpeed;
        }
        if (userInput["zoomOut"]) {
            cameraZoom /= 1 + zoomSpeed;
        }
    } else {
        cameraX = player.x;
        cameraY = player.y;
    }

    mouseWorldPos = transformToWorldSpace(mouseX, mouseY);
    mouseGridPos.x = Math.round(mouseWorldPos.x);
    mouseGridPos.y = Math.round(mouseWorldPos.y);
    if (mouseDown && mouseGridPos.x >= 0 && mouseGridPos.x < levelWidth && mouseGridPos.y >= 0 && mouseGridPos.y < levelHeight) {
        levelTiles[0][mouseGridPos.x][mouseGridPos.y] = {type: "grass"};
    }

    if (keyHit["z"]) {
        freeCam = !freeCam;
        if (!freeCam) {
            cameraZoom = defaultZoom;
        }
        player.freeFlight = !player.freeFlight;
    }
}


// Game loop
function gameTick() {
    // Here we increment the frame counter, update user input, update the game state, render the game, reset the user input, and request the next frame.
    t += 1;
    updateBindableInputs();
    updateGame();
    renderFrame();
    resetInput();
    requestAnimationFrame(gameTick);
}


// Wait until the assets are loaded before starting the game loop
window.addEventListener("load", () => {
    requestAnimationFrame(gameTick);
});