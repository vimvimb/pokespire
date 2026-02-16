import { useState } from "react";
import type { PokemonData } from "../../engine/types";
import { getPokemon } from "../../data/loaders";
import {
  TUTORIAL_STARTER_IDS,
  type TutorialStarterId,
} from "../../data/tutorial";
import { ScreenShell } from "../components/ScreenShell";
import { PokemonTile } from "../components/PokemonTile";
import { THEME } from "../theme";
import { getSpriteUrl } from "../utils/sprites";

interface Props {
  onStart: (starter: PokemonData) => void;
  onSkip: () => void;
}

const TUTORIAL_STARTERS: PokemonData[] = TUTORIAL_STARTER_IDS.map((id) =>
  getPokemon(id),
);

export function TutorialStarterScreen({ onStart, onSkip }: Props) {
  const [selected, setSelected] = useState<TutorialStarterId | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    const pokemon = getPokemon(selected);
    onStart(pokemon);
  };

  return (
    <ScreenShell
      ambient
      header={
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
            onClick={onSkip}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: "none",
              color: THEME.text.tertiary,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Skip Tutorial
          </button>
          <span
            style={{
              color: THEME.text.secondary,
              fontWeight: "bold",
              fontSize: 16,
              letterSpacing: "0.08em",
            }}
          >
            Choose Your Starter
          </span>
          <div style={{ width: 90 }} />
        </div>
      }
      bodyStyle={{ padding: "24px 16px 48px" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          maxWidth: 750,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            color: THEME.text.secondary,
            fontSize: 15,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Pick one Pokémon for a quick practice battle. You&apos;ll learn the
          basics, then start your real adventure.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {TUTORIAL_STARTERS.map((poke) => (
            <div key={poke.id}>
              <PokemonTile
                name={poke.name}
                spriteUrl={getSpriteUrl(poke.id)}
                primaryType={poke.types[0]}
                secondaryType={poke.types[1]}
                size="large"
                isSelected={selected === poke.id}
                onClick={() => setSelected(poke.id as TutorialStarterId)}
                stats={`HP: ${poke.maxHp} | SPD: ${poke.baseSpeed}`}
              />
              {poke.description && (
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: THEME.text.tertiary,
                    fontStyle: "italic",
                    textAlign: "center",
                    maxWidth: 150,
                    lineHeight: 1.3,
                  }}
                >
                  {poke.description}
                </p>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            maxWidth: 280,
          }}
        >
          <button
            onClick={handleConfirm}
            disabled={!selected}
            style={{
              padding: "12px 24px",
              fontSize: 16,
              fontWeight: "bold",
              border: "none",
              borderRadius: 8,
              background: selected ? THEME.accent : THEME.bg.elevated,
              color: selected ? THEME.bg.base : THEME.text.tertiary,
              cursor: selected ? "pointer" : "not-allowed",
            }}
          >
            Start Practice Battle
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
