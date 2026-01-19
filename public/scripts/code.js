// DOM elements
// ------------------------------------------------------------
const form = document.querySelector("form");
const msgElement = document.querySelector("input#msg");
const chatBoxElement = document.querySelector("div#chatBox");

// dependencies Websocket
// ------------------------------------------------------------
const websocket = new WebSocket("ws://localhost:3000")

// variabler
// ------------------------------------------------------------

// event handlers/listeners
// ------------------------------------------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("Prevented form submit");
});

// is typing?
// msgElement.addEventListener("keydown", (e) => {
//     console.log("User is typing...")
// })

// funktioner
// ------------------------------------------------------------
