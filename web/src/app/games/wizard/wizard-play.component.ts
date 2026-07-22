import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { cumulativeTotals } from '../../core/ranking';
import { WizardStateService } from './wizard-state.service';
import { wizardValidateRoundInput } from './wizard-rules';

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

  /** Set by undoLastRound() to carry the popped round's original `actual` values across
   *  the next confirmBids() call, instead of being wiped by its usual fresh-zero reset. */
  private restoredActual: number[] | null = null;

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
      // Bidding just closed for this round; give the now-visible results phase a fresh,
      // all-zero input set — unless we just undid a round, in which case restore its
      // original actual values so the user only has to fix what was actually wrong.
      this.actualInputs.set(this.restoredActual ?? this.freshInputs());
      this.restoredActual = null;
    }
  }

  protected confirmResults(): void {
    if (this.actualsError()) {
      return;
    }
    const error = this.state.confirmResults(this.actualInputs());
    if (!error) {
      // Round committed and advanced; reset for the next round's bidding phase.
      this.bidInputs.set(this.freshInputs());
    }
  }

  protected undoLastRound(): void {
    const undone = this.state.undoLastRound();
    if (undone) {
      this.bidInputs.set([...undone.data.bids]);
      this.restoredActual = [...undone.data.actual];
    }
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
