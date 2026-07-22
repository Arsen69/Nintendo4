import { Component, computed, inject, signal } from '@angular/core';
import { cumulativeTotals } from '../../core/ranking';
import { WizardStateService } from './wizard-state.service';

@Component({
  selector: 'app-wizard-play',
  standalone: true,
  templateUrl: './wizard-play.component.html',
  styleUrl: './wizard-play.component.css',
})
export class WizardPlayComponent {
  protected readonly state = inject(WizardStateService);

  protected readonly bidInputs = signal<number[]>(this.freshInputs());
  protected readonly actualInputs = signal<number[]>(this.freshInputs());
  protected readonly error = signal<string | null>(null);

  protected readonly playerIndices = computed(() => this.state.players().map((_, i) => i));

  protected readonly roundsWithTotals = computed(() => {
    const rounds = this.state.rounds();
    const playerCount = this.state.players().length;
    return rounds.map((round, i) => ({
      round,
      totals: cumulativeTotals(rounds.slice(0, i + 1), playerCount),
    }));
  });

  protected updateBid(playerIndex: number, value: string): void {
    const n = clampToCards(value, this.state.cardsDealt());
    const next = [...this.bidInputs()];
    next[playerIndex] = n;
    this.bidInputs.set(next);
  }

  protected updateActual(playerIndex: number, value: string): void {
    const n = clampToCards(value, this.state.cardsDealt());
    const next = [...this.actualInputs()];
    next[playerIndex] = n;
    this.actualInputs.set(next);
  }

  protected confirmBids(): void {
    const error = this.state.confirmBids(this.bidInputs());
    this.error.set(error);
    if (!error) {
      // Bidding just closed for this round; give the now-visible results phase a fresh,
      // all-zero input set. Done synchronously here (not via an effect reacting to the
      // phase signal) so it can't race with the user's next input.
      this.actualInputs.set(this.freshInputs());
    }
  }

  protected confirmResults(): void {
    const error = this.state.confirmResults(this.actualInputs());
    this.error.set(error);
    if (!error) {
      // Round committed and advanced; reset for the next round's bidding phase.
      this.bidInputs.set(this.freshInputs());
      this.error.set(null);
    }
  }

  private freshInputs(): number[] {
    return new Array(this.state.players().length).fill(0);
  }

  protected newGame(): void {
    if (confirm('Abandonner la partie en cours et recommencer ?')) {
      this.error.set(null);
      this.state.newGame();
    }
  }
}

function clampToCards(rawValue: string, cardsDealt: number): number {
  let n = Math.round(Number(rawValue));
  if (Number.isNaN(n) || n < 0) {
    n = 0;
  }
  if (n > cardsDealt) {
    n = cardsDealt;
  }
  return n;
}
