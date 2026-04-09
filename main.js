let text = document.getElementById("text");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let t = 0;


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



function drawRectangle(x, y, width, height) {
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
}

function renderFrame() {
    // Clear the canvas for the new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let x = 0;
    ctx.font = "20px Arial";
    // Render all pressed keys as a test
    for (let key in keyDown) {
        if (keyDown[key]) {
            ctx.fillText(key, x, canvas.height / 2);
            x += 30;
        }
    }
}

function updateGame() {
}

function gameTick() {
    t += 1;
    updateGame();
    renderFrame();
    resetHitKeys();
    requestAnimationFrame(gameTick);
}

requestAnimationFrame(gameTick);