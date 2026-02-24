import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InformeService,
  VideoReportFormData,
  VideoReportFrame,
  VideoReportPayload,
} from '../services/informe.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 class="text-xl font-bold text-slate-800">Informe de Analisis de Video</h2>
        <p class="text-sm text-slate-500 mt-1">
          Flujo guiado en 4 pasos con vista previa y anexo de fotogramas.
        </p>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let step of steps"
            type="button"
            (click)="goToStep(step.number)"
            class="px-3 py-2 rounded-xl text-sm font-semibold border"
            [class.bg-indigo-600]="step.number === currentStep"
            [class.text-white]="step.number === currentStep"
            [class.border-indigo-600]="step.number === currentStep"
            [class.bg-slate-50]="step.number !== currentStep"
            [class.text-slate-700]="step.number !== currentStep"
            [class.border-slate-200]="step.number !== currentStep"
          >
            {{ step.number }}. {{ step.label }}
          </button>
        </div>
      </div>

      <div *ngIf="!wizardEnabled" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        La vista previa por pasos esta deshabilitada por configuracion.
      </div>

      <form *ngIf="wizardEnabled" (ngSubmit)="generateReport()" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div *ngIf="currentStep === 1" class="space-y-4">
          <h3 class="text-lg font-bold text-slate-800">Paso 1 - Datos base</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha del Informe</label>
              <input [(ngModel)]="form.report_date" (ngModelChange)="markDirty()" name="report_date" type="date" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Destinatarios</label>
              <input [(ngModel)]="form.destinatarios" (ngModelChange)="markDirty()" name="destinatarios" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Informe</label>
              <input [(ngModel)]="form.tipo_informe" (ngModelChange)="markDirty()" name="tipo_informe" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Numero de Informe</label>
              <input [(ngModel)]="form.numero_informe" (ngModelChange)="markDirty()" name="numero_informe" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Grado</label>
              <input [(ngModel)]="form.grado" (ngModelChange)="markDirty()" name="grado" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Operador</label>
              <input [(ngModel)]="form.operador" (ngModelChange)="markDirty()" name="operador" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">LUP</label>
              <input [(ngModel)]="form.lup" (ngModelChange)="markDirty()" name="lup" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Firma</label>
              <input [(ngModel)]="form.firma" (ngModelChange)="markDirty()" name="firma" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
          </div>
        </div>

        <div *ngIf="currentStep === 2" class="space-y-4">
          <h3 class="text-lg font-bold text-slate-800">Paso 2 - Datos de causa</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Sistema</label>
              <input [(ngModel)]="form.sistema" (ngModelChange)="markDirty()" name="sistema" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Prevencion Sumaria</label>
              <input [(ngModel)]="form.prevencion_sumaria" (ngModelChange)="markDirty()" name="prevencion_sumaria" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Caratula</label>
              <input [(ngModel)]="form.caratula" (ngModelChange)="markDirty()" name="caratula" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fiscalia</label>
              <input [(ngModel)]="form.fiscalia" (ngModelChange)="markDirty()" name="fiscalia" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fiscal</label>
              <input [(ngModel)]="form.fiscal" (ngModelChange)="markDirty()" name="fiscal" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Denunciante</label>
              <input [(ngModel)]="form.denunciante" (ngModelChange)="markDirty()" name="denunciante" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Vuelo</label>
              <input [(ngModel)]="form.vuelo" (ngModelChange)="markDirty()" name="vuelo" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Objeto Denunciado / Marca</label>
              <input [(ngModel)]="form.objeto_denunciado" (ngModelChange)="markDirty()" name="objeto_denunciado" type="text" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50">
            </div>
          </div>
        </div>

        <div *ngIf="currentStep === 3" class="space-y-4">
          <h3 class="text-lg font-bold text-slate-800">Paso 3 - Desarrollo y fotogramas</h3>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Desarrollo</label>
            <textarea [(ngModel)]="form.desarrollo" (ngModelChange)="markDirty()" name="desarrollo" rows="6" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Conclusion</label>
            <textarea [(ngModel)]="form.conclusion" (ngModelChange)="markDirty()" name="conclusion" rows="5" class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"></textarea>
          </div>

          <div class="border border-slate-200 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="font-semibold text-slate-800">Fotogramas</h4>
              <span class="text-xs text-slate-500">{{ frames.length }}/{{ MAX_FRAMES }} - {{ readableTotalFramesSize() }}</span>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple (change)="onFrameFilesSelected($event)" class="block w-full text-sm">
            <p class="text-xs text-slate-500">Tipos permitidos: JPG, PNG, WEBP. Maximo 5 MB por imagen, 40 MB total.</p>

            <div *ngIf="frames.length === 0" class="text-sm text-slate-500">No hay fotogramas cargados.</div>

            <div *ngFor="let frame of frames; let i = index" class="border border-slate-200 rounded-xl p-3 space-y-2">
              <div class="flex items-start gap-3">
                <img [src]="frame.preview_url" alt="Fotograma" class="w-28 h-20 object-cover rounded border border-slate-200 bg-slate-50">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-slate-800 truncate">{{ i + 1 }}. {{ frame.file_name }}</div>
                  <div class="text-xs text-slate-500">{{ frame.mime_type }} - {{ readableBytes(frame.size_bytes || 0) }}</div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Descripcion (opcional)</label>
                <textarea
                  [(ngModel)]="frame.description"
                  (ngModelChange)="markDirty()"
                  [name]="'frame_description_' + frame.id_temp"
                  rows="2"
                  maxlength="500"
                  class="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                ></textarea>
              </div>

              <div class="flex gap-2 justify-end">
                <button type="button" (click)="moveFrameUp(i)" [disabled]="i === 0" class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50">Subir</button>
                <button type="button" (click)="moveFrameDown(i)" [disabled]="i === frames.length - 1" class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50">Bajar</button>
                <button type="button" (click)="removeFrame(i)" class="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-sm">Eliminar</button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="currentStep === 4" class="space-y-4">
          <h3 class="text-lg font-bold text-slate-800">Paso 4 - Revision final</h3>
          <div class="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
            <h4 class="text-lg font-bold text-slate-800">{{ form.tipo_informe }} {{ form.numero_informe }}</h4>
            <p class="text-sm text-slate-700"><strong>Fecha:</strong> {{ form.report_date }}</p>
            <p class="text-sm text-slate-700"><strong>Destinatarios:</strong> {{ form.destinatarios }}</p>
            <p class="text-sm text-slate-700"><strong>Operador:</strong> {{ form.grado }} {{ form.operador }}, LUP: {{ form.lup }}</p>
            <p class="text-sm text-slate-700"><strong>Sistema:</strong> {{ form.sistema }}</p>
            <p class="text-sm text-slate-700"><strong>Prevencion sumaria:</strong> {{ form.prevencion_sumaria }}</p>
            <p class="text-sm text-slate-700"><strong>Caratula:</strong> {{ form.caratula }}</p>
            <p class="text-sm text-slate-700"><strong>Fiscalia:</strong> {{ form.fiscalia }}</p>
            <p class="text-sm text-slate-700"><strong>Fiscal:</strong> {{ form.fiscal }}</p>
            <p class="text-sm text-slate-700"><strong>Denunciante:</strong> {{ form.denunciante }}</p>
            <p class="text-sm text-slate-700"><strong>Vuelo:</strong> {{ form.vuelo }}</p>
            <p class="text-sm text-slate-700"><strong>Objeto denunciado:</strong> {{ form.objeto_denunciado }}</p>

            <div>
              <h5 class="font-semibold text-slate-800 mb-2">Desarrollo</h5>
              <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ form.desarrollo || 'Sin desarrollo.' }}</p>
            </div>
            <div>
              <h5 class="font-semibold text-slate-800 mb-2">Conclusion</h5>
              <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ form.conclusion || 'Sin conclusion.' }}</p>
            </div>
            <div>
              <h5 class="font-semibold text-slate-800 mb-2">Anexo de fotogramas ({{ frames.length }})</h5>
              <div *ngIf="frames.length === 0" class="text-sm text-slate-500">No se adjuntaron fotogramas.</div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div *ngFor="let frame of orderedFrames(); let i = index" class="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                  <img [src]="frame.preview_url" alt="Fotograma preview" class="w-full h-36 object-cover rounded border border-slate-200 bg-slate-50">
                  <div class="text-sm font-semibold text-slate-800">Fotograma {{ i + 1 }} - {{ frame.file_name }}</div>
                  <p class="text-sm text-slate-600 whitespace-pre-wrap">{{ frame.description || 'Sin descripcion.' }}</p>
                </div>
              </div>
            </div>
            <p class="text-sm text-slate-700"><strong>Firma:</strong> {{ form.firma }}</p>
          </div>
        </div>

        <div class="flex justify-between gap-3">
          <button type="button" (click)="prevStep()" [disabled]="currentStep === 1" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-50">Anterior</button>
          <div class="flex gap-3">
            <button *ngIf="currentStep < 4" type="button" (click)="nextStep()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">Siguiente</button>
            <button *ngIf="currentStep === 4" [disabled]="isGenerating" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-semibold">
              {{ isGenerating ? 'Generando...' : 'Generar Informe DOCX' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `
})
export class InformesComponent implements OnDestroy {
  private informeService = inject(InformeService);
  private toastService = inject(ToastService);

  readonly wizardEnabled = !!environment.enableReportWizardPreview;
  readonly MAX_FRAMES = 20;
  readonly MAX_FRAME_SIZE = 5 * 1024 * 1024;
  readonly MAX_TOTAL_FRAMES_SIZE = 40 * 1024 * 1024;
  readonly allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  isGenerating = false;
  isDirty = false;
  currentStep = 1;
  frames: VideoReportFrame[] = [];

  steps = [
    { number: 1, label: 'Datos base' },
    { number: 2, label: 'Causa' },
    { number: 3, label: 'Desarrollo y fotogramas' },
    { number: 4, label: 'Revision final' },
  ];

  form: VideoReportFormData = {
    report_date: new Date().toISOString().slice(0, 10),
    destinatarios: 'URSA I - Jefe',
    tipo_informe: 'IAV - Informe Analisis de Video',
    numero_informe: `${new Date().getFullYear()}/001`,
    grado: 'Oficial Mayor',
    operador: '',
    lup: '',
    sistema: 'MILESTONE',
    prevencion_sumaria: '003BAR/2026',
    caratula: 'DENUNCIA S/ PRESUNTO HURTO',
    fiscalia: 'Fiscalia Nro. 02',
    fiscal: '',
    denunciante: '',
    vuelo: 'WJ 3045',
    objeto_denunciado: 'RIVER PLATE',
    desarrollo: '',
    conclusion: '',
    firma: 'Coordinador CReV I DEL ESTE',
  };

  private readonly fieldLabels: Record<keyof VideoReportFormData, string> = {
    report_date: 'Fecha del Informe',
    destinatarios: 'Destinatarios',
    tipo_informe: 'Tipo de Informe',
    numero_informe: 'Numero de Informe',
    grado: 'Grado',
    operador: 'Operador',
    lup: 'LUP',
    sistema: 'Sistema',
    prevencion_sumaria: 'Prevencion Sumaria',
    caratula: 'Caratula',
    fiscalia: 'Fiscalia',
    fiscal: 'Fiscal',
    denunciante: 'Denunciante',
    vuelo: 'Vuelo',
    objeto_denunciado: 'Objeto Denunciado / Marca',
    desarrollo: 'Desarrollo',
    conclusion: 'Conclusion',
    firma: 'Firma',
  };

  private readonly stepRequiredFields: Record<number, (keyof VideoReportFormData)[]> = {
    1: ['report_date', 'destinatarios', 'tipo_informe', 'numero_informe', 'grado', 'operador', 'lup', 'firma'],
    2: ['sistema', 'prevencion_sumaria', 'caratula', 'fiscalia', 'fiscal', 'denunciante', 'vuelo', 'objeto_denunciado'],
    3: [],
    4: [
      'report_date', 'destinatarios', 'tipo_informe', 'numero_informe', 'grado', 'operador', 'lup', 'firma',
      'sistema', 'prevencion_sumaria', 'caratula', 'fiscalia', 'fiscal', 'denunciante', 'vuelo', 'objeto_denunciado',
    ],
  };

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty && !this.isGenerating) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  ngOnDestroy(): void {
    for (const frame of this.frames) {
      if (frame.preview_url) {
        URL.revokeObjectURL(frame.preview_url);
      }
    }
  }

  markDirty(): void {
    this.isDirty = true;
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      return;
    }
    if (step === this.currentStep) {
      return;
    }
    if (!this.validateStep(this.currentStep)) {
      return;
    }
    this.currentStep = step;
  }

  nextStep(): void {
    if (!this.validateStep(this.currentStep)) {
      return;
    }
    if (this.currentStep < 4) {
      this.currentStep += 1;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep -= 1;
    }
  }

  private validateStep(step: number): boolean {
    const required = this.stepRequiredFields[step] || [];
    const missing = required.filter((field) => !this.form[field] || !this.form[field].trim());
    if (missing.length > 0) {
      const labels = missing.map((field) => this.fieldLabels[field]).join(', ');
      this.toastService.error(`Completa los campos requeridos: ${labels}`);
      return false;
    }
    return true;
  }

  private totalFramesBytes(): number {
    return this.frames.reduce((acc, frame) => acc + (frame.size_bytes || 0), 0);
  }

  readableBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  readableTotalFramesSize(): string {
    return this.readableBytes(this.totalFramesBytes());
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  async onFrameFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      return;
    }

    const remainingSlots = this.MAX_FRAMES - this.frames.length;
    if (remainingSlots <= 0) {
      this.toastService.error(`Solo se permiten ${this.MAX_FRAMES} fotogramas.`);
      input.value = '';
      return;
    }

    const candidates = Array.from(files).slice(0, remainingSlots);
    let currentTotal = this.totalFramesBytes();

    for (const file of candidates) {
      if (!this.allowedMimeTypes.has(file.type)) {
        this.toastService.error(`Tipo no permitido: ${file.name}`);
        continue;
      }
      if (file.size > this.MAX_FRAME_SIZE) {
        this.toastService.error(`El archivo ${file.name} supera 5 MB.`);
        continue;
      }
      if (currentTotal + file.size > this.MAX_TOTAL_FRAMES_SIZE) {
        this.toastService.error('El tamano total de fotogramas no puede superar 40 MB.');
        break;
      }

      try {
        const dataUrl = await this.fileToDataUrl(file);
        const frame: VideoReportFrame = {
          id_temp: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          file_name: file.name,
          mime_type: file.type as VideoReportFrame['mime_type'],
          content_base64: dataUrl,
          description: '',
          order: this.frames.length,
          preview_url: URL.createObjectURL(file),
          size_bytes: file.size,
        };
        this.frames.push(frame);
        currentTotal += file.size;
        this.markDirty();
      } catch (error) {
        this.toastService.error(String(error));
      }
    }

    this.reindexFrames();
    input.value = '';
  }

  removeFrame(index: number): void {
    const frame = this.frames[index];
    if (frame?.preview_url) {
      URL.revokeObjectURL(frame.preview_url);
    }
    this.frames.splice(index, 1);
    this.reindexFrames();
    this.markDirty();
  }

  moveFrameUp(index: number): void {
    if (index <= 0) return;
    const temp = this.frames[index - 1];
    this.frames[index - 1] = this.frames[index];
    this.frames[index] = temp;
    this.reindexFrames();
    this.markDirty();
  }

  moveFrameDown(index: number): void {
    if (index >= this.frames.length - 1) return;
    const temp = this.frames[index + 1];
    this.frames[index + 1] = this.frames[index];
    this.frames[index] = temp;
    this.reindexFrames();
    this.markDirty();
  }

  orderedFrames(): VideoReportFrame[] {
    return [...this.frames].sort((a, b) => a.order - b.order);
  }

  private reindexFrames(): void {
    this.frames.forEach((frame, idx) => {
      frame.order = idx;
    });
  }

  private buildPayload(): VideoReportPayload {
    return {
      report_data: { ...this.form },
      frames: this.orderedFrames().map((frame) => ({
        id_temp: frame.id_temp,
        file_name: frame.file_name,
        mime_type: frame.mime_type,
        content_base64: frame.content_base64,
        description: frame.description || '',
        order: frame.order,
      })),
    };
  }

  generateReport(): void {
    if (!this.validateStep(4)) {
      this.currentStep = 4;
      return;
    }

    this.isGenerating = true;
    const payload = this.buildPayload();
    this.informeService.generateVideoAnalysisReport(payload).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `informe_analisis_video_${this.form.report_date || 'hoy'}.docx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Informe generado');
        this.isGenerating = false;
        this.isDirty = false;
      },
      error: () => {
        this.toastService.error('No se pudo generar el informe. Verifica los datos cargados.');
        this.isGenerating = false;
      }
    });
  }
}
