// dependencies
// ------------------------------------------------------------

// Express import för server app
// ------------------------------------------------------------
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
// miljövariabler
// ------------------------------------------------------------
const app = express();
app.use(express.static("public"));
const PORT = 3000;

// http server
const server = http.createServer(app);

// WS server
const wss = new WebSocketServer({ noServer: true });

// Handskakning av WS connection
server.on("upgrade", (req, socket, head) => {
  console.log("event upgreade...");

  wss.handleUpgrade(req, socket, head, (ws) => {
    console.log("Client:", req.headers["user-agent"]);

    wss.emit("connection", ws, req);
  });
});

// middleware
// ------------------------------------------------------------

// event handlers
// ------------------------------------------------------------
wss.on("connection", (ws) => {
  // Loggar anslutande klienter. Ska även visa när klienter lämnar
  console.log(`New client connected, total clients: ${wss.clients.size}`);
  ws.on("close", () => {
    console.log(`Client disconnected, total clients: ${wss.clients.size}`);
  });
});

const obj = {
  type: "new_client",
  msg: "New client connected",
};
// broadcast(wss, obj);

// server start
// ------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
