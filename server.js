const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true }, pingInterval: 10000, pingTimeout: 20000 });
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_, res) => res.json({ ok: true, game: "Kaushik Formula + GT 3D" }));

const rooms = new Map();
const allowedTracks = new Set([
  "Monza", "Silverstone", "Suzuka", "Monaco", "Spa", "Bahrain",
  "Austin", "BrandsHatch", "Budapest", "Catalunya", "Hockenheim", "IMS",
  "Melbourne", "MexicoCity", "Montreal", "MoscowRaceway", "Norisring",
  "Nuerburgring", "Oschersleben", "Sakhir", "SaoPaulo", "Sepang",
  "Shanghai", "Sochi", "Spielberg", "YasMarina", "Zandvoort"
]);
function cleanRoom(room) {
  return String(room || "GRID").trim().toUpperCase().slice(0, 24) || "GRID";
}
function roomGrid(room) {
  const drivers = rooms.get(room);
  return drivers ? [...drivers.values()].map((driver, gridSlot) => ({ ...driver, gridSlot })) : [];
}
function publishGrid(room) {
  if (rooms.has(room)) io.to(room).emit("gridUpdate", roomGrid(room));
}
function removeFromRoom(socket) {
  const room = socket.data.room;
  if (!room) return;
  const drivers = rooms.get(room);
  if (drivers) {
    drivers.delete(socket.id);
    if (drivers.size) publishGrid(room);
    else rooms.delete(room);
  }
  socket.leave(room);
  socket.data.room = null;
}

io.on("connection", socket => {
  socket.on("joinRace", payload => {
    const data = payload || {};
    const room = cleanRoom(data.room);
    const requestedTrack = allowedTracks.has(data.trackName) ? data.trackName : "Monza";
    if (socket.data.room && socket.data.room !== room) removeFromRoom(socket);
    const current = rooms.get(room);
    if (current?.size) {
      const roomTrack = current.values().next().value.trackName;
      if (roomTrack && roomTrack !== requestedTrack) {
        socket.emit("roomError", { message: `This room is racing at ${roomTrack}. Select the same circuit to join.` });
        return;
      }
    }
    if (socket.data.room === room && rooms.get(room)?.has(socket.id)) {
      const grid = roomGrid(room);
      const mine = grid.find(d => d.id === socket.id);
      socket.emit("roomJoined", { room, id: socket.id, gridSlot: mine?.gridSlot ?? 0, players: grid.length });
      socket.emit("roomSnapshot", grid);
      return;
    }
    socket.join(room);
    socket.data.room = room;
    socket.data.driver = {
      id: socket.id,
      name: String(data.name || "Driver").slice(0, 18),
      carClass: data.carClass === "GT" ? "GT" : "FORMULA",
      color: /^#[0-9a-f]{6}$/i.test(String(data.color || "")) ? data.color : "#e53935",
      trackName: requestedTrack,
      x: Number(data.x) || 0,
      z: Number(data.z) || 0,
      heading: Number(data.heading) || 0,
      speed: 0,
      lap: 1
    };
    if (!rooms.has(room)) rooms.set(room, new Map());
    rooms.get(room).set(socket.id, socket.data.driver);
    const grid = roomGrid(room);
    const mine = grid.find(d => d.id === socket.id);
    socket.emit("roomJoined", { room, id: socket.id, gridSlot: mine?.gridSlot ?? 0, players: grid.length });
    socket.emit("roomSnapshot", grid);
    publishGrid(room);
  });

  socket.on("leaveRace", () => removeFromRoom(socket));

  socket.on("driveState", state => {
    const room = socket.data.room;
    const drivers = rooms.get(room);
    if (!room || !drivers || !drivers.has(socket.id) || !state) return;
    const d = drivers.get(socket.id);
    const x = Number(state.x), z = Number(state.z), heading = Number(state.heading), speed = Number(state.speed);
    if (![x, z, heading, speed].every(Number.isFinite)) return;
    if (state.trackName && state.trackName !== d.trackName) return;
    d.x = x; d.z = z; d.heading = heading;
    d.speed = Math.max(0, Math.min(400, speed));
    d.lap = Math.max(1, Math.min(100, Number(state.lap) || 1));
    socket.to(room).volatile.emit("opponentState", { ...d });
  });

  socket.on("disconnect", () => removeFromRoom(socket));
});
server.listen(PORT, () => console.log(`Kaushik Formula + GT 3D running at http://localhost:${PORT}`));
