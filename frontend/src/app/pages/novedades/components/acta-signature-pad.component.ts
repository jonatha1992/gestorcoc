import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-acta-signature-pad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
        Firma Digital (opcional)
      </label>
      <div class="border border-slate-300 rounded-xl overflow-hidden bg-white">
        <canvas #sigPad 
          [attr.width]="width" 
          [attr.height]="height"
          class="block w-full cursor-crosshair touch-none"></canvas>
      </div>
      <button type="button" (click)="clear()"
        class="mt-1 text-xs text-slate-500 hover:text-slate-700 underline">
        Limpiar firma
      </button>
    </div>
  `,
})
export class ActaSignaturePadComponent implements AfterViewInit, OnDestroy {
  @Input() width = 520;
  @Input() height = 100;
  @Output() signatureChange = new EventEmitter<string>();

  @ViewChild('sigPad') sigPad!: ElementRef<HTMLCanvasElement>;

  private sigDrawing = false;
  private sigCtx: CanvasRenderingContext2D | null = null;
  private sigAbort: AbortController | null = null;

  ngAfterViewInit() {
    this.initSignaturePad();
  }

  ngOnDestroy() {
    if (this.sigAbort) {
      this.sigAbort.abort();
      this.sigAbort = null;
    }
  }

  initSignaturePad() {
    if (this.sigAbort) {
      this.sigAbort.abort();
      this.sigAbort = null;
    }

    const canvas = this.sigPad?.nativeElement;
    if (!canvas) return;

    this.sigCtx = canvas.getContext('2d')!;
    this.sigCtx.strokeStyle = '#000';
    this.sigCtx.lineWidth = 2;
    this.sigCtx.lineCap = 'round';
    this.sigCtx.clearRect(0, 0, canvas.width, canvas.height);

    const ctrl = new AbortController();
    this.sigAbort = ctrl;
    const opts = { signal: ctrl.signal } as AddEventListenerOptions;

    canvas.addEventListener('mousedown', (e) => this.sigStart(e.offsetX, e.offsetY), opts);
    canvas.addEventListener('mousemove', (e) => {
      if (this.sigDrawing) this.sigDraw(e.offsetX, e.offsetY);
    }, opts);
    canvas.addEventListener('mouseup', () => (this.sigDrawing = false), opts);
    canvas.addEventListener('mouseleave', () => (this.sigDrawing = false), opts);

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const r = canvas.getBoundingClientRect();
      this.sigStart(t.clientX - r.left, t.clientY - r.top);
    }, { ...opts, passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.sigDrawing) return;
      const t = e.touches[0];
      const r = canvas.getBoundingClientRect();
      this.sigDraw(t.clientX - r.left, t.clientY - r.top);
    }, { ...opts, passive: false });

    canvas.addEventListener('touchend', () => (this.sigDrawing = false), opts);
  }

  private sigStart(x: number, y: number) {
    this.sigDrawing = true;
    this.sigCtx!.beginPath();
    this.sigCtx!.moveTo(x, y);
  }

  private sigDraw(x: number, y: number) {
    this.sigCtx!.lineTo(x, y);
    this.sigCtx!.stroke();
  }

  clear() {
    const canvas = this.sigPad?.nativeElement;
    if (canvas && this.sigCtx) {
      this.sigCtx.clearRect(0, 0, canvas.width, canvas.height);
      this.signatureChange.emit('');
    }
  }

  getSignatureBase64(): string {
    const canvas = this.sigPad?.nativeElement;
    if (!canvas) return '';
    
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    
    if (canvas.toDataURL() === blank.toDataURL()) return '';
    
    const signature = canvas.toDataURL('image/png');
    this.signatureChange.emit(signature);
    return signature;
  }
}
