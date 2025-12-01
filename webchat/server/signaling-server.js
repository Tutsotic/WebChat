// Run:  node signaling-server.js
// Then clients connect: ws://your-signaling-server

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

let rooms = {};

wss.on("connection", ws => {
    ws.on("message", raw => {
        let data = JSON.parse(raw);

        if (data.type === "create") {
            rooms[data.room] = ws;
            ws.room = data.room;
        }

        if (data.type === "signal") {
            if (rooms[data.room] && rooms[data.room] !== ws) {
                rooms[data.room].send(JSON.stringify(data));
            } else {
                ws.send(JSON.stringify({ error: "Room not found or host unavailable." }));
            }
        }
    });

    ws.on("close", () => {
        if (ws.room) delete rooms[ws.room];
    });
});

console.log("Signaling server running : ws://localhost:8080");
