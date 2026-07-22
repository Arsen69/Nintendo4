import { Component } from '@angular/core';

@Component({
  selector: 'app-fixture-play',
  standalone: true,
  template: `
    <div class="card">
      <h2>Fixture game</h2>
      <p class="hint">
        Rendered by loadChildren → FIXTURE_ROUTES → FIXTURE_DEFINITION.ui.phaseComponents[0].
        Proves the GameDefinition/manifest/routing wiring works end to end.
      </p>
    </div>
  `,
})
export class FixturePlayComponent {}
