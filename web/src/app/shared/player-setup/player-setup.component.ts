import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { clearSetupDraft, loadSetupDraft, saveSetupDraft } from '../../core/setup-draft';
import { findDuplicateName, resolvePlayerNames } from './player-name-utils';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Shared across every game (parameterized by that game's GameMeta min/max player count):
 *  count stepper, name inputs, duplicate-name validation, and setup-draft persistence so
 *  reloading mid-typing doesn't lose entered names. Emits the resolved player names once
 *  the user confirms; the calling game screen owns turning that into a GameSession. */
@Component({
  selector: 'app-player-setup',
  standalone: true,
  templateUrl: './player-setup.component.html',
  styleUrl: './player-setup.component.css',
})
export class PlayerSetupComponent implements OnInit {
  readonly gameId = input.required<string>();
  readonly minPlayers = input.required<number>();
  readonly maxPlayers = input.required<number>();
  readonly start = output<string[]>();

  protected readonly playerCount = signal(0);
  protected readonly names = signal<string[]>([]);

  protected readonly visibleNames = computed(() => this.names().slice(0, this.playerCount()));
  protected readonly duplicateName = computed(() =>
    findDuplicateName(resolvePlayerNames(this.visibleNames())),
  );

  ngOnInit(): void {
    const min = this.minPlayers();
    const max = this.maxPlayers();
    const draft = loadSetupDraft(this.gameId());

    const names = new Array<string>(max).fill('');
    draft?.names.forEach((name, i) => {
      if (i < max) {
        names[i] = name;
      }
    });

    this.playerCount.set(clamp(draft?.playerCount ?? min, min, max));
    this.names.set(names);
  }

  protected decrement(): void {
    this.setCount(this.playerCount() - 1);
  }

  protected increment(): void {
    this.setCount(this.playerCount() + 1);
  }

  protected updateName(index: number, value: string): void {
    const next = [...this.names()];
    next[index] = value;
    this.names.set(next);
    this.persistDraft();
  }

  protected confirm(): void {
    if (this.duplicateName()) {
      return;
    }
    const resolved = resolvePlayerNames(this.visibleNames());
    clearSetupDraft(this.gameId());
    this.start.emit(resolved);
  }

  private setCount(n: number): void {
    this.playerCount.set(clamp(n, this.minPlayers(), this.maxPlayers()));
    this.persistDraft();
  }

  private persistDraft(): void {
    saveSetupDraft(this.gameId(), { playerCount: this.playerCount(), names: this.names() });
  }
}
