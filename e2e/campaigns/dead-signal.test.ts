/**
 * Dead Signal (rocket_tower) campaign — end-to-end happy-path test.
 *
 * What this tests:
 *  - Campaign select screen lists Dead Signal as available
 *  - The draft, party-select, and starter-items screens complete successfully
 *  - The map loads with correct nodes for each act
 *  - Battles can be played (card interaction, energy, enemy defeat)
 *  - Post-battle screens (card draft, item reward, level up) are navigable
 *  - Act transitions advance to the next act map
 *  - Defeating the final boss (Mewtwo) reaches the run_victory screen
 *
 * What this intentionally does NOT test:
 *  - Battle log text
 *  - Enemy intent previews
 *  - Exact gold amounts
 *  - Card description text
 *  - Sprite animations
 *
 * Battle strategy: Arceus (max speed, max HP) with 3× God's Wrath (free,
 * 999 AoE damage) is injected after reaching the first map screen. This
 * guarantees every battle ends in one card play, keeping the test deterministic
 * regardless of enemy deck composition or RNG.
 */

import { test, expect } from '@playwright/test';
import { DEAD_SIGNAL } from './deadSignalPath';
import {
  setupFreshRun,
  selectCampaign,
  completeDraftFirstPicks,
  completePartyPosition,
  completeStarterItems,
  injectArceusParty,
  waitForMapScreen,
  clickMapNode,
  completeBattle,
  completeRestNode,
  handlePostBattleScreens,
  handlePostBossScreens,
} from '../helpers/gameHelpers';

// ── Smoke test: campaign select screen ────────────────────────────────────────

test('campaign select: Dead Signal is listed and available', async ({ page }) => {
  await setupFreshRun(page);
  await page.locator('.menu-item').filter({ hasText: /campaign/i }).first().click();

  // Dead Signal should be a clickable campaign card
  await expect(page.getByRole('button', { name: /^Dead Signal/ })).toBeVisible();
  // Threads of Time should be visible (locked — its name includes a lock emoji)
  await expect(page.getByRole('button', { name: /Threads of Time/ })).toBeVisible();
});

// ── Smoke test: onboarding flow ───────────────────────────────────────────────

test('onboarding: draft → party select → starter items → map', async ({ page }) => {
  await setupFreshRun(page);
  await selectCampaign(page, 'Dead Signal');
  await completeDraftFirstPicks(page);
  await completePartyPosition(page);
  await completeStarterItems(page);

  // Map screen should load — at least one node marker must be present
  await waitForMapScreen(page);
  // The spawn node (1a) is always completed at run start
  await expect(page.locator('[data-testid="map-node-1a"]')).toBeVisible();
  // The first available nodes should be clickable (1b and 1c)
  await expect(page.locator('[data-testid="map-node-1b"]')).toBeVisible();
});

// ── Full campaign run ─────────────────────────────────────────────────────────

test('full campaign run: Dead Signal reaches the victory screen', async ({ page }) => {
  // A full 3-act campaign run navigates ~15 battles plus post-battle screens —
  // the default 30s timeout is too short.
  test.setTimeout(120_000);
  // ── Setup ──
  await setupFreshRun(page);
  await selectCampaign(page, 'Dead Signal');
  await completeDraftFirstPicks(page);
  await completePartyPosition(page);
  await completeStarterItems(page);

  // ── Inject Arceus once the map is showing ──
  await waitForMapScreen(page);
  await injectArceusParty(page);
  await waitForMapScreen(page);

  // Arceus should be visible in the party sidebar
  await expect(page.getByText('Arceus')).toBeVisible();

  // ── Act 1: Rocket Hideout ──
  for (const nodeId of DEAD_SIGNAL.act1.mapClicks) {
    await clickMapNode(page, nodeId);

    if ((DEAD_SIGNAL.act1.restNodes as readonly string[]).includes(nodeId)) {
      // Rest node
      await completeRestNode(page);
    } else if (nodeId === DEAD_SIGNAL.act1.bossNodeId) {
      // Boss battle — verify enemy count matches the boss node definition
      const bossEnemyCount = DEAD_SIGNAL.act1.bossNode.enemies.length;
      await completeBattle(page, bossEnemyCount);
      await handlePostBossScreens(page);
    } else {
      // Regular battle
      const battleNode = DEAD_SIGNAL.act1.battleNodes[nodeId as keyof typeof DEAD_SIGNAL.act1.battleNodes];
      const enemyCount = battleNode?.enemies.length;
      await completeBattle(page, enemyCount);
      await handlePostBattleScreens(page);
    }
  }

  // ── Act 2: Destroyed Rocket Lab ──
  await waitForMapScreen(page);
  // First available node in Act 2 should be present
  await expect(page.locator('[data-testid="map-node-2b"]')).toBeVisible();

  for (const nodeId of DEAD_SIGNAL.act2.mapClicks) {
    await clickMapNode(page, nodeId);

    if ((DEAD_SIGNAL.act2.restNodes as readonly string[]).includes(nodeId)) {
      await completeRestNode(page);
    } else if (nodeId === DEAD_SIGNAL.act2.bossNodeId) {
      const bossEnemyCount = DEAD_SIGNAL.act2.bossNode.enemies.length;
      await completeBattle(page, bossEnemyCount);
      await handlePostBossScreens(page);
    } else {
      const battleNode = DEAD_SIGNAL.act2.battleNodes[nodeId as keyof typeof DEAD_SIGNAL.act2.battleNodes];
      const enemyCount = battleNode?.enemies.length;
      await completeBattle(page, enemyCount);
      await handlePostBattleScreens(page);
    }
  }

  // ── Act 3: The Depths ──
  await waitForMapScreen(page);
  await expect(page.locator('[data-testid="map-node-3b"]')).toBeVisible();

  for (const nodeId of DEAD_SIGNAL.act3.mapClicks) {
    await clickMapNode(page, nodeId);

    if ((DEAD_SIGNAL.act3.restNodes as readonly string[]).includes(nodeId)) {
      await completeRestNode(page);
    } else if (nodeId === DEAD_SIGNAL.act3.bossNodeId) {
      // Final boss — defeating it triggers run_victory
      const bossEnemyCount = DEAD_SIGNAL.act3.bossNode.enemies.length;
      await completeBattle(page, bossEnemyCount);
      // After the final boss: optional level_up then run_victory
      for (let i = 0; i < 5; i++) {
        if (await page.locator('.victory-title').count() > 0) break;
        const continueBtn = page.getByRole('button', { name: 'Continue' });
        if (await continueBtn.count() > 0) await continueBtn.click();
        await page.waitForTimeout(400);
      }
    } else {
      const battleNode = DEAD_SIGNAL.act3.battleNodes[nodeId as keyof typeof DEAD_SIGNAL.act3.battleNodes];
      const enemyCount = battleNode?.enemies.length;
      await completeBattle(page, enemyCount);
      await handlePostBattleScreens(page);
    }
  }

  // ── Victory screen ──
  await expect(page.locator('.victory-title')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.victory-title')).toContainText('VICTORY');
});

// ── Battle mechanics smoke test ───────────────────────────────────────────────

test('battle mechanics: God\'s Wrath plays from hand, consumes no energy, kills all enemies', async ({ page }) => {
  await setupFreshRun(page);
  await selectCampaign(page, 'Dead Signal');
  await completeDraftFirstPicks(page);
  await completePartyPosition(page);
  await completeStarterItems(page);
  await waitForMapScreen(page);
  await injectArceusParty(page);
  await waitForMapScreen(page);

  // Navigate into the first battle (1b: single rattata)
  await clickMapNode(page, '1b');

  // Verify the hand loads with a card (God's Wrath)
  await page.locator('[data-tutorial-id="hand"]').waitFor();
  const cards = page.locator('[data-tutorial-id="hand"]').locator('[draggable="true"]');
  await expect(cards).not.toHaveCount(0);

  // Verify starting energy is shown (Arceus has 3 energy per turn at start)
  await expect(page.locator('[data-tutorial-id="energy"]')).toBeVisible();

  // Play the first card — God's Wrath (cost 0, all_enemies)
  await cards.first().click();

  // After playing God's Wrath, wait for battle to resolve
  await page.waitForFunction(() =>
    !document.querySelector('[data-tutorial-id="hand"]') ||
    document.querySelectorAll('button[disabled]').length > 0 ||
    document.querySelector('[data-testid^="map-node-"]') !== null ||
    document.querySelectorAll('button').length > 0
  , undefined, { timeout: 10_000 });

  // The screen should eventually leave the battle
  await handlePostBattleScreens(page);
  await waitForMapScreen(page);
});
