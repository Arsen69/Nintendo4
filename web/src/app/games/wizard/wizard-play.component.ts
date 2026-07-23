import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { cumulativeTotals } from '../../core/ranking';
import { WizardStateService } from './wizard-state.service';
import { wizardCardsDealt, wizardValidateRoundInput } from './wizard-rules';

@Component({
  selector: 'app-wizard-play',
  standalone: true,
  imports: [ConfirmDialogComponent],
  templateUrl: './wizard-play.component.html',
  styleUrl: './wizard-play.component.css',
})
export class WizardPlayComponent {
  protected readonly state = inject(WizardStateService);

  protected readonly bidInputs = signal<number[]>(this.freshInputs());
  protected readonly actualInputs = signal<number[]>(this.freshInputs());
  protected readonly showNewGameConfirm = signal(false);

  /** Which past round's row is currently open for editing in the score table, or null if
   *  none. Only one row can be edited at a time. */
  protected readonly editingRound = signal<number | null>(null);
  protected readonly editBids = signal<number[]>([]);
  protected readonly editActual = signal<number[]>([]);

  protected readonly playerIndices = computed(() => this.state.players().map((_, i) => i));

  protected readonly bidsError = computed(() =>
    validateInputs(this.bidInputs(), this.state.cardsDealt(), 'prédiction', (values) =>
      wizardValidateRoundInput({ bids: values }, { players: this.state.players(), roundNumber: this.state.currentRound() }),
    ),
  );

  protected readonly actualsError = computed(() =>
    validateInputs(this.actualInputs(), this.state.cardsDealt(), 'nombre de plis remportés', (values) =>
      wizardValidateRoundInput({ actual: values }, { players: this.state.players(), roundNumber: this.state.currentRound() }),
    ),
  );

  protected readonly roundsWithTotals = computed(() => {
    const rounds = this.state.rounds();
    const playerCount = this.state.players().length;
    return rounds.map((round, i) => ({
      round,
      totals: cumulativeTotals(rounds.slice(0, i + 1), playerCount),
    }));
  });

  protected readonly editError = computed(() => {
    const roundNumber = this.editingRound();
    if (roundNumber === null) {
      return null;
    }
    const cardsDealt = wizardCardsDealt(roundNumber);
    const ctx = { players: this.state.players(), roundNumber };
    return (
      validateInputs(this.editBids(), cardsDealt, 'prédiction', (values) =>
        wizardValidateRoundInput({ bids: values }, ctx),
      ) ??
      validateInputs(this.editActual(), cardsDealt, 'nombre de plis remportés', (values) =>
        wizardValidateRoundInput({ actual: values }, ctx),
      )
    );
  });

  protected updateBid(playerIndex: number, value: string): void {
    const next = [...this.bidInputs()];
    next[playerIndex] = Number(value);
    this.bidInputs.set(next);
  }

  protected updateActual(playerIndex: number, value: string): void {
    const next = [...this.actualInputs()];
    next[playerIndex] = Number(value);
    this.actualInputs.set(next);
  }

  protected confirmBids(): void {
    if (this.bidsError()) {
      return;
    }
    const error = this.state.confirmBids(this.bidInputs());
    if (!error) {
      this.actualInputs.set(this.freshInputs());
    }
  }

  protected confirmResults(): void {
    if (this.actualsError()) {
      return;
    }
    const error = this.state.confirmResults(this.actualInputs());
    if (!error) {
      this.bidInputs.set(this.freshInputs());
    }
  }

  protected startEdit(roundNumber: number): void {
    const round = this.state.rounds().find((r) => r.roundNumber === roundNumber);
    if (!round) {
      return;
    }
    this.editBids.set([...round.data.bids]);
    this.editActual.set([...round.data.actual]);
    this.editingRound.set(roundNumber);
  }

  protected updateEditBid(playerIndex: number, value: string): void {
    const next = [...this.editBids()];
    next[playerIndex] = Number(value);
    this.editBids.set(next);
  }

  protected updateEditActual(playerIndex: number, value: string): void {
    const next = [...this.editActual()];
    next[playerIndex] = Number(value);
    this.editActual.set(next);
  }

  protected saveEdit(): void {
    const roundNumber = this.editingRound();
    if (roundNumber === null || this.editError()) {
      return;
    }
    const error = this.state.updateRoundData(roundNumber, this.editBids(), this.editActual());
    if (!error) {
      this.editingRound.set(null);
    }
  }

  protected cancelEdit(): void {
    this.editingRound.set(null);
  }

  protected requestNewGame(): void {
    this.showNewGameConfirm.set(true);
  }

  protected confirmNewGame(): void {
    this.showNewGameConfirm.set(false);
    this.state.newGame();
  }

  protected cancelNewGame(): void {
    this.showNewGameConfirm.set(false);
  }

  private freshInputs(): number[] {
    return new Array(this.state.players().length).fill(0);
  }
}

function validateInputs(
  values: number[],
  cardsDealt: number,
  label: string,
  ruleCheck: (values: number[]) => string | null,
): string | null {
  const outOfRange = values.some((n) => !Number.isInteger(n) || n < 0 || n > cardsDealt);
  if (outOfRange) {
    return `Chaque ${label} doit être un nombre entier entre 0 et ${cardsDealt}.`;
  }
  return ruleCheck(values);
}
