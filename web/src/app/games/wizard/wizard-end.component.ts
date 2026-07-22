import { Component, computed, inject } from '@angular/core';
import { WizardStateService } from './wizard-state.service';

@Component({
  selector: 'app-wizard-end',
  standalone: true,
  templateUrl: './wizard-end.component.html',
})
export class WizardEndComponent {
  protected readonly state = inject(WizardStateService);

  protected readonly maxScore = computed(() => {
    const ranking = this.state.ranking();
    return ranking.length ? ranking[0].total : 0;
  });

  protected newGame(): void {
    this.state.newGame();
  }
}
