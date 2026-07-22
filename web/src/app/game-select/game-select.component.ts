import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAME_MANIFEST } from '../core/game-manifest';

@Component({
  selector: 'app-game-select',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game-select.component.html',
  styleUrl: './game-select.component.css',
})
export class GameSelectComponent {
  protected readonly games = GAME_MANIFEST;
}
