// DOM elements
// ------------------------------------------------------------
const form = document.querySelector("form");
const msgElement = document.querySelector("input#msg");
const chatBoxElement = document.querySelector("div#chatBox");

// dependencies Websocket
// ------------------------------------------------------------
const websocket = new WebSocket("ws://localhost:3000");

// variabler
// ------------------------------------------------------------

// event handlers/listeners
// ------------------------------------------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
    console.log("Prevented form submit");

    // Skicka ett meddelande via websocket
    const msg  = msgElement.value;

    const obj = {msg: msg};
    
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
});

// funktioner
// ------------------------------------------------------------
