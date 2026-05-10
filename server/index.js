const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

const app    = express();
const PORT   = process.env.PORT || 3002;
const ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

// ── Persistance JSON ──────────────────────────────────────────────────────────
const DATA_DIR  = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DATA_FILE = path.join(DATA_DIR, "flip7.json");

function readData() {
  try   { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return { players: [], games: [] }; }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === ORIGIN) return cb(null, true);
    cb(new Error("Origine non autorisée"));
  },
}));
app.use(express.json({ limit: "512kb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
// Récupère toutes les données (joueurs + parties)
app.get("/api/data", (_req, res) => {
  res.json(readData());
});

// Sauvegarde complète (le front envoie { players, games })
app.put("/api/data", (req, res) => {
  const { players, games } = req.body || {};
  if (!Array.isArray(players) || !Array.isArray(games)) {
    return res.status(400).json({ error: "Format invalide" });
  }
  writeData({ players, games });
  res.json({ ok: true });
});

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Flip7 API → http://localhost:${PORT}  |  Origin: ${ORIGIN}`);
});
