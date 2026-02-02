import { useState, useEffect } from 'react';
import { IntroScreen } from './ui/screens/IntroScreen';
import { PlayerSetupScreen } from './ui/screens/PlayerSetupScreen';
import { StarterSelectionScreen } from './ui/screens/StarterSelectionScreen';
import { MapScreen } from './ui/screens/MapScreen';
import { CombatScreen } from './ui/screens/CombatScreen';
import { VictoryScreen } from './ui/screens/VictoryScreen';
import { DefeatScreen } from './ui/screens/DefeatScreen';
import { useGameState } from './ui/hooks/useGameState';
import type { PokemonId } from './config/pokemon';
import './App.css';

function App() {
  const gameState = useGameState();
  const [screen, setScreen] = useState<'intro' | 'playerSetup' | 'starterSelection' | 'game'>(() => {
    // If there's a saved game, start in game mode
    if (gameState.gameState.screen === 'map' || gameState.gameState.screen === 'combat' || 
        gameState.gameState.screen === 'victory' || gameState.gameState.screen === 'defeat') {
      return 'game';
    }
    return 'intro';
  });
  const [players, setPlayers] = useState<Array<{ id: string; name: string }>>([]);

  // Check if there's a saved game
  const hasSavedGame = gameState.gameState.screen !== 'intro' && 
    (gameState.gameState.campaign !== undefined || gameState.gameState.battle !== undefined);

  const handleStart = () => {
    // If there's a saved game, resume it
    if (hasSavedGame) {
      setScreen('game');
    } else {
      setScreen('playerSetup');
    }
  };

  const handleReset = () => {
    gameState.handleResetGame();
    setScreen('intro');
    setPlayers([]);
  };

  const handlePlayerSetupContinue = (setupPlayers: Array<{ id: string; name: string }>) => {
    setPlayers(setupPlayers);
    setScreen('starterSelection');
  };

  const handleStarterSelection = (selections: Record<string, PokemonId>) => {
    const playersWithPokemon = players.map(p => ({
      id: p.id,
      name: p.name,
      pokemonId: selections[p.id],
    }));
    gameState.handleStartCampaign(playersWithPokemon);
    setScreen('game');
  };

  const handleBack = () => {
    if (screen === 'playerSetup') {
      setScreen('intro');
    } else if (screen === 'starterSelection') {
      setScreen('playerSetup');
    }
  };

  if (screen === 'intro') {
    return (
      <IntroScreen
        onStart={handleStart}
        onReset={handleReset}
        hasSavedGame={hasSavedGame}
      />
    );
  }

  if (screen === 'playerSetup') {
    return (
      <PlayerSetupScreen
        onContinue={handlePlayerSetupContinue}
        onBack={handleBack}
      />
    );
  }

  if (screen === 'starterSelection') {
    return (
      <StarterSelectionScreen
        players={players}
        onStart={handleStarterSelection}
        onBack={handleBack}
      />
    );
  }

  // Game screens
  if (screen === 'game') {
    const { gameState: state } = gameState;

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/052177c7-b559-47bb-b50f-ee17a791e993',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:97',message:'App render - game screen routing',data:{screen:state.screen,hasBattle:!!state.battle,hasCampaign:!!state.campaign,battleResult:state.battle?.result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    if (state.screen === 'map' && state.campaign) {
      return (
        <MapScreen
          campaignState={state.campaign}
          onNodeClick={gameState.handleNodeClick}
        />
      );
    }

    if (state.screen === 'combat' && state.battle) {
      return (
        <CombatScreen
          battleState={state.battle}
          onAction={gameState.handleBattleAction}
          onBattleEnd={gameState.handleBattleEnd}
        />
      );
    }

    if (state.screen === 'combat' && !state.battle) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/052177c7-b559-47bb-b50f-ee17a791e993',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:115',message:'CRITICAL: combat screen but no battle state',data:{screen:state.screen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return <div style={{padding:'20px',color:'white'}}>Error: Combat screen but no battle state</div>;
    }

    if (state.screen === 'victory') {
      return (
        <VictoryScreen
          isFinalVictory={state.isFinalVictory || false}
          evolutions={state.evolutions}
          onContinue={gameState.handleContinueFromVictory}
        />
      );
    }

    if (state.screen === 'defeat') {
      return <DefeatScreen onReturnToMenu={gameState.handleReturnToMenu} />;
    }
  }

  return <div>Unknown screen state</div>;
}

export default App;
