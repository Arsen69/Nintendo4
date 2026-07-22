import { Routes } from '@angular/router';
import { FIXTURE_DEFINITION } from './fixture.definition';

export const FIXTURE_ROUTES: Routes = [
  { path: '', component: FIXTURE_DEFINITION.ui.phaseComponents[0] },
];
