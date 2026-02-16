import { useState, useEffect, useRef, useMemo } from "react";
import type { RunState, RunPokemon } from "../../run/types";
import type { ProgressionRung } from "../../run/progression";
import { getPokemon, getMove } from "../../data/loaders";
import { canPokemonLevelUp, applyLevelUp, getNextRung } from "../../run/state";
import { PASSIVE_DEFINITIONS, type PassiveId } from "../../run/progression";
import { getSpriteUrl } from "../utils/sprites";
import { getSpriteSize } from "../../data/heights";
import { AmbientBackground } from "../components/AmbientBackground";
import { ScreenShell } from "../components/ScreenShell";
import { Flourish } from "../components/Flourish";
import { CardPreview } from "../components/CardPreview";
import { THEME } from "../theme";
import { playSound } from "../utils/sound";

const CONFETTI_COLORS = [
  THEME.accent,
  THEME.text.primary,
  "#4ade80",
  "#60a5fa",
  "#a855f7",
  "#f97316",
];

type EvolutionPhase =
  | "intro"
  | "silhouette"
  | "morph"
  | "reveal"
  | "celebration";

type ScreenPhase = "summary" | "evolution";

interface LevelUpScreenProps {
  run: RunState;
  onComplete: (updatedRun: RunState) => void;
}

interface LevelUpEntry {
  pokemonIndex: number;
  pokemon: RunPokemon;
  nextRung: ProgressionRung;
  evolves: boolean;
}

export function LevelUpScreen({ run, onComplete }: LevelUpScreenProps) {
  const [screenPhase, setScreenPhase] = useState<ScreenPhase>("summary");

  // Build the queue once from initial run (before any level-ups applied)
  const entries = useMemo<LevelUpEntry[]>(() => {
    const result: LevelUpEntry[] = [];
    run.party.forEach((pokemon, index) => {
      if (!canPokemonLevelUp(pokemon)) return;
      const nextRung = getNextRung(pokemon);
      if (!nextRung) return;
      result.push({
        pokemonIndex: index,
        pokemon,
        nextRung,
        evolves: !!nextRung.evolvesTo,
      });
    });
    return result;
  }, [run]);

  // Apply all level-ups to compute the post-level-up run state
  const leveledUpRun = useMemo<RunState>(() => {
    let updated = run;
    for (const entry of entries) {
      updated = applyLevelUp(updated, entry.pokemonIndex);
    }
    return updated;
  }, [run, entries]);

  const evolvingEntries = useMemo(
    () => entries.filter((e) => e.evolves),
    [entries],
  );

  // If no one can level up, complete immediately
  useEffect(() => {
    if (entries.length === 0) {
      onComplete(run);
    }
  }, [entries, onComplete, run]);

  // Play sound on summary mount
  useEffect(() => {
    if (entries.length > 0) {
      playSound("raise_stat");
    }
  }, [entries]);

  const handleContinueFromSummary = () => {
    if (evolvingEntries.length > 0) {
      setScreenPhase("evolution");
    } else {
      onComplete(leveledUpRun);
    }
  };

  const handleEvolutionComplete = () => {
    onComplete(leveledUpRun);
  };

  if (entries.length === 0) {
    return null;
  }

  if (screenPhase === "summary") {
    return (
      <LevelUpSummary
        entries={entries}
        leveledUpRun={leveledUpRun}
        onContinue={handleContinueFromSummary}
      />
    );
  }

  return (
    <EvolutionSequence
      entries={evolvingEntries}
      onComplete={handleEvolutionComplete}
    />
  );
}

// ── Phase 1: Level-Up Summary ─────────────────────────────────────────

function LevelUpSummary({
  entries,
  leveledUpRun,
  onContinue,
}: {
  entries: LevelUpEntry[];
  leveledUpRun: RunState;
  onContinue: () => void;
}) {
  const [cardsModalEntryIndex, setCardsModalEntryIndex] = useState<
    number | null
  >(null);

  const modalEntry =
    cardsModalEntryIndex !== null
      ? entries.find((e) => e.pokemonIndex === cardsModalEntryIndex)
      : null;

  return (
    <ScreenShell
      ambient
      bodyStyle={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            ...THEME.heading,
            letterSpacing: "0.2em",
            color: THEME.accent,
            marginBottom: 8,
          }}
        >
          Level Up
        </div>
        <Flourish variant="heading" color={THEME.accent} />
      </div>

      {/* All leveled-up Pokemon */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
          width: "100%",
          maxWidth: 800,
          marginBottom: 32,
        }}
      >
        {entries.map((entry) => {
          const afterPokemon = leveledUpRun.party[entry.pokemonIndex];
          const oldData = getPokemon(entry.pokemon.formId);
          const spriteSize = Math.min(getSpriteSize(entry.pokemon.formId), 56);

          return (
            <div
              key={entry.pokemonIndex}
              className="levelup-card"
              style={{
                background: THEME.chrome.backdrop,
                borderRadius: 8,
                padding: 16,
                border: `1px solid ${THEME.border.subtle}`,
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                flex: "0 0 260px",
              }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    minWidth: 0,
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  {/* Sprite */}
                  <img
                    src={getSpriteUrl(entry.pokemon.formId)}
                    alt={oldData.name}
                    style={{
                      width: spriteSize,
                      height: spriteSize,
                      imageRendering: "pixelated",
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: "bold" }}>
                        {oldData.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: THEME.accent,
                          ...THEME.heading,
                          letterSpacing: "0.1em",
                        }}
                      >
                        Lv {entry.pokemon.level} → {afterPokemon.level}
                      </span>
                    </div>
                    <div>
                      {/* HP boost */}
                      {entry.nextRung.hpBoost > 0 && (
                        <div
                          style={{
                            fontSize: 12,
                            color: THEME.status.heal,
                            fontWeight: "bold",
                            marginTop: 2,
                          }}
                        >
                          +{entry.nextRung.hpBoost} Max HP
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* New passive */}
                {entry.nextRung.passiveId !== "none" && (
                  <div
                    style={{
                      padding: "6px 8px",
                      background: "#22c55e12",
                      borderRadius: 4,
                      border: "1px solid #22c55e30",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: "bold",
                        color: "#22c55e",
                      }}
                    >
                      {PASSIVE_DEFINITIONS[
                        entry.nextRung.passiveId as PassiveId
                      ]?.name ?? entry.nextRung.passiveId}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: THEME.text.secondary,
                        marginLeft: 6,
                      }}
                    >
                      {
                        PASSIVE_DEFINITIONS[
                          entry.nextRung.passiveId as PassiveId
                        ]?.description
                      }
                    </span>
                  </div>
                )}

                {/* New cards */}
                {entry.nextRung.cardsToAdd.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCardsModalEntryIndex(entry.pokemonIndex)}
                    style={{
                      ...THEME.button.secondary,
                      padding: "4px 10px",
                      fontSize: 12,
                      marginTop: 12,
                    }}
                  >
                    {entry.nextRung.cardsToAdd.length === 1
                      ? "1 new card"
                      : `${entry.nextRung.cardsToAdd.length} new cards`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        style={{
          padding: "14px 32px",
          fontSize: 16,
          marginBottom: 32,
          ...THEME.button.primary,
        }}
      >
        Continue
      </button>

      {/* New cards modal */}
      {modalEntry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setCardsModalEntryIndex(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: THEME.bg.panel,
              borderRadius: 10,
              border: `1.5px solid ${THEME.border.medium}`,
              padding: 20,
              maxWidth: 700,
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: THEME.accent,
                }}
              >
                New cards
              </div>
              <button
                onClick={() => setCardsModalEntryIndex(null)}
                style={{
                  ...THEME.button.secondary,
                  padding: "4px 12px",
                  fontSize: 15,
                }}
              >
                Close
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {modalEntry.nextRung.cardsToAdd.map((cardId) => {
                const card = getMove(cardId);
                return card ? (
                  <CardPreview
                    key={cardId}
                    card={card}
                    showHoverEffect={false}
                  />
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .levelup-card {
          animation: levelupCardIn 0.3s ease-out both;
        }
        .levelup-card:nth-child(2) { animation-delay: 0.1s; }
        .levelup-card:nth-child(3) { animation-delay: 0.2s; }
        .levelup-card:nth-child(4) { animation-delay: 0.3s; }
        @keyframes levelupCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ScreenShell>
  );
}

// ── Phase 2: Evolution Sequence ───────────────────────────────────────

function EvolutionSequence({
  entries,
  onComplete,
}: {
  entries: LevelUpEntry[];
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<EvolutionPhase>("intro");
  const [allDone, setAllDone] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<
    {
      id: number;
      left: number;
      delay: number;
      duration: number;
      color: string;
    }[]
  >([]);
  const [cardsModalEntryIndex, setCardsModalEntryIndex] = useState<
    number | null
  >(null);
  const hasPlayedReveal = useRef(false);

  // Phase timing - auto-advances through all animations (all Pokemon in lockstep)
  useEffect(() => {
    if (allDone) return;
    const timers: number[] = [];

    if (phase === "intro") {
      timers.push(window.setTimeout(() => setPhase("silhouette"), 1200));
    } else if (phase === "silhouette") {
      timers.push(window.setTimeout(() => setPhase("morph"), 1000));
    } else if (phase === "morph") {
      timers.push(window.setTimeout(() => setPhase("reveal"), 2500));
    } else if (phase === "reveal") {
      if (!hasPlayedReveal.current) {
        hasPlayedReveal.current = true;
        playSound("win_battle");
        queueMicrotask(() => {
          setConfettiParticles(
            Array.from({ length: 40 }, (_, i) => ({
              id: i,
              left: Math.random() * 100,
              delay: Math.random() * 200,
              duration: 1500 + Math.random() * 1000,
              color:
                CONFETTI_COLORS[
                  Math.floor(Math.random() * CONFETTI_COLORS.length)
                ],
            })),
          );
        });
      }
      timers.push(window.setTimeout(() => setPhase("celebration"), 1000));
    } else if (phase === "celebration") {
      timers.push(
        window.setTimeout(() => {
          hasPlayedReveal.current = false;
          setConfettiParticles([]);
          setAllDone(true);
        }, 2000),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [phase, allDone]);

  // ── Congratulations screen after all evolutions ──
  if (allDone) {
    const congratsModalEntry =
      cardsModalEntryIndex !== null
        ? entries.find((e) => e.pokemonIndex === cardsModalEntryIndex)
        : null;

    return (
      <ScreenShell
        ambient
        bodyStyle={{
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              ...THEME.heading,
              letterSpacing: "0.2em",
              color: THEME.accent,
              marginBottom: 8,
            }}
          >
            Congratulations
          </div>
          <Flourish variant="heading" color={THEME.accent} />
        </div>

        {/* Evolved Pokemon cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
            width: "100%",
            maxWidth: 800,
            marginBottom: 32,
          }}
        >
          {entries.map((e) => {
            const oFormId = e.pokemon.formId;
            const nFormId = e.nextRung.evolvesTo ?? e.pokemon.formId;
            const oData = getPokemon(oFormId);
            const nData = getPokemon(nFormId);
            const size = Math.min(getSpriteSize(nFormId), 64);

            return (
              <div
                key={e.pokemonIndex}
                className="evo-congrats-card"
                style={{
                  background: THEME.chrome.backdrop,
                  borderRadius: 8,
                  padding: 16,
                  border: `1px solid ${THEME.border.subtle}`,
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  flex: "0 0 260px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      minWidth: 0,
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <img
                      src={getSpriteUrl(nFormId)}
                      alt={nData.name}
                      style={{
                        width: size,
                        height: size,
                        imageRendering: "pixelated",
                        objectFit: "contain",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                      }}
                    >
                      {oData.name} evolved into{" "}
                      <span style={{ color: THEME.accent }}>{nData.name}</span>!
                    </div>
                  </div>

                  {e.nextRung.passiveId !== "none" && (
                    <div
                      style={{
                        padding: "8px",
                        background: "#22c55e12",
                        borderRadius: 4,
                        border: "1px solid #22c55e30",
                        marginBottom: 12,
                        lineHeight: 1,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: "bold",
                          color: "#22c55e",
                        }}
                      >
                        {
                          PASSIVE_DEFINITIONS[e.nextRung.passiveId as PassiveId]
                            ?.name
                        }
                      </p>
                      <span
                        style={{
                          fontSize: 11,
                          color: THEME.text.secondary,
                        }}
                      >
                        {
                          PASSIVE_DEFINITIONS[e.nextRung.passiveId as PassiveId]
                            ?.description
                        }
                      </span>
                    </div>
                  )}

                  {e.nextRung.cardsToAdd.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCardsModalEntryIndex(e.pokemonIndex)}
                      style={{
                        ...THEME.button.secondary,
                        padding: "4px 10px",
                        fontSize: 12,
                      }}
                    >
                      {e.nextRung.cardsToAdd.length === 1
                        ? "1 new card"
                        : `${e.nextRung.cardsToAdd.length} new cards`}
                    </button>
                  )}

                  {e.nextRung.hpBoost > 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: THEME.status.heal,
                        fontWeight: "bold",
                      }}
                    >
                      +{e.nextRung.hpBoost} Max HP
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onComplete}
          style={{
            padding: "14px 32px",
            fontSize: 16,
            marginBottom: 32,
            ...THEME.button.primary,
          }}
        >
          Continue
        </button>

        {/* New cards modal */}
        {congratsModalEntry && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              zIndex: 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
            onClick={() => setCardsModalEntryIndex(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: THEME.bg.panel,
                borderRadius: 10,
                border: `1.5px solid ${THEME.border.medium}`,
                padding: 20,
                maxWidth: 700,
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: THEME.accent,
                  }}
                >
                  New cards
                </div>
                <button
                  onClick={() => setCardsModalEntryIndex(null)}
                  style={{
                    ...THEME.button.secondary,
                    padding: "4px 12px",
                    fontSize: 15,
                  }}
                >
                  Close
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {congratsModalEntry.nextRung.cardsToAdd.map((cardId) => {
                  const card = getMove(cardId);
                  return card ? (
                    <CardPreview
                      key={cardId}
                      card={card}
                      showHoverEffect={false}
                    />
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}

        <style>{`
          .evo-congrats-card {
            animation: levelupCardIn 0.3s ease-out both;
          }
          .evo-congrats-card:nth-child(2) { animation-delay: 0.1s; }
          .evo-congrats-card:nth-child(3) { animation-delay: 0.15s; }
          .evo-congrats-card:nth-child(4) { animation-delay: 0.2s; }
          @keyframes levelupCardIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </ScreenShell>
    );
  }

  // ── Animation screen for current evolution ──
  const showOld =
    phase === "intro" || phase === "silhouette" || phase === "morph";
  const showNew =
    phase === "morph" || phase === "reveal" || phase === "celebration";
  const isSilhouette = phase === "silhouette" || phase === "morph";
  const isMorphing = phase === "morph";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        color: THEME.text.primary,
        padding: "24px",
        position: "relative",
      }}
    >
      <AmbientBackground />

      {/* Confetti */}
      {confettiParticles.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.left}%`,
                top: "50%",
                width: 8,
                height: 8,
                backgroundColor: p.color,
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                animation: `confettiBurst ${p.duration}ms ease-out ${p.delay}ms forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Sprite area - row of up to 4 Pokemon evolving simultaneously */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 32,
          }}
        >
          {entries.map((e) => {
            const oldFormId = e.pokemon.formId;
            const newFormId = e.nextRung.evolvesTo ?? e.pokemon.formId;
            const oldData = getPokemon(oldFormId);
            const newData = getPokemon(newFormId);
            const spriteSize = Math.min(
              Math.max(getSpriteSize(oldFormId), getSpriteSize(newFormId)),
              entries.length > 2 ? 100 : 140,
            );
            return (
              <div
                key={e.pokemonIndex}
                style={{
                  position: "relative",
                  width: spriteSize + 40,
                  height: spriteSize + 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showOld && (
                  <div
                    className={isMorphing ? "evolution-morph" : ""}
                    style={{
                      position: isMorphing ? "absolute" : "relative",
                      filter: isSilhouette ? "brightness(0)" : "none",
                      opacity: isMorphing ? 0.3 : 1,
                      transition:
                        phase === "silhouette"
                          ? "filter 0.8s ease-out"
                          : isMorphing
                            ? "opacity 1s ease-out"
                            : "none",
                    }}
                  >
                    <img
                      src={getSpriteUrl(oldFormId)}
                      alt={oldData.name}
                      style={{
                        width: spriteSize,
                        height: spriteSize,
                        imageRendering: "pixelated",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}

                {showNew && (
                  <div
                    className={`${isMorphing ? "evolution-morph evolution-morph-new" : ""} ${phase === "reveal" ? "evolution-reveal" : ""}`}
                    style={{
                      position: isMorphing ? "absolute" : "relative",
                      filter: isMorphing ? "brightness(0)" : undefined,
                      opacity: isMorphing ? 0.7 : 1,
                      transition: isMorphing ? "opacity 0.8s ease-in" : "none",
                    }}
                  >
                    <img
                      src={getSpriteUrl(newFormId)}
                      alt={newData.name}
                      style={{
                        width: spriteSize,
                        height: spriteSize,
                        imageRendering: "pixelated",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Text */}
        <div style={{ textAlign: "center", minHeight: 48 }}>
          {phase === "intro" && (
            <div
              className="evolution-pulse"
              style={{ fontSize: 18, fontWeight: "bold", color: THEME.accent }}
            >
              {entries.length === 1
                ? `${getPokemon(entries[0].pokemon.formId).name} is evolving!`
                : "Your Pokemon are evolving!"}
            </div>
          )}
          {(phase === "silhouette" || phase === "morph") && (
            <div style={{ fontSize: 14, color: THEME.text.tertiary }}>...</div>
          )}
          {phase === "celebration" && (
            <div
              style={{
                fontSize: entries.length === 1 ? 16 : 14,
                color: THEME.text.secondary,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              {entries.map((e) => {
                const oData = getPokemon(e.pokemon.formId);
                const nData = getPokemon(
                  e.nextRung.evolvesTo ?? e.pokemon.formId,
                );
                return (
                  <div key={e.pokemonIndex}>
                    {oData.name} evolved into{" "}
                    <strong style={{ color: THEME.accent }}>
                      {nData.name}
                    </strong>
                    !
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes confettiBurst {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          20% { opacity: 1; transform: translateY(-80px) rotate(180deg) scale(1.2); }
          100% { opacity: 0; transform: translateY(300px) rotate(720deg) scale(0.5); }
        }
        .evolution-pulse {
          animation: evolutionPulse 0.8s ease-in-out infinite;
        }
        @keyframes evolutionPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .evolution-morph {
          animation: evolutionMorph 0.4s ease-in-out infinite;
        }
        .evolution-morph-new {
          animation-delay: 0.2s;
        }
        @keyframes evolutionMorph {
          0%, 100% { transform: scale(0.85); }
          50% { transform: scale(1.15); }
        }
        .evolution-reveal {
          animation: evolutionReveal 0.8s ease-in forwards;
        }
        @keyframes evolutionReveal {
          from { filter: brightness(0); }
          to { filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}
