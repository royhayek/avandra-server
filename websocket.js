const WebSocket = require("ws");
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("message", (message) => {
    console.log("Received message:", message);
  });
});

module.exports = wss;
