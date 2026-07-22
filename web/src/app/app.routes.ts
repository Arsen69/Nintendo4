import { Routes } from '@angular/router';
import { GameSelectComponent } from './game-select/game-select.component';

export const routes: Routes = [
  { path: '', component: GameSelectComponent },
  {
    path: 'games/fixture',
    loadChildren: () => import('./games/fixture/fixture.routes').then((m) => m.FIXTURE_ROUTES),
  },
];
