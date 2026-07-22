import { Component, inject } from '@angular/core';
import { PlayerSetupComponent } from '../../shared/player-setup/player-setup.component';
import { WizardEndComponent } from './wizard-end.component';
import { WizardPlayComponent } from './wizard-play.component';
import { WizardStateService } from './wizard-state.service';
import { WIZARD_META } from './wizard.meta';

@Component({
  selector: 'app-wizard-page',
  standalone: true,
  imports: [PlayerSetupComponent, WizardPlayComponent, WizardEndComponent],
  providers: [WizardStateService],
  template: `
    <header class="app-header">
      <h1><span class="hat">🧙</span> Wizard <span class="subtitle">Compteur de points</span></h1>
    </header>

    @if (!state.session()) {
      <app-player-setup
        [gameId]="meta.id"
        [minPlayers]="meta.minPlayers"
        [maxPlayers]="meta.maxPlayers"
        (start)="state.startGame($event)"
      />
    } @else if (state.isFinished()) {
      <app-wizard-end />
    } @else {
      <app-wizard-play />
    }
  `,
})
export class WizardPageComponent {
  protected readonly state = inject(WizardStateService);
  protected readonly meta = WIZARD_META;
}
