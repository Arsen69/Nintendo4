import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { GAME_STATE_STORE } from './core/game-state-store';
import { LocalStorageGameStateStore } from './core/local-storage-game-state-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: GAME_STATE_STORE, useClass: LocalStorageGameStateStore },
  ]
};
