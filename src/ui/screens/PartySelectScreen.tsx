import { useState } from 'react';
import type { PokemonData, Position, Row, Column } from '../../engine/types';
import { STARTER_POKEMON } from '../../data/loaders';

interface Props {
  onStart: (party: PokemonData[], positions: Position[]) => void;
}

const starters = Object.values(STARTER_POKEMON);

type Phase = 'select' | 'position';

// Grid slot: row + column
type SlotKey = `${Row}-${Column}`;

export function PartySelectScreen({ onStart }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Map from slot key to pokemon id
  const [formation, setFormation] = useState<Map<SlotKey, string>>(new Map());
  // Pokemon waiting to be placed
  const [unplacedPokemon, setUnplacedPokemon] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const party = starters.filter(s => selected.has(s.id));

  const goToPositioning = () => {
    // Initialize with selected Pokemon as unplaced
    setUnplacedPokemon([...selected]);
    setFormation(new Map());
    setPhase('position');
  };

  const goBackToSelect = () => {
    setPhase('select');
    setFormation(new Map());
    setUnplacedPokemon([]);
  };

  const handleSlotClick = (row: Row, col: Column) => {
    const key: SlotKey = `${row}-${col}`;
    const currentPokemon = formation.get(key);

    if (currentPokemon) {
      // Remove pokemon from slot, add back to unplaced
      setFormation(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      setUnplacedPokemon(prev => [...prev, currentPokemon]);
    } else if (unplacedPokemon.length > 0) {
      // Place first unplaced pokemon in this slot
      const pokemonToPlace = unplacedPokemon[0];
      setFormation(prev => {
        const next = new Map(prev);
        next.set(key, pokemonToPlace);
        return next;
      });
      setUnplacedPokemon(prev => prev.slice(1));
    }
  };

  const handleUnplacedClick = (pokemonId: string) => {
    // Find first empty slot and place there
    const slots: SlotKey[] = ['front-0', 'front-1', 'front-2', 'back-0', 'back-1', 'back-2'];
    for (const slot of slots) {
      if (!formation.has(slot)) {
        setFormation(prev => {
          const next = new Map(prev);
          next.set(slot, pokemonId);
          return next;
        });
        setUnplacedPokemon(prev => prev.filter(id => id !== pokemonId));
        return;
      }
    }
  };

  const startBattle = () => {
    // Build party array and positions array in matching order
    const partyList: PokemonData[] = [];
    const positions: Position[] = [];

    formation.forEach((pokemonId, slotKey) => {
      const [row, colStr] = slotKey.split('-') as [Row, string];
      const col = parseInt(colStr) as Column;
      const pokemon = starters.find(p => p.id === pokemonId);
      if (pokemon) {
        partyList.push(pokemon);
        positions.push({ row, column: col });
      }
    });

    onStart(partyList, positions);
  };

  const allPlaced = unplacedPokemon.length === 0 && formation.size > 0;

  const getPokemonInSlot = (row: Row, col: Column): PokemonData | null => {
    const key: SlotKey = `${row}-${col}`;
    const id = formation.get(key);
    if (!id) return null;
    return starters.find(p => p.id === id) || null;
  };

  // Selection phase
  if (phase === 'select') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: 32,
        color: '#e2e8f0',
      }}>
        <h1 style={{ fontSize: 30, margin: 0, color: '#facc15' }}>
          Choose Your Party
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>
          Select 1-4 Pokemon for battle
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {starters.map(pokemon => {
            const isSelected = selected.has(pokemon.id);
            return (
              <div
                key={pokemon.id}
                onClick={() => toggle(pokemon.id)}
                style={{
                  width: 160,
                  padding: 16,
                  borderRadius: 12,
                  border: isSelected ? '3px solid #facc15' : '3px solid #333',
                  background: isSelected ? '#2d2d3f' : '#1e1e2e',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <img
                  src={`https://img.pokemondb.net/sprites/black-white/anim/normal/${pokemon.id}.gif`}
                  alt={pokemon.name}
                  style={{ width: 80, height: 80, imageRendering: 'pixelated', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ fontSize: 17, fontWeight: 'bold', marginTop: 8 }}>
                  {pokemon.name}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  HP: {pokemon.maxHp} | SPD: {pokemon.baseSpeed}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={goToPositioning}
          disabled={party.length === 0}
          style={{
            padding: '12px 32px',
            fontSize: 17,
            fontWeight: 'bold',
            borderRadius: 8,
            border: 'none',
            background: party.length > 0 ? '#facc15' : '#333',
            color: party.length > 0 ? '#000' : '#666',
            cursor: party.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Set Formation ({party.length} selected)
        </button>
      </div>
    );
  }

  // Positioning phase
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      padding: 32,
      color: '#e2e8f0',
    }}>
      <h1 style={{ fontSize: 30, margin: 0, color: '#facc15' }}>
        Set Formation
      </h1>
      <p style={{ color: '#94a3b8', margin: 0 }}>
        Click slots to place your Pokemon (Back row is protected by Front row)
      </p>

      {/* Formation Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Back row label */}
        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', textTransform: 'uppercase' }}>
          Back Row (Protected)
        </div>
        {/* Back row */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {([0, 1, 2] as Column[]).map(col => {
            const pokemon = getPokemonInSlot('back', col);
            return (
              <FormationSlot
                key={`back-${col}`}
                pokemon={pokemon}
                onClick={() => handleSlotClick('back', col)}
                isEmpty={!pokemon}
                canPlace={unplacedPokemon.length > 0}
              />
            );
          })}
        </div>

        {/* Front row label */}
        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', textTransform: 'uppercase', marginTop: 8 }}>
          Front Row (Exposed)
        </div>
        {/* Front row */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {([0, 1, 2] as Column[]).map(col => {
            const pokemon = getPokemonInSlot('front', col);
            return (
              <FormationSlot
                key={`front-${col}`}
                pokemon={pokemon}
                onClick={() => handleSlotClick('front', col)}
                isEmpty={!pokemon}
                canPlace={unplacedPokemon.length > 0}
              />
            );
          })}
        </div>
      </div>

      {/* Unplaced Pokemon */}
      {unplacedPokemon.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 15, color: '#94a3b8', marginBottom: 8, textAlign: 'center' }}>
            Click to place:
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {unplacedPokemon.map(id => {
              const pokemon = starters.find(p => p.id === id);
              if (!pokemon) return null;
              return (
                <div
                  key={id}
                  onClick={() => handleUnplacedClick(id)}
                  style={{
                    padding: 8,
                    background: '#2d2d3f',
                    border: '2px solid #facc15',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={`https://img.pokemondb.net/sprites/black-white/anim/normal/${pokemon.id}.gif`}
                    alt={pokemon.name}
                    style={{ width: 50, height: 50, imageRendering: 'pixelated', objectFit: 'contain' }}
                  />
                  <div style={{ fontSize: 13, fontWeight: 'bold' }}>{pokemon.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <button
          onClick={goBackToSelect}
          style={{
            padding: '12px 24px',
            fontSize: 15,
            fontWeight: 'bold',
            borderRadius: 8,
            border: '2px solid #555',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          Back
        </button>
        <button
          onClick={startBattle}
          disabled={!allPlaced}
          style={{
            padding: '12px 32px',
            fontSize: 17,
            fontWeight: 'bold',
            borderRadius: 8,
            border: 'none',
            background: allPlaced ? '#facc15' : '#333',
            color: allPlaced ? '#000' : '#666',
            cursor: allPlaced ? 'pointer' : 'not-allowed',
          }}
        >
          Start Battle
        </button>
      </div>
    </div>
  );
}

function FormationSlot({
  pokemon,
  onClick,
  isEmpty,
  canPlace,
}: {
  pokemon: PokemonData | null;
  onClick: () => void;
  isEmpty: boolean;
  canPlace: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 100,
        height: 120,
        border: isEmpty
          ? canPlace ? '2px dashed #facc15' : '2px dashed #444'
          : '2px solid #facc15',
        borderRadius: 8,
        background: isEmpty ? '#1a1a24' : '#2d2d3f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: (isEmpty && canPlace) || !isEmpty ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
    >
      {pokemon ? (
        <>
          <img
            src={`https://img.pokemondb.net/sprites/black-white/anim/normal/${pokemon.id}.gif`}
            alt={pokemon.name}
            style={{ width: 60, height: 60, imageRendering: 'pixelated', objectFit: 'contain' }}
          />
          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}>
            {pokemon.name}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 26, color: canPlace ? '#facc15' : '#444' }}>+</div>
      )}
    </div>
  );
}
