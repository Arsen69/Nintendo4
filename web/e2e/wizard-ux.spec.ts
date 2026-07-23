import { test, expect } from '@playwright/test';

async function startThreePlayerGame(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Wizard' }).click();
  const nameInputs = page.locator('.player-names input');
  await nameInputs.nth(0).fill('Alice');
  await nameInputs.nth(1).fill('Bob');
  await nameInputs.nth(2).fill('Cid');
  await page.getByRole('button', { name: 'Commencer la partie' }).click();
  await expect(page.getByText('1 / 20')).toBeVisible();
}

/** Fills the current-round row's bid inputs (fixed player-column order) and confirms. */
async function fillBids(page: import('@playwright/test').Page, values: string[]) {
  const bids = page.locator('input[id^="bid-"]');
  for (let p = 0; p < values.length; p++) {
    await bids.nth(p).fill(values[p]);
  }
  await page.getByRole('button', { name: 'Valider les prédictions' }).click();
}

/** Fills the current-round row's actual-tricks inputs and confirms. */
async function fillActual(page: import('@playwright/test').Page, values: string[]) {
  const actuals = page.locator('input[id^="actual-"]');
  await expect(actuals.first()).toBeEnabled();
  for (let p = 0; p < values.length; p++) {
    await actuals.nth(p).fill(values[p]);
  }
  await page.getByRole('button', { name: 'Valider les résultats' }).click();
}

test('out-of-range bid input shows a visible error and disables confirm', async ({ page }) => {
  await startThreePlayerGame(page);

  const bidInputs = page.locator('input[id^="bid-"]');
  await bidInputs.nth(0).fill('5'); // cardsDealt is 1, so 5 is out of range
  await bidInputs.nth(1).fill('0');
  await bidInputs.nth(2).fill('0');

  await expect(page.locator('.error')).toContainText('entier entre 0 et 1');
  await expect(page.getByRole('button', { name: 'Valider les prédictions' })).toBeDisabled();

  // fixing the value clears the error and re-enables the button (0, not 1: a bid of
  // 1 here would sum to cardsDealt and trip the separate dealer-restriction rule)
  await bidInputs.nth(0).fill('0');
  await expect(page.locator('.error')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Valider les prédictions' })).toBeEnabled();
});

test('abandoning an in-progress game requires confirmation', async ({ page }) => {
  await startThreePlayerGame(page);

  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Abandonner');

  // cancelling keeps the game exactly where it was
  await page.getByRole('button', { name: 'Continuer la partie' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('1 / 20')).toBeVisible();

  // confirming actually abandons it, back to setup
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  await page.getByRole('button', { name: 'Abandonner' }).click();
  await expect(page.getByRole('heading', { name: 'Joueurs' })).toBeVisible();
});

test('restarting from the end screen requires confirmation', async ({ page }) => {
  test.setTimeout(60_000);
  await startThreePlayerGame(page);

  // finish all 20 rounds fast: everyone bids 0, Alice wins every trick dealt.
  for (let round = 1; round <= 20; round++) {
    const bids = page.locator('input[id^="bid-"]');
    const count = await bids.count();
    for (let p = 0; p < count; p++) {
      await bids.nth(p).fill('0');
    }
    await page.getByRole('button', { name: 'Valider les prédictions' }).click();

    const actuals = page.locator('input[id^="actual-"]');
    await expect(actuals.first()).toBeEnabled();
    const cardsDealtText = await page.locator('.round-info-row div').nth(1).innerText();
    const cardsDealt = cardsDealtText.split('\n').pop()!.trim();
    await actuals.nth(0).fill(cardsDealt);
    for (let p = 1; p < count; p++) {
      await actuals.nth(p).fill('0');
    }
    await page.getByRole('button', { name: 'Valider les résultats' }).click();
  }

  await expect(page.getByText('Fin de la partie')).toBeVisible();

  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('effacée');

  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Fin de la partie')).toBeVisible();

  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  await page.getByRole('button', { name: 'Recommencer' }).click();
  await expect(page.getByRole('heading', { name: 'Joueurs' })).toBeVisible();
});

test('editing a past round recomputes its score and the running totals', async ({ page }) => {
  await startThreePlayerGame(page);

  // round 1 (cardsDealt 1): everyone bids 0, Cid (seat 2) wins the only trick (mismatch, -10)
  await fillBids(page, ['0', '0', '0']);
  await fillActual(page, ['0', '0', '1']);

  // round 2 (cardsDealt 2): everyone bids 0, Bob (seat 1) wins both tricks (mismatch, -20)
  await fillBids(page, ['0', '0', '0']);
  await fillActual(page, ['0', '2', '0']);

  await expect(page.getByText('3 / 20')).toBeVisible();
  await expect(page.locator('.score-table tbody tr.round-row')).toHaveCount(2);

  // Round 2's total for everyone is 20 (correct bid of 0). Open round 1 for editing and
  // correct it: it was actually Alice who won the trick, not Cid.
  await page.getByRole('button', { name: 'Modifier la manche 1' }).click();
  const editBids = page.locator('input[id^="edit-bid-1-"]');
  const editActual = page.locator('input[id^="edit-actual-1-"]');
  await expect(editBids.nth(0)).toHaveValue('0');
  await expect(editActual.nth(2)).toHaveValue('1'); // Cid's original actual

  await editActual.nth(2).fill('0'); // Cid no longer wins
  await editActual.nth(0).fill('1'); // Alice wins instead
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  // Editing closes the row and the score table reflects the corrected round 1 + untouched
  // round 2. Alice: -10 (round 1, now missed) + 20 (round 2) = 10. Bob: 20 + -20 = 0.
  // Cid: 20 + 20 = 40.
  await expect(page.getByRole('button', { name: 'Modifier la manche 1' })).toBeVisible();
  const scoreTable = page.locator('.score-table');
  await expect(scoreTable).toContainText('total 10');
  await expect(scoreTable).toContainText('total 0');
  await expect(scoreTable).toContainText('total 40');

  // A rejected correction (violates the tricks-total rule) surfaces the same error and
  // leaves the round unchanged.
  await page.getByRole('button', { name: 'Modifier la manche 1' }).click();
  await editActual.nth(0).fill('1');
  await editActual.nth(1).fill('1'); // sum now 2, cardsDealt for round 1 is 1
  await expect(page.locator('.error')).toContainText('doit être égal');
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  await page.getByRole('button', { name: 'Annuler' }).click();
});
