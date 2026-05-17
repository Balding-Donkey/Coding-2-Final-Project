// Error logging and output to get around the fact that I can't use the developer console on a school chromebook
let textLog = document.getElementById("textLog");
function output(string, consoleLog = true) {
    textLog.innerHTML = textLog.innerHTML + string + "<br>";
    if (consoleLog) {
        console.log("Game: " + string);
    }
}
output("Script loaded successfully"); // If this does not appear then if means the script didn't run
window.addEventListener("error", (event) => {
    output("Error at " + event.filename + ":" + event.lineno + " - " + event.message, consoleLog = false);
});


// Math
function logBase(base, x) {
    return Math.log(x) / Math.log(base)
}
function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}
function mod(x, y) {
    return ((x % y) + y) % y;
}


// Import assets
let assets = {};
function loadAsset(name, path) {
    let image = new Image();
    image.src = "assets/" + path;
    assets[name] = image;
}
// Placeholder assets
loadAsset("tiller", "placeholder/partick tiler.png");
loadAsset("amongus", "placeholder/sussy.png");
loadAsset("carrots", "placeholder/Carrots.png");
loadAsset("tile", "placeholder/Closed.png");
loadAsset("flag", "placeholder/Flag_R.png");
loadAsset("glungus", "placeholder/Glungus.jpeg");
// Objects
loadAsset("ending", "objects/ending.png");
// Tiles
loadAsset("grass", "tiles/grass.png");
loadAsset("concrete", "tiles/concrete.png");


// Custom output log
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
let previousMousePos = {x: 0, y: 0};
let mouseMovement = {x: 0, y: 0};

canvas.addEventListener("mousemove", (event) => {
    let rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left - canvasWidth / 2;
    mouseY = event.clientY - rect.top - canvasHeight / 2;
    mouseMovement = {x: mouseX - previousMousePos.x, y: mouseY - previousMousePos.y};
    previousMousePos = {x: mouseX, y: mouseY};
    // mouseWorldPos = transformToWorldSpace(mouseX, mouseY); // Do this in the game loop instead so that it happens when the camera moves too
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
const GAMEPAD_DEADZONE = 0.3; // The minimum value for gamepad axes to be registered, prevents drift
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
    if (gamepadAxes[0] < 0 && !gamepadDown["left"]) {
        gamepadHit["left"] = true;
    }
    if (gamepadAxes[0] > 0 && !gamepadDown["right"]) {
        gamepadHit["right"] = true;
    }
    if (gamepadAxes[1] < 0 && !gamepadDown["up"]) {
        gamepadHit["up"] = true;
    }
    if (gamepadAxes[1] > 0 && !gamepadDown["down"]) {
        gamepadHit["down"] = true;
    }
    gamepadDown["left"] = gamepadAxes[0] < 0;
    gamepadDown["right"] = gamepadAxes[0] > 0;
    gamepadDown["up"] = gamepadAxes[1] < 0;
    gamepadDown["down"] = gamepadAxes[1] > 0;
}



// Reset keys hit and mouse clicked each frame
function resetInput() {
    primaryMouseClicked = false;
    secondaryMouseClicked = false;
    mouseMovement = {x: 0, y: 0};
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

let userInput = {};

class UserInputAction {
    constructor(name, type, defaults, gamepadDefaults = []) {
        this.name = name;
        this.keys = defaults;
        this.buttons = gamepadDefaults;
        this.type = type;
    }

    getState() {
        let state = false;
        let keyboardInputs = [];
        let gamepadInputs = [];
        switch (this.type) {
            case "down":
                keyboardInputs = keyDown;
                gamepadInputs = gamepadDown;
                break;
            case "hit":
                keyboardInputs = keyHit;
                gamepadInputs = gamepadHit;
                break;
            case "pressed":
                keyboardInputs = keyPressed;
                gamepadInputs = gamepadHit; // Gamepad does not support pressed
                break;
            case "modifier":
                keyboardInputs = shortcutsHit;
                gamepadInputs = gamepadHit; // Gamepad does not have modifier keys
                break;
        }
        this.keys.forEach((input) => {
            state = state || (keyboardInputs[input] ?? false);
        });
        this.buttons.forEach((input) => {
            state = state || (gamepadInputs[input] ?? false);
        });
        return state;
    }
}

userInputActions = [
    new UserInputAction("menuUp", "pressed", ["w", "ArrowUp"], [12, "up"]),
    new UserInputAction("menuDown", "pressed", ["s", "ArrowDown"], [13, "down"]),
    new UserInputAction("menuLeft", "pressed", ["a", "ArrowLeft"], [14, "left"]),
    new UserInputAction("menuRight", "pressed", ["d", "ArrowRight"], [15, "right"]),
    new UserInputAction("menuSelect", "hit", [" ", "Enter"], [0]),
    new UserInputAction("menuReset", "hit", ["r"], [2]),
    new UserInputAction("menuBack", "hit", ["Escape"], [1]),
    new UserInputAction("pause", "hit", ["Escape"], [8, 9]),
    new UserInputAction("moveUp", "down", ["w", "ArrowUp"], [12, "up"]),
    new UserInputAction("moveDown", "down", ["s", "ArrowDown"], [13, "down"]),
    new UserInputAction("moveLeft", "down", ["a", "ArrowLeft"], [14, "left"]),
    new UserInputAction("moveRight", "down", ["d", "ArrowRight"], [15, "right"]),
    new UserInputAction("jumpStart", "hit", [" "], [0]),
    new UserInputAction("jumpHold", "down", [" "], [0]),
    new UserInputAction("zoomIn", "down", ["e"], [7]),
    new UserInputAction("zoomOut", "down", ["q"], [6]),
    new UserInputAction("toggleEditMode", "hit", ["z"], [3]),
    new UserInputAction("saveLevel", "modifier", ["s"]),
    new UserInputAction("loadLevel", "modifier", ["o"]),
    new UserInputAction("spawnGlungus", "pressed", ["i"]),
    new UserInputAction("placeEnding", "hit", ["l"]),
    new UserInputAction("deleteEnding", "hit", ["k"]),
    new UserInputAction("setLevelStart", "hit", ["j"]),
];

// Set up each input as false initially
for (let i = 0; i < userInputActions.length; i++) {
    let action = userInputActions[i];
    userInput[action.name] = false;
}

function updateBindableInputs() {
    // Handles keyboard and gamepad inputs

    updateGamepadInput();
    for (let i = 0; i < userInputActions.length; i++) {
        let action = userInputActions[i];
        userInput[action.name] = action.getState();
    }
}


// User Interface

let menus = {};
let gameState = "title"; // What menu to display

class MenuOption {
    // A selectable option listed in a menu
    constructor(text) {
        this.text = text;
    }

    getText() {
        return this.text;
    }

    // By default, activating a menu option will set the game state to a set value, but it can be overridden with other code.
    activate(type = 0) {
        return;
    }

    reset() {
        return;
    }
}

class MenuOptionChangeState extends MenuOption {
    // A menu option that changes the game state
    constructor(text, state=null) {
        super(text);
        this.state = state;
    }

    activate(type = 0) {
        if (!(this.state === null) && type == 0) {
            gameState = this.state ?? gameState;
        }
        return;
    }
}

class MenuOptionLinear extends MenuOption {
    // A menu option that has a number value which can be changed
    constructor(text, defaultValue = 0, min = 0, max = 10, step = 1) {
        super(text);
        this.default = defaultValue;
        this.value = defaultValue;
        this.min = min;
        this.max = max;
        this.step = step;
    }

    getText() {
        return this.text + ": " + this.value;
    }

    activate(type = 0) {
        if (type !== 0) {
            this.value = clamp(this.value + type * this.step, this.min, this.max);
        }
    }

    reset() {
        this.value = this.default;
    }
}

class MenuOptionBoolean extends MenuOption {
    // A menu option that has a boolean value which can be toggled
    constructor(text, defaultValue=false, trueText = "On", falseText = "Off") {
        super(text);
        this.default = defaultValue;
        this.value = defaultValue;
        this.trueText = trueText;
        this.falseText = falseText;
    }

    getText() {
        return this.text + ": " + (this.value ? this.trueText : this.falseText);
    }

    activate(type = 0) {
        this.value = !this.value;
    }

    reset() {
        this.value = this.default;
    }
}

class MenuOptionLevel extends MenuOption {
    // A menu option that loads a level when selected
    constructor(text, levelPath) {
        super(text);
        this.level = levelPath;
    }

    activate(type = 0) {
        if (type == 0) {
            openBuiltInLevel(this.level);
        }
    }
}

class Menu {
    // A list of selectable options that appear in a list
    constructor(options = []) {
        this.selectedOption = 0;
        this.options = options;
        this.back = "play";
        this.selectColor = "#fff7b1";
        this.unselectedColor = "white";
        this.font = "20px Arial";
        this.background = "rgba(0, 0, 0, 0.3)";
        this.yOffset = 50;
    }

    render() {
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        for (let i = 0; i < this.options.length; i++) {
            let option = this.options[i];
            let text = option.getText();
            if (i === this.selectedOption) {
                text = "> " + text + " <";
                ctx.fillStyle = this.selectColor;
            } else {
                ctx.fillStyle = this.unselectedColor;
            }
            // const metrics = ctx.measureText(text)
            ctx.textAlign = "center";
            ctx.font = this.font
            ctx.fillText(text, canvasWidth / 2, this.yOffset + i * 30);
        }
    }
}

// Ran inside a function for organization and memory purposes
function setupMenus() {

    // Special Buttons
    let resetButton = new MenuOption("Reset all to default");
    resetButton.activate = function(type = 0) {
        if (type == 0) {
            // Activate reset for all options on the current menu
            menus[gameState].options.forEach((option) => {
                option.reset();
            });
        }
    }

    let backButton = new MenuOption("Back");
    backButton.activate = function(type = 0) {
        if (type == 0) {
            // Activate the current menu's back function
            gameState = menus[gameState].back;
        }
    }

    let loadButton = new MenuOption("Custom level")
    loadButton.activate = function(type = 0) {
        if (type == 0) {
            openLevel();
        }
    }

    // Pause
    let options = [
        new MenuOptionChangeState("Resume", "play"),
        new MenuOptionChangeState("Settings", "settings2"),
        new MenuOptionChangeState("Exit level", "selectLevel"),
    ];
    menus.pause = new Menu(options);

    // Settings
    options = [
        backButton,
        new MenuOptionLinear("Placeholder setting 1"),
        new MenuOptionBoolean("Placeholder setting 2"),
        new MenuOptionLinear("Placeholder setting 3", 0, -Infinity, Infinity, 100),
        // new MenuOptionChangeState("Keyboard Controls", "settingsKeyboard"),
        // new MenuOptionChangeState("Gamepad Controls", "settingsGamepad"),
        resetButton,
    ];
    menus.settings = new Menu(options);
    menus.settings.back = "title";

    // Settings 2
    menus.settings2 = new Menu(options);
    menus.settings2.back = "pause";

    // Ingame
    menus.play = new Menu([]);
    menus.play.back = "pause";
    menus.play.background = "rgba(0, 0, 0, 0)";

    // Title
    options = [
        new MenuOptionChangeState("Play", "selectLevel"),
        new MenuOptionChangeState("Create", "play"),
        loadButton,
        new MenuOptionChangeState("Settings", "settings"),
    ];
    menus.title = new Menu(options)
    menus.title.background = "#7edb4c";
    menus.title.back = "title";
    menus.title.yOffset = 250;

    // Level Select
    options = [
        backButton,
        new MenuOptionLevel("House and Basement", "level1"),
        new MenuOptionLevel("Diamond Tower", "level2"),
        new MenuOptionLevel("The Challenge", "challenge")
    ];
    menus.selectLevel = new Menu(options);
    menus.selectLevel.background = "#7edb4c";
    menus.selectLevel.selectedOption = 1;
    menus.selectLevel.back = "title";

    // Loading Screen
    options = [
        new MenuOption("Loading...")
    ];
    menus.loading = new Menu(options);
    menus.loading.back = "loading";
    menus.loading.background = "rgb(150, 126, 255)"

    // Win Screen
    options = [
        new MenuOption("You win!"),
        new MenuOptionChangeState("Return to Level Select", "selectLevel"),
    ]
    menus.win = new Menu(options);
    menus.win.back = "selectLevel";

}
setupMenus()


// Tiles

class Tile {
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
    "air": new Tile(null, false),
    "grass": new Tile(assets.grass, true),
    "concrete": new Tile(assets.concrete, true),
}

let levelWidth = 100;
let levelHeight = 100;
let levelDepth = 1; // The amount of layers, only layer 0 will be used for collision
let levelTiles = tileGrid(levelDepth, levelWidth, levelHeight);
// for (let x = 0; x < levelWidth; x++) {
//     for (let y = 0; y < levelHeight; y++) {
//         if (Math.random() < 0.02) {
//             levelTiles[0][x][y] = {type: "dirt"};
//         }
//         if (Math.random() < 0.002) {
//             levelTiles[0][x][y] = {type: "flower"};
//         }
//     }
// }
let startPosition = {x: 0, y: 0};


let editMode = false; // Whether the user can edit the level

// Camera
class CameraObject {
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
        this.xOffset = 0; // How far the camera is offset from the player horizontally
        this.yOffset = 0; // How far the camera is offset from the player vertically
        this.quickFallingTime = 0; // How long the player has been falling at max speed for (might be moved to the player object in the future)
    }

    position() {
        if (editMode) {
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
    }
}
let camera = new CameraObject();


// Objects

class DynamicObject {
    // Base class for objects that can move, does not include physics
    constructor(active = false) {
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

    activate() {
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

class PhysicalObject extends DynamicObject {
    // Base class for objects that collide with walls and experience gravity
    constructor(active = false) {
        super(active);
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

class PlayerObject extends PhysicalObject {
    // Player object controlled by the user
    constructor(active = false) {
        super(active);
        // Constant Overrides
        this.width = 0.8;
        this.height = 1.5;

        // Constants
        this.walkSpeed = 0.08; // The maximum speed the player will move at
        this.acceleration = (this.walkSpeed * (1 - this.friction) / this.friction); // This formula calculates the acceleration needed to reach the max speed with the specified friction
        this.fallSpeed = 0.5;

        // Variables
        // (none)

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
        if (editMode) {
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
        drawInWorldSpace(this.x, this.y, this.width, this.height, assets.tiller);
    }
}

class TestObject extends PhysicalObject {
    // Thing that flies towards you
    constructor(active = false) {
        super(active);
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
        drawInWorldSpace(this.x, this.y, this.width, this.height, assets.glungus);
    }
}

class LevelEnding extends DynamicObject {
    constructor(active = false) {
        super(active);
        this.width = 0.5;
        this.height = 0.5;
    }

    update() {
        super.update();
        if ((Math.abs(player.x - this.x) < (this.width + player.width) / 2) && (Math.abs(player.y - this.y) < (this.height + player.height) / 2)) {
            gameState = "win";
        }
    }

    render() {
        drawInWorldSpace(this.x, this.y, this.width * 2, this.width * 2, assets.ending);
    }
}


// A list of classes that can exist in the level
const classes = {
    DynamicObject: DynamicObject,
    PhysicalObject: PhysicalObject,
    PlayerObject: PlayerObject,
    TestObject: TestObject,
    LevelEnding: LevelEnding,
};

// Object system
let player = new PlayerObject();
let activeObjects = [];
let constantObjects = [player];
let inactiveObjects = [];


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

    if (gameState !== "selectLevel" && gameState !== "title") {
        // Draw the tiles
        for (let z = 0; z < levelDepth; z++) {    
            for (let x = 0; x < levelWidth; x++) {
                for (let y = 0; y < levelHeight; y++) {
                    let tileType = levelTiles[z][x][y].type;
                    let tileSprite = tileTypes[tileType].sprite;
                    if (tileSprite === null) {
                        continue
                    }
                    drawInWorldSpace(x, y, 1, 1, tileSprite);
                }
            }
        }

        // Draw the objects, including the player
        renderingObjects = activeObjects.concat(constantObjects, (editMode ? inactiveObjects : []));
        for (let i = 0; i < renderingObjects.length; i++) {
            renderingObjects[i].render();
        }
    }

    const currentMenu = menus[gameState];
    // Render the current menu if it exists
    if (currentMenu) {
        currentMenu.render();
    }

    // debug stuff (will probably be removed eventually)
    ctx.textAlign = "left";
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    // ctx.fillText(mouseMovement.x, 100, 100);
    // ctx.fillText(mouseMovement.y, 100, 120);
}


// For loading/saving levels

function stringifyLevelData() {
    // Returns a string which describes the current level
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
    for (let i = 0; i < inactiveObjects.length; i++) {
        let object = inactiveObjects[i];
        if (!(object instanceof PlayerObject)) { // Do not save the player since it will not be reset when a level is loaded
            savingObjects.push({
                type: object.constructor.name,
                data: object,
            });
        }
    }
    return JSON.stringify({
        // Values
        width: levelWidth,
        height: levelHeight,
        depth: levelDepth,
        start: startPosition,
        // Data
        objects: savingObjects,
        tileIDs: tileIDs,
        tiles: savingTiles,
    });
}

function parseLevelData(levelData) {
    // Loads a level based on a level data object

    // Variables
    levelWidth = levelData.width;
    levelHeight = levelData.height;
    levelDepth = levelData.depth;
    startPosition = levelData.start;
    player.x = startPosition.x;
    player.y = startPosition.y;
    camera.x = startPosition.x;
    camera.y = startPosition.y;

    // Tiles
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

    // Objects
    activeObjects = [];
    inactiveObjects = [];
    for (let i = 0; i < levelData.objects.length; i++) {
        let object = new classes[levelData.objects[i].type];
        Object.assign(object, levelData.objects[i].data);
        inactiveObjects.push(object);
    }
}

// File stuff
// I barely know how this section works, it's cobbled together from documentation

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
    output("Attempting to open custom level");
    let previousState = gameState;
    gameState = "loading";
    try {
        const fileHandle = await getFileOpenHandle();
        const file = await fileHandle[0].getFile();
        const contents = await file.text();
        const levelData = JSON.parse(contents);
        parseLevelData(levelData);
        gameState = "play"
        enterPlayMode();
        output("Level opened successfully");
    } catch (err) {
        output("Error opening file: " + err);
        gameState = previousState;
    }
}

async function openBuiltInLevel(fileName) {
    output("Attempting to open level");
    let previousState = gameState;
    gameState = "loading";
    try {
        const file = await fetch("levels/" + fileName + ".json");
        const levelData = await file.json();
        parseLevelData(levelData);
        gameState = "play";
        enterPlayMode();
        output("Level opened successfully");
    } catch(err) {
        output("Error opening level: " + err);
        gameState = previousState;
    }
}


// Editor
function enterPlayMode() {
    editMode = false;
    // Create "Active" copies of all the inactive objects
    inactiveObjects.forEach(object => {
        let newObject = new classes[object.constructor.name](true);
        Object.assign(newObject, object);
        activeObjects.push(newObject);
    });
    // Reset camera zoom
    camera.zoom = camera.defaultZoom;
}

function exitPlayMode() {
    editMode = true;
    // Delete all active objects
    activeObjects = [];
    // Move the camera to the player
    camera.x = player.x;
    camera.y = player.y;
}


// Basic game logic

function updateGame() {
    const currentMenu = menus[gameState];
    if (gameState == "play") {
        // Update objects
        let updatingObjects = activeObjects.concat(constantObjects);
        for (let i = 0; i < updatingObjects.length; i++) {
            updatingObjects[i].update();
        }

        camera.position();

        mouseWorldPos = transformToWorldSpace(mouseX, mouseY);
        mouseGridPos.x = Math.round(mouseWorldPos.x);
        mouseGridPos.y = Math.round(mouseWorldPos.y);
        if (userInput["spawnGlungus"]) {
            let glungu = new TestObject();
            glungu.x = player.x;
            glungu.y = player.y;
            inactiveObjects.push(glungu);
        }

        if (userInput["placeEnding"]) {
            let ending = new LevelEnding();
            ending.x = Math.round(player.x);
            ending.y = Math.round(player.y);
            inactiveObjects.push(ending);
        }
        if (userInput["deleteEnding"]) {
            for(let i = 0; i < inactiveObjects.length; i++) {
                if (inactiveObjects[i] instanceof LevelEnding) {
                    inactiveObjects.splice(i, 1);
                    i--;
                }
            }
        }

        if (userInput["setLevelStart"]) {
            startPosition = {x: player.x, y: player.y};
        }

        if (userInput["toggleEditMode"]) {
            if (editMode) {
                enterPlayMode();
            } else {
                exitPlayMode();
            }
            output(editMode);
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

            if (userInput["saveLevel"]) {
                saveLevel();
            }
            if (userInput["loadLevel"]) {
                openLevel();
            }
        }
    }

    if (currentMenu) {
        const menuLength = currentMenu.options.length;
        currentMenu.selectedOption = mod(currentMenu.selectedOption + (userInput.menuDown - userInput.menuUp), menuLength);
        const selectedOption = currentMenu.options[currentMenu.selectedOption];
        if (selectedOption) {
            if (userInput.menuSelect || userInput.menuLeft || userInput.menuRight) {
                selectedOption.activate(userInput.menuRight - userInput.menuLeft);
            } else if (userInput.menuReset) {
                selectedOption.reset();
            }
        }
        if (userInput.menuBack && currentMenu.back && gameState !== "play") {
            gameState = currentMenu.back;
        }
        if ((gameState == "play" || gameState == "pause") && userInput.pause) {
            gameState = currentMenu.back;
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