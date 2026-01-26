// dependencies
// ------------------------------------------------------------
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

// miljövariabler
// ------------------------------------------------------------
const app = express();
app.use(express.json());

// statiska filer
app.use(express.static("public"));

const PORT = 3000;

// http server. Express skickas med som en instans i http servern
const server = http.createServer(app);

// WS server
const wss = new WebSocketServer({ noServer: true });

// Handskakning av WS connection
server.on("upgrade", (req, socket, head) => {
  //   console.log("event upgreade...");

  wss.handleUpgrade(req, socket, head, (ws) => {
    console.log("Client:", req.headers["user-agent"]);

    wss.emit("connection", ws, req);
  });
});

// Online status för användare. Ska matcha med användarnamnet som klienter skickar.

// middleware
// ------------------------------------------------------------

// routes
// ------------------------------------------------------------

// event handlers
// ------------------------------------------------------------
wss.on("connection", (ws) => {
  // Loggar anslutande klienter. Visar även när klienter lämnar
  console.log(`New client connected, total clients: ${wss.clients.size}`);

  // Skicka till browserland
  // skicka och ta emot data, förutsatt att det är i JSON format

  const obj = { type: "new_client", msg: "New client connected" };

  ws.send(JSON.stringify(obj));

  //   Klienter lämnar
  ws.on("close", () => {
    console.log(`Client disconnected, total clients: ${wss.clients.size}`);
  });

  // Lyssnar på event "message"
  ws.on("message", (data) => {
    // parse används för vi vet att det är i JSON format, annars felmeddelande. Kontrollera isf!
    const obj = JSON.parse(data);

    console.log(obj);

    wss.clients.forEach((client) => {
      client.send(JSON.stringify(obj));
    });
  });

  ws.onerror = (error) => {
    console.log("WebSocket error;", error);
  };
});

// server start
// ------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
