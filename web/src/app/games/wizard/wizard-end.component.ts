import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { WizardStateService } from './wizard-state.service';

@Component({
  selector: 'app-wizard-end',
  standalone: true,
  imports: [ConfirmDialogComponent],
  templateUrl: './wizard-end.component.html',
})
export class WizardEndComponent {
  protected readonly state = inject(WizardStateService);
  protected readonly showRestartConfirm = signal(false);

  protected readonly maxScore = computed(() => {
    const ranking = this.state.ranking();
    return ranking.length ? ranking[0].total : 0;
  });

  protected requestNewGame(): void {
    this.showRestartConfirm.set(true);
  }

  protected confirmNewGame(): void {
    this.showRestartConfirm.set(false);
    this.state.newGame();
  }

  protected cancelNewGame(): void {
    this.showRestartConfirm.set(false);
  }
}
