// DOM elements
// ------------------------------------------------------------
const gameCanvas = document.querySelector("#game");
const gameCtx = gameCanvas.getContext("2d");

// Dependencies
const backendHost = "teachersrun.onrender.com";
const websocket = new WebSocket(`wss://${backendHost}`);
const endpoint = `https://${backendHost}`;

const dpr = window.devicePixelRatio || 1;

// Ljud vid vinst
const winSound = new Audio("../sounds/winSound.mp3");
winSound.volume = 0.5;

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
const players = [];
let localPlayer = null;
let localPlayerId = null;
let isGameJoined = false;
let gameWebSocket = null; // WebSocket connection

// Kamera
let camera = {
  x: 0,
  y: 0,
};

// Platform
class Platform {
  constructor({ x, y, image }) {
    this.position = { x, y };

    this.image = image;

    this.width = image.width;
    this.height = image.height;
  }
  draw() {
    gameCtx.drawImage(
      this.image,
      this.position.x - camera.x,
      this.position.y - camera.y,
    );
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
    gameCtx.drawImage(
      this.image,
      this.position.x - camera.x,
      this.position.y - camera.y,
    );
  }
}

function createImage(imageSrc) {
  const image = new Image();
  image.src = imageSrc;
  return image;
}

let player = new Player(); // för singleplayer
let platforms = [];
let genericObjects = [];

const keys = {
  w: { pressed: false, justPressed: false },
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

  // Singleplayer läge
  if (!isGameJoined) {
    player = new Player();
  }
  platforms = [
    // Högre platformar läggs här för att hamna bakom de lägre
    // detta baseras på när de ritas ut.
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
    new Platform({
      x: platformImage.width * 8 + 1200,
      y: 270,
      image: platformSmallTall,
    }),
    new Platform({
      x: platformImage.width * 11 + 3000,
      y: 270,
      image: platformSmallTall,
    }),
    new Platform({
      x: platformImage.width * 12 + 3000,
      y: 170,
      image: platformSmallTall,
    }),
    // Vanliga plafformar
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
    new Platform({
      x: platformImage.width * 6 + 1150 - 2,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 7 + 1300 - 2,
      y: 470,
      image: platformSmallTall,
    }),
    new Platform({
      x: platformImage.width * 8 + 1700 - 2,
      y: 470,
      image: platformSmallTall,
    }),
    new Platform({
      x: platformImage.width * 9 + 1800 - 2,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 10 + 2200 - 2,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 11 + 2300 - 2,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 13 + 3000 - 2,
      y: 470,
      image: platformImage,
    }),
    new Platform({
      x: platformImage.width * 14 + 3400 - 2,
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
      x: backgroundImage.width,
      y: 0,
      image: backgroundImage,
    }),
    new GenericObjects({
      x: 0,
      y: 0,
      image: hillsImage,
    }),
    new GenericObjects({
      x: hillsImage.width,
      y: 0,
      image: hillsImage,
    }),
  ];

  scrollOffset = 0;
}

// Kamera uppdatering
function updateCamera(followPlayer) {
  if (!followPlayer) return;

  // Centrera kameran på spelaren horisontellt
  camera.x =
    followPlayer.position.x -
    gameCanvas.width / 2 / dpr +
    followPlayer.width / 2;
  camera.y = 0;

  // Begränsa kameran från att gå utanför vänstra kanten
  camera.x = Math.max(0, camera.x);
}

// animation loop
let lastTime = 0;

function animate(currentTime = 0) {
  if (lastTime === 0) lastTime = currentTime;
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  requestAnimationFrame(animate);
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // Fix för suddigheten av pixel art
  gameCtx.imageSmoothingEnabled = false;

  // Skicka uppdateringar till servern
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

  if (isGameJoined && localPlayer) {
    if (keys.d.pressed) {
      localPlayer.velocity.x = localPlayer.speed;
    } else if (keys.a.pressed) {
      localPlayer.velocity.x = -localPlayer.speed;
    } else {
      localPlayer.velocity.x = 0;
    }
  } else if (!isGameJoined && player) {
    if (keys.d.pressed) {
      player.velocity.x = player.speed;
    } else if (keys.a.pressed) {
      player.velocity.x = -player.speed;
    } else {
      player.velocity.x = 0;
    }
  }

  // Uppdatera och rita spelaren(a)
  if (isGameJoined && localPlayer) {
    players.forEach((gamePlayer) => {
      if (gamePlayer.id == localPlayerId) {
        gamePlayer.update(gameCtx, gameCanvas, gravity, deltaTime, platforms);
      } else if (gamePlayer.isRemote && gamePlayer.updateAnimationState) {
        gamePlayer.updateAnimationState(deltaTime);
      }
    });

    // Updatera kameran och följ lokala spelaren
    updateCamera(localPlayer);

    // Rendera alla spelare med animation och kamera
    players.forEach((gamePlayer) => {
      if (gamePlayer.image && gamePlayer.renderAnimated) {
        gamePlayer.renderAnimated(gameCtx, camera);
      }
    });
  } else if (!isGameJoined) {
    // Single-player läge
    player.update(gameCtx, gameCanvas, gravity, deltaTime, platforms);

    // Uppdatera kameran och följ spelaren
    updateCamera(player);

    // Rendera spelaren med animation och kamera
    if (player.image && player.renderAnimated) {
      player.renderAnimated(gameCtx, camera);
    }
  }

  // Platform collision och animation uppdateringar
  if (isGameJoined) {
    players.forEach((gamePlayer) => {
      if (gamePlayer.id == localPlayerId) {
        platforms.forEach((platform) => {
          if (
            gamePlayer.position.y + gamePlayer.height <= platform.position.y &&
            gamePlayer.position.y + gamePlayer.height + gamePlayer.velocity.y >=
              platform.position.y &&
            gamePlayer.position.x + gamePlayer.width >= platform.position.x &&
            gamePlayer.position.x <= platform.position.x + platform.width
          ) {
            gamePlayer.velocity.y = 0;
          }
        });

        // Grounded state uppdatering
        if (gamePlayer.updateGroundedState) {
          gamePlayer.updateGroundedState();
        }
        if (gamePlayer.updateAnimationState) {
          gamePlayer.updateAnimationState(deltaTime);
        }
      }
    });
  } else {
    // Single-player collision och animation
    const currentPlayer = player;
    if (currentPlayer) {
      platforms.forEach((platform) => {
        if (
          currentPlayer.position.y + currentPlayer.height <=
            platform.position.y &&
          currentPlayer.position.y +
            currentPlayer.height +
            currentPlayer.velocity.y >=
            platform.position.y &&
          currentPlayer.position.x + currentPlayer.width >=
            platform.position.x &&
          currentPlayer.position.x <= platform.position.x + platform.width
        ) {
          currentPlayer.velocity.y = 0;
        }
      });

      // Uppdatera grounded state och animation efter kollisions
      // AI genererad kod. Använt Claude Sonnet i VS Code. Önskade att spelarens animation
      // ändrades och passade in med vilket håll spelaren senast "tittade" åt. För en bättre
      // spelupplevelse.

      if (currentPlayer.updateGroundedState) {
        currentPlayer.updateGroundedState();
      }
      if (currentPlayer.updateAnimationState) {
        currentPlayer.updateAnimationState(deltaTime);
      }
    }
  }

  // Win condition
  // AI genererad kod. Använt Claude Sonnet i VS Code.
  // Första win scenariot var baserat på scrollOffset. Detta fungerade inte med
  // multiplayer och behövdes ändras. Nu baseras det på spelarens position.
  // Skapades en bugg där spelare 1 "puttade" spelare två med sig och vise versa
  if (
    isGameJoined &&
    localPlayer &&
    localPlayer.position.x > platformImage.width * 14 + 3400
  ) {
    document.getElementById("winText").style.visibility = "visible";
    winSound.play().catch((e) => console.log("Audio play failed:", e));
  } else if (
    !isGameJoined &&
    player &&
    player.position.x > platformImage.width * 14 + 3400
  ) {
    document.getElementById("winText").style.visibility = "visible";
    winSound.play().catch((e) => console.log("Audio play failed:", e));
  }

  // Lose condition
  if (
    isGameJoined &&
    localPlayer &&
    localPlayer.position.y > gameCanvas.height
  ) {
    // Reset local player
    localPlayer.position.x = 100;
    localPlayer.position.y = 100;
    localPlayer.velocity.x = 0;
    localPlayer.velocity.y = 0;

    // Reset camera & scroll
    camera.x = 0;
    camera.y = 0;
    scrollOffset = 0;

    // Reinit platformar och bakgrund
    const wasGameJoined = isGameJoined;
    const savedLocalPlayer = localPlayer;
    const savedLocalPlayerId = localPlayerId;
    const savedPlayers = [...players];

    init();

    // Återställ multiplayer state
    isGameJoined = wasGameJoined;
    localPlayer = savedLocalPlayer;
    localPlayerId = savedLocalPlayerId;
    players.length = 0;
    players.push(...savedPlayers);
  } else if (!isGameJoined && player && player.position.y > gameCanvas.height) {
    init();
  }
}

init();
animate();

document.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "w":
      if (!keys.w.pressed) {
        keys.w.justPressed = true;
      }
      keys.w.pressed = true;
      // AI genererad kod. Använt Claude Sonnet i VS Code.
      // Kontroll för att enbart kunna hoppa en gång.

      const jumpPlayer = isGameJoined ? localPlayer : player;
      if (jumpPlayer && keys.w.justPressed && jumpPlayer.isGrounded) {
        jumpPlayer.velocity.y -= 20;
      }
      keys.w.justPressed = false;
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
  switch (e.key) {
    case "w":
      keys.w.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
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

// WebSocket functions
// ------------------------------------------------------------
// AI genererad kod. Använt Claude Sonnet i VS Code.
// Låg efter med WebSocket delen och tog hjälp av AI för att komma ikapp
// och kunna arbeta med ett mer komplett spel.
function connectToGame() {
  gameWebSocket = new WebSocket(`wss://${backendHost}`);

  gameWebSocket.addEventListener("open", () => {
    console.log("Connected to game server");
    // Send join request
    const joinData = {
      type: "join",
      playerData: {
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        direction: "idleRight",
      },
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

// AI genererad kod. Använt Claude Sonnet i VS Code.
// Samma anledning som ovan.
function handleServerMessage(data) {
  switch (data.type) {
    case "welcome":
      localPlayerId = data.playerId;
      isGameJoined = true;

      console.log("Joined game with ID:", localPlayerId);
      break;

    case "playerJoined":
      // Spelare 2 ansluter
      if (data.playerId !== localPlayerId) {
        const newPlayer = new Player(
          data.playerData.position,
          data.playerData.spriteType,
        );
        newPlayer.id = data.playerId;
        newPlayer.isRemote = true;
        players.push(newPlayer);
        console.log(
          "Player joined:",
          data.playerId,
          "with sprite:",
          data.playerData.spriteType,
        );
      }
      break;

    case "playerUpdate":
      const remotePlayer = players.find(
        (p) => p.id == data.playerId && p.id != localPlayerId,
      );
      if (remotePlayer) {
        remotePlayer.position.x = data.position.x;
        remotePlayer.position.y = data.position.y;
        remotePlayer.velocity.x = data.velocity.x;
        remotePlayer.velocity.y = data.velocity.y;
        remotePlayer.direction = data.direction;
        if (data.currentFrame !== undefined) {
          remotePlayer.currentFrame = data.currentFrame;
        }
        if (data.isGrounded !== undefined) {
          remotePlayer.isGrounded = data.isGrounded;
        }
      }
      break;

    case "gameState":
      players.length = 0;
      localPlayer = null;

      Object.keys(data.players).forEach((playerId) => {
        const playerData = data.players[playerId];
        const gamePlayer = new Player(
          playerData.position,
          playerData.spriteType,
        );
        gamePlayer.id = playerId;
        gamePlayer.velocity = { ...playerData.velocity };
        gamePlayer.direction = playerData.direction;

        if (playerId == localPlayerId) {
          localPlayer = gamePlayer;
          gamePlayer.isRemote = false;
        } else {
          gamePlayer.isRemote = true;
        }
        players.push(gamePlayer);
      });

      console.log(
        "Game state updated. Local player:",
        localPlayer ? localPlayer.id : "none",
      );
      break;

    case "playerLeft":
      const playerIndex = players.findIndex((p) => p.id == data.playerId);
      if (playerIndex !== -1) {
        players.splice(playerIndex, 1);
        console.log("Player left:", data.playerId);
      }
      break;
  }
}

function sendPlayerUpdate() {
  if (
    gameWebSocket &&
    gameWebSocket.readyState === WebSocket.OPEN &&
    localPlayer
  ) {
    const updateData = {
      type: "playerUpdate",
      playerId: localPlayerId,
      position: { ...localPlayer.position },
      velocity: { ...localPlayer.velocity },
      direction: localPlayer.direction,
      currentFrame: localPlayer.currentFrame,
      isGrounded: localPlayer.isGrounded,
    };
    gameWebSocket.send(JSON.stringify(updateData));
  }
}

let lastUpdateTime = 0;
function sendPeriodicUpdate(currentTime) {
  if (currentTime - lastUpdateTime > 33) {
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

    // Aktivera knappen igen
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
    if (gameWebSocket) {
      gameWebSocket.close();
    }
    joinGameButton.textContent = "Join Game";
    joinGameButton.disabled = false;
  }
});
