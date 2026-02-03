// DOM elements
// ------------------------------------------------------------
const gameCanvas = document.querySelector("#game");
const gameCtx = gameCanvas.getContext("2d");

const dpr = window.devicePixelRatio || 1;

// dependencies Websocket
// ------------------------------------------------------------
// WebSocket connection is now managed by connectToGame() function

// Bildhämtning för spel
// ------------------------------------------------------------
const backgroundImage = new Image();
const hillsImage = new Image();
let platformImage = new Image();
let platformSmallTall = new Image();

platformImage.src = "../images/platform.png";
backgroundImage.src = "../images/background.png";
hillsImage.src = "../images/hills.png";
platformSmallTall.src = "../images/platformSmallTall.png";

// Canvas storlek
gameCanvas.width = 1024 * dpr;
gameCanvas.height = 576 * dpr;

// Gravitation
const gravity = 1;

// Player klass
import Player from "./Player.js";

// Multiplayer variables
const players = []; // All players in the game
let localPlayer = null; // The local player instance
let localPlayerId = null; // Unique ID for local player
let isGameJoined = false; // Track if we've joined the multiplayer game
let gameWebSocket = null; // WebSocket connection

// Vad som uppdateras med spelaren

// Platform
class Platform {
  constructor({ x, y, image }) {
    this.position = { x, y };

    this.image = image;

    this.width = image.width;
    this.height = image.height;
  }
  draw() {
    gameCtx.drawImage(this.image, this.position.x, this.position.y);
  }
}

// Generic object, för bakgrunden

class GenericObjects {
  constructor({ x, y, image }) {
    this.position = { x, y };

    this.image = image;

    this.width = image.width;
    this.height = image.height;
  }
  draw() {
    gameCtx.drawImage(this.image, this.position.x, this.position.y);
  }
}

function createImage(imageSrc) {
  const image = new Image();
  image.src = imageSrc;
  return image;
}

let player = new Player(); // Legacy single-player (for non-multiplayer mode)
let platforms = [];
let genericObjects = [];

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false },
};

// För att tracka "scrollning" som leder till vinst/spelets slut
let scrollOffset = 0;

// Starta om spelet när spelaren förlorar (ramlar ner)
function init() {
  platformImage = new Image();
  platformImage.src = "../images/platform.png";

  // Initialize single-player mode if not in multiplayer
  if (!isGameJoined) {
    player = new Player();
  }
  platforms = [
    new Platform({
      x:
        platformImage.width * 4 +
        300 -
        2 +
        platformImage.width -
        platformSmallTall.width,
      y: 270,
      image: platformSmallTall,
    }),
    new Platform({ x: -1, y: 470, image: platformImage }),
    new Platform({
      x: platformImage.width - 3,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 2 + 100,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 3 + 300,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 4 + 300 - 2,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 5 + 800 - 2,
      y: 470,
      image: platformImage,
    }),
  ];

  genericObjects = [
    new GenericObjects({
      x: 0,
      y: 0,
      image: backgroundImage,
    }),
    new GenericObjects({
      x: 0,
      y: 0,
      image: hillsImage,
    }),
  ];

  scrollOffset = 0;
}

// animation loop
let lastTime = 0;

function animate(currentTime = 0) {
  if (lastTime === 0) lastTime = currentTime;
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  requestAnimationFrame(animate);
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // Send periodic updates to server in multiplayer
  if (isGameJoined) {
    sendPeriodicUpdate(currentTime);
  }

  // Rita bakgrund
  genericObjects.forEach((genericObject) => {
    genericObject.draw();
  });

  // Rita platformar
  platforms.forEach((platform) => {
    platform.draw();
  });

  // Uppdatera och rita spelaren(a)
  if (isGameJoined && localPlayer) {
    // Multiplayer mode - update local player and render all players
    localPlayer.update(gameCtx, gameCanvas, gravity, deltaTime, platforms);
    
    // Render all players
    players.forEach(gamePlayer => {
      if (gamePlayer.render) {
        gamePlayer.render(gameCtx);
      }
    });
  } else {
    // Single-player mode
    player.update(gameCtx, gameCanvas, gravity, deltaTime, platforms);
  }

  // Monitor rörelse av spelare samt för scrollande av platformar/bakgrund
  const currentPlayer = isGameJoined ? localPlayer : player;
  
  if (keys.d.pressed && currentPlayer.position.x < 400) {
    currentPlayer.velocity.x = currentPlayer.speed;
    currentPlayer.direction = "runRight";
  } else if (
    (keys.a.pressed && currentPlayer.position.x > 100) ||
    (keys.a.pressed && scrollOffset === 0 && currentPlayer.position.x > 0)
  ) {
    currentPlayer.velocity.x = -currentPlayer.speed;
    currentPlayer.direction = "runLeft";
  } else {
    currentPlayer.velocity.x = 0;

    if (keys.d.pressed) {
      scrollOffset += currentPlayer.speed;
      platforms.forEach((platform) => {
        platform.position.x -= currentPlayer.speed;
      });
      genericObjects.forEach((genericObject) => {
        genericObject.position.x -= currentPlayer.speed * 0.66;
      });
    } else if (keys.a.pressed && scrollOffset > 0) {
      scrollOffset -= currentPlayer.speed;
      platforms.forEach((platform) => {
        platform.position.x += currentPlayer.speed;
      });
      genericObjects.forEach((genericObject) => {
        genericObject.position.x += currentPlayer.speed * 0.66;
      });
    }
  }

  // Set animation states based on movement and grounded status
  if (currentPlayer.velocity.x === 0 && currentPlayer.velocity.y === 0) {
    currentPlayer.direction =
      currentPlayer.lastDirection === "runLeft" ? "idleLeft" : "idleRight";
  }

  // Platform collision
  platforms.forEach((platform) => {
    if (
      currentPlayer.position.y + currentPlayer.height <= platform.position.y &&
      currentPlayer.position.y + currentPlayer.height + currentPlayer.velocity.y >=
        platform.position.y &&
      currentPlayer.position.x + currentPlayer.width >= platform.position.x &&
      currentPlayer.position.x <= platform.position.x + platform.width
    ) {
      currentPlayer.velocity.y = 0;
    }
  });

  // Win condition
  if (scrollOffset > platformImage.width * 5 + 400 - 2) {
    console.log("Du hann i tid!");
  }

  // Lose condition
  if (currentPlayer.position.y > gameCanvas.height) {
    if (isGameJoined) {
      // In multiplayer, respawn the local player
      localPlayer.position.x = 100;
      localPlayer.position.y = 100;
      localPlayer.velocity.x = 0;
      localPlayer.velocity.y = 0;
    } else {
      init();
    }
  }
}

init();
animate();

document.addEventListener("keydown", (e) => {
  console.log(e.key);
  switch (e.key.toLowerCase()) {
    case "w":
      keys.w.pressed = true;
      const jumpPlayer = isGameJoined ? localPlayer : player;
      if (jumpPlayer) {
        jumpPlayer.velocity.y -= 20;
      }
      break;
    case "a":
      keys.a.pressed = true;
      break;
    case "s":
      keys.s.pressed = true;
      break;
    case "d":
      keys.d.pressed = true;
      break;
  }
});

document.addEventListener("keyup", (e) => {
  console.log(e.key);
  switch (e.key) {
    case "w":
      keys.w.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
    case "s":
      keys.s.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      const currentPlayerForStop = isGameJoined ? localPlayer : player;
      if (currentPlayerForStop) {
        currentPlayerForStop.velocity.x = 0;
      }
      break;
  }
});

// variabler
// ------------------------------------------------------------

// WebSocket functions
// ------------------------------------------------------------
function connectToGame() {
  gameWebSocket = new WebSocket("ws://localhost:3000");
  
  gameWebSocket.addEventListener("open", () => {
    console.log("Connected to game server");
    // Send join request
    const joinData = {
      type: "join",
      playerData: {
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        direction: "idleRight"
      }
    };
    gameWebSocket.send(JSON.stringify(joinData));
  });

  gameWebSocket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    handleServerMessage(data);
  });

  gameWebSocket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

  gameWebSocket.addEventListener("close", () => {
    console.log("Disconnected from game server");
    isGameJoined = false;
    localPlayer = null;
    localPlayerId = null;
    players.length = 0;
  });
}

function handleServerMessage(data) {
  switch (data.type) {
    case "welcome":
      localPlayerId = data.playerId;
      localPlayer = new Player({ x: 100, y: 100 });
      localPlayer.id = localPlayerId;
      isGameJoined = true;
      
      // Clear single-player mode
      players.length = 0;
      players.push(localPlayer);
      
      console.log("Joined game with ID:", localPlayerId);
      break;
      
    case "playerJoined":
      // Another player joined
      if (data.playerId !== localPlayerId) {
        const newPlayer = new Player(data.playerData.position);
        newPlayer.id = data.playerId;
        newPlayer.isRemote = true;
        players.push(newPlayer);
        console.log("Player joined:", data.playerId);
      }
      break;
      
    case "playerUpdate":
      // Update remote player positions
      const remotePlayer = players.find(p => p.id === data.playerId && p.id !== localPlayerId);
      if (remotePlayer) {
        remotePlayer.position.x = data.position.x;
        remotePlayer.position.y = data.position.y;
        remotePlayer.velocity.x = data.velocity.x;
        remotePlayer.velocity.y = data.velocity.y;
        remotePlayer.direction = data.direction;
      }
      break;
      
    case "gameState":
      // Full game state update (for new joiners)
      players.length = 0;
      Object.keys(data.players).forEach(playerId => {
        const playerData = data.players[playerId];
        const gamePlayer = new Player(playerData.position);
        gamePlayer.id = playerId;
        gamePlayer.velocity = { ...playerData.velocity };
        gamePlayer.direction = playerData.direction;
        
        if (playerId === localPlayerId) {
          localPlayer = gamePlayer;
        } else {
          gamePlayer.isRemote = true;
        }
        players.push(gamePlayer);
      });
      break;
      
    case "playerLeft":
      // Remove player who left
      const playerIndex = players.findIndex(p => p.id === data.playerId);
      if (playerIndex !== -1) {
        players.splice(playerIndex, 1);
        console.log("Player left:", data.playerId);
      }
      break;
  }
}

function sendPlayerUpdate() {
  if (gameWebSocket && gameWebSocket.readyState === WebSocket.OPEN && localPlayer) {
    const updateData = {
      type: "playerUpdate",
      playerId: localPlayerId,
      position: { ...localPlayer.position },
      velocity: { ...localPlayer.velocity },
      direction: localPlayer.direction
    };
    gameWebSocket.send(JSON.stringify(updateData));
  }
}

// Send updates periodically
let lastUpdateTime = 0;
function sendPeriodicUpdate(currentTime) {
  if (currentTime - lastUpdateTime > 50) { // Update every 50ms
    sendPlayerUpdate();
    lastUpdateTime = currentTime;
  }
}

// event handlers/listeners
// ------------------------------------------------------------
joinGameButton.addEventListener("click", (event) => {
  if (!isGameJoined) {
    connectToGame();
    joinGameButton.textContent = "Connecting...";
    joinGameButton.disabled = true;
    
    // Re-enable button after connection attempt
    setTimeout(() => {
      if (isGameJoined) {
        joinGameButton.textContent = "Leave Game";
        joinGameButton.disabled = false;
      } else {
        joinGameButton.textContent = "Join Game";
        joinGameButton.disabled = false;
      }
    }, 2000);
  } else {
    // Leave game
    if (gameWebSocket) {
      gameWebSocket.close();
    }
    joinGameButton.textContent = "Join Game";
    joinGameButton.disabled = false;
  }
});
