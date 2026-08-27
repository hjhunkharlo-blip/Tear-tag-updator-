import { world, system } from "@minecraft/server";

const API_URL =
  "https://tear-tag-updator-production.up.railway.app/api/tiers";

const REFRESH_SECONDS = 10;

const TIER_PRIORITY = {
  HT1: 100,
  LT1: 90,
  HT2: 80,
  LT2: 70,
  HT3: 60,
  LT3: 50,
  HT4: 40,
  LT4: 30,
  HT5: 20,
  LT5: 10
};

const KIT_ICONS = {
  sword: "⚔",
  axe: "🪓",
  mace: "🔨",
  crystal: "💎",
  smp: "🛡",
  diasmp: "❄",
  uch: "⚔"
};

let tierData = null;

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getHighestTier(playerName) {
  if (!tierData) return null;

  let highest = null;

  for (const kit of tierData.kits) {
    const players = tierData.data[kit.id] || {};

    const entry = Object.entries(players).find(
      ([name]) =>
        normalize(name) === normalize(playerName)
    );

    if (!entry) continue;

    const tier = String(entry[1])
      .trim()
      .toUpperCase();

    const priority = TIER_PRIORITY[tier] || 0;

    if (!highest || priority > highest.priority) {
      highest = {
        kit: kit.id,
        tier,
        priority
      };
    }
  }

  return highest;
}

function updatePlayer(player) {
  const highest =
    getHighestTier(player.name);

  if (!highest) {
    player.nameTag = player.name;
    return;
  }

  const icon =
    KIT_ICONS[highest.kit] || "⚔";

  player.nameTag =
    `[${icon} ${highest.tier}] ${player.name}`;
}

async function loadTiers() {
  try {
    const response = await fetch(
      API_URL + "?cache=" + Date.now()
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const json = await response.json();

    if (
      json.status !== "online" ||
      !Array.isArray(json.kits) ||
      !json.data
    ) {
      throw new Error("Invalid tier API response");
    }

    tierData = json;

    console.warn(
      "[HAVOC STYX] Tier data updated."
    );

  } catch (error) {
    console.warn(
      "[HAVOC STYX] Tier sync failed:",
      error
    );
  }
}

async function syncPlayers() {
  await loadTiers();

  if (!tierData) return;

  for (const player of world.getAllPlayers()) {
    try {
      updatePlayer(player);
    } catch (error) {
      console.warn(
        "[HAVOC STYX] Player update failed:",
        error
      );
    }
  }
}

system.runTimeout(() => {
  syncPlayers();
}, 40);

system.runInterval(() => {
  syncPlayers();
}, 20 * REFRESH_SECONDS);

world.afterEvents.playerSpawn.subscribe(event => {
  system.runTimeout(() => {
    if (event.player?.isValid) {
      updatePlayer(event.player);
    }
  }, 40);
});
