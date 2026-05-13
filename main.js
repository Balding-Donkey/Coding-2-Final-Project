// Error logging and output to get around the fact that I can't use the developer console on a school chromebook
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
function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
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
loadAsset("glungus", "Glungus.jpeg");


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
let shortcutsHit = {}; // A map of keyboard shortcuts that have been hit this frame
const overridenShortcuts = ["s","o"]; // A list of keys that have their default browser shortcuts overridden

window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && overridenShortcuts.includes(event.key)) {
        event.preventDefault();
        if (!keyDown[event.key]) {
            shortcutsHit[event.key] = true;
        }
    }
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

let primaryMouseDown = false; // Whether the user is currently holding the primary mouse button
let primaryMouseClicked = false; // Whether the user clicked the primary mouse button this frame (true for one frame)
let secondaryMouseDown = false; // Whether the user is currently holding the secondary mouse button
let secondaryMouseClicked = false; // Whether the user clicked the secondary mouse button this frame (true for one frame)
// Uses canvas so that offscreen clicks won't be registered.
canvas.addEventListener("mousedown", (event) => {
    switch (event.button) {
        case 0:
            primaryMouseDown = true;
            primaryMouseClicked = true;
            break;
        case 2:
            secondaryMouseDown = true;
            secondaryMouseClicked = true;
            break;
    }
});
/* Uses document instead of canvas so the click won't stay registered if the user moses the mouse off the canvas.
This still allows the user to keep the mouse held by switching tabs, which is an intentional choice. */
document.addEventListener("mouseup", (event) => {
    switch (event.button) {
        case 0:
            primaryMouseDown = false;
        case 2:
            secondaryMouseDown = false;
    }
});

// Gamepad input
const GAMEPAD_DEADZONE = 0.2; // The minimum value for gamepad axes to be registered, prevents drift
let gamepadDown = {}; // A map of gamepad buttons that are currently held down
let gamepadHit = {}; // A map of gamepad buttons which have been pressed this frame
let gamepadAxes = {};
function updateGamepadInput() {
    let gamepad = navigator.getGamepads()[0];
    if (gamepad) {
        for (let i = 0; i < gamepad.buttons.length; i++) {
            if (gamepad.buttons[i].pressed && !gamepadDown[i]) {
                gamepadHit[i] = true;
            }
            gamepadDown[i] = gamepad.buttons[i].pressed;
        }
        for (let i = 0; i < gamepad.axes.length; i++) {
            gamepadAxes[i] = Math.abs(gamepad.axes[i]) > GAMEPAD_DEADZONE ? gamepad.axes[i] : 0;
        }
    }
}
        
    

// Reset keys hit and mouse clicked each frame
function resetInput() {
    primaryMouseClicked = false;
    secondaryMouseClicked = false;
    for (let key in keyPressed) {
        keyPressed[key] = false;
    }
    for (let key in keyHit) {
        keyHit[key] = false;
    }
    for (let key in gamepadHit) {
        gamepadHit[key] = false;
    }
    for (let key in shortcutsHit) {
        shortcutsHit[key] = false;
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
    "toggleFreeCamMode": false,
};
function updateBindableInputs() {
    // Handles inputs with multiple or changeable binds
    // Binds being set by variables will be added later
    updateGamepadInput();
    userInput["moveUp"] = ((keyDown["w"] ?? false) || (keyDown["ArrowUp"] ?? false) || (gamepadAxes[1] ?? 0) < 0 || (gamepadDown[12] ?? false));
    userInput["moveDown"] = ((keyDown["s"] ?? false) || (keyDown["ArrowDown"] ?? false) || (gamepadAxes[1] ?? 0) > 0);
    userInput["moveLeft"] = ((keyDown["a"] ?? false) || (keyDown["ArrowLeft"] ?? false) || (gamepadAxes[0] ?? 0) < 0);
    userInput["moveRight"] = ((keyDown["d"] ?? false) || (keyDown["ArrowRight"] ?? false) || (gamepadAxes[0] ?? 0) > 0);
    userInput["jumpStart"] = ((keyHit[" "] ?? false) || (gamepadHit[0] ?? false));
    userInput["jumpHold"] = ((keyDown[" "] ?? false) || (gamepadDown[0] ?? false));
    userInput["zoomIn"] = ((keyDown["e"] ?? false) || (gamepadDown[7] ?? false));
    userInput["zoomOut"] = ((keyDown["q"] ?? false) || (gamepadDown[6] ?? false));
    userInput["toggleFreeCamMode"] = ((keyHit["z"] ?? false) || (gamepadHit[3] ?? false));

}



// Tiles

class tile {
    constructor(sprite = null, collidable = false) {
        this.collidable = collidable;
        this.sprite = sprite;
    }
}

const DEFAULT_TILE = {type: "air"};

function tileGrid(depth, width, height, defaultTile = DEFAULT_TILE) {
    return new Array(depth).fill(null).map(() => new Array(width).fill(null).map(() => new Array(height).fill(defaultTile)));
}

let tileTypes = {
    "air": new tile(null, false),
    "grass": new tile(assets["tile"], true),
    "dirt": new tile(assets["flag"], true),
    "flower": new tile(assets["carrots"], false),
}

let levelWidth = 100;
let levelHeight = 100;
let levelDepth = 1;
let levelTiles = tileGrid(levelDepth, levelWidth, levelHeight);
// for (let x = 0; x < levelWidth; x++) {
//     for (let y = 0; y < levelHeight; y++) {
//         if (Math.random() < 0.2) {
//             levelTiles[0][x][y] = {type: "dirt"};
//         }
//         if (Math.random() < 0.02) {
//             levelTiles[0][x][y] = {type: "flower"};
//         }
//     }
// }


let editMode = false;

// Camera
class cameraObject {
    /*
    Camera system explained:
    The camera has a "target position" which it always moves towards.
    The target position consists of the players position, plus an offset determined by other logic.
    When the player has been falling at max speed for long enough, the camera starts moving downwards to a set distance.
    When the player stops falling at max speed, it starts moving back to the normal height
    When the player attempts to walk in a direction, the camera moves in that direction until it reaches a set distance.
    If the player stops moving, the X offset will not change
    */

    constructor() {
        // Constants
        this.defaultZoom = 48;
        this.zoomSpeed = 0.02; // The speed that the camera zooms when in freecam mode
        this.lerp = 0.2; // The speed that the camera moves towards the target position, lower values make it smoother
        this.xOffsetMagnitude = 1; // The distance, in tiles, that the camera will be offset ahead of the player
        this.xOffsetSpeed = 0.2; // The speed that the x offset will move
        this.yOffsetMagnitude = 4; // The distance, in tiles, that the camera will move down while the player is falling
        this.yOffsetSpeed = 0.05; // The speed that the y offset will move at
        this.yOffsetReturnSpeed = 0.1; // The speed that the y offset will move back to 0 when the player stops falling
        this.yOffsetDelay = 30; // The amount of time the player must be at max fall speed before the camera starts getting offset

        // Variables
        this.x = levelWidth / 2;
        this.y = levelHeight / 2;
        this.zoom = this.defaultZoom;
        this.panSpeed = 0;
        this.freeMode = false;
        this.xOffset = 0; // How far the camera is offset from the player horizontally
        this.yOffset = 0; // How far the camera is offset from the player vertically
        this.quickFallingTime = 0; // How long the player has been falling at max speed for (might be moved to the player object in the future)
    }

    position() {
        if (this.freeMode) {
            this.panSpeed = 0.2 * Math.sqrt(this.defaultZoom / this.zoom);
            this.y += this.panSpeed * (userInput["moveDown"] - userInput["moveUp"]);
            this.x += this.panSpeed * (userInput["moveRight"] - userInput["moveLeft"]);
            if (userInput["zoomIn"]) {
                this.zoom *= 1 + this.zoomSpeed;
            }
            if (userInput["zoomOut"]) {
                this.zoom /= 1 + this.zoomSpeed;
            }
        } else {
            this.xOffset = clamp(this.xOffset + (userInput["moveRight"] - userInput["moveLeft"]) * this.xOffsetSpeed, -1, 1);
            let targetX = player.x + this.xOffset * this.xOffsetMagnitude;
            
            if (player.vy >= player.fallSpeed) {
                this.quickFallingTime += 1;
            } else {
                this.quickFallingTime = 0;
            }
            if (this.quickFallingTime >= this.yOffsetDelay) {
                this.yOffset = clamp(this.yOffset + this.yOffsetSpeed, 0, 1);
            } else {
                this.yOffset = clamp(this.yOffset - this.yOffsetReturnSpeed, 0, 1);
            }
            let targetY = player.y + this.yOffset * this.yOffsetMagnitude;
            if (player.vy >= player.fallSpeed) {
                targetY += 1;
            }

            this.x += (targetX - this.x) * this.lerp;
            this.y += (targetY - this.y) * this.lerp;
        }
        
        if (userInput["toggleFreeCamMode"]) {
            this.freeMode = !this.freeMode;
            if (this.freeMode) {
                this.x = player.x;
                this.y = player.y;
            } else {
                this.zoom = this.defaultZoom;
            }
            player.freeFlight = !player.freeFlight;
            editMode = !editMode;
        }
    }
}
let camera = new cameraObject();


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
const MARGIN = 2 ** -40 // The minimum distance from a physical object from a tile, prevents the object from being pushed in a direction perpendicular to the tile it is touchingHard

function collisionX(object) {
    object.touchingHard.left = false;
    object.touchingHard.right = false;
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
                    object.touchingHard.left = true;
                // Otherwise, move it left
                } else {
                    object.x = tile.x - 0.5 - MARGIN - object.width / 2;
                    object.touchingHard.right = true;
                }
            }
        }
    }
}

function collisionY(object) {
    // Very similar to collisionX, but uses different variables. Maybe there's a way to condense these into one function?
    object.touchingHard.up = false;
    object.touchingHard.down = false;
    object.y += object.vy;
    let collisionResults = collisionGrid(0, object.x, object.y, object.width, object.height);
    if (collisionResults.collided) {
        object.vy = 0;
        for (let i = 0; i < collisionResults.tiles.length; i++) {
            let tile = collisionResults.tiles[i];
            if (tile.solid) {
                if (tile.y < object.y) {
                    object.y = tile.y + 0.5 + MARGIN + object.height / 2;
                    object.touchingHard.up = true;
                } else {
                    object.y = tile.y - 0.5 - MARGIN - object.height / 2;
                    object.touchingHard.down = true;
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
        this.touchingHard = {
            left: false,
            right: false,
            up: false,
            down: false,
        } // Each value is true if the object is being pushed into a tile in that direction. It will not be true if the object is visibly touchingHard the tile but not being pushed into it.
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
            this.x = camera.x;
            this.y = camera.y;
        } else {
            if (this.touchingHard.down) {
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

            if (this.touchingHard.down || this.touchingHard.up) {
                this.vx *= this.friction;
            } else {
                this.vx *= this.airResistance;
            }

            if (this.touchingHard.up) {
                this.jumpTime = 0;
            }
        }
    }

    render() {
        drawInWorldSpace(this.x, this.y, this.width, this.height, assets["tiller"]);
    }
}

class testObject extends physicalObject {
    constructor() {
        super();
        this.width = 0.8;
        this.height = 0.8;
        this.maxSpeed = 0.2;
        this.randomFactor = 5;
    }

    update() {
        this.vx += (player.x - this.x + this.randomFactor * (Math.random() - 0.5)) * 0.004;
        this.vy += (player.y - this.y + this.randomFactor * (Math.random() - 0.5)) * 0.004;
        this.vx = clamp(this.vx, -this.maxSpeed, this.maxSpeed);
        this.vy = clamp(this.vy, -this.maxSpeed, this.maxSpeed);
        super.update();
    }

    render() {
        drawInWorldSpace(this.x, this.y, this.width, this.height, assets["glungus"]);
    }
}


const classes = {
    dynamicObject: dynamicObject,
    physicalObject: physicalObject,
    playerObject: playerObject,
    cameraObject: cameraObject,
    tile: tile,
    testObject: testObject,
};
// Required objects
let player = new playerObject();
let levelObjects = [player, new testObject(),];


// Rendering

function drawCenteredRectangle(x, y, width, height) {
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
}

function drawCenteredImage(image, x, y, width, height) {
    ctx.drawImage(image, x - width / 2 + canvasWidth / 2, y - height / 2 + canvasHeight / 2, width, height);
}

function transformToWorldSpace(x, y) {
    x = x / camera.zoom + camera.x;
    y = y / camera.zoom + camera.y;
    return {x: x, y: y};
}

function transformFromWorldSpace(x, y, width=null, height=null) {
    x = (x - camera.x) * camera.zoom;
    y = (y - camera.y) * camera.zoom;
    if (width !== null) {
        width = width * camera.zoom;
    }
    if (height !== null) {
        height = height * camera.zoom;
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
    ctx.fillText(JSON.stringify(gamepadHit), 0, 100) // Debug
}


// For loading/saving levels, these 2 functions are my own code

function stringifyLevelData() {
    let tileIDsStrings = {};
    let tileIDs = {};
    let reverseTileIDs = {};
    let savingTiles = structuredClone(levelTiles);
    for (let z = 0; z < levelDepth; z++) {
        for (let x = 0; x < levelWidth; x++) {
            for (let y = 0; y < levelHeight; y++) {
                let tile = levelTiles[z][x][y];
                let tileString = JSON.stringify(tile);
                if (!Object.values(tileIDsStrings).includes(tileString)) {
                    tileIDsStrings[Object.keys(tileIDsStrings).length] = tileString;
                    tileIDs[Object.keys(tileIDs).length] = tile;
                    reverseTileIDs[tileString] = Object.keys(tileIDsStrings).length - 1;
                }
            }
        }
    }
    for (let z = 0; z < levelDepth; z++) {
        for (let x = 0; x < levelWidth; x++) {
            for (let y = 0; y < levelHeight; y++) {
                let tile = levelTiles[z][x][y];
                let tileString = JSON.stringify(tile);
                savingTiles[z][x][y] = reverseTileIDs[tileString];
            }
        }
    }
    let savingObjects = [];
    for (let i = 0; i < levelObjects.length; i++) {
        let object = levelObjects[i];
        if (!(object instanceof playerObject)) {
            savingObjects.push({
                type: object.constructor.name,
                data: object,
            });
        }
    }
    return JSON.stringify({
        width: levelWidth,
        height: levelHeight,
        depth: levelDepth,
        objects: savingObjects,
        tileIDs: tileIDs,
        tiles: savingTiles,
    });
}

function parseLevelData(levelData) {
    levelWidth = levelData.width;
    levelHeight = levelData.height;
    levelDepth = levelData.depth;
    let tileIDs = levelData.tileIDs;
    let loadingTiles = levelData.tiles;
    for (let z = 0; z < levelDepth; z++) {
        for (let x = 0; x < levelWidth; x++) {
            for (let y = 0; y < levelHeight; y++) {
                let tileID = loadingTiles[z][x][y];
                levelTiles[z][x][y] = tileIDs[tileID];
            }
        }
    }
    for (let i = 0; i < levelData.objects.length; i++) {
        levelObjects = [player];
        let object = new classes[levelData.objects[i].type];
        Object.assign(object, levelData.objects[i].data);
        levelObjects.push(object);
    }
}

// File stuff
// I barely know how this section works, it's cobbled together from documentation and AI suggestions

async function getFileSaveHandle() {
    const options = {
        types: [
            {
                description: 'JSON Files',
                accept: {
                    'application/json': ['.json'],
                },
                suggestedName: 'level.json',
                startIn: 'downloads',
                excludeAcceptAllOption: true,
            },
        ],
    }
    return await window.showSaveFilePicker(options);
}

async function saveLevel() {
    output("Attempting to save level");
    try {
        const fileHandle = await getFileSaveHandle();
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(stringifyLevelData());
        await writableStream.close();
        output("Level saved successfully");
    } catch (err) {
        output("Error saving file: " + err);
    }
}

async function getFileOpenHandle() {
    const options = {
        types: [
            {
                description: 'JSON Files',
                accept: {
                    'application/json': ['.json'],
                },

            },
        ],
    }
    return await window.showOpenFilePicker(options);
}

async function openLevel() {
    output("Attempting to open level");
    try {
        const fileHandle = await getFileOpenHandle();
        const file = await fileHandle[0].getFile();
        const contents = await file.text();
        const levelData = JSON.parse(contents);
        parseLevelData(levelData);
        output("Level opened successfully");
    } catch (err) {
        output("Error opening file: " + err);
    }
}


// Basic game logic

function updateGame() {
    // Update objects
    for (let i = 0; i < levelObjects.length; i++) {
        levelObjects[i].update();
    }

    camera.position();

    mouseWorldPos = transformToWorldSpace(mouseX, mouseY);
    mouseGridPos.x = Math.round(mouseWorldPos.x);
    mouseGridPos.y = Math.round(mouseWorldPos.y);
    if (keyPressed["i"]) {
        let glungu = new testObject();
        glungu.x = player.x;
        glungu.y = player.y;
        levelObjects.push(glungu);
    }
    if (editMode) {
        if (mouseGridPos.x >= 0 && mouseGridPos.x < levelWidth && mouseGridPos.y >= 0 && mouseGridPos.y < levelHeight) {
            if (primaryMouseDown) {
                levelTiles[0][mouseGridPos.x][mouseGridPos.y] = {type: "grass"};
            }
            if (secondaryMouseDown) {
                levelTiles[0][mouseGridPos.x][mouseGridPos.y] = {type: "air"};
            }
        }

        if (shortcutsHit["s"]) {
            saveLevel();
        }
        if (shortcutsHit["o"]) {
            openLevel();
        }
    }
}


const MAX_FPS = 60;
const FRAME_DURATION = 1000 / MAX_FPS;

// Game loop
let lastTime = performance.now();
function gameTick() {
    requestAnimationFrame(gameTick);

    let currentTime = performance.now();
    let deltaTime = currentTime - lastTime;
    // console.log(1000 / deltaTime); // Shows framerate for debugging

    // If there has not been enough time since the last frame, skip this update
    if (deltaTime < FRAME_DURATION) {
        return;
    }

    // Here we increment the frame counter, update user input, update the game state, render the game, reset the user input, and request the next frame.
    t += 1;
    updateBindableInputs();
    updateGame();
    renderFrame();
    resetInput();

    const extraTime = deltaTime % FRAME_DURATION; // A basic framerate limit will actually run slower than the specified framerate, this accounts for the lost time
    lastTime = currentTime - extraTime;
}


// Wait until the assets are loaded before starting the game loop
window.addEventListener("load", () => {
    requestAnimationFrame(gameTick);
});