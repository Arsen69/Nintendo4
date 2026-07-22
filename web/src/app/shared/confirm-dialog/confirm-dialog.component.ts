import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

/** Shared destructive-action confirmation, used consistently everywhere a game screen
 *  needs one (today: abandoning an in-progress game, restarting after the end screen) —
 *  replacing the mix of a native confirm() in one place and no confirmation at all in
 *  the other. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  readonly open = input.required<boolean>();
  readonly title = input('Confirmer');
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmer');
  readonly cancelLabel = input('Annuler');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialogEl = viewChild<ElementRef<HTMLElement>>('dialogEl');

  constructor() {
    effect(() => {
      if (this.open()) {
        queueMicrotask(() => this.dialogEl()?.nativeElement.focus());
      }
    });
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }
}
