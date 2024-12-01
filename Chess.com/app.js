const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = { white: null, black: null };

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("disconnect", () => {
        if (socket.id === players.white) {
            console.log(`White player disconnected: ${socket.id}`);
            players.white = null;
        } else if (socket.id === players.black) {
            console.log(`Black player disconnected: ${socket.id}`);
            players.black = null;
        }
    });

    socket.on("move", (move) => {
        try {
            if ((chess.turn() === "w" && socket.id !== players.white) ||
                (chess.turn() === "b" && socket.id !== players.black)) {
                return;
            }

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Illegal move:", move);
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            console.error("Error processing move:", err);
        }
    });
});

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
