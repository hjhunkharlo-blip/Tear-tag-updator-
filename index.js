const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* =========================
   HAVOC STYX CONFIG
========================= */

const TIERS = [
  "HT1",
  "LT1",
  "HT2",
  "LT2",
  "HT3",
  "LT3",
  "HT4",
  "LT4",
  "HT5",
  "LT5"
];

const POINTS = {
  HT1: 10,
  LT1: 8,
  HT2: 8,
  LT2: 6,
  HT3: 5,
  LT3: 4,
  HT4: 3,
  LT4: 2,
  HT5: 1,
  LT5: 1
};

/* =========================
   KITS
========================= */

const KITS = [
  { id: "sword", name: "Sword", icon: "⚔️" },
  { id: "axe", name: "Axe", icon: "🪓" },
  { id: "mace", name: "Mace", icon: "🔨" },
  { id: "crystal", name: "Crystal", icon: "💎" },
  { id: "smp", name: "SMP", icon: "🛡️" },
  { id: "diasmp", name: "DiaSMP", icon: "❄️" },
  { id: "uch", name: "UHC", icon: "⚔️" }
];

/* =========================
   PLAYER TIER DATA
========================= */

const data = {
  sword: {},
  axe: {},
  mace: {},
  crystal: {},
  smp: {},
  diasmp: {},
  uch: {}
};

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "HAVOC STYX API",
    version: "1.0.0"
  });
});

/* =========================
   GET ALL TIERS
========================= */

app.get("/api/tiers", (req, res) => {
  res.json({
    status: "online",
    name: "HAVOC STYX",

    kits: KITS,

    tiers: TIERS,

    points: POINTS,

    data: data,

    overallRankings: calculateRankings(),

    updatedAt: new Date().toISOString()
  });
});

/* =========================
   CALCULATE RANKINGS
========================= */

function calculateRankings() {
  const players = {};

  for (const kit of KITS) {
    const kitPlayers = data[kit.id] || {};

    for (const [player, tier] of Object.entries(kitPlayers)) {

      const key = player.toLowerCase();

      if (!players[key]) {
        players[key] = {
          player: player,
          totalPoints: 0,
          kits: []
        };
      }

      const normalizedTier =
        String(tier).trim().toUpperCase();

      const points =
        POINTS[normalizedTier] || 0;

      players[key].totalPoints += points;

      players[key].kits.push({
        kit: kit.id,
        kitName: kit.name,
        icon: kit.icon,
        tier: normalizedTier,
        points: points
      });
    }
  }

  return Object.values(players)
    .sort((a, b) => {

      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      return a.player.localeCompare(
        b.player,
        undefined,
        { sensitivity: "base" }
      );
    })
    .slice(0, 50);
}

/* =========================
   UPDATE PLAYER TIER
========================= */

app.post("/api/tiers/update", (req, res) => {

  const {
    player,
    kit,
    tier
  } = req.body;

  if (!player || !kit || !tier) {
    return res.status(400).json({
      status: "error",
      message: "player, kit and tier are required"
    });
  }

  if (!data[kit]) {
    return res.status(400).json({
      status: "error",
      message: "Unknown kit"
    });
  }

  const normalizedTier =
    String(tier).trim().toUpperCase();

  if (!TIERS.includes(normalizedTier)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid tier"
    });
  }

  data[kit][player] = normalizedTier;

  res.json({
    status: "success",
    player,
    kit,
    tier: normalizedTier,
    points: POINTS[normalizedTier]
  });
});

/* =========================
   REMOVE PLAYER TIER
========================= */

app.post("/api/tiers/remove", (req, res) => {

  const {
    player,
    kit
  } = req.body;

  if (!player || !kit) {
    return res.status(400).json({
      status: "error",
      message: "player and kit are required"
    });
  }

  if (!data[kit]) {
    return res.status(400).json({
      status: "error",
      message: "Unknown kit"
    });
  }

  const existingPlayer =
    Object.keys(data[kit]).find(
      name =>
        name.toLowerCase() ===
        player.toLowerCase()
    );

  if (existingPlayer) {
    delete data[kit][existingPlayer];
  }

  res.json({
    status: "success",
    message: "Tier removed"
  });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `HAVOC STYX API running on port ${PORT}`
  );
});
