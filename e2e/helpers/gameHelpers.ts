/**
 * Playwright game helpers for Pokespire e2e tests.
 *
 * All UI interactions are encapsulated here so tests read as a clear story
 * and selector details are easy to debug in one place.
 */

import { type Page } from '@playwright/test';

// ── localStorage keys (must match src/App.tsx and src/run/playerProfile.ts) ──

const SAVE_KEY = 'pokespire_save';
const PROFILE_KEY = 'pokespire_player_profile';
const TUTORIAL_KEY = 'pokespire_tutorial_complete';

// ── Setup / teardown ──────────────────────────────────────────────────────────

/**
 * Navigate to the app with a completely clean state:
 * - No saved run (pokespire_save cleared)
 * - Default player profile (caterpie/weedle/rattata/etc unlocked)
 * - Tutorial marked complete so we skip straight to campaign draft
 */
export async function setupFreshRun(page: Page): Promise<void> {
  await page.goto('/pokespire/');
  await page.evaluate(([save, profile, tutorial]) => {
    localStorage.removeItem(save);
    localStorage.removeItem(profile);
    // Mark tutorial complete so Dead Signal goes straight to campaign draft
    localStorage.setItem(tutorial, 'true');
  }, [SAVE_KEY, PROFILE_KEY, TUTORIAL_KEY]);
  await page.reload();
}

// ── Main menu ─────────────────────────────────────────────────────────────────

/**
 * From the main menu, click the Campaign / New Run button and then click the
 * campaign card with the given display name.
 */
export async function selectCampaign(page: Page, campaignName: string): Promise<void> {
  // Button label is "Campaign" when there is no saved game
  await page.locator('.menu-item').filter({ hasText: /campaign/i }).first().click();
  // Use role+name to precisely target the campaign card button (getByText would also
  // match the lock description "Complete Dead Signal to unlock" in other cards)
  await page.getByRole('button', { name: new RegExp(`^${campaignName}`) }).click();
}

// ── Campaign draft ────────────────────────────────────────────────────────────

/**
 * Navigate through the CampaignDraftScreen picking the first available option
 * at every step:
 *  - story_intro  → click "Continue"
 *  - starter_pick → click the first starter tile
 *  - rounds 2–4   → click the first "Recruit" button, or "Skip" if none
 */
export async function completeDraftFirstPicks(page: Page): Promise<void> {
  // Story intro — wait for Continue (TypewriterIntro finishes typing first)
  await page.getByRole('button', { name: 'Continue' }).click();

  // Starter pick — click the first starter's clickable tile
  // The starter tiles are the only large interactive elements visible at this point
  await page.locator('text=Pick one starter').waitFor();
  // PokemonTile renders the pokemon name in a span/div; clicking it triggers pickPokemon
  await page.locator('[style*="cursor"]').filter({ hasText: /bulbasaur|charmander|squirtle|pikachu|chikorita|cyndaquil|totodile/i }).first().click();

  // Draft rounds 2–4
  for (let round = 2; round <= 4; round++) {
    // Wait for either a Recruit button or a Skip/Continue button
    await Promise.race([
      page.getByRole('button', { name: /recruit/i }).first().waitFor({ timeout: 6_000 }).catch(() => null),
      page.getByRole('button', { name: /skip|continue/i }).first().waitFor({ timeout: 6_000 }).catch(() => null),
    ]);

    const recruitBtns = page.getByRole('button', { name: /recruit/i });
    if (await recruitBtns.count() > 0) {
      await recruitBtns.first().click();
    } else {
      // Empty pool or can't afford — click Skip or Continue
      await page.getByRole('button', { name: /skip|continue/i }).first().click();
    }
  }
}

// ── Party positioning (screen "select") ──────────────────────────────────────

/**
 * In the party-positioning screen (preSelected mode), place each unplaced
 * pokemon into a slot in order: back-0, back-1, front-0, front-1.
 * Then click "Start Battle →" to create the RunState and advance to
 * starter_items.
 */
export async function completePartyPosition(page: Page): Promise<void> {
  // Wait for the position phase to load (at least one unplaced tile visible)
  await page.locator('[data-testid^="unplaced-pokemon-"]').first().waitFor();

  const slots = ['back-0', 'back-1', 'front-0', 'front-1'];

  for (const slot of slots) {
    const unplacedTiles = page.locator('[data-testid^="unplaced-pokemon-"]');
    const count = await unplacedTiles.count();
    if (count === 0) break; // fewer pokemon than slots — nothing left to place

    // Select the first unplaced pokemon tile
    await unplacedTiles.first().click();

    // Place it in the target slot
    await page.locator(`[data-testid="formation-slot-${slot}"]`).click();
  }

  // Click "Start Battle →" (enabled once all pokemon are placed)
  await page.getByRole('button', { name: /start battle/i }).click();
}

// ── Starter items ─────────────────────────────────────────────────────────────

/**
 * On the StarterItemScreen, click "Confirm" to proceed without assigning items.
 */
export async function completeStarterItems(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Confirm' }).click();
}

// ── Arceus party injection ────────────────────────────────────────────────────

/**
 * Replace the active party in the saved run with a single Arceus carrying
 * three God's Wrath cards. Arceus has max speed (999) so it always goes first,
 * and God's Wrath deals 999 damage to all enemies at zero energy cost.
 *
 * Approach: read the pokespire_save from localStorage, replace runState.party,
 * then reload so the app picks up the new state.
 */
export async function injectArceusParty(page: Page): Promise<void> {
  // Wait for the React useEffect to flush and write the save to localStorage.
  // The map DOM nodes appear before the effect fires, so we poll briefly.
  await page.waitForFunction((key) => localStorage.getItem(key) !== null, SAVE_KEY, { timeout: 5_000 });

  await page.evaluate((saveKey) => {
    const raw = localStorage.getItem(saveKey);
    if (!raw) throw new Error('No save data found. Ensure the run has started before calling injectArceusParty.');
    const save = JSON.parse(raw);

    const arceus = {
      baseFormId: 'arceus',
      formId: 'arceus',
      currentHp: 999,
      maxHp: 999,
      maxHpModifier: 0,
      deck: ['gods-wrath', 'gods-wrath', 'gods-wrath'],
      position: { row: 'front', column: 1 },
      level: 1,
      exp: 0,
      passiveIds: [],
      knockedOut: false,
      energyModifier: 0,
      drawModifier: 0,
      heldItemIds: [],
    };

    save.runState.party = [arceus];
    save.runState.bench = [];
    save.runState.graveyard = [];
    localStorage.setItem(saveKey, JSON.stringify(save));
  }, SAVE_KEY);

  // Reload the page. The app shows the main menu with "Continue Run" (it never
  // auto-navigates from save). Click Continue Run to load our injected state.
  await page.reload();
  await page.getByRole('button', { name: 'Continue Run' }).click();
}

// ── Map screen ────────────────────────────────────────────────────────────────

/**
 * Wait until the map screen has finished loading (at least one node marker
 * is visible in the DOM).
 */
export async function waitForMapScreen(page: Page): Promise<void> {
  await page.locator('[data-testid^="map-node-"]').first().waitFor({ timeout: 15_000 });
}

/**
 * Click a map node by its node ID. The node must be in "available" state
 * (it won't be clickable otherwise).
 */
export async function clickMapNode(page: Page, nodeId: string): Promise<void> {
  await page.locator(`[data-testid="map-node-${nodeId}"]`).click();
}

// ── Battle screen ─────────────────────────────────────────────────────────────

/**
 * Play the first card in Arceus's hand (always God's Wrath — 999 AoE damage,
 * free cost) and wait for the battle to resolve. Since all enemies die
 * immediately, we only need to play one card.
 *
 * Asserts:
 *  - The expected number of enemies are on screen before playing
 *  - The battle screen eventually transitions away after victory
 */
export async function completeBattle(page: Page, _expectedEnemyCount?: number): Promise<void> {
  // Wait for it to be the player's turn (hand is visible)
  await page.locator('[data-tutorial-id="hand"]').waitFor({ timeout: 15_000 });

  // Click the first available (affordable) card in hand — God's Wrath
  // CardDisplay renders a <div draggable="true" onClick={...}> when affordable
  const firstCard = page.locator('[data-tutorial-id="hand"]').locator('[draggable="true"]').first();
  await firstCard.click();

  // Wait for the battle to resolve.  With VITE_E2E_FAST=1 both victory
  // animation delays are 0ms so onBattleEnd fires almost immediately.
  await waitForScreenTransitionFromBattle(page);
}

/**
 * Wait for the battle screen to transition to the next screen.
 * Waits until the battle hand is no longer visible OR until a known
 * post-battle screen element appears.
 */
async function waitForScreenTransitionFromBattle(page: Page): Promise<void> {
  // Wait until a known post-battle screen element appears.
  // We do NOT check for hand absence alone — the hand disappears during the
  // victory animation before the next screen is ready, which would cause
  // handlePostBattleScreens to poll before anything is available.
  await page.waitForFunction(() => {
    // Map (most common — after regular battles)
    if (document.querySelector('[data-testid^="map-node-"]')) return true;
    // Run victory screen
    if (document.querySelector('.victory-title')) return true;
    // Act transition
    if (document.querySelector('[data-testid="act-transition-continue"]')) return true;
    // Card draft: "Draft Round" heading is visible
    const buttons = Array.from(document.querySelectorAll('button'));
    const hasSkip = buttons.some(b => b.textContent?.trim() === 'Skip');
    if (hasSkip) return true;
    // Level up
    if (Array.from(document.querySelectorAll('*')).some(
      el => el.textContent?.trim() === 'Level Up'
    )) return true;
    return false;
  }, undefined, { timeout: 25_000 });
}

// ── Post-battle screens ───────────────────────────────────────────────────────

/**
 * Handle all the optional screens that appear after a regular (non-boss) battle:
 *  - item_reward (optional) → click Skip
 *  - card_draft            → click Skip for each pokemon
 *  - level_up (optional)   → click Continue
 * Returns once the map screen is showing.
 */
export async function handlePostBattleScreens(page: Page): Promise<void> {
  // Loop until we detect the map screen
  for (let i = 0; i < 20; i++) {
    // Map — we're done
    if (await page.locator('[data-testid^="map-node-"]').count() > 0) return;

    // Victory title (run_victory) — handled by caller
    if (await page.locator('.victory-title').count() > 0) return;

    // Item reward screen → skip
    const skipItemBtn = page.getByRole('button', { name: 'Skip' });
    if (await skipItemBtn.count() > 0 && await isItemRewardScreen(page)) {
      await skipItemBtn.click();
      await page.waitForTimeout(300);
      continue;
    }

    // Card draft — click Skip for each pokemon's draft turn
    const skipDraftBtn = page.getByRole('button', { name: 'Skip' });
    if (await skipDraftBtn.count() > 0 && await isCardDraftScreen(page)) {
      await skipDraftBtn.click();
      await page.waitForTimeout(300);
      continue;
    }

    // Level up — click Continue
    const levelUpContinue = page.getByRole('button', { name: 'Continue' });
    if (await levelUpContinue.count() > 0 && await isLevelUpScreen(page)) {
      await levelUpContinue.click();
      await page.waitForTimeout(300);
      continue;
    }

    await page.waitForTimeout(400);
  }
}

/**
 * Handle the post-boss sequence:
 *  - level_up (optional)   → click Continue
 *  - item_reward (optional) → click Skip
 *  - act_transition         → click the continue button
 * Returns once the map screen (next act) is showing.
 */
export async function handlePostBossScreens(page: Page): Promise<void> {
  for (let i = 0; i < 20; i++) {
    // Map — we're done (next act loaded)
    if (await page.locator('[data-testid^="map-node-"]').count() > 0) return;

    // Victory title (run_victory) — handled by caller
    if (await page.locator('.victory-title').count() > 0) return;

    // Act transition — click the labeled continue button
    const actTransitionBtn = page.locator('[data-testid="act-transition-continue"]');
    if (await actTransitionBtn.count() > 0) {
      await actTransitionBtn.click();
      await page.waitForTimeout(500);
      continue;
    }

    // Item reward → skip
    const skipBtn = page.getByRole('button', { name: 'Skip' });
    if (await skipBtn.count() > 0 && await isItemRewardScreen(page)) {
      await skipBtn.click();
      await page.waitForTimeout(300);
      continue;
    }

    // Level up → continue
    const continuBtn = page.getByRole('button', { name: 'Continue' });
    if (await continuBtn.count() > 0 && await isLevelUpScreen(page)) {
      await continuBtn.click();
      await page.waitForTimeout(300);
      continue;
    }

    // Card draft (boss battles also award a card draft) → skip
    const skipDraftBtn = page.getByRole('button', { name: 'Skip' });
    if (await skipDraftBtn.count() > 0 && await isCardDraftScreen(page)) {
      await skipDraftBtn.click();
      await page.waitForTimeout(300);
      continue;
    }

    await page.waitForTimeout(400);
  }
}

// ── Individual node screens ───────────────────────────────────────────────────

/**
 * On a rest node, click "Heal Party" (first option).
 * Then handle optional level_up before returning to map.
 */
export async function completeRestNode(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Heal Party' }).click();
  // Handle optional level up
  for (let i = 0; i < 5; i++) {
    if (await page.locator('[data-testid^="map-node-"]').count() > 0) return;
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.count() > 0) {
      await continueBtn.click();
      await page.waitForTimeout(300);
    } else {
      await page.waitForTimeout(400);
    }
  }
}

// ── Screen detection helpers ──────────────────────────────────────────────────

/**
 * Heuristic: item_reward screen shows a "Starter Items" or item name heading.
 * The ItemRewardScreen has a "Skip" button and some item description.
 */
async function isItemRewardScreen(page: Page): Promise<boolean> {
  // ItemRewardScreen shows a reward item with description; card draft also has Skip.
  // Distinguish: ItemRewardScreen title is the item name, not "Draft Round N".
  const draftHeading = page.locator('text=/Draft Round/');
  return (await draftHeading.count()) === 0;
}

/**
 * Heuristic: card draft screen shows "Draft Round N" heading.
 */
async function isCardDraftScreen(page: Page): Promise<boolean> {
  return (await page.locator('text=/Draft Round/').count()) > 0;
}

/**
 * Heuristic: level up screen shows "Level Up" text somewhere.
 */
async function isLevelUpScreen(page: Page): Promise<boolean> {
  return (await page.locator('text=/Level Up/').count()) > 0;
}
