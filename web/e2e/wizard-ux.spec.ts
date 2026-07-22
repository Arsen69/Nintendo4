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

test('out-of-range bid input shows a visible error and disables confirm', async ({ page }) => {
  await startThreePlayerGame(page);

  const bidInputs = page.locator('.input-row input[type="number"]');
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

  // play round 1 (cardsDealt 1) to reach round 2, then undo isn't needed here —
  // instead we just directly abandon via new game and start a fresh, tiny game by
  // reusing the same 3 players but this time drive it to completion quickly by
  // undoing is out of scope; play only what's needed: finish all 20 rounds fast.
  for (let round = 1; round <= 20; round++) {
    await expect(page.getByRole('heading', { name: 'Prédictions' })).toBeVisible();
    const bids = page.locator('.input-row input[type="number"]');
    const count = await bids.count();
    for (let p = 0; p < count; p++) {
      await bids.nth(p).fill('0');
    }
    await page.getByRole('button', { name: 'Valider les prédictions' }).click();

    await expect(page.getByRole('heading', { name: 'Plis remportés' })).toBeVisible();
    const cardsDealtText = await page.locator('.round-info-row div').nth(1).innerText();
    const cardsDealt = cardsDealtText.split('\n').pop()!.trim();
    const actuals = page.locator('.input-row input[type="number"]');
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

test('undo last round restores its original bids/actual for editing', async ({ page }) => {
  await startThreePlayerGame(page);

  // round 1 (cardsDealt 1): everyone bids 0, Alice wins the trick (mismatch, -10)
  const bidInputs = page.locator('.input-row input[type="number"]');
  await bidInputs.nth(0).fill('0');
  await bidInputs.nth(1).fill('0');
  await bidInputs.nth(2).fill('0');
  await page.getByRole('button', { name: 'Valider les prédictions' }).click();
  await expect(page.getByRole('heading', { name: 'Plis remportés' })).toBeVisible();

  const actualInputs = page.locator('.input-row input[type="number"]');
  await actualInputs.nth(0).fill('1');
  await actualInputs.nth(1).fill('0');
  await actualInputs.nth(2).fill('0');
  await page.getByRole('button', { name: 'Valider les résultats' }).click();

  await expect(page.getByText('2 / 20')).toBeVisible();
  await expect(page.locator('.score-table tbody tr')).toHaveCount(1);

  // Undo: back to round 1 bidding, with the original bids pre-filled.
  await page.getByRole('button', { name: 'Annuler la dernière manche' }).click();
  await expect(page.getByText('1 / 20')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prédictions' })).toBeVisible();
  await expect(page.getByText("Aucune manche jouée pour l'instant.").first()).toBeVisible();

  const restoredBids = await bidInputs.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  expect(restoredBids).toEqual(['0', '0', '0']);

  // Re-confirm the (unchanged) bids; the results phase should have the original actual
  // values (1, 0, 0) pre-filled rather than reset to zero.
  await page.getByRole('button', { name: 'Valider les prédictions' }).click();
  await expect(page.getByRole('heading', { name: 'Plis remportés' })).toBeVisible();
  const restoredActual = await actualInputs.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  expect(restoredActual).toEqual(['1', '0', '0']);
});
