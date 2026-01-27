// DOM elements
// ------------------------------------------------------------
const formMessage = document.querySelector("#chatStage form");
const formUsername = document.querySelector("#formUsername");
const msgElement = document.querySelector("input#msg");
const chatElement = document.querySelector("div#chat");
const usernameElement = document.querySelector("#username");
const chatStage = document.querySelector("#chatStage");
const onlineUsersElement = chatStage.querySelector("code");
const canvas = document.querySelector("canvas");
const gameCanvas = document.querySelector("#game");

const ctx = canvas.getContext("2d");
const gameCtx = gameCanvas.getContext("2d");

// dependencies Websocket
// ------------------------------------------------------------
const websocket = new WebSocket("ws://localhost:3000");

// Canvas Game
// ------------------------------------------------------------

// Canvas storlek, fullscreen
gameCanvas.width = window.innerWidth;
// WIP, definiera höjden senare för bättre upplevelse och design.
gameCanvas.height = window.innerHeight;

const gravity = 1;

// Player
class Player {
  constructor() {
    this.position = { x: 100, y: 100 };
    this.velocity = { x: 0, y: 0 };
    this.width = 50;
    this.height = 50;
  }
  // Hur spelaren ser ut
  render(gameCtx) {
    gameCtx.fillStyle = "red";
    gameCtx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
  // Vad som uppdateras med spelaren
  update() {
    this.render(gameCtx);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // gravitation
    if (this.position.y + this.height + this.velocity.y <= gameCanvas.height) {
      this.velocity.y += gravity;
    } else {
      this.velocity.y = 0;
    }
  }
}

// Platform
class Platform {
  constructor({ x, y }) {
    this.position = { x, y };

    this.width = 200;
    this.height = 20;
  }
  draw() {
    gameCtx.fillStyle = "blue";
    gameCtx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
}

const player = new Player();
const platforms = [
  new Platform({ x: 200, y: 100 }),
  new Platform({ x: 400, y: 200 }),
];
const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false },
};

// animation loop
function animate() {
  requestAnimationFrame(animate);
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  player.update();
  platforms.forEach((platform) => {
    platform.draw();
  });

  // moniter rörelse av spelare samt för scrollande av platformar/bakgrund
  if (keys.d.pressed && player.position.x < 400) {
    player.velocity.x = 5;
  } else if (keys.a.pressed && player.position.x > 100) {
    player.velocity.x = -5;
  } else {
    player.velocity.x = 0;

    if (keys.d.pressed) {
      platforms.forEach((platform) => {
        platform.position.x -= 5;
      });
    } else if (keys.a.pressed) {
      platforms.forEach((platform) => {
        platform.position.x += 5;
      });
    }
  }

  // kollision med platformar
  platforms.forEach((platform) => {
    if (
      player.position.y + player.height <= platform.position.y &&
      player.position.y + player.height + player.velocity.y >=
        platform.position.y &&
      player.position.x + player.width >= platform.position.x &&
      player.position.x <= platform.position.x + platform.width
    ) {
      player.velocity.y = 0;
    }
  });
}
animate();

document.addEventListener("keydown", (e) => {
  const isTyping =
    document.activeElement === "input#msg" ||
    document.activeElement === "input#username";

  if (!isTyping) {
    console.log(e.key);
    switch (e.key.toLowerCase()) {
      case "w":
        keys.w.pressed = true;
        player.velocity.y -= 5;
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
  }
});

document.addEventListener("keyup", (e) => {
  console.log(e.key);
  switch (e.key) {
    case "w":
      keys.w.pressed = false;
      player.velocity.y -= 20;
      break;
    case "a":
      keys.a.pressed = false;
      break;
    case "s":
      keys.s.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      player.velocity.x = 0;
      break;
  }
});

// ------------------------------------------------------------

// variabler
// ------------------------------------------------------------
let username = "";
// let authenticated = false;
// let onlineUsers = [];

// event handlers/listeners
// ------------------------------------------------------------

formUsername.addEventListener("submit", (e) => {
  e.preventDefault();
  const endpoint = "http://localhost:3000/login";

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username }),
  };

  // fetch(endpoint, options)
  //   .then((res) => res.json())
  //   .then((data) => {
  //     console.log("data", data);
  //     if (data.success) {
  //       username = usernameElement.value;
  //       player = new Player(data.id, data.username);

  //       usernameElement.setAttribute("disabled", true);
  //       chatStage.classList.remove("hidden");

  //       // Fokusera på medellande fältet direkt
  //       msgElement.focus();

  //       // Skicka meddelande till server om ny användare
  //       const obj = { type: "new_user", username: username };
  //       websocket.send(JSON.stringify(obj));
  //     }
  //   });
});

formMessage.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("Prevented form submit");

  // Skicka ett meddelande via websocket
  const msg = msgElement.value;
  const obj = { type: "text", msg: msg, username: username };

  renderChatMessage(obj);

  websocket.send(JSON.stringify(obj));

  msgElement.value = "";
  msgElement.focus();
});

// is typing? något att implementera senare
// msgElement.addEventListener("keydown", (e) => {
//     console.log("User is typing...")
// })

// Socket event handler, för att fånga meddelanden från servern
websocket.addEventListener("message", (e) => {
  const data = e.data; // plockar datan, meddelandet, från eventet

  // skicka och ta emot data, förutsatt att det är i JSON format

  const obj = JSON.parse(e.data);
  console.log("obj", obj);

  // renderChatMessage(obj);
});

// funktioner
// ------------------------------------------------------------
function renderChatMessage(obj) {
  chatElement.innerText += obj.msg + "\n";
}

// socketplayer, gameLoop, renderPlayers
