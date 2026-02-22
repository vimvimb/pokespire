import {
  useState,
  useCallback,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react";
import type { PokemonData, Position, Combatant } from "./engine/types";
import { useBattle } from "./ui/hooks/useBattle";
import { useTutorial } from "./ui/hooks/useTutorial";
import { PartySelectScreen } from "./ui/screens/PartySelectScreen";
import { CampaignDraftScreen } from "./ui/screens/CampaignDraftScreen";
import { CampaignSelectScreen } from "./ui/screens/CampaignSelectScreen";
import { TutorialStarterScreen } from "./ui/screens/TutorialStarterScreen";
import { BattleScreen } from "./ui/screens/BattleScreen";
import type { BattleResult } from "./ui/screens/BattleScreen";
import { MapScreen } from "./ui/screens/MapScreen";
import { RestScreen } from "./ui/screens/RestScreen";
import { EventScreen } from "./ui/screens/EventScreen";
import { RecruitScreen } from "./ui/screens/RecruitScreen";
import { CardDraftScreen } from "./ui/screens/CardDraftScreen";
import { LevelUpScreen } from "./ui/screens/LevelUpScreen";
import { RunVictoryScreen } from "./ui/screens/RunVictoryScreen";
import type { SandboxPokemon } from "./ui/screens/SandboxConfigScreen";
import { ActTransitionScreen } from "./ui/screens/ActTransitionScreen";
import { CardRemovalScreen } from "./ui/screens/CardRemovalScreen";
import { Flourish } from "./ui/components/Flourish";
import { AmbientBackground } from "./ui/components/AmbientBackground";
import { playSound } from "./ui/utils/sound";
import { playMusic, getMusicForScreen } from "./ui/utils/music";
import { ScreenShell } from "./ui/components/ScreenShell";
import { DexFrame } from "./ui/components/DexFrame";
import { THEME } from "./ui/theme";
const CardDexScreen = lazy(() =>
  import("./ui/screens/CardDexScreen").then((m) => ({
    default: m.CardDexScreen,
  })),
);
const PokeDexScreen = lazy(() =>
  import("./ui/screens/PokeDexScreen").then((m) => ({
    default: m.PokeDexScreen,
  })),
);
const SandboxConfigScreen = lazy(() =>
  import("./ui/screens/SandboxConfigScreen").then((m) => ({
    default: m.SandboxConfigScreen,
  })),
);
const EventTesterScreen = lazy(() =>
  import("./ui/screens/EventTesterScreen").then((m) => ({
    default: m.EventTesterScreen,
  })),
);
const ClassesPlanScreen = lazy(() =>
  import("./ui/screens/ClassesPlanScreen").then((m) => ({
    default: m.ClassesPlanScreen,
  })),
);
import { GhostReviveScreen } from "./ui/screens/GhostReviveScreen";
import type {
  RunState,
  RunPokemon,
  BattleNode,
  EventNode,
  RecruitNode,
} from "./run/types";
import { getCurrentCombatant } from "./engine/combat";
import { getPokemon } from "./data/loaders";
import {
  isTutorialComplete,
  setTutorialComplete,
  resetTutorial,
} from "./ui/utils/tutorialPersistence";
import {
  unlockPokemon,
  resetProfile,
  recordCampaignComplete,
  resetCampaignProgress,
  unlockAllCampaignsDebug,
} from "./run/playerProfile";
import { SHOP_ITEMS, CARD_FORGET_COST } from "./data/shop";
import {
  createRunState,
  createAct1BossTestState,
  createAct2TestState,
  createAct3TestState,
  createAct2BossTestState,
  createAct3BossTestState,
  createLevelUpTestState,
  createEvolutionTestState,
  createEvolutionLargePartyTestState,
  createCampaign2Act1TestState,
  createCampaign2Act1BossTestState,
  createCampaign2Act2TestState,
  createCampaign2Act2GoldBossTestState,
  createCampaign2Act2SilverBossTestState,
  createCampaign2Act3ATestState,
  createCampaign2Act3ABossTestState,
  createCampaign2Act3BTestState,
  createCampaign2Act3BBossTestState,
  createCampaign2Act3ABeforeDogsTestState,
  createCampaign2Act3BBeforeDogsTestState,
  createCampaign2GoldTransitionTestState,
  createCampaign2SilverTransitionTestState,
  applyPartyPercentHeal,
  applyFullHealAll,
  addCardToDeck,
  syncBattleResults,
  moveKnockedOutToGraveyard,
  moveToNode,
  isRunComplete,
  getCurrentNode,
  applyLevelUp,
  transitionToNextAct,
  removeCardsFromDeck,
  removeCardFromBench,
  getCurrentCardRemovalNode,
  migrateRunState,
  swapPartyAndBench,
  promoteFromBench,
  findEmptyPosition,
  getRecruitLevel,
  createRecruitPokemon,
  recruitToRoster,
  getRunPokemonData,
  getBattleGoldReward,
  applyPickupBonus,
  addGold,
  spendGold,
  reviveFromGraveyard,
  anyPokemonCanLevelUp,
} from "./run/state";
import { getActMapConfig } from "./ui/components/map/mapConfig";
import { isCurrentActComplete, hasNextAct, getCampaignStatus, CAMPAIGNS } from "./data/campaigns";
import type { Screen } from "./types/screens";

// localStorage keys
const SAVE_KEY = "pokespire_save";

interface SaveData {
  screen: Screen;
  runState: RunState | null;
  savedAt: number;
}

function saveGame(screen: Screen, runState: RunState | null) {
  // Only save during active runs (not menus, not sandbox)
  const savableScreens: Screen[] = [
    "map",
    "rest",
    "event",
    "recruit",
    "card_draft",
    "level_up",
    "battle",
    "act_transition",
    "card_removal",
  ];
  if (runState && savableScreens.includes(screen)) {
    const saveData: SaveData = { screen, runState, savedAt: Date.now() };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn("Failed to save game:", e);
    }
  }
}

function loadGame(): SaveData | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved) as SaveData;
    }
  } catch (e) {
    console.warn("Failed to load save:", e);
  }
  return null;
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("main_menu");
  const [runState, setRunState] = useState<RunState | null>(null);
  const [isSandboxBattle, setIsSandboxBattle] = useState(false);
  const [isRecruitBattle, setIsRecruitBattle] = useState(false);
  const [recruitFighterIndex, setRecruitFighterIndex] = useState<number | null>(
    null,
  );
  const [recruitBattleResult, setRecruitBattleResult] = useState<
    "pending" | "victory" | "defeat" | null
  >(null);
  const [sandboxPlayerTeam, setSandboxPlayerTeam] = useState<SandboxPokemon[]>(
    [],
  );
  const [sandboxEnemyTeam, setSandboxEnemyTeam] = useState<SandboxPokemon[]>(
    [],
  );
  const [hasSavedGame, setHasSavedGame] = useState(() => loadGame() !== null);
  const [lastGoldEarned, setLastGoldEarned] = useState<number | undefined>(
    undefined,
  );
  const [pendingBattleNodeId, setPendingBattleNodeId] = useState<string | null>(
    null,
  );
  const [pendingPostLevelUpScreen, setPendingPostLevelUpScreen] =
    useState<Screen | null>(null);
  const [isTutorialMode, setIsTutorialMode] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("rocket_tower");
  const [draftResults, setDraftResults] = useState<{
    pokemon: PokemonData[];
    gold: number;
  } | null>(null);
  const [tutorialStarterName, setTutorialStarterName] = useState("");
  const battle = useBattle();
  const tutorialOnComplete = useCallback(() => {
    // Overlay dismissed; battle continues
  }, []);
  const tutorial = useTutorial({
    starterName: tutorialStarterName,
    onComplete: tutorialOnComplete,
  });

  const latestSaveRef = useRef({ screen, runState });

  // Save game whenever screen or runState changes (debounced to avoid blocking on rapid updates)
  useEffect(() => {
    latestSaveRef.current = { screen, runState };
    const timer = setTimeout(() => saveGame(screen, runState), 2000);
    return () => clearTimeout(timer);
  }, [screen, runState]);

  // Flush on actual unmount only
  useEffect(() => {
    return () => {
      const { screen: s, runState: r } = latestSaveRef.current;
      saveGame(s, r);
    };
  }, []);

  // Play defeat sound when entering run_defeat screen
  useEffect(() => {
    if (screen === "run_defeat") {
      playSound("lose_final");
    }
  }, [screen]);

  // Background music: play the correct track for the current screen and game state
  useEffect(() => {
    const track = getMusicForScreen(screen, runState, pendingBattleNodeId);
    playMusic(track);
  }, [screen, runState, pendingBattleNodeId]);

  // Continue saved game
  const handleContinue = useCallback(() => {
    const saved = loadGame();
    if (saved) {
      // Migrate old saves to current format
      const run = saved.runState ? migrateRunState(saved.runState) : null;
      setRunState(run);
      // If saved during battle, go to map instead (can't restore battle state)
      if (saved.screen === "battle") {
        setScreen("map");
      } else {
        setScreen(saved.screen);
      }
    }
  }, []);

  // Start a new run after party selection
  const handleStart = useCallback(
    (party: PokemonData[], positions: Position[], gold: number) => {
      const run = createRunState(party, positions, Date.now(), gold, selectedCampaignId);
      setRunState(run);
      setDraftResults(null);
      setScreen("map");
    },
    [selectedCampaignId],
  );

  // Tutorial: start practice battle (1 starter vs Magikarp with Splash-only deck)
  const handleTutorialStart = useCallback(
    (starter: PokemonData) => {
      setTutorialStarterName(starter.name);
      setIsTutorialMode(true);
      const magikarp = getPokemon("magikarp");
      const tutorialMagikarp: PokemonData = {
        ...magikarp,
        deck: Array(10).fill("splash"),
      };
      const playerPositions: Position[] = [{ row: "front", column: 1 }];
      const enemyPositions: Position[] = [{ row: "front", column: 1 }];
      battle.startTutorialBattle(
        [starter],
        [tutorialMagikarp],
        playerPositions,
        enemyPositions,
      );
      setScreen("battle");
    },
    [battle],
  );

  // Campaign select: pick a campaign then advance to draft/tutorial
  const handleCampaignSelect = useCallback(
    (campaignId: string) => {
      // Guard: don't proceed if locked (CampaignSelectScreen also disables the button,
      // but this is a second line of defence)
      if (getCampaignStatus(campaignId) === "locked") return;
      setSelectedCampaignId(campaignId);
      if (campaignId === "rocket_tower" && !isTutorialComplete()) {
        setScreen("tutorial_select");
      } else {
        setScreen("campaign_draft");
      }
    },
    [],
  );

  // Tutorial: skip and go to campaign draft
  const handleTutorialSkip = useCallback(() => {
    setTutorialComplete();
    setScreen("campaign_draft");
  }, []);

  // Handle node selection on the map
  const handleSelectNode = useCallback(
    (nodeId: string) => {
      if (!runState) return;

      // Check node type before advancing — battle nodes defer moveToNode until victory
      const targetNode = runState.nodes.find((n) => n.id === nodeId);
      if (!targetNode) return;

      if (targetNode.type === "battle") {
        // Don't call moveToNode yet — if the game crashes mid-battle,
        // the save retains pre-battle state so the player can retry
        battle.startBattleFromRun(runState, targetNode as BattleNode);
        setPendingBattleNodeId(nodeId);
        setScreen("battle");
        return;
      }

      // For all other node types, advance immediately (grants EXP, marks completed)
      const newRun = moveToNode(runState, nodeId);
      setRunState(newRun);

      const node = getCurrentNode(newRun);
      if (!node) return;

      if (node.type === "rest") {
        setScreen("rest");
      } else if (node.type === "event") {
        setScreen("event");
      } else if (node.type === "act_transition") {
        setScreen("act_transition");
      } else if (node.type === "card_removal") {
        setScreen("card_removal");
      } else if (node.type === "recruit") {
        setRecruitBattleResult(null);
        setRecruitFighterIndex(null);
        setIsRecruitBattle(false);
        setScreen("recruit");
      }
      // spawn nodes don't have a screen
    },
    [runState, battle],
  );

  // Handle rest: Chansey heals whole party 30%
  const handleRestHeal = useCallback(() => {
    if (!runState) return;

    const newRun = applyPartyPercentHeal(runState, 0.3);
    setRunState(newRun);
    setScreen("map");
  }, [runState]);

  // Handle event completion (new data-driven event system)
  const handleEventComplete = useCallback((newRun: RunState) => {
    // Mark the event as seen
    const currentNode = getCurrentNode(newRun);
    const eventId =
      currentNode?.type === "event" ? (currentNode as EventNode).eventId : "";
    const updatedRun =
      eventId && !newRun.seenEventIds.includes(eventId)
        ? { ...newRun, seenEventIds: [...newRun.seenEventIds, eventId] }
        : newRun;

    setRunState(updatedRun);
    setScreen("map");
  }, []);

  // Handle card draft completion (happens after battles)
  const handleDraftComplete = useCallback(
    (drafts: Map<number, string | null>) => {
      if (!runState) return;

      // Add drafted cards to decks
      let newRun = runState;
      drafts.forEach((cardId, pokemonIndex) => {
        if (cardId !== null) {
          newRun = addCardToDeck(newRun, pokemonIndex, cardId);
        }
      });

      setRunState(newRun);

      const targetScreen: Screen = isRunComplete(newRun)
        ? "run_victory"
        : newRun.currentNodeId === "a2-chasm-ghosts"
          ? "ghost_revive"
          : "map";

      if (anyPokemonCanLevelUp(newRun)) {
        setPendingPostLevelUpScreen(targetScreen);
        setScreen("level_up");
      } else {
        setScreen(targetScreen);
      }
    },
    [runState],
  );

  const handleLevelUpComplete = useCallback(
    (updatedRun: RunState) => {
      setRunState(updatedRun);
      const target = pendingPostLevelUpScreen ?? "map";
      setPendingPostLevelUpScreen(null);
      setScreen(target);
    },
    [pendingPostLevelUpScreen],
  );

  // Detect enemy turn done for tutorial (phase: enemy_turn -> player_turn)
  const prevPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    const now = battle.phase;
    if (
      isTutorialMode &&
      prevPhaseRef.current === "enemy_turn" &&
      now === "player_turn"
    ) {
      tutorial.notifyEnemyTurnDone();
    }
    prevPhaseRef.current = now;
  }, [battle.phase, isTutorialMode, tutorial]);

  // Handle battle end
  const handleBattleEnd = useCallback(
    (
      result: BattleResult,
      combatants: Combatant[],
      combatGoldEarned?: number,
    ) => {
      // Tutorial battle: victory -> party select, defeat -> main menu
      if (isTutorialMode) {
        setIsTutorialMode(false);
        setTutorialStarterName("");
        if (result === "victory") {
          setTutorialComplete();
          setScreen("campaign_draft");
        } else {
          setScreen("main_menu");
        }
        return;
      }

      if (!runState) return;

      // Recruit battles: sync HP back to fighter, return to recruit screen
      if (isRecruitBattle && recruitFighterIndex !== null) {
        const playerCombatant = combatants.find((c) => c.side === "player");
        let newParty = runState.party;
        if (playerCombatant) {
          const newHp = Math.max(0, playerCombatant.hp);
          const isKO = newHp <= 0 || !playerCombatant.alive;
          newParty = runState.party.map((p, i) => {
            if (i !== recruitFighterIndex) return p;
            return { ...p, currentHp: newHp, knockedOut: p.knockedOut || isKO };
          });
          const updatedRun = moveKnockedOutToGraveyard({
            ...runState,
            party: newParty,
          });
          setRunState(updatedRun);
          newParty = updatedRun.party;
        }

        // Check for full party wipe
        const allDead = newParty.every((p) => p.currentHp <= 0 || p.knockedOut);
        if (allDead) {
          setIsRecruitBattle(false);
          setPendingBattleNodeId(null);
          setScreen("run_defeat");
          return;
        }

        setRecruitBattleResult(result === "victory" ? "victory" : "defeat");
        setIsRecruitBattle(false);
        setPendingBattleNodeId(null);
        setScreen("recruit");
        return;
      }

      if (result === "defeat") {
        setPendingBattleNodeId(null);
        setScreen("run_defeat");
        return;
      }

      // Advance the node NOW (deferred from handleSelectNode for battle nodes)
      let newRun = pendingBattleNodeId
        ? moveToNode(runState, pendingBattleNodeId)
        : runState;
      setPendingBattleNodeId(null);

      // Sync HP from battle back to run state, then move KO'd to graveyard
      newRun = syncBattleResults(newRun, combatants);
      newRun = moveKnockedOutToGraveyard(newRun);

      // Award gold for battle
      const currentNode = getCurrentNode(newRun);
      let goldEarned = 0;
      if (currentNode?.type === "battle") {
        const baseGold = getBattleGoldReward(
          currentNode as BattleNode,
          newRun.currentAct,
        );
        goldEarned =
          applyPickupBonus(newRun, baseGold) + (combatGoldEarned ?? 0);
        newRun = addGold(newRun, goldEarned);
      }

      // Check if this was the final boss (Mewtwo in Act 3)
      if (isRunComplete(newRun)) {
        // Persist campaign completion with run metadata for future story use
        recordCampaignComplete(newRun.campaignId, {
          completedAt: Date.now(),
          path: newRun.actVariants?.[newRun.currentAct],
          metadata: {
            starter:         newRun.party[0]?.baseFormId ?? null,
            partyWiped:      newRun.graveyard.length > 0,
            graveyardCount:  newRun.graveyard.length,
            activeSurvivors: newRun.party.filter(p => !p.knockedOut).length,
            goldAtCompletion: newRun.gold,
          },
        });
        setRunState(newRun);
        if (anyPokemonCanLevelUp(newRun)) {
          setPendingPostLevelUpScreen("run_victory");
          setScreen("level_up");
        } else {
          setScreen("run_victory");
        }
      } else if (isCurrentActComplete(newRun) && hasNextAct(newRun)) {
        // Act boss defeated and there is a next act — full heal and show act transition
        newRun = applyFullHealAll(newRun);
        setRunState(newRun);
        if (anyPokemonCanLevelUp(newRun)) {
          setPendingPostLevelUpScreen("act_transition");
          setScreen("level_up");
        } else {
          setScreen("act_transition");
        }
      } else {
        setRunState(newRun);
        setLastGoldEarned(goldEarned > 0 ? goldEarned : undefined);
        // Go to card draft after battle
        setScreen("card_draft");
      }
    },
    [
      runState,
      isRecruitBattle,
      recruitFighterIndex,
      pendingBattleNodeId,
      isTutorialMode,
    ],
  );

  // Handle card selection during battle
  const handleSelectCard = useCallback(
    (cardIndex: number | null) => {
      if (cardIndex === null || !battle.state) {
        battle.setPendingCardIndex(null);
        return;
      }
      battle.setPendingCardIndex(cardIndex);
    },
    [battle],
  );

  // Handle target selection during battle
  const handleSelectTarget = useCallback(
    (targetId: string) => {
      if (battle.pendingCardIndex !== null) {
        const combatant = battle.state
          ? getCurrentCombatant(battle.state)
          : null;
        const moveId = combatant?.hand[battle.pendingCardIndex];
        battle.playCard(battle.pendingCardIndex, targetId || undefined);
        if (isTutorialMode && moveId) tutorial.notifyCardPlayed(moveId);
      }
    },
    [battle, isTutorialMode, tutorial],
  );

  // Handle direct card play (for drag-and-drop, bypasses two-step selection)
  const handlePlayCard = useCallback(
    (cardIndex: number, targetId?: string) => {
      const combatant = battle.state ? getCurrentCombatant(battle.state) : null;
      const moveId = combatant?.hand[cardIndex];
      battle.playCard(cardIndex, targetId);
      if (isTutorialMode && moveId) tutorial.notifyCardPlayed(moveId);
    },
    [battle, isTutorialMode, tutorial],
  );

  // Handle end turn (with tutorial notification)
  const handleEndTurn = useCallback(() => {
    if (isTutorialMode) tutorial.notifyTurnEnded();
    battle.endPlayerTurn();
  }, [battle, isTutorialMode, tutorial]);

  // Handle level-up from map screen
  const handleLevelUp = useCallback(
    (pokemonIndex: number) => {
      if (!runState) return;
      const newRun = applyLevelUp(runState, pokemonIndex);
      setRunState(newRun);
    },
    [runState],
  );

  // Handle shop purchase
  const handlePurchase = useCallback(
    (moveId: string, pokemonIndex: number) => {
      if (!runState) return;
      const item = SHOP_ITEMS.find((i) => i.moveId === moveId);
      if (!item) return;
      const afterSpend = spendGold(runState, item.goldCost);
      if (!afterSpend) return;
      const afterAdd = addCardToDeck(afterSpend, pokemonIndex, moveId);
      setRunState(afterAdd);
    },
    [runState],
  );

  // Handle card removal from Hypno's Parlor
  const handleForgetCard = useCallback(
    (pokemonIndex: number, cardIndex: number, source: "party" | "bench") => {
      if (!runState) return;
      const afterSpend = spendGold(runState, CARD_FORGET_COST);
      if (!afterSpend) return;
      const afterRemove =
        source === "party"
          ? removeCardsFromDeck(afterSpend, pokemonIndex, [cardIndex])
          : removeCardFromBench(afterSpend, pokemonIndex, [cardIndex]);
      setRunState(afterRemove);
    },
    [runState],
  );

  // Handle act transition - continue to next act
  const handleActTransitionContinue = useCallback(() => {
    if (!runState) return;
    const newRun = transitionToNextAct(runState);
    setRunState(newRun);
    setScreen("map");
  }, [runState]);

  // Handle card removal completion
  const handleCardRemovalComplete = useCallback(
    (removals: Map<number, number[]>) => {
      if (!runState) return;

      let newRun = runState;
      removals.forEach((cardIndices, pokemonIndex) => {
        newRun = removeCardsFromDeck(newRun, pokemonIndex, cardIndices);
      });

      setRunState(newRun);
      setScreen("map");
    },
    [runState],
  );

  // Handle card removal skip
  const handleCardRemovalSkip = useCallback(() => {
    setScreen("map");
  }, []);

  // Handle swap between party and bench
  const handleSwap = useCallback(
    (partyIndex: number, benchIndex: number) => {
      if (!runState) return;
      const newRun = swapPartyAndBench(runState, partyIndex, benchIndex);
      setRunState(newRun);
    },
    [runState],
  );

  // Handle promoting a bench Pokemon to the active party
  const handlePromote = useCallback(
    (benchIndex: number) => {
      if (!runState) return;
      const emptyPos = findEmptyPosition(runState.party);
      if (!emptyPos) return;
      const newRun = promoteFromBench(runState, benchIndex, emptyPos);
      setRunState(newRun);
    },
    [runState],
  );

  // Handle rearranging party formation (including promote/demote from modal)
  const handleRearrange = useCallback(
    (newParty: RunPokemon[], newBench: RunPokemon[]) => {
      if (!runState) return;
      setRunState({ ...runState, party: newParty, bench: newBench });
    },
    [runState],
  );

  // Handle starting a 1v1 recruit fight
  const handleRecruitFight = useCallback(
    (partyIndex: number) => {
      if (!runState) return;

      const currentNode = getCurrentNode(runState);
      if (!currentNode || currentNode.type !== "recruit") return;
      const recruitNode = currentNode as RecruitNode;

      const fighter = runState.party[partyIndex];
      const recruitLevel = getRecruitLevel(runState);
      const recruitMon = createRecruitPokemon(
        recruitNode.pokemonId,
        recruitLevel,
      );

      // Build enemy data at recruit level with proper HP and deck
      const enemyData = getPokemon(recruitMon.formId);
      const enemyWithHp = {
        ...enemyData,
        maxHp: recruitMon.maxHp,
        deck: [...recruitMon.deck],
      };

      // Start 1v1 battle: fighter vs wild Pokemon (with passives from progression tree)
      const fighterData = getRunPokemonData(fighter);
      battle.startConfiguredBattle(
        [fighterData],
        [enemyWithHp],
        [fighter.position],
        [{ row: "front", column: 1 }],
        new Map([[0, fighter.passiveIds]]),
        new Map([[0, recruitMon.passiveIds]]),
        new Map([
          [
            "player-0",
            {
              maxHp: fighter.maxHp,
              startPercent: fighter.currentHp / fighter.maxHp,
            },
          ],
        ]),
      );

      setIsRecruitBattle(true);
      setRecruitFighterIndex(partyIndex);
      setRecruitBattleResult("pending");
      // Set the recruit node ID so getMusicForScreen can resolve campaign-specific
      // battle music (e.g. legendary beast track for c2-a3x-s5-recruit-* nodes)
      setPendingBattleNodeId(recruitNode.id);
      setScreen("battle");
    },
    [runState, battle],
  );

  // Handle recruit confirm (add to bench)
  const handleRecruitConfirm = useCallback(() => {
    if (!runState) return;

    const currentNode = getCurrentNode(runState);
    if (!currentNode || currentNode.type !== "recruit") return;
    const recruitNode = currentNode as RecruitNode;

    const level = getRecruitLevel(runState);
    const matchingExp = Math.min(...runState.party.map((p) => p.exp));
    const newPokemon = createRecruitPokemon(
      recruitNode.pokemonId,
      level,
      matchingExp,
    );
    let newRun = recruitToRoster(runState, newPokemon);

    // Permanently unlock this Pokemon for future drafts
    unlockPokemon(recruitNode.pokemonId);

    // Mark the node as recruited
    newRun = {
      ...newRun,
      nodes: newRun.nodes.map((n) =>
        n.id === recruitNode.id && n.type === "recruit"
          ? { ...n, recruited: true }
          : n,
      ),
    };

    setRunState(newRun);
    setRecruitBattleResult(null);
    setRecruitFighterIndex(null);
    setScreen("map");
  }, [runState]);

  // Handle recruit decline (skip recruitment, back to map)
  const handleRecruitDecline = useCallback(() => {
    setRecruitBattleResult(null);
    setRecruitFighterIndex(null);
    setScreen("map");
  }, []);

  // Return to main menu (preserves save)
  const handleMainMenu = useCallback(() => {
    setDraftResults(null);
    setScreen("main_menu");
    setHasSavedGame(!!runState);
  }, [runState]);

  // Handle ghost revive (after chasm battle)
  const handleGhostRevive = useCallback(
    (graveyardIndex: number) => {
      if (!runState) return;
      const newRun = reviveFromGraveyard(runState, graveyardIndex, 0.5);
      setRunState(newRun);
      setScreen("map");
    },
    [runState],
  );

  const handleGhostReviveSkip = useCallback(() => {
    setScreen("map");
  }, []);

  // Abandon run and return to main menu (clears save)
  const handleRestart = useCallback(() => {
    clearSave();
    setHasSavedGame(false);
    setRunState(null);
    setDraftResults(null);
    setScreen("main_menu");
  }, []);

  // Go to sandbox configuration screen
  const handleGoToSandbox = useCallback(() => {
    setIsTutorialMode(false);
    setScreen("sandbox_config");
  }, []);

  // Start a test run at Act 2 with a leveled party
  const handleTestAct2 = useCallback(() => {
    clearSave();
    const run = createAct2TestState();
    setRunState(run);
    setScreen("map");
  }, []);

  // Start a test run at Act 3 with a leveled party
  const handleTestAct3 = useCallback(() => {
    clearSave();
    const run = createAct3TestState();
    setRunState(run);
    setScreen("map");
  }, []);

  // Boss test shortcuts (map-based — drop before boss node)
  const handleTestAct1Boss = useCallback(() => {
    clearSave();
    const run = createAct1BossTestState();
    setRunState(run);
    setScreen("map");
  }, []);

  const handleTestAct2Boss = useCallback(() => {
    clearSave();
    const run = createAct2BossTestState();
    setRunState(run);
    setScreen("map");
  }, []);

  const handleTestAct3Boss = useCallback(() => {
    clearSave();
    const run = createAct3BossTestState();
    setRunState(run);
    setScreen("map");
  }, []);

  const handleTestLevelUp = useCallback(() => {
    clearSave();
    const run = createLevelUpTestState();
    setRunState(run);
    setLastGoldEarned(50);
    setScreen("card_draft");
  }, []);

  const handleTestEvolution = useCallback(() => {
    clearSave();
    const run = createEvolutionTestState();
    setRunState(run);
    setLastGoldEarned(50);
    setScreen("card_draft");
  }, []);

  const handleTestEvolutionLargeParty = useCallback(() => {
    clearSave();
    const run = createEvolutionLargePartyTestState();
    setRunState(run);
    setLastGoldEarned(50);
    setScreen("card_draft");
  }, []);

  // Campaign 2 (Threads of Time) test shortcuts
  const handleTestC2Act1 = useCallback(() => { clearSave(); setRunState(createCampaign2Act1TestState()); setScreen("map"); }, []);
  const handleTestC2Act1Boss = useCallback(() => { clearSave(); setRunState(createCampaign2Act1BossTestState()); setScreen("map"); }, []);
  const handleTestC2Act2 = useCallback(() => { clearSave(); setRunState(createCampaign2Act2TestState()); setScreen("map"); }, []);
  const handleTestC2Act2GoldBoss = useCallback(() => { clearSave(); setRunState(createCampaign2Act2GoldBossTestState()); setScreen("map"); }, []);
  const handleTestC2Act2SilverBoss = useCallback(() => { clearSave(); setRunState(createCampaign2Act2SilverBossTestState()); setScreen("map"); }, []);
  const handleTestC2Act3A = useCallback(() => { clearSave(); setRunState(createCampaign2Act3ATestState()); setScreen("map"); }, []);
  const handleTestC2Act3ABoss = useCallback(() => { clearSave(); setRunState(createCampaign2Act3ABossTestState()); setScreen("map"); }, []);
  const handleTestC2Act3B = useCallback(() => { clearSave(); setRunState(createCampaign2Act3BTestState()); setScreen("map"); }, []);
  const handleTestC2Act3BBoss = useCallback(() => { clearSave(); setRunState(createCampaign2Act3BBossTestState()); setScreen("map"); }, []);
  const handleTestC2Act3ABeforeDogs = useCallback(() => { clearSave(); setRunState(createCampaign2Act3ABeforeDogsTestState()); setScreen("map"); }, []);
  const handleTestC2Act3BBeforeDogs = useCallback(() => { clearSave(); setRunState(createCampaign2Act3BBeforeDogsTestState()); setScreen("map"); }, []);
  // Gold path — post-Gold dialog (no C1 metadata needed)
  const handleTestC2GoldTransition = useCallback(() => {
    clearSave();
    setRunState(createCampaign2GoldTransitionTestState());
    setScreen("act_transition");
  }, []);
  // Silver path — C1 flawless (Giovanni reference triggers)
  const handleTestC2SilverGiovanniDialog = useCallback(() => {
    recordCampaignComplete("rocket_tower", {
      completedAt: Date.now(),
      metadata: { starter: "charizard", partyWiped: false, graveyardCount: 0, activeSurvivors: 3, debugUnlock: true },
    });
    clearSave();
    setRunState(createCampaign2SilverTransitionTestState());
    setScreen("act_transition");
  }, []);
  // Silver path — C1 not flawless (neutral Silver dialog, no Giovanni reference)
  const handleTestC2SilverNormalDialog = useCallback(() => {
    recordCampaignComplete("rocket_tower", {
      completedAt: Date.now(),
      metadata: { starter: "charizard", partyWiped: true, graveyardCount: 2, activeSurvivors: 1, debugUnlock: true },
    });
    clearSave();
    setRunState(createCampaign2SilverTransitionTestState());
    setScreen("act_transition");
  }, []);

  // Jump straight to a boss fight from Event Tester
  const handleStartBossBattle = useCallback(
    (act: 1 | 2 | 3) => {
      clearSave();
      const run =
        act === 1
          ? createAct1BossTestState()
          : act === 2
            ? createAct2TestState()
            : createAct3TestState();
      const { bossNodeId } = getActMapConfig(act);
      const bossNode = run.nodes.find(
        (n) => n.id === bossNodeId && n.type === "battle",
      );
      if (!bossNode) return;
      setRunState(run);
      battle.startBattleFromRun(run, bossNode as BattleNode);
      setPendingBattleNodeId(bossNodeId);
      setScreen("battle");
    },
    [battle],
  );

  // Start a configured sandbox battle
  const handleStartSandboxBattle = useCallback(
    (
      players: PokemonData[],
      enemies: PokemonData[],
      playerPositions: Position[],
      enemyPositions: Position[],
      playerPassives: Map<number, string[]>,
      enemyPassives: Map<number, string[]>,
      hpOverrides: Map<string, { maxHp?: number; startPercent?: number }>,
    ) => {
      battle.startConfiguredBattle(
        players,
        enemies,
        playerPositions,
        enemyPositions,
        playerPassives,
        enemyPassives,
        hpOverrides,
      );
      setIsSandboxBattle(true);
      setIsTutorialMode(false);
      setScreen("battle");
    },
    [battle],
  );

  // Go back to sandbox config (from sandbox battle)
  const handleBackToSandboxConfig = useCallback(() => {
    setIsSandboxBattle(false);
    setScreen("sandbox_config");
  }, []);

  // Update sandbox config state (called by SandboxConfigScreen)
  const handleSandboxConfigChange = useCallback(
    (playerTeam: SandboxPokemon[], enemyTeam: SandboxPokemon[]) => {
      setSandboxPlayerTeam(playerTeam);
      setSandboxEnemyTeam(enemyTeam);
    },
    [],
  );

  // Render based on current screen
  if (screen === "main_menu") {
    // Stagger index for entrance animations (Continue button shifts indices)
    let menuIdx = 0;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 32,
          color: THEME.text.primary,
          minHeight: "100dvh",
          position: "relative",
        }}
      >
        <AmbientBackground />

        {/* Title — fades in and drifts up */}
        <div
          className="menu-title"
          style={{
            fontSize: 68,
            fontWeight: "bold",
            color: THEME.accent,
            textShadow:
              "0 0 30px rgba(250, 204, 21, 0.4), 0 0 60px rgba(250, 204, 21, 0.15)",
            ...THEME.heading,
            letterSpacing: "0.2em",
            position: "relative",
            zIndex: 1,
          }}
        >
          POKESPIRE
        </div>

        {/* Flourish — fades in after title */}
        <div
          className="menu-flourish"
          style={{ position: "relative", zIndex: 1 }}
        >
          <Flourish variant="divider" width={240} color={THEME.text.tertiary} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            marginTop: 16,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Continue Run — breathing glow */}
          {hasSavedGame && (
            <button
              className={`menu-item menu-item-continue`}
              onClick={handleContinue}
              style={{
                padding: "12px 0",
                fontSize: 22,
                fontWeight: "bold",
                border: "none",
                background: "transparent",
                color: "#22c55e",
                cursor: "pointer",
                letterSpacing: "0.08em",
                position: "relative",
                marginBottom: 8,
                animationDelay: `${menuIdx++ * 50 + 250}ms`,
              }}
            >
              Continue Run
            </button>
          )}
          <button
            className="menu-item"
            onClick={() => {
              clearSave();
              setHasSavedGame(false);
              setDraftResults(null);
              setScreen("campaign_select");
            }}
            style={{
              padding: "12px 0",
              fontSize: 22,
              fontWeight: "bold",
              border: "none",
              background: "transparent",
              color: THEME.text.primary,
              cursor: "pointer",
              letterSpacing: "0.08em",
              position: "relative",
              animationDelay: `${menuIdx++ * 50 + 250}ms`,
            }}
          >
            {hasSavedGame ? "New Run" : "Campaign"}
          </button>
          <button
            className="menu-item"
            onClick={handleGoToSandbox}
            style={{
              padding: "12px 0",
              fontSize: 22,
              fontWeight: "bold",
              border: "none",
              background: "transparent",
              color: THEME.text.primary,
              cursor: "pointer",
              letterSpacing: "0.08em",
              position: "relative",
              animationDelay: `${menuIdx++ * 50 + 250}ms`,
            }}
          >
            Sandbox
          </button>

          {/* Separator between play and browse */}
          <div
            className="menu-flourish-sep"
            style={{
              margin: "8px 0",
              animationDelay: `${menuIdx * 50 + 250}ms`,
            }}
          >
            <Flourish
              variant="heading"
              width={120}
              color={THEME.text.tertiary}
            />
          </div>

          <button
            className="menu-item menu-item-secondary"
            onClick={() => setScreen("pokedex")}
            style={{
              padding: "10px 0",
              fontSize: 18,
              fontWeight: "bold",
              border: "none",
              background: "transparent",
              color: THEME.text.secondary,
              cursor: "pointer",
              letterSpacing: "0.08em",
              position: "relative",
              animationDelay: `${menuIdx++ * 50 + 250}ms`,
            }}
          >
            PokeDex
          </button>
          <button
            className="menu-item menu-item-secondary"
            onClick={() => setScreen("card_dex")}
            style={{
              padding: "10px 0",
              fontSize: 18,
              fontWeight: "bold",
              border: "none",
              background: "transparent",
              color: THEME.text.secondary,
              cursor: "pointer",
              letterSpacing: "0.08em",
              position: "relative",
              animationDelay: `${menuIdx++ * 50 + 250}ms`,
            }}
          >
            Card Dex
          </button>
          <button
            className="menu-item menu-item-tertiary"
            onClick={() => setScreen("disclaimer")}
            style={{
              padding: "8px 0",
              fontSize: 14,
              fontWeight: "bold",
              border: "none",
              background: "transparent",
              color: THEME.text.tertiary,
              cursor: "pointer",
              letterSpacing: "0.08em",
              position: "relative",
              marginTop: 8,
              animationDelay: `${menuIdx++ * 50 + 250}ms`,
            }}
          >
            Disclaimer & Credits
          </button>
          <button
            className="menu-item menu-item-tertiary"
            onClick={() => setScreen("debugging")}
            style={{
              padding: "8px 0",
              fontSize: 14,
              fontWeight: "bold",
              border: "none",
              background: "transparent",
              color: THEME.text.tertiary,
              cursor: "pointer",
              letterSpacing: "0.08em",
              position: "relative",
              opacity: 0.6,
              animationDelay: `${menuIdx++ * 50 + 250}ms`,
            }}
          >
            Debugging
          </button>
        </div>

        {/* Menu animations */}
        <style>{`
          /* Title entrance */
          .menu-title {
            animation: menuTitleIn 0.7s ease-out forwards;
            opacity: 0;
          }
          @keyframes menuTitleIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Flourish entrance */
          .menu-flourish {
            animation: menuFadeIn 0.4s ease-out 0.2s forwards;
            opacity: 0;
          }
          .menu-flourish-sep {
            animation: menuFadeIn 0.3s ease-out forwards;
            animation-delay: inherit;
            opacity: 0;
          }
          @keyframes menuFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          /* Menu item staggered entrance */
          .menu-item {
            animation: menuItemIn 0.3s ease-out forwards;
            opacity: 0;
          }
          @keyframes menuItemIn {
            from {
              opacity: 0;
              transform: translateY(6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Hover flourish lines extending from text */
          .menu-item::before,
          .menu-item::after {
            content: '';
            position: absolute;
            top: 50%;
            height: 1px;
            background: ${THEME.accent};
            opacity: 0;
            transition: all 0.3s ease-out;
            transform: translateY(-50%);
          }
          .menu-item::before {
            right: 100%;
            width: 0;
            margin-right: 12px;
          }
          .menu-item::after {
            left: 100%;
            width: 0;
            margin-left: 12px;
          }
          .menu-item:hover::before,
          .menu-item:hover::after {
            width: 32px;
            opacity: 0.5;
          }

          /* Hover glow for menu items */
          .menu-item:hover {
            color: ${THEME.accent} !important;
            text-shadow: 0 0 12px rgba(250, 204, 21, 0.4);
          }
          .menu-item-secondary:hover {
            color: ${THEME.accent} !important;
            text-shadow: 0 0 12px rgba(250, 204, 21, 0.4);
          }
          .menu-item-tertiary:hover {
            color: ${THEME.accent} !important;
            text-shadow: 0 0 12px rgba(250, 204, 21, 0.4);
          }
          .menu-item-dev {
            transition: all 0.2s;
          }
          .menu-item-dev:hover {
            color: ${THEME.accent} !important;
            text-shadow: 0 0 12px rgba(250, 204, 21, 0.4);
            opacity: 1 !important;
          }

          /* Continue Run breathing glow */
          .menu-item-continue {
            text-shadow: 0 0 16px rgba(34, 197, 94, 0.4);
            animation: menuItemIn 0.3s ease-out forwards, continueBreathe 3s ease-in-out 1s infinite !important;
          }
          .menu-item-continue:hover {
            color: ${THEME.accent} !important;
            text-shadow: 0 0 12px rgba(250, 204, 21, 0.4) !important;
          }
          @keyframes continueBreathe {
            0%, 100% {
              text-shadow: 0 0 12px rgba(34, 197, 94, 0.25);
            }
            50% {
              text-shadow: 0 0 24px rgba(34, 197, 94, 0.6), 0 0 48px rgba(34, 197, 94, 0.2);
            }
          }
        `}</style>
      </div>
    );
  }

  if (screen === "card_dex") {
    return (
      <Suspense
        fallback={
          <div
            style={{
              height: "100dvh",
              background: THEME.bg.base,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Loading...
          </div>
        }
      >
        <CardDexScreen onBack={() => setScreen("main_menu")} />
      </Suspense>
    );
  }

  if (screen === "pokedex") {
    return (
      <Suspense
        fallback={
          <div
            style={{
              height: "100dvh",
              background: THEME.bg.base,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Loading...
          </div>
        }
      >
        <PokeDexScreen onBack={() => setScreen("main_menu")} />
      </Suspense>
    );
  }

  if (screen === "debugging") {
    const devBtnStyle = {
      padding: "12px 20px",
      fontSize: 14,
      fontWeight: "bold" as const,
      border: `1px solid ${THEME.border.subtle}`,
      borderRadius: 8,
      background: THEME.bg.elevated,
      color: THEME.text.secondary,
      cursor: "pointer",
      letterSpacing: "0.06em",
      width: "100%",
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
              onClick={() => setScreen("main_menu")}
              style={{
                padding: "8px 16px",
                ...THEME.button.secondary,
                fontSize: 13,
              }}
            >
              Back
            </button>
            <span
              style={{
                color: THEME.text.primary,
                fontWeight: "bold",
                fontSize: 16,
                letterSpacing: "0.08em",
              }}
            >
              Debugging
            </span>
            <div style={{ width: 60 }} />
          </div>
        }
        bodyStyle={{ padding: "24px 16px 48px" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 360,
            margin: "0 auto",
          }}
        >
          {/* ── Campaign 1 — Rocket Tower ── */}
          <div style={{ fontSize: 11, fontWeight: "bold", color: THEME.text.tertiary, letterSpacing: "0.1em", textTransform: "uppercase", paddingTop: 4 }}>
            Campaign 1 — Rocket Tower
          </div>
          <button onClick={handleTestAct2} style={devBtnStyle}>
            Test Act 2
          </button>
          <button onClick={handleTestAct3} style={devBtnStyle}>
            Test Act 3
          </button>
          <button onClick={handleTestAct1Boss} style={devBtnStyle}>
            Test Act 1 Boss
          </button>
          <button onClick={handleTestAct2Boss} style={devBtnStyle}>
            Test Act 2 Boss
          </button>
          <button onClick={handleTestAct3Boss} style={devBtnStyle}>
            Test Act 3 Boss
          </button>

          {/* ── Campaign 2 — Threads of Time ── */}
          <div style={{ fontSize: 11, fontWeight: "bold", color: THEME.text.tertiary, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 8 }}>
            Campaign 2 — Threads of Time
          </div>
          <button onClick={handleTestC2Act1} style={devBtnStyle}>
            C2: Ilex Forest (Act 1)
          </button>
          <button onClick={handleTestC2Act1Boss} style={devBtnStyle}>
            C2: Before Celebi
          </button>
          <button onClick={handleTestC2Act2} style={devBtnStyle}>
            C2: Act 2 — Past Johto
          </button>
          <button onClick={handleTestC2Act2GoldBoss} style={devBtnStyle}>
            C2: Before Gold
          </button>
          <button onClick={handleTestC2Act2SilverBoss} style={devBtnStyle}>
            C2: Before Silver
          </button>
          <button onClick={handleTestC2Act3A} style={devBtnStyle}>
            C2: Tin Tower (Act 3A)
          </button>
          <button onClick={handleTestC2Act3ABoss} style={devBtnStyle}>
            C2: Before Ho-Oh
          </button>
          <button onClick={handleTestC2Act3ABeforeDogs} style={devBtnStyle}>
            C2: Before Legendary Dogs (3A)
          </button>
          <button onClick={handleTestC2Act3B} style={devBtnStyle}>
            C2: Brass Tower (Act 3B)
          </button>
          <button onClick={handleTestC2Act3BBoss} style={devBtnStyle}>
            C2: Before Lugia
          </button>
          <button onClick={handleTestC2Act3BBeforeDogs} style={devBtnStyle}>
            C2: Before Legendary Dogs (3B)
          </button>
          <button onClick={handleTestC2GoldTransition} style={devBtnStyle}>
            C2: Gold Act 2 Transition
          </button>
          <button onClick={handleTestC2SilverGiovanniDialog} style={devBtnStyle}>
            C2: Silver Act 2 Transition (C1 Flawless)
          </button>
          <button onClick={handleTestC2SilverNormalDialog} style={devBtnStyle}>
            C2: Silver Act 2 Transition (C1 Not Flawless)
          </button>

          {/* ── Campaign Progress ── */}
          <div style={{ fontSize: 11, fontWeight: "bold", color: THEME.text.tertiary, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 8 }}>
            Campaign Progress
          </div>
          <button
            onClick={() => {
              recordCampaignComplete("rocket_tower", {
                completedAt: Date.now(),
                metadata: { starter: "charizard", partyWiped: false, graveyardCount: 0, activeSurvivors: 3, debugUnlock: true },
              });
            }}
            style={devBtnStyle}
          >
            Debug: Mark C1 Complete
          </button>
          <button
            onClick={() => {
              unlockAllCampaignsDebug(CAMPAIGNS.map(c => c.id));
            }}
            style={devBtnStyle}
          >
            Debug: Unlock All Campaigns
          </button>
          <button
            onClick={() => {
              resetCampaignProgress();
            }}
            style={devBtnStyle}
          >
            Debug: Reset Campaign Progress
          </button>

          {/* ── Other ── */}
          <div style={{ fontSize: 11, fontWeight: "bold", color: THEME.text.tertiary, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 8 }}>
            Other
          </div>
          <button onClick={handleTestLevelUp} style={devBtnStyle}>
            Test Level Up
          </button>
          <button onClick={handleTestEvolution} style={devBtnStyle}>
            Test Level Up + Evolution
          </button>
          <button onClick={handleTestEvolutionLargeParty} style={devBtnStyle}>
            Test Evolution (Large Party)
          </button>
          <button onClick={() => setScreen("event_tester")} style={devBtnStyle}>
            Event Tester
          </button>
          <button onClick={() => setScreen("classes_plan")} style={devBtnStyle}>
            Classes Plan
          </button>
          <button
            onClick={() => {
              clearSave();
              setDraftResults(null);
              setScreen("select");
            }}
            style={devBtnStyle}
          >
            Free Draft (Old Campaign)
          </button>
          <button
            onClick={() => {
              resetTutorial();
              setScreen("main_menu");
            }}
            style={devBtnStyle}
          >
            Reset Tutorial (First-Time Player)
          </button>
          <button
            onClick={() => {
              resetProfile();
            }}
            style={devBtnStyle}
          >
            Reset Pokemon Unlocks
          </button>
        </div>
      </ScreenShell>
    );
  }

  if (screen === "disclaimer") {
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
              onClick={() => setScreen("main_menu")}
              style={{
                padding: "8px 16px",
                ...THEME.button.secondary,
                fontSize: 13,
              }}
            >
              &larr; Back
            </button>
            <h1
              style={{
                margin: 0,
                color: THEME.accent,
                fontSize: 22,
                ...THEME.heading,
              }}
            >
              Disclaimer
            </h1>
            <div style={{ width: 80 }} />
          </div>
        }
      >
        <div
          style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 64px" }}
        >
          <DexFrame>
            <div
              className="disc-content"
              style={{
                padding: "28px 32px 36px",
                lineHeight: 1.7,
                color: THEME.text.secondary,
                fontSize: 14,
              }}
            >
              <DisclaimerSection title="Fan Project Notice" first>
                Pokespire is an unofficial, non-commercial fan project created
                for educational and entertainment purposes only. It is not
                affiliated with, endorsed by, sponsored by, or in any way
                officially connected to Nintendo, The Pokemon Company, Game
                Freak, or Creatures Inc.
              </DisclaimerSection>

              <DisclaimerSection title="Intellectual Property">
                <p style={{ margin: "0 0 8px" }}>
                  Pokemon, the Pokemon logo, and all related character names,
                  artwork, and trademarks are the intellectual property of
                  Nintendo, The Pokemon Company, Game Freak, and Creatures Inc.
                  All rights to these properties are reserved by their
                  respective owners.
                </p>
                <p style={{ margin: 0 }}>
                  This project uses Pokemon names, types, move names, and game
                  mechanics as references to create a fan-made experience. No
                  copyright or trademark infringement is intended.
                </p>
              </DisclaimerSection>

              <DisclaimerSection title="Non-Commercial Use">
                This project is provided entirely free of charge. It is not
                sold, licensed, or monetized in any form. No donations,
                subscriptions, or payments of any kind are accepted. The source
                code is made available solely for educational and personal use.
              </DisclaimerSection>

              <DisclaimerSection title="No Distribution of Copyrighted Assets">
                This project does not distribute, bundle, or host any
                copyrighted artwork, sprites, music, or other media assets owned
                by the rights holders. Any visual or audio assets used are
                either original creations or sourced from publicly available
                community resources under applicable fair-use terms.
              </DisclaimerSection>

              <DisclaimerSection title="Disclaimer of Liability">
                This project is provided &ldquo;as is&rdquo; without warranty of
                any kind, express or implied. The authors assume no
                responsibility or liability for any consequences arising from
                the use or misuse of this project.
              </DisclaimerSection>

              <DisclaimerSection title="Takedown" last>
                If any rights holder has concerns about this project, please
                open an issue on the repository or contact the maintainer
                directly. The project will be modified or removed promptly upon
                request.
              </DisclaimerSection>

              <DisclaimerSection title="Credits">
                <p style={{ margin: "0 0 12px" }}>
                  Background music by{" "}
                  <a
                    href="https://soundcloud.com/glitchxcity/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: THEME.accent }}
                  >
                    GlitchxCity
                  </a>
                  .
                </p>
                <p style={{ margin: "0 0 8px" }}>Sound effects by:</p>
                <ul style={{ margin: "0 0 0 20px", padding: 0 }}>
                  <li style={{ marginBottom: 4 }}>
                    <a
                      href="https://pixabay.com/users/freesound_community-46691455/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: THEME.accent }}
                    >
                      freesound community
                    </a>
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    <a
                      href="https://pixabay.com/users/astralsynthesizer-50776509/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: THEME.accent }}
                    >
                      AstralSynthesizer
                    </a>
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    <a
                      href="https://pixabay.com/users/universfield-28281460/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: THEME.accent }}
                    >
                      Universfield
                    </a>
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    <a
                      href="https://pixabay.com/users/scratchonix-50592769/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: THEME.accent }}
                    >
                      Scratchonix
                    </a>
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    <a
                      href="https://pixabay.com/users/edimar_ramide-50233661/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: THEME.accent }}
                    >
                      Edimar Ramide
                    </a>
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    <a
                      href="https://pixabay.com/users/yo-tu-45000291/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: THEME.accent }}
                    >
                      Yo-Tu
                    </a>
                  </li>
                </ul>
              </DisclaimerSection>
            </div>
          </DexFrame>
        </div>

        <style>{`
          .disc-content {
            animation: discIn 0.25s ease-out forwards;
            opacity: 0;
          }
          @keyframes discIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </ScreenShell>
    );
  }

  if (screen === "sandbox_config") {
    return (
      <Suspense
        fallback={
          <div
            style={{
              height: "100dvh",
              background: THEME.bg.base,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Loading...
          </div>
        }
      >
        <SandboxConfigScreen
          onStartBattle={handleStartSandboxBattle}
          onBack={() => setScreen("main_menu")}
          initialPlayerTeam={sandboxPlayerTeam}
          initialEnemyTeam={sandboxEnemyTeam}
          onConfigChange={handleSandboxConfigChange}
        />
      </Suspense>
    );
  }

  if (screen === "campaign_select") {
    return (
      <CampaignSelectScreen
        onSelect={handleCampaignSelect}
        onBack={() => setScreen("main_menu")}
        getCampaignStatus={getCampaignStatus}
      />
    );
  }

  if (screen === "tutorial_select") {
    return (
      <TutorialStarterScreen
        onStart={handleTutorialStart}
        onSkip={handleTutorialSkip}
      />
    );
  }

  if (screen === "campaign_draft") {
    return (
      <CampaignDraftScreen
        campaignId={selectedCampaignId}
        onComplete={(pokemon, gold) => {
          setDraftResults({ pokemon, gold });
          setScreen("select");
        }}
        onBack={() => setScreen("main_menu")}
      />
    );
  }

  if (screen === "select") {
    return (
      <PartySelectScreen
        onStart={handleStart}
        onRestart={handleRestart}
        preSelected={draftResults ?? undefined}
      />
    );
  }

  if (screen === "map" && runState) {
    return (
      <MapScreen
        run={runState}
        onSelectNode={handleSelectNode}
        onLevelUp={handleLevelUp}
        onSwap={handleSwap}
        onPromote={handlePromote}
        onRearrange={handleRearrange}
        onPurchase={handlePurchase}
        onForgetCard={handleForgetCard}
        onRestart={handleMainMenu}
      />
    );
  }

  if (screen === "rest" && runState) {
    return (
      <RestScreen
        run={runState}
        onHeal={handleRestHeal}
        onRestart={handleMainMenu}
      />
    );
  }

  if (screen === "event" && runState) {
    const currentNode = getCurrentNode(runState);
    const eventId =
      currentNode?.type === "event"
        ? (currentNode as EventNode).eventId
        : "training_camp";
    return (
      <EventScreen
        run={runState}
        eventId={eventId}
        onComplete={handleEventComplete}
        onRestart={handleMainMenu}
      />
    );
  }

  if (screen === "event_tester") {
    return (
      <Suspense
        fallback={
          <div
            style={{
              height: "100dvh",
              background: THEME.bg.base,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Loading...
          </div>
        }
      >
        <EventTesterScreen
          onBack={() => setScreen("main_menu")}
          onStartBossBattle={handleStartBossBattle}
        />
      </Suspense>
    );
  }

  if (screen === "classes_plan") {
    return (
      <Suspense
        fallback={
          <div
            style={{
              height: "100dvh",
              background: THEME.bg.base,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Loading...
          </div>
        }
      >
        <ClassesPlanScreen onBack={() => setScreen("debugging")} />
      </Suspense>
    );
  }

  if (screen === "ghost_revive" && runState) {
    return (
      <GhostReviveScreen
        run={runState}
        onRevive={handleGhostRevive}
        onSkip={handleGhostReviveSkip}
      />
    );
  }

  if (screen === "recruit" && runState) {
    const currentNode = getCurrentNode(runState);
    if (currentNode?.type === "recruit") {
      return (
        <RecruitScreen
          run={runState}
          node={currentNode as RecruitNode}
          battleResult={recruitBattleResult}
          onStartFight={handleRecruitFight}
          onRecruit={handleRecruitConfirm}
          onDecline={handleRecruitDecline}
          onRestart={handleMainMenu}
        />
      );
    }
    // Fallback to map if node not found
    setScreen("map");
    return null;
  }

  if (screen === "card_draft" && runState) {
    return (
      <CardDraftScreen
        run={runState}
        onDraftComplete={handleDraftComplete}
        onRestart={handleMainMenu}
        goldEarned={lastGoldEarned}
      />
    );
  }

  if (screen === "level_up" && runState) {
    return <LevelUpScreen run={runState} onComplete={handleLevelUpComplete} />;
  }

  if (screen === "battle" && battle.state) {
    return (
      <BattleScreen
        state={battle.state}
        phase={battle.phase}
        logs={battle.logs}
        pendingCardIndex={battle.pendingCardIndex}
        onSelectCard={handleSelectCard}
        onSelectTarget={handleSelectTarget}
        onPlayCard={handlePlayCard}
        onEndTurn={handleEndTurn}
        onSwitchPosition={battle.switchPosition}
        onRestart={handleMainMenu}
        onBattleEnd={handleBattleEnd}
        runState={runState ?? undefined}
        onBackToSandboxConfig={
          isSandboxBattle ? handleBackToSandboxConfig : undefined
        }
        tutorial={
          isTutorialMode && tutorial.isActive
            ? {
                isActive: tutorial.isActive,
                highlightTarget: tutorial.highlightTarget,
                stepText: tutorial.stepText,
                advance: tutorial.advance,
                skip: tutorial.skip,
                canSkip: tutorial.canSkip,
                allowInteraction: tutorial.allowInteraction,
                zone: tutorial.currentStep?.zone ?? "bottom",
              }
            : undefined
        }
      />
    );
  }

  if (screen === "act_transition" && runState) {
    return (
      <ActTransitionScreen
        run={runState}
        onContinue={handleActTransitionContinue}
        onRestart={handleMainMenu}
      />
    );
  }

  if (screen === "card_removal" && runState) {
    const cardRemovalNode = getCurrentCardRemovalNode(runState);
    if (cardRemovalNode) {
      return (
        <CardRemovalScreen
          run={runState}
          node={cardRemovalNode}
          onComplete={handleCardRemovalComplete}
          onSkip={handleCardRemovalSkip}
          onRestart={handleMainMenu}
        />
      );
    }
    // Fallback to map if node not found
    setScreen("map");
    return null;
  }

  if (screen === "run_victory" && runState) {
    return <RunVictoryScreen run={runState} onNewRun={handleRestart} />;
  }

  if (screen === "run_defeat") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          padding: 32,
          color: THEME.text.primary,
          minHeight: "100dvh",
          background: THEME.bg.base,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: "bold",
            color: "#ef4444",
            letterSpacing: THEME.heading.letterSpacing,
          }}
        >
          RUN OVER
        </div>
        <Flourish variant="heading" color="#ef4444" />
        <div
          style={{
            fontSize: 24,
            color: THEME.text.secondary,
            textAlign: "center",
          }}
        >
          Your party was defeated...
        </div>
        <button
          onClick={handleRestart}
          style={{
            padding: "16px 48px",
            fontSize: 18,
            fontWeight: "bold",
            borderRadius: 8,
            border: "none",
            background: THEME.accent,
            color: "#000",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Fallback: Unknown state - show debug info instead of blank screen
  const debugState = {
    screen,
    hasRunState: runState !== null,
    runState: runState
      ? {
          currentAct: runState.currentAct,
          currentNodeId: runState.currentNodeId,
          partySize: runState.party.length,
          party: runState.party.map((p) => ({
            formId: p.formId,
            currentHp: p.currentHp,
            maxHp: p.maxHp,
            knockedOut: p.knockedOut,
          })),
        }
      : null,
    hasBattleState: battle.state !== null,
    battlePhase: battle.phase,
    isSandboxBattle,
  };

  const copyDebugInfo = () => {
    const fullDebug = {
      ...debugState,
      fullRunState: runState,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(fullDebug, null, 2));
    alert("Debug info copied to clipboard!");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 32,
        color: THEME.text.primary,
        minHeight: "100dvh",
        background: THEME.bg.base,
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color: "#f59e0b",
        }}
      >
        Unexpected State
      </div>
      <div
        style={{
          fontSize: 16,
          color: THEME.text.secondary,
          textAlign: "center",
          maxWidth: 500,
        }}
      >
        The game reached an unexpected state. This info can help debug the
        issue:
      </div>
      <pre
        style={{
          background: THEME.bg.panel,
          padding: 16,
          borderRadius: 8,
          fontSize: 12,
          color: "#a5f3fc",
          maxWidth: "90vw",
          overflow: "auto",
          maxHeight: 300,
        }}
      >
        {JSON.stringify(debugState, null, 2)}
      </pre>
      <div style={{ display: "flex", gap: 16 }}>
        <button
          onClick={copyDebugInfo}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: "bold",
            borderRadius: 8,
            border: `2px solid ${THEME.border.bright}`,
            background: "transparent",
            color: THEME.text.secondary,
            cursor: "pointer",
          }}
        >
          Copy Debug Info
        </button>
        <button
          onClick={handleRestart}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: "bold",
            borderRadius: 8,
            border: "none",
            background: THEME.accent,
            color: "#000",
            cursor: "pointer",
          }}
        >
          Return to Menu
        </button>
      </div>
      {hasSavedGame && (
        <button
          onClick={handleContinue}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: "bold",
            borderRadius: 8,
            border: "2px solid #22c55e",
            background: "transparent",
            color: "#22c55e",
            cursor: "pointer",
          }}
        >
          Try to Recover from Save
        </button>
      )}
    </div>
  );
}

// ── Disclaimer Section ──────────────────────────────────────────────

function DisclaimerSection({
  title,
  children,
  first,
  last,
}: {
  title: string;
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <div style={{ marginBottom: last ? 0 : 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
          ...(first
            ? {}
            : {
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid ${THEME.border.subtle}`,
              }),
        }}
      >
        <div
          style={{
            width: 4,
            height: 4,
            background: THEME.border.medium,
            transform: "rotate(45deg)",
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            color: THEME.text.primary,
            ...THEME.heading,
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ paddingLeft: 14 }}>{children}</div>
    </div>
  );
}
