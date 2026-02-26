import { Component, HostListener, OnDestroy, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { InformeService, VideoReportFormData, VideoReportFrame, VideoReportPayload, ImproveVideoTextResponse } from '../../services/informe.service';
import { ToastService } from '../../services/toast.service';
import { LoadingService } from '../../services/loading.service';
import { PersonnelService } from '../../services/personnel.service';
import { AssetService } from '../../services/asset.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes.html'
})
export class InformesComponent implements OnDestroy {
  private informeService = inject(InformeService);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);
  private personnelService = inject(PersonnelService);
  private assetService = inject(AssetService);
  private cdr = inject(ChangeDetectorRef);

  readonly wizardEnabled = !!environment.enableReportWizardPreview;
  readonly MAX_FRAMES = 30;
  readonly MAX_FRAME_SIZE = 8 * 1024 * 1024;
  readonly MAX_TOTAL_FRAMES_SIZE = 80 * 1024 * 1024;
  readonly MAX_FRAME_SIZE_MB = this.MAX_FRAME_SIZE / (1024 * 1024);
  readonly MAX_TOTAL_FRAMES_SIZE_MB = this.MAX_TOTAL_FRAMES_SIZE / (1024 * 1024);
  readonly allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  isGenerating = false;
  isImprovingText = false;
  isProcessingFrames = false;
  isDirty = false;
  currentStep = 1;
  reportGenerationMode: 'frontend_doc' | 'backend_docx' = 'frontend_doc';

  @ViewChild('signaturePad') signaturePad?: ElementRef<HTMLCanvasElement>;
  private signatureCtx: CanvasRenderingContext2D | null = null;
  isDrawingSignature = false;
  incluirFirma = false;
  api_key = '';
  private lastPos = { x: 0, y: 0 };
  frames: VideoReportFrame[] = [];
  personnelOptions: any[] = [];
  selectedOperatorId: number | null = null;
  isSavingOperatorData = false;
  private pendingOperatorSave = false;
  invalidFields = new Set<keyof VideoReportFormData>();
  validationMessage = '';
  private lastSuggestedReportNumber = '';
  private validationStep: number | null = null;
  private readonly numeroInformePattern = /^\d{4}[A-Z]{3,4}\/\d{4}$/;
  private unitCodeByName: Record<string, string> = {};
  private readonly fallbackUnidadOptions: string[] = [
    'Coordinacion Regional de Video Seguridad I del Este',
    'Coordinacion Regional de Video Seguridad II del Centro',
    'Coordinacion Regional de Video Seguridad III del Norte',
    'Coordinacion Regional de Video Seguridad IV del Litoral',
    'Coordinacion Regional de Video Seguridad V de la Patagonia',
    'CEAC',
  ];
  unidadOptions: string[] = [...this.fallbackUnidadOptions];

  ngOnInit() {
    this.loadUnits();
    this.loadPersonnel();
  }

  private loadUnits() {
    this.assetService.getUnits().subscribe({
      next: (units) => {
        const sortedUnits = [...(units || [])].sort((a, b) =>
          (a.name || '').localeCompare((b.name || ''), 'es', { sensitivity: 'base' })
        );

        if (sortedUnits.length === 0) {
          this.unitCodeByName = {};
          this.unidadOptions = [...this.fallbackUnidadOptions];
          if (!this.form.unidad) {
            this.form.unidad = this.unidadOptions[0];
          }
          this.applySuggestedReportNumber(true);
          return;
        }

        this.unitCodeByName = {};
        for (const unit of sortedUnits) {
          const name = (unit.name || '').trim();
          const code = this.normalizeUnitCode(unit.code || '');
          if (name && code) {
            this.unitCodeByName[name] = code;
          }
        }

        this.unidadOptions = sortedUnits.map((unit) => unit.name).filter((name) => !!name);

        const currentUnit = (this.form.unidad || '').trim();
        if (!currentUnit || !this.unidadOptions.includes(currentUnit)) {
          this.form.unidad = this.unidadOptions[0] || '';
        }
        this.applySuggestedReportNumber(true);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading units:', err);
        this.unitCodeByName = {};
        this.unidadOptions = [...this.fallbackUnidadOptions];
        if (!this.form.unidad) {
          this.form.unidad = this.unidadOptions[0];
        }
        this.applySuggestedReportNumber(true);
        this.toastService.show(
          'No se pudieron cargar las unidades desde la base de datos. Se usa lista local.',
          'warning'
        );
      }
    });
  }

  private loadPersonnel() {
    this.personnelService.getPeople().subscribe({
      next: (people) => {
        this.personnelOptions = people;
        for (const person of this.personnelOptions) {
          this.registerGradeOption((person?.rank || '').trim());
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading personnel:', err);
        this.toastService.show('Error al cargar personal', 'error');
      }
    });
  }

  onOperatorChange(personId: number | null) {
    if (!personId) {
      this.form.operador = '';
      this.form.grado = '';
      this.form.lup = '';
      this.markDirty('operador');
      return;
    }

    const person = this.personnelOptions.find(p => p.id === personId);
    if (person) {
      this.form.operador = `${person.last_name}, ${person.first_name}`;
      this.form.grado = this.normalizeGrade((person.rank || '').trim());
      this.form.lup = person.badge_number || '';
      this.markDirty('operador');
    }
  }

  onOperatorGradeChange(value: string) {
    this.form.grado = this.normalizeGrade(value || '');
    this.markDirty('grado');
  }

  onOperatorLupChange(value: string) {
    this.form.lup = (value || '').toUpperCase();
    this.markDirty('lup');
  }

  saveOperatorData(): void {
    if (!this.selectedOperatorId) {
      return;
    }

    const person = this.personnelOptions.find(p => p.id === this.selectedOperatorId);
    if (!person) {
      return;
    }

    const rankInput = (this.form.grado || '').trim();
    const lupInput = (this.form.lup || '').trim();
    if (!rankInput || !lupInput) {
      return;
    }

    const currentRank = (person.rank || '').trim();
    const currentLup = (person.badge_number || '').trim();
    if (rankInput === currentRank && lupInput === currentLup) {
      return;
    }

    if (this.isSavingOperatorData) {
      this.pendingOperatorSave = true;
      return;
    }

    this.isSavingOperatorData = true;
    const payload = this.buildOperatorUpdatePayload(person, rankInput, lupInput);

    this.personnelService.updatePerson(person.id, payload).subscribe({
      next: (updatedPerson) => {
        this.personnelOptions = this.personnelOptions.map((p) =>
          p.id === updatedPerson.id ? updatedPerson : p
        );
        this.form.grado = this.normalizeGrade((updatedPerson.rank || '').trim());
        this.form.lup = (updatedPerson.badge_number || '').trim();
        this.toastService.success('Jerarquia y legajo del operador guardados en la base de datos.');
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.error(
          this.getSimpleApiErrorMessage(error, 'No se pudieron guardar los datos del operador.')
        );
      },
      complete: () => {
        this.isSavingOperatorData = false;
        this.runPendingOperatorSave();
      }
    });
  }

  private runPendingOperatorSave() {
    if (!this.pendingOperatorSave) {
      return;
    }
    this.pendingOperatorSave = false;
    this.saveOperatorData();
  }

  private buildOperatorUpdatePayload(person: any, rank: string, lup: string) {
    return {
      first_name: person.first_name || '',
      last_name: person.last_name || '',
      badge_number: lup,
      role: person.role || 'OPERATOR',
      rank,
      unit: person.unit ?? null,
      guard_group: person.guard_group ?? '',
      assigned_systems: Array.isArray(person.assigned_systems)
        ? person.assigned_systems
        : [],
      is_active: !!person.is_active
    };
  }

  private normalizeGrade(value: string): string {
    const normalized = (value || '').trim();
    if (!normalized) {
      return 'CIVIL';
    }

    this.registerGradeOption(normalized);

    const existingOption = this.gradeOptions.find(
      (option) => option.toUpperCase() === normalized.toUpperCase()
    );
    return existingOption || normalized;
  }

  private registerGradeOption(value: string): void {
    const normalized = (value || '').trim();
    if (!normalized) {
      return;
    }

    const exists = this.gradeOptions.some(
      (option) => option.toUpperCase() === normalized.toUpperCase()
    );

    if (!exists) {
      this.gradeOptions = [...this.gradeOptions, normalized];
    }
  }

  onUnidadChange(_val: string) {
    this.applySuggestedReportNumber(false);
    this.markDirty('unidad');
    this.markDirty('numero_informe');
  }

  onNumeroInformeChange(value: string) {
    this.form.numero_informe = (value || '').toUpperCase();
    this.markDirty('numero_informe');
  }

  private applySuggestedReportNumber(force: boolean) {
    const suggested = this.buildSuggestedReportNumber(this.form.unidad);
    const current = (this.form.numero_informe || '').trim().toUpperCase();
    const previousSuggested = (this.lastSuggestedReportNumber || '').trim().toUpperCase();

    if (force || !current || current === previousSuggested) {
      this.form.numero_informe = suggested;
    }
    this.lastSuggestedReportNumber = suggested;
  }

  private buildSuggestedReportNumber(unitName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const unitCode = this.getUnitCode(unitName);
    return `0001${unitCode}/${year}`;
  }

  private normalizeUnitCode(code: string): string {
    const normalized = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized.length >= 3 && normalized.length <= 4) {
      return normalized;
    }
    return '';
  }

  private getUnitCode(unitName: string): string {
    const rawName = (unitName || '').trim();
    const codeFromDb = this.unitCodeByName[rawName];
    if (codeFromDb) {
      return codeFromDb;
    }

    const normalized = rawName.toLowerCase();
    if (normalized.includes('ceac')) return 'CEAC';
    if (normalized.includes('este')) return 'EZE';
    if (normalized.includes('centro')) return 'CEN';
    if (normalized.includes('norte')) return 'NOR';
    if (normalized.includes('litoral')) return 'LIT';
    if (normalized.includes('patagonia')) return 'PAT';
    if (normalized.includes('ezeiza')) return 'EZE';
    if (normalized.includes('aeroparque')) return 'AEP';
    if (normalized.includes('san fernando')) return 'FDO';
    if (normalized.includes('bahia blanca') || normalized.includes('bahía blanca')) return 'BHI';
    if (normalized.includes('mar del plata')) return 'MDQ';
    return 'UN';
  }

  steps = [
    { number: 1, label: 'Datos base' },
    { number: 2, label: 'Causa' },
    { number: 3, label: 'Desarrollo y fotogramas' },
    { number: 4, label: 'Revision final' },
  ];

  gradeOptions: string[] = [
    'OF. AYUDATE',
    'OF. PRINCIPAL',
    'OF. MAYOR',
    'OF. JEFE',
    'SUBINSPECTOR',
    'INSPECTOR',
    'COM. MAYOR',
    'COM. GENERAL',
    'CIVIL',
  ];

  form: VideoReportFormData = {
    report_date: new Date().toISOString().slice(0, 10),
    destinatarios: 'URSA I - Jefe',
    unidad: '',
    tipo_informe: 'Informe de análisis de videos',
    numero_informe: '',
    grado: '',
    operador: '',
    lup: '',
    sistema: 'MILESTONE',
    material_filmico: '',
    prevencion_sumaria: '',
    caratula: '',
    fiscalia: '',
    fiscal: '',
    denunciante: '',
    vuelo: '',
    empresa_aerea: '',
    destino: '',
    fecha_hecho: '',
    objeto_denunciado: '',
    unidad_aeroportuaria: 'Unidad Regional de Seguridad Aeroportuaria I',
    asiento: 'Coordinación Regional de Video Seguridad I del Este',
    aeropuerto: 'Aeropuerto Internacional Mtro. Pistarini',
    desarrollo: 'Al proceder a la reproducción y análisis del material fílmico obrante, pude observar e interpretar que, [DETALLAR OBSERVACIÓN AQUÍ].\n\nEn cumplimiento de las tareas solicitadas, es imperativo informar el siguiente resultado del análisis efectuado: Producto de la inspección visual minuciosa realizada en los autos ut supra mencionados, es dable destacar que [RESULTADO DE LA OBSERVACIÓN].\n\nPara finalizar, es relevante mencionar, que el análisis de imágenes realizado se limita únicamente a la visualización e interpretación de los registros fílmicos, sin constituir una pericia ni una tarea forense. Es todo CONSTE.',
    conclusion: 'Se determina que las imágenes analizadas coinciden con la descripción de los hechos mencionados en la denuncia.',
    firma: '',
  };

  private readonly fieldLabels: Record<keyof VideoReportFormData, string> = {
    report_date: 'Fecha del Informe',
    destinatarios: 'Destinatarios',
    tipo_informe: 'Tipo de Informe',
    numero_informe: 'Numero de Informe',
    grado: 'Jerarquia',
    operador: 'Operador',
    lup: 'Legajo (LUP)',
    unidad: 'Unidad',
    sistema: 'Sistema',
    material_filmico: 'Material Filmico Analizado',
    prevencion_sumaria: 'Prevencion Sumaria',
    caratula: 'Caratula',
    fiscalia: 'Fiscalia',
    fiscal: 'Fiscal',
    denunciante: 'Denunciante',
    vuelo: 'Vuelo',
    empresa_aerea: 'Empresa Aérea',
    destino: 'Destino',
    fecha_hecho: 'Fecha del Hecho',
    objeto_denunciado: 'Objeto Denunciado / Marca',
    unidad_aeroportuaria: 'Unidad Aeroportuaria',
    asiento: 'Asiento',
    aeropuerto: 'Aeropuerto',
    desarrollo: 'Desarrollo',
    conclusion: 'Conclusion',
    firma: 'Firma',
  };

  private readonly stepRequiredFields: Record<number, (keyof VideoReportFormData)[]> = {
    1: ['operador', 'grado', 'lup', 'report_date', 'destinatarios', 'unidad', 'numero_informe', 'aeropuerto', 'asiento', 'unidad_aeroportuaria'],
    2: ['sistema', 'material_filmico', 'prevencion_sumaria', 'caratula', 'fiscalia', 'fiscal', 'denunciante', 'objeto_denunciado'],
    3: [],
    4: [
      'operador', 'grado', 'lup', 'report_date', 'destinatarios', 'unidad', 'numero_informe', 'aeropuerto', 'asiento', 'unidad_aeroportuaria',
      'sistema', 'material_filmico', 'prevencion_sumaria', 'caratula', 'fiscalia', 'fiscal', 'denunciante', 'objeto_denunciado',
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

  markDirty(field?: keyof VideoReportFormData): void {
    this.isDirty = true;

    if (field && this.invalidFields.has(field)) {
      this.invalidFields.delete(field);
    }

    if (this.validationStep === this.currentStep) {
      this.refreshValidationState(this.currentStep, false);
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      this.invalidFields.clear();
      this.validationMessage = '';
      this.validationStep = null;
      if (step === 1) setTimeout(() => this.initSignaturePad(), 50);
      return;
    }
    if (step === this.currentStep) {
      return;
    }
    if (!this.validateStep(this.currentStep)) {
      return;
    }
    if (this.currentStep === 1) {
      this.saveOperatorData();
    }
    this.currentStep = step;
    this.invalidFields.clear();
    this.validationMessage = '';
    this.validationStep = null;
    if (step === 1) setTimeout(() => this.initSignaturePad(), 50);
  }

  nextStep(): void {
    if (!this.validateStep(this.currentStep)) {
      return;
    }
    if (this.currentStep === 1) {
      this.saveOperatorData();
    }
    if (this.currentStep < 4) {
      this.currentStep += 1;
      this.invalidFields.clear();
      this.validationMessage = '';
      this.validationStep = null;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep -= 1;
      this.invalidFields.clear();
      this.validationMessage = '';
      this.validationStep = null;
      if (this.currentStep === 1) setTimeout(() => this.initSignaturePad(), 50);
    }
  }

  // --- LOGICA DE FIRMA DIGITAL ---
  initSignaturePad() {
    if (!this.signaturePad) return;
    const canvas = this.signaturePad.nativeElement;
    this.signatureCtx = canvas.getContext('2d');
    if (this.signatureCtx) {
      this.signatureCtx.lineWidth = 3;
      this.signatureCtx.lineCap = 'round';
      this.signatureCtx.lineJoin = 'round';
      this.signatureCtx.strokeStyle = '#000000';
    }
  }

  private getCanvasPos(evt: MouseEvent | TouchEvent) {
    if (!this.signaturePad) return { x: 0, y: 0 };
    const rect = this.signaturePad.nativeElement.getBoundingClientRect();
    const scaleX = this.signaturePad.nativeElement.width / rect.width;
    const scaleY = this.signaturePad.nativeElement.height / rect.height;

    let clientX = 0, clientY = 0;
    if (window.TouchEvent && evt instanceof TouchEvent) {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else {
      clientX = (evt as MouseEvent).clientX;
      clientY = (evt as MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  startDrawingSignature(evt: MouseEvent | TouchEvent) {
    if (evt.cancelable) evt.preventDefault();
    if (!this.signatureCtx) this.initSignaturePad();
    this.isDrawingSignature = true;
    this.lastPos = this.getCanvasPos(evt);
  }

  drawSignature(evt: MouseEvent | TouchEvent) {
    if (!this.isDrawingSignature || !this.signatureCtx) return;
    if (evt.cancelable) evt.preventDefault(); // prevenir scroll en touch

    const currentPos = this.getCanvasPos(evt);
    this.signatureCtx.beginPath();
    this.signatureCtx.moveTo(this.lastPos.x, this.lastPos.y);
    this.signatureCtx.lineTo(currentPos.x, currentPos.y);
    this.signatureCtx.stroke();

    this.lastPos = currentPos;
  }

  endDrawingSignature() {
    this.isDrawingSignature = false;
  }

  clearSignatureCanvas() {
    if (this.signatureCtx && this.signaturePad) {
      this.signatureCtx.clearRect(0, 0, this.signaturePad.nativeElement.width, this.signaturePad.nativeElement.height);
    }
  }

  saveSignature() {
    if (this.signaturePad) {
      this.form.firma = this.signaturePad.nativeElement.toDataURL('image/png');
      this.markDirty();
      this.toastService.success('Firma guardada correctamente.');
    }
  }

  removeSignature() {
    this.form.firma = '';
    this.markDirty();
    setTimeout(() => this.initSignaturePad(), 50);
  }
  // --- FIN LOGICA DE FIRMA DIGITAL ---

  private isBlankField(field: keyof VideoReportFormData): boolean {
    const value = this.form[field];
    return !value || !value.trim();
  }

  isFieldInvalid(field: keyof VideoReportFormData): boolean {
    return this.invalidFields.has(field);
  }

  private refreshValidationState(step: number, notify: boolean): boolean {
    const required = this.stepRequiredFields[step] || [];
    const missing = required.filter((field) => this.isBlankField(field));
    const invalid = new Set<keyof VideoReportFormData>(missing);

    let hasFormatError = false;
    if (
      required.includes('numero_informe') &&
      !missing.includes('numero_informe') &&
      !this.numeroInformePattern.test((this.form.numero_informe || '').trim())
    ) {
      invalid.add('numero_informe');
      hasFormatError = true;
    }

    this.invalidFields = invalid;

    if (invalid.size === 0) {
      this.validationMessage = '';
      if (this.validationStep === step) {
        this.validationStep = null;
      }
      return true;
    }

    const labels = missing.map((field) => this.fieldLabels[field]);
    if (hasFormatError) {
      labels.push('Numero de Informe (formato NNNNCODIGO/YYYY)');
    }

    const message = `Completa los campos requeridos: ${labels.join(', ')}`;
    this.validationMessage = message;
    this.validationStep = step;

    if (notify) {
      this.toastService.error(message);
    }

    return false;
  }

  private validateStep(step: number): boolean {
    return this.refreshValidationState(step, true);
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
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 10cm x 8cm a 96 DPI
          const targetWidth = 378;
          const targetHeight = 302;

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(String(reader.result));

          // Fondo blanco para imagenes con fondo transparente y bordes (letterbox)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // object-fit: contain
          const ratio = Math.min(targetWidth / img.width, targetHeight / img.height);
          const newWidth = img.width * ratio;
          const newHeight = img.height * ratio;
          const offsetX = (targetWidth - newWidth) / 2;
          const offsetY = (targetHeight - newHeight) / 2;

          ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

          // Exportar como JPEG siempre (Word no soporta WEBP)
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error(`No se pudo decodificar la imagen.`));
        img.src = String(e.target?.result);
      };
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

    this.isProcessingFrames = true;
    this.loadingService.show();
    this.cdr.detectChanges();

    // Permitir que Angular renderice el spinner antes de bloquear el hilo
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      for (const file of candidates) {
        if (!this.allowedMimeTypes.has(file.type)) {
          this.toastService.error(`Tipo no permitido: ${file.name}`);
          continue;
        }
        if (file.size > this.MAX_FRAME_SIZE) {
          this.toastService.error(`El archivo ${file.name} supera ${this.MAX_FRAME_SIZE_MB} MB.`);
          continue;
        }
        if (currentTotal + file.size > this.MAX_TOTAL_FRAMES_SIZE) {
          this.toastService.error(
            `El tamano total de fotogramas no puede superar ${this.MAX_TOTAL_FRAMES_SIZE_MB} MB.`
          );
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
    } finally {
      this.isProcessingFrames = false;
      this.loadingService.hide();
      this.cdr.detectChanges();
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
    if (!this.incluirFirma) {
      this.form.firma = '';
    }
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

  improveNarrativeWithAi(): void {
    const desarrollo = (this.form.desarrollo || '').trim();
    const conclusion = (this.form.conclusion || '').trim();

    if (!desarrollo && !conclusion) {
      this.toastService.error('Escribe en Desarrollo o Conclusion para usar la mejora con IA.');
      return;
    }

    this.isImprovingText = true;
    this.informeService.improveVideoText({
      desarrollo: this.form.desarrollo,
      conclusion: this.form.conclusion
      // Redundant api_key removed, backend uses env var
    }).subscribe({
      next: (response: ImproveVideoTextResponse) => {
        this.form.desarrollo = response?.desarrollo ?? this.form.desarrollo;
        this.form.conclusion = response?.conclusion ?? this.form.conclusion;
        this.markDirty();
        this.toastService.success('Texto mejorado con IA.');
        this.isImprovingText = false;
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.error(this.getSimpleApiErrorMessage(error, 'No se pudo mejorar el texto con IA.'));
        this.isImprovingText = false;
      }
    });
  }

  generateReport(): void {
    if (!this.validateStep(4)) {
      this.currentStep = 4;
      return;
    }
    this.saveOperatorData();

    this.isGenerating = true;
    const payload = this.buildPayload();

    if (this.reportGenerationMode === 'frontend_doc') {
      this.loadingService.show();
      setTimeout(async () => await this.generateReportLocally(payload), 0);
      return;
    }

    this.informeService.generateVideoAnalysisReport(payload).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.toastService.error('No se recibio archivo para descargar.');
          this.isGenerating = false;
          return;
        }

        const serverFileName = this.extractFilenameFromContentDisposition(
          response.headers.get('content-disposition')
        );
        const downloadFileName = serverFileName || `informe_analisis_video_${this.form.report_date || 'hoy'}.docx`;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFileName;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Informe generado');
        this.isGenerating = false;
        this.isDirty = false;
      },
      error: async (error: HttpErrorResponse) => {
        const message = await this.getReportErrorMessage(error);
        this.toastService.error(message);
        this.isGenerating = false;
      }
    });
  }

  private async generateReportLocally(payload: VideoReportPayload): Promise<void> {
    try {
      const logoBase64 = await this.getLogoBase64();
      const html = this.buildLocalWordHtml(payload, logoBase64);
      const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe_analisis_video_${this.form.report_date || 'hoy'}_local.doc`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.toastService.success('Informe local generado.');
      this.isDirty = false;
    } catch {
      this.toastService.error('No se pudo generar el informe local.');
    } finally {
      this.isGenerating = false;
      this.loadingService.hide();
    }
  }

  private async getLogoBase64(): Promise<string> {
    try {
      const response = await fetch('/Logo-PSA.png');
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Error al cargar el logo:', e);
      return '';
    }
  }

  private buildLocalWordHtml(payload: VideoReportPayload, logoBase64: string): string {
    const report = payload.report_data;
    const orderedFrames = [...payload.frames].sort((a, b) => a.order - b.order);
    const frameBlocks = orderedFrames.length === 0
      ? '<p>No se adjuntaron fotogramas.</p>'
      : orderedFrames.map((frame, idx) => `
          <div class="frame">
            <h4>Fotograma ${idx + 1}: ${this.escapeHtml(frame.file_name)}</h4>
            <p align="center" style="text-align: center; margin: 20px 0;">
              <img src="${frame.content_base64}" alt="Fotograma ${idx + 1}" width="378" height="302" style="display: block; margin: 0 auto; border: 1px solid #d1d5db;">
            </p>
            <p><strong>Descripcion:</strong> ${this.escapeHtml(frame.description || 'Sin descripcion.')}</p>
          </div>
        `).join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Informe de Analisis de Video</title>
        <style>
          @page { margin: 1.27cm; } /* Margen estrecho */
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 0; }
          h1 { font-size: 24px; margin-bottom: 4px; text-align: center; }
          h2 { 
            font-size: 16px; 
            margin-top: 30px; 
            margin-bottom: 15px; 
            background-color: #000000; 
            color: #ffffff; 
            padding: 8px; 
            text-transform: uppercase; 
          }
          h3 { font-size: 15px; margin-top: 18px; margin-bottom: 6px; }
          h4 { font-size: 14px; margin: 0 0 8px 0; }
          p { font-size: 12px; line-height: 1.5; margin: 6px 0; }
          .meta p { margin: 4px 0; }
          .frame { border: 1px solid #e5e7eb; padding: 10px; margin: 10px 0; text-align: left; }
          .frame img { border: 1px solid #d1d5db; }
          .muted { color: #6b7280; font-size: 11px; margin-top: 18px; text-align: center; }
        </style>
      </head>
      <body>
        ${logoBase64 ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoBase64}" width="150" alt="Logo PSA"></div>` : ''}
        <h1>${this.escapeHtml(report.tipo_informe)} ${this.escapeHtml(report.numero_informe)}</h1>
        <p class="muted">Generado localmente en frontend para reducir trafico.</p>

/* Replaced content for local doc generation to include intro and new fields if mapped */
        <div class="meta">
          <p><strong>Fecha:</strong> ${this.escapeHtml(report.report_date)}</p>
          <p><strong>Destinatarios:</strong> ${this.escapeHtml(report.destinatarios)}</p>
          <p><strong>Operador:</strong> ${this.escapeHtml(report.grado)} ${this.escapeHtml(report.operador)}, LUP: ${this.escapeHtml(report.lup)}</p>
          <p><strong>Unidad Aeroportuaria:</strong> ${this.escapeHtml(report.unidad_aeroportuaria)}</p>
          <p><strong>Asiento / Aeropuerto:</strong> ${this.escapeHtml(report.asiento)} / ${this.escapeHtml(report.aeropuerto)}</p>
          <p><strong>Sistema:</strong> ${this.escapeHtml(report.sistema)}</p>
          <p><strong>Prevencion sumaria:</strong> ${this.escapeHtml(report.prevencion_sumaria)}</p>
          <p><strong>Caratula:</strong> ${this.escapeHtml(report.caratula)}</p>
          <p><strong>Fiscalia:</strong> ${this.escapeHtml(report.fiscalia)}</p>
          <p><strong>Fiscal:</strong> ${this.escapeHtml(report.fiscal)}</p>
          <p><strong>Denunciante:</strong> ${this.escapeHtml(report.denunciante)}</p>
          ${report.vuelo ? `<p><strong>Vuelo:</strong> ${this.escapeHtml(report.vuelo)}</p>` : ''}
          ${report.empresa_aerea ? `<p><strong>Empresa Aerea:</strong> ${this.escapeHtml(report.empresa_aerea)}</p>` : ''}
          ${report.destino ? `<p><strong>Destino:</strong> ${this.escapeHtml(report.destino)}</p>` : ''}
          ${report.fecha_hecho ? `<p><strong>Fecha del Hecho:</strong> ${this.escapeHtml(report.fecha_hecho)}</p>` : ''}
          <p><strong>Objeto denunciado:</strong> ${this.escapeHtml(report.objeto_denunciado)}</p>
          <p><strong>Firma adjunta:</strong> ${report.firma && report.firma.startsWith('data:image') ? 'Sí' : 'No'}</p>
        </div>

        <h2>Introduccion</h2>
        <p style="text-align: justify; text-indent: 2em; line-height: 1.5;">
          En el ${this.escapeHtml(report.aeropuerto)}, asiento de la ${this.escapeHtml(report.asiento)}, de la Policía de Seguridad Aeroportuaria, a los XXXXX días del mes de XXXXX del año XXXXX, siendo la hora XXXXX, quien suscribe ${this.escapeHtml(report.grado)} ${this.escapeHtml(report.operador)}, LUP: ${this.escapeHtml(report.lup)}, en mi carácter de Operador de Video Vigilancia (OVV), labro el presente a los fines legales de dejar debida constancia del resultado obtenido en virtud al análisis visual minucioso efectuado sobre el material fílmico, obrante en el sistema denominado “${this.escapeHtml(report.sistema)}”, emplazado en el Centro Operativo de Control (COC) de la ${this.escapeHtml(report.unidad_aeroportuaria)}, en el marco de la Prevención Sumaria ${this.escapeHtml(report.prevencion_sumaria)}, caratulada “${this.escapeHtml(report.caratula)}”, en trámite por ante la ${this.escapeHtml(report.fiscalia)}, a cargo del Señor fiscal ${this.escapeHtml(report.fiscal)}, respecto de los hechos denunciados por el Sr/a. ${this.escapeHtml(report.denunciante)}, quien manifiesta el faltante de ${this.escapeHtml(report.objeto_denunciado)}${report.vuelo ? `, el cual se encontraba en el interior de su equipaje despachado por bodega del vuelo ${this.escapeHtml(report.vuelo)} perteneciente a la empresa aerocomercial ${this.escapeHtml(report.empresa_aerea || '—')}, con destino a la ciudad de ${this.escapeHtml(report.destino || '—')}, el día ${this.escapeHtml(report.fecha_hecho || '—')}` : ''}.
        </p>

        <h2>Material Fílmico Analizado</h2>
        <p>${this.escapeHtml(report.material_filmico || 'Sin material.').replace(/\n/g, '<br>')}</p>

        <h2>Desarrollo</h2>
        <p>${this.escapeHtml(report.desarrollo || 'Sin desarrollo.').replace(/\n/g, '<br>')}</p>

        <h2>Anexo de fotogramas (${orderedFrames.length})</h2>
        ${frameBlocks}

        <h2>Conclusion</h2>
        <p>${this.escapeHtml(report.conclusion || 'Sin conclusion.').replace(/\n/g, '<br>')}</p>

        <br><br><br>
        <div style="text-align: center; margin-top: 50px;">
          <p>_________________________________________</p>
          ${report.firma && report.firma.startsWith('data:image')
        ? `<img src="${report.firma}" style="max-height: 80px; display: block; margin: -20px auto 0 auto;" />`
        : ``}
          <p style="margin-top: ${report.firma && report.firma.startsWith('data:image') ? '5px' : '10px'};"><strong>${this.escapeHtml(report.grado)} ${this.escapeHtml(report.operador)}</strong></p>
        </div>
      </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private extractFilenameFromContentDisposition(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      return decodeURIComponent(utf8Match[1].trim().replace(/["']/g, ''));
    }

    const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (asciiMatch && asciiMatch[1]) {
      return asciiMatch[1].trim();
    }

    return null;
  }

  private async getReportErrorMessage(error: HttpErrorResponse): Promise<string> {
    if (error.status === 0) {
      return 'No se pudo conectar con el backend en http://localhost:8000. Verifica que Django este ejecutandose.';
    }

    if (error.status === 413) {
      return 'El tamano total del informe excede el maximo permitido.';
    }

    const payload = error.error;

    if (payload instanceof Blob) {
      try {
        const text = await payload.text();
        const parsed = JSON.parse(text);
        if (parsed?.['error'] && typeof parsed['error'] === 'string') {
          return parsed['error'];
        }
        if (parsed?.['errors']) {
          return this.formatValidationErrors(parsed['errors']);
        }
      } catch {
        // Keep fallback message below.
      }
    }

    if (payload && typeof payload === 'object') {
      const apiPayload = payload as Record<string, unknown>;
      if (typeof apiPayload['error'] === 'string') {
        return apiPayload['error'];
      }
      if (apiPayload['errors']) {
        return this.formatValidationErrors(apiPayload['errors']);
      }
    }

    if (typeof payload === 'string' && payload.trim()) {
      return payload.trim();
    }

    return 'No se pudo generar el informe. Verifica los datos cargados.';
  }

  private formatValidationErrors(errors: unknown): string {
    if (typeof errors === 'string') {
      return errors;
    }

    if (Array.isArray(errors)) {
      return errors.map((item) => String(item)).join(' ');
    }

    if (errors && typeof errors === 'object') {
      const messages: string[] = [];
      for (const value of Object.values(errors as Record<string, unknown>)) {
        if (typeof value === 'string') {
          messages.push(value);
        } else if (Array.isArray(value)) {
          messages.push(value.map((item) => String(item)).join(' '));
        }
      }
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    return 'No se pudo generar el informe. Verifica los datos cargados.';
  }

  private getSimpleApiErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el backend en http://localhost:8000.';
    }

    if (error?.error?.error && typeof error.error.error === 'string') {
      return error.error.error;
    }

    if (error?.error?.errors) {
      return this.formatValidationErrors(error.error.errors);
    }

    return fallback;
  }
}
