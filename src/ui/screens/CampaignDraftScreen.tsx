import { useState, useMemo } from "react";
import type { PokemonData } from "../../engine/types";
import { getPokemon } from "../../data/loaders";
import { POKEMON_COSTS, STARTING_GOLD } from "../../data/shop";
import { getUnlockedPokemonIds } from "../../run/playerProfile";
import { getCampaign } from "../../data/campaigns";
import { ScreenShell } from "../components/ScreenShell";
import { PokemonTile } from "../components/PokemonTile";
import { GoldCoin } from "../components/GoldCoin";
import { THEME } from "../theme";
import { getSpriteUrl } from "../utils/sprites";

interface Props {
  onComplete: (selectedPokemon: PokemonData[], gold: number) => void;
  onBack: () => void;
  campaignId?: string;
}

type Phase =
  | "story_intro"
  | "starter_pick"
  | "draft_2"
  | "draft_3"
  | "draft_4"
  | "done";

/** Seeded shuffle using a simple LCG. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function CampaignDraftScreen({ onComplete, onBack, campaignId = "rocket_tower" }: Props) {
  const campaign = getCampaign(campaignId);
  const starterIds = campaign.starterIds;

  const [phase, setPhase] = useState<Phase>("story_intro");
  const [gold, setGold] = useState(STARTING_GOLD);
  const [picked, setPicked] = useState<PokemonData[]>([]);

  // Compute draft pool once per mount.
  // Fixed campaigns use their defined pool; Campaign 1 uses the player's unlocked Pokemon.
  const draftPool = useMemo(() => {
    const seed = Date.now();
    if (campaign.draftPool !== null) {
      // Fixed pool: shuffle and use as-is
      return seededShuffle(campaign.draftPool, seed);
    }
    // Unlock-based pool: filter out starters
    const unlocked = getUnlockedPokemonIds();
    const eligible = unlocked.filter((id) => !starterIds.includes(id));
    return seededShuffle(eligible, seed);
  }, []);

  // Track how many we've consumed from the pool
  const [poolIndex, setPoolIndex] = useState(0);

  const pickedIds = new Set(picked.map((p) => p.id));

  // Get N candidates from the pool that haven't been picked
  function getNextCandidates(count: number): PokemonData[] {
    const candidates: PokemonData[] = [];
    let idx = poolIndex;
    while (candidates.length < count && idx < draftPool.length) {
      const id = draftPool[idx];
      if (!pickedIds.has(id)) {
        try {
          candidates.push(getPokemon(id));
        } catch {
          // Skip if Pokemon doesn't exist
        }
      }
      idx++;
    }
    return candidates;
  }

  function advancePool(candidates: PokemonData[]) {
    // Advance pool index past all candidates we showed
    let idx = poolIndex;
    let found = 0;
    while (found < candidates.length && idx < draftPool.length) {
      const id = draftPool[idx];
      if (!pickedIds.has(id)) found++;
      idx++;
    }
    setPoolIndex(idx);
  }

  function pickPokemon(pokemon: PokemonData, candidates: PokemonData[]) {
    const cost = POKEMON_COSTS[pokemon.id] ?? 200;
    if (gold < cost) return;
    setGold((g) => g - cost);
    setPicked((prev) => [...prev, pokemon]);
    advancePool(candidates);
    advancePhase();
  }

  function skipRound(candidates: PokemonData[]) {
    advancePool(candidates);
    advancePhase();
  }

  function advancePhase() {
    setPhase((prev) => {
      if (prev === "starter_pick") return "draft_2";
      if (prev === "draft_2") return "draft_3";
      if (prev === "draft_3") return "draft_4";
      return "done";
    });
  }

  // When done phase is reached, fire completion
  if (phase === "done") {
    // Use setTimeout to avoid calling onComplete during render
    setTimeout(() => onComplete(picked, gold), 0);
    return null;
  }

  // ── Header ──────────────────────────────────────────────────────

  const roundLabel =
    phase === "story_intro"
      ? "Campaign"
      : phase === "starter_pick"
        ? "Choose Your Starter"
        : phase === "draft_2"
          ? "Draft Round 2"
          : phase === "draft_3"
            ? "Draft Round 3"
            : "Draft Round 4";

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: `1px solid ${THEME.border.subtle}`,
      }}
    >
      <button
        onClick={onBack}
        style={{
          padding: "8px 16px",
          ...THEME.button.secondary,
          fontSize: 13,
        }}
      >
        &larr; Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            color: THEME.text.primary,
            fontWeight: "bold",
            fontSize: 16,
            ...THEME.heading,
            letterSpacing: "0.08em",
          }}
        >
          {roundLabel}
        </span>
        {phase !== "story_intro" && (
          <div
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.3)",
              color: "#facc15",
              fontSize: 15,
              fontWeight: "bold",
            }}
          >
            {gold}
            <GoldCoin size={14} />
          </div>
        )}
      </div>
      <div style={{ width: 60 }} />
    </div>
  );

  // ── Story Intro ─────────────────────────────────────────────────

  if (phase === "story_intro") {
    return (
      <ScreenShell
        header={header}
        bodyStyle={{ padding: "24px 16px 48px" }}
        ambient
      >
        <div
          style={{
            maxWidth: 500,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            paddingTop: 40,
          }}
        >
          <div
            style={{
              padding: "28px 32px",
              borderRadius: 12,
              background: THEME.bg.panelDark,
              border: `1px solid ${THEME.border.subtle}`,
              color: THEME.text.secondary,
              fontSize: 15,
              lineHeight: 1.8,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            {campaign.narrativeTexts.draftIntro}
          </div>
          <button
            onClick={() => setPhase("starter_pick")}
            style={{
              padding: "14px 48px",
              ...THEME.button.primary,
              fontSize: 16,
            }}
          >
            Continue
          </button>
        </div>
      </ScreenShell>
    );
  }

  // ── Starter Pick ────────────────────────────────────────────────

  if (phase === "starter_pick") {
    const starters = starterIds.map((id) => getPokemon(id));

    return (
      <ScreenShell
        header={header}
        bodyStyle={{ padding: "24px 16px 48px" }}
        ambient
        ambientTint="rgba(250,204,21,0.02)"
      >
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <p
            style={{
              color: THEME.text.secondary,
              margin: 0,
              textAlign: "center",
            }}
          >
            Pick one starter to lead your team
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {starters.map((pokemon) => {
              const cost = POKEMON_COSTS[pokemon.id] ?? 250;
              const canAfford = gold >= cost;
              return (
                <div key={pokemon.id} style={{ position: "relative" }}>
                  <PokemonTile
                    name={pokemon.name}
                    spriteUrl={getSpriteUrl(pokemon.id)}
                    primaryType={pokemon.types[0]}
                    secondaryType={pokemon.types[1]}
                    size="large"
                    onClick={
                      canAfford
                        ? () => pickPokemon(pokemon, [])
                        : undefined
                    }
                    stats={`HP: ${pokemon.maxHp} | SPD: ${pokemon.baseSpeed}`}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(0,0,0,0.7)",
                      color: "#facc15",
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                  >
                    {cost}
                    <GoldCoin size={10} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScreenShell>
    );
  }

  // ── Draft Rounds 2-4 ───────────────────────────────────────────

  const candidates = getNextCandidates(2);
  const affordableCandidates = candidates.filter(
    (p) => gold >= (POKEMON_COSTS[p.id] ?? 200),
  );

  // Auto-skip if nothing to show or can't afford anything
  if (candidates.length === 0 || affordableCandidates.length === 0) {
    return (
      <ScreenShell
        header={header}
        bodyStyle={{ padding: "24px 16px 48px" }}
        ambient
      >
        <div
          style={{
            maxWidth: 500,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            paddingTop: 40,
          }}
        >
          <p
            style={{
              color: THEME.text.secondary,
              margin: 0,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            {candidates.length === 0
              ? "No more Pokemon available to draft."
              : "Not enough gold to recruit anyone."}
          </p>
          <button
            onClick={() => skipRound(candidates)}
            style={{
              padding: "12px 36px",
              ...THEME.button.secondary,
              fontSize: 14,
            }}
          >
            Continue
          </button>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      header={header}
      bodyStyle={{ padding: "24px 16px 48px" }}
      ambient
      ambientTint="rgba(250,204,21,0.02)"
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <p
          style={{
            color: THEME.text.secondary,
            margin: 0,
            textAlign: "center",
          }}
        >
          Choose a companion or skip to save gold
        </p>

        {/* Party so far */}
        {picked.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {picked.map((p) => (
              <PokemonTile
                key={p.id}
                name={p.name}
                spriteUrl={getSpriteUrl(p.id)}
                primaryType={p.types[0]}
                size="small"
                isSelected
              />
            ))}
          </div>
        )}

        {/* Candidates */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {candidates.map((pokemon) => {
            const cost = POKEMON_COSTS[pokemon.id] ?? 200;
            const canAfford = gold >= cost;
            return (
              <div
                key={pokemon.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  opacity: canAfford ? 1 : 0.4,
                }}
              >
                <div style={{ position: "relative" }}>
                  <PokemonTile
                    name={pokemon.name}
                    spriteUrl={getSpriteUrl(pokemon.id)}
                    primaryType={pokemon.types[0]}
                    secondaryType={pokemon.types[1]}
                    size="large"
                    onClick={
                      canAfford
                        ? () => pickPokemon(pokemon, candidates)
                        : undefined
                    }
                    stats={`HP: ${pokemon.maxHp} | SPD: ${pokemon.baseSpeed}`}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(0,0,0,0.7)",
                      color: "#facc15",
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                  >
                    {cost}
                    <GoldCoin size={10} />
                  </div>
                </div>
                <button
                  onClick={() => pickPokemon(pokemon, candidates)}
                  disabled={!canAfford}
                  style={{
                    padding: "8px 20px",
                    ...(canAfford
                      ? THEME.button.primary
                      : THEME.button.secondary),
                    fontSize: 13,
                    opacity: canAfford ? 1 : 0.4,
                    cursor: canAfford ? "pointer" : "not-allowed",
                  }}
                >
                  Recruit ({cost}
                  <GoldCoin size={10} />)
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => skipRound(candidates)}
          style={{
            padding: "10px 32px",
            ...THEME.button.secondary,
            fontSize: 14,
            marginTop: 8,
          }}
        >
          Skip & Save Gold
        </button>
      </div>
    </ScreenShell>
  );
}
