import { useState } from 'react';
import type { RunState, MapNode } from '../../run/types';
import { getPokemon } from '../../data/loaders';
import { canPokemonLevelUp, getAvailableNextNodes, EXP_PER_LEVEL } from '../../run/state';
import { getNodesAtStage, getMaxStage } from '../../run/nodes';
import { ProgressionPanel } from '../components/ProgressionPanel';
import { getSpriteSize } from '../../data/heights';

interface Props {
  run: RunState;
  onSelectNode: (nodeId: string) => void;
  onLevelUp: (pokemonIndex: number) => void;
}

function getNodeIcon(node: MapNode): string {
  if (node.type === 'spawn') return 'S';
  if (node.type === 'rest') return 'R';
  if (node.type === 'battle') {
    // Show skull for boss, crossed swords for regular battle
    if (node.stage === 8) return '☠';
    return '⚔';
  }
  return '?';
}

function getNodeColor(node: MapNode, isAvailable: boolean, isVisited: boolean, isCurrent: boolean): string {
  if (isCurrent) return '#facc15';
  if (isVisited) return '#22c55e';
  if (isAvailable) return '#60a5fa';
  // Battle nodes get a red tint when not yet available
  if (node.type === 'battle') return '#666';
  return '#444';
}

function getNodeLabel(node: MapNode): string {
  if (node.type === 'spawn') return 'Start';
  if (node.type === 'rest') return 'Rest: Heal or +HP';
  if (node.type === 'battle') {
    const enemyNames = node.enemies.map(id =>
      id.charAt(0).toUpperCase() + id.slice(1)
    ).join(', ');
    if (node.stage === 8) return `BOSS: ${enemyNames}`;
    return `Battle: ${enemyNames}`;
  }
  return '???';
}

export function MapScreen({ run, onSelectNode, onLevelUp }: Props) {
  const [selectedPokemonIndex, setSelectedPokemonIndex] = useState<number | null>(null);

  const availableNodes = getAvailableNextNodes(run);
  const availableNodeIds = new Set(availableNodes.map(n => n.id));
  const visitedNodeIds = new Set(run.visitedNodeIds);
  const maxStage = getMaxStage(run.nodes);

  const handleNodeClick = (node: MapNode) => {
    if (availableNodeIds.has(node.id)) {
      onSelectNode(node.id);
    }
  };

  const handlePokemonClick = (index: number) => {
    const pokemon = run.party[index];
    if (pokemon.currentHp > 0) {
      setSelectedPokemonIndex(index);
    }
  };

  const handleClosePanel = () => {
    setSelectedPokemonIndex(null);
  };

  const handleLevelUp = (pokemonIndex: number) => {
    onLevelUp(pokemonIndex);
  };

  // Group nodes by stage for rendering
  const nodesByStage: MapNode[][] = [];
  for (let stage = 0; stage <= maxStage; stage++) {
    nodesByStage.push(getNodesAtStage(run.nodes, stage));
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      padding: 32,
      color: '#e2e8f0',
      minHeight: '100vh',
      background: '#0f0f17',
    }}>
      <h1 style={{ fontSize: 30, margin: 0, color: '#facc15' }}>
        Act 1 - Map
      </h1>

      {/* Party Status */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 16,
        padding: 16,
        background: '#1e1e2e',
        borderRadius: 12,
        border: '1px solid #333',
      }}>
        {run.party.map((pokemon, i) => {
          const basePokemon = getPokemon(pokemon.formId);
          const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;
          const isDead = pokemon.currentHp <= 0;
          const canLevel = canPokemonLevelUp(pokemon);

          return (
            <div
              key={i}
              onClick={() => handlePokemonClick(i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                opacity: isDead ? 0.4 : 1,
                cursor: isDead ? 'default' : 'pointer',
                padding: 8,
                borderRadius: 8,
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* Level-up badge */}
              {canLevel && !isDead && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#facc15',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 15,
                  animation: 'pulse 1s infinite',
                }}>
                  !
                </div>
              )}

              <img
                src={`https://img.pokemondb.net/sprites/black-white/anim/normal/${pokemon.formId}.gif`}
                alt={basePokemon.name}
                style={{
                  width: getSpriteSize(pokemon.formId) * 0.7,
                  height: getSpriteSize(pokemon.formId) * 0.7,
                  imageRendering: 'pixelated',
                  objectFit: 'contain',
                  filter: isDead ? 'grayscale(100%)' : 'none',
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 'bold' }}>{basePokemon.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Lv.{pokemon.level} | {pokemon.exp}/{EXP_PER_LEVEL} EXP
              </div>
              <div style={{
                width: 60,
                height: 6,
                background: '#333',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#eab308' : '#ef4444',
                  borderRadius: 3,
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {pokemon.currentHp}/{pokemon.maxHp}
              </div>
            </div>
          );
        })}
      </div>

      {/* Branching Map */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: 24,
        background: '#1a1a24',
        borderRadius: 16,
        border: '1px solid #333',
        overflowX: 'auto',
        maxWidth: '100%',
      }}>
        {nodesByStage.map((stageNodes, stageIndex) => (
          <div key={stageIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Stage column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              minHeight: 200,
              justifyContent: 'center',
            }}>
              {stageNodes.map(node => {
                const isCurrent = node.id === run.currentNodeId;
                const isVisited = visitedNodeIds.has(node.id);
                const isAvailable = availableNodeIds.has(node.id);
                const nodeColor = getNodeColor(node, isAvailable, isVisited, isCurrent);

                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: isCurrent || isVisited ? nodeColor : '#2a2a3a',
                      border: `3px solid ${nodeColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isAvailable ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      boxShadow: isAvailable ? `0 0 12px ${nodeColor}66` : 'none',
                      transform: isAvailable ? 'scale(1.1)' : 'scale(1)',
                    }}
                    title={`${getNodeLabel(node)}${isCurrent ? ' (Current)' : ''}${isAvailable ? ' (Click to move)' : ''}`}
                  >
                    <span style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: isCurrent || isVisited ? '#000' : nodeColor,
                    }}>
                      {getNodeIcon(node)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stage label */}
            <div style={{
              marginTop: 8,
              fontSize: 11,
              color: '#64748b',
            }}>
              {stageIndex === 0 ? 'Start' : stageIndex === maxStage ? 'Boss' : `Stage ${stageIndex}`}
            </div>

            {/* Connection lines to next stage */}
            {stageIndex < maxStage && (
              <div style={{
                position: 'absolute',
                left: `calc(${stageIndex} * 66px + 57px)`,
                width: 20,
                height: 200,
                pointerEvents: 'none',
              }}>
                {/* Lines are drawn via SVG in a separate layer */}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 24,
        fontSize: 13,
        color: '#94a3b8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#facc15' }} />
          <span>Current</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#22c55e' }} />
          <span>Visited</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #60a5fa', background: 'transparent' }} />
          <span>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>S = Start</span>
          <span>R = Rest</span>
          <span>B = Boss</span>
        </div>
      </div>

      {/* Instructions */}
      {availableNodes.length > 0 && (
        <div style={{
          padding: '12px 24px',
          background: '#60a5fa22',
          border: '1px solid #60a5fa',
          borderRadius: 8,
          color: '#60a5fa',
          fontSize: 14,
        }}>
          Click a glowing node to continue your journey
        </div>
      )}

      {/* Progression Panel */}
      {selectedPokemonIndex !== null && (
        <ProgressionPanel
          pokemon={run.party[selectedPokemonIndex]}
          pokemonIndex={selectedPokemonIndex}
          partySize={run.party.length}
          onClose={handleClosePanel}
          onLevelUp={handleLevelUp}
          onNavigate={setSelectedPokemonIndex}
        />
      )}

      {/* Pulse animation for level-up badge */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
