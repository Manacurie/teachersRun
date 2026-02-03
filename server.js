// dependencies
// ------------------------------------------------------------
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

// miljövariabler
// ------------------------------------------------------------
const app = express();
app.use(express.json());
let nextClientId = 1;
const clients = {};
const players = {};

// WS server
const wss = new WebSocketServer({ noServer: true });

// statiska filer
app.use(express.static("public"));

// http server. Express skickas med som en instans i http servern
const server = http.createServer(app);

// Handskakning av WS connection
server.on("upgrade", (req, socket, head) => {
  //   console.log("event upgreade...");

  wss.handleUpgrade(req, socket, head, (ws) => {
    console.log("Client:", req.headers["user-agent"]);

    wss.emit("connection", ws, req);
  });
});

// event handlers
// ------------------------------------------------------------
wss.on("connection", (ws) => {
  // Loggar anslutande klienter. Visar även när klienter lämnar
  console.log(`New client connected, total clients: ${wss.clients.size}`);

  const id = nextClientId++;
  clients[id] = ws;

  // Skicka till klinter med meddelande
  ws.send(
    JSON.stringify({
      type: "welcome",
      playerId: id,
      message: `Welcome! Your player ID is ${id}`,
    }),
  );

  ws.on("message", (event) => {
    const message = JSON.parse(event);

    if (message.type === "join") {
      const playerCount = Object.keys(players).length;
      const spriteType = playerCount === 0 ? "mattias" : "madde";

      players[id] = {
        id: id,
        position: message.playerData.position || { x: 100, y: 100 },
        velocity: message.playerData.velocity || { x: 0, y: 0 },
        direction: message.playerData.direction || "idleRight",
        spriteType: spriteType,
      };

      console.log("Player joined", players[id], "with sprite:", spriteType);

      ws.send(
        JSON.stringify({
          type: "gameState",
          players: players,
        }),
      );

      const joinNotification = JSON.stringify({
        type: "playerJoined",
        playerId: id,
        playerData: players[id],
      });

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === client.OPEN) {
          client.send(joinNotification);
        }
      });
    } else if (message.type === "playerUpdate") {
      if (players[id]) {
        players[id].position = message.position;
        players[id].velocity = message.velocity;
        players[id].direction = message.direction;

        const updateData = JSON.stringify({
          type: "playerUpdate",
          playerId: id,
          position: message.position,
          velocity: message.velocity,
          direction: message.direction,
        });

        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === client.OPEN) {
            client.send(updateData);
          }
        });
      }
    }
  });

  //   Klienter lämnar
  ws.on("close", () => {
    console.log(
      `Client disconnected with id: ${id}, total clients: ${wss.clients.size}`,
    );

    // Remove player
    if (players[id]) {
      delete players[id];
      delete clients[id];

      // Skicka ut när spelare lämnar
      const leaveNotification = JSON.stringify({
        type: "playerLeft",
        playerId: id,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(leaveNotification);
        }
      });
    }
  });

  ws.onerror = (error) => {
    console.log("WebSocket error:", error);
  };
});

// server start
// ------------------------------------------------------------
const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
