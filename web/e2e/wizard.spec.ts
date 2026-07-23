import { test, expect } from '@playwright/test';

/** Plays a full 4-player Wizard game end to end in a real browser. Covers what the unit/
 *  component test suite can't: actual rendering, the dealer's-bid-restriction UI flow, the
 *  score table remaining a real table at narrow viewports, and that the app runs with zero
 *  console errors. */
test('play a full 4-player Wizard game', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto('/');
  await page.getByRole('link', { name: 'Wizard' }).click();
  await expect(page.getByRole('heading', { name: 'Joueurs' })).toBeVisible();

  await page.getByRole('button', { name: 'Augmenter le nombre de joueurs' }).click();
  const nameInputs = page.locator('.player-names input');
  await nameInputs.nth(0).fill('Alice');
  await nameInputs.nth(1).fill('Bob');
  await nameInputs.nth(2).fill('Cid');
  await nameInputs.nth(3).fill('Dan');
  await page.getByRole('button', { name: 'Commencer la partie' }).click();

  await expect(page.getByText('1 / 15')).toBeVisible();
  await expect(page.locator('.round-info')).toContainText('Alice'); // round 1 dealer

  // The current-round row is in fixed player-column order (Alice, Bob, Cid, Dan), not
  // bidding order. Round 1's dealer is Alice (seat 0): make the bid total equal cardsDealt
  // (1) to trigger the dealer's-bid restriction. Validation is live: the error shows and the
  // button disables without a click.
  const bidInputs = page.locator('input[id^="bid-"]');
  await bidInputs.nth(1).fill('0'); // Bob
  await bidInputs.nth(2).fill('0'); // Cid
  await bidInputs.nth(3).fill('0'); // Dan
  await bidInputs.nth(0).fill('1'); // Alice (dealer) -- sum == cardsDealt, should be rejected
  await expect(page.locator('.error')).toContainText('Alice');
  await expect(page.locator('.error')).toContainText('donneur');
  await expect(page.getByRole('button', { name: 'Valider les prédictions' })).toBeDisabled();

  // Fix Alice's bid so the total no longer equals cardsDealt.
  await bidInputs.nth(0).fill('0');
  await page.getByRole('button', { name: 'Valider les prédictions' }).click();

  // Actual tricks must sum to cardsDealt (1); give it to Dan.
  const actualInputs = page.locator('input[id^="actual-"]');
  await expect(actualInputs.first()).toBeEnabled();
  await actualInputs.nth(0).fill('0'); // Alice
  await actualInputs.nth(1).fill('0'); // Bob
  await actualInputs.nth(2).fill('0'); // Cid
  await actualInputs.nth(3).fill('1'); // Dan
  await page.getByRole('button', { name: 'Valider les résultats' }).click();

  // Round 2: dealer rotates to Bob, and the score table now has one completed round row.
  await expect(page.getByText('2 / 15')).toBeVisible();
  await expect(page.locator('.score-table tbody tr.round-row')).toHaveCount(1);

  // Score table stays a real table at narrow viewports too (horizontally scrollable).
  await page.setViewportSize({ width: 380, height: 900 });
  await expect(page.locator('.score-table')).toBeVisible();
  await expect(page.locator('.score-table tbody tr.round-row')).toHaveCount(1);
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator('.score-table')).toBeVisible();

  // Play out the remaining 14 rounds (Alice always wins the trick, everyone bids 0) to
  // reach the end screen (totalRounds = 15 for 4 players; round 1 is already done above).
  // The current-round row stays mounted across phases (only its inputs' disabled state
  // changes), so there's no DOM-swap to wait out between bidding and results anymore.
  for (let i = 0; i < 14; i++) {
    const bids = page.locator('input[id^="bid-"]');
    const bidCount = await bids.count();
    for (let p = 0; p < bidCount; p++) {
      await bids.nth(p).fill('0');
    }
    await page.getByRole('button', { name: 'Valider les prédictions' }).click();

    const actuals = page.locator('input[id^="actual-"]');
    await expect(actuals.first()).toBeEnabled();
    const cardsDealtText = await page.locator('.round-info-row div').nth(1).innerText();
    const cardsDealt = cardsDealtText.split('\n').pop()!.trim();
    await actuals.nth(0).fill(cardsDealt); // Alice wins every trick dealt
    for (let p = 1; p < bidCount; p++) {
      await actuals.nth(p).fill('0');
    }
    await page.getByRole('button', { name: 'Valider les résultats' }).click();
  }

  await expect(page.getByText('Fin de la partie')).toBeVisible();
  await expect(page.locator('.rank-row')).toHaveCount(4);

  expect(consoleErrors).toEqual([]);
});
