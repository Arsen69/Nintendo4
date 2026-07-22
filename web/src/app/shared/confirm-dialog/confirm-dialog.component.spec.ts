import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  function createComponent(open: boolean, message = 'Are you sure?') {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    return fixture;
  }

  it('renders nothing when closed', () => {
    const fixture = createComponent(false);
    expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeNull();
  });

  it('renders the message and both actions when open', () => {
    const fixture = createComponent(true, 'Delete everything?');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.dialog-backdrop')).not.toBeNull();
    expect(el.textContent).toContain('Delete everything?');
  });

  it('emits confirmed when the confirm button is clicked', () => {
    const fixture = createComponent(true);
    let confirmed = false;
    fixture.componentInstance.confirmed.subscribe(() => (confirmed = true));
    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click();
    expect(confirmed).toBe(true);
  });

  it('emits cancelled when the cancel button or backdrop is clicked', () => {
    const fixture = createComponent(true);
    let cancelledCount = 0;
    fixture.componentInstance.cancelled.subscribe(() => cancelledCount++);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();
    expect(cancelledCount).toBe(1);

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.dialog-backdrop');
    backdrop.click();
    expect(cancelledCount).toBe(2);
  });

  it('emits cancelled on Escape', () => {
    const fixture = createComponent(true);
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    const dialog: HTMLElement = fixture.nativeElement.querySelector('.dialog');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cancelled).toBe(true);
  });

  it('clicking inside the dialog does not trigger cancel via the backdrop', () => {
    const fixture = createComponent(true);
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    const dialog: HTMLElement = fixture.nativeElement.querySelector('.dialog');
    dialog.click();
    expect(cancelled).toBe(false);
  });
});
