import { Component, HostListener, OnDestroy, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  InformeService,
  ImproveVideoTextMode,
  ImproveVideoTextResponse,
  MaterialSpeechContext,
  VideoReportFormData,
  VideoReportFrame,
  VideoReportHashAlgorithm,
  VideoReportPayload,
  VideoReportVmsAuthenticityMode,
} from '../../services/informe.service';
import { ToastService } from '../../services/toast.service';
import { LoadingService } from '../../services/loading.service';
import { PersonnelService } from '../../services/personnel.service';
import { AssetService } from '../../services/asset.service';

type HelpKey = keyof VideoReportFormData | 'operador_select' | 'frame_upload' | 'frame_description';

type FieldHelpContent = {
  quePoner: string;
  ejemplo: string;
};

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

  readonly MAX_FRAMES = 30;
  readonly MAX_FRAME_SIZE = 8 * 1024 * 1024;
  readonly MAX_TOTAL_FRAMES_SIZE = 80 * 1024 * 1024;
  readonly MAX_FRAME_SIZE_MB = this.MAX_FRAME_SIZE / (1024 * 1024);
  readonly MAX_TOTAL_FRAMES_SIZE_MB = this.MAX_TOTAL_FRAMES_SIZE / (1024 * 1024);
  readonly allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  readonly motivoSinHashOptions: string[] = [
    'El sistema no permitía efectuar hash al momento del análisis',
    'No se contó con las herramientas necesarias al momento del análisis',
    'El material fue recibido sin posibilidad de aplicar hash previo',
    'No correspondía por el tipo de análisis solicitado',
  ];

  isGenerating = false;
  isImprovingNarrative = false;
  isImprovingMaterialFilmico = false;
  isProcessingFrames = false;
  utilizoHash = false;
  isDirty = false;
  aiProgressLabel = '';
  private aiStartedAt = 0;
  private aiProgressTimer: ReturnType<typeof window.setInterval> | null = null;
  private aiToastId: number | null = null;
  private aiBaseLabel = '';

  @ViewChild('signaturePad') signaturePad?: ElementRef<HTMLCanvasElement>;
  private signatureCtx: CanvasRenderingContext2D | null = null;
  isDrawingSignature = false;
  incluirFirma = false;
  incluirDatosVuelo = false;
  private airportManualOverride = false;
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
  private readonly numeroInformePattern = /^\d{4}[A-Z]{3,4}\/\d{4}$/;
  private unitCodeByName: Record<string, string> = {};
  private unitAirportByName: Record<string, string> = {};
  private readonly fallbackUnidadOptions: string[] = [
    'Coordinacion Regional de Video Seguridad I del Este',
    'Coordinacion Regional de Video Seguridad II del Centro',
    'Coordinacion Regional de Video Seguridad III del Norte',
    'Coordinacion Regional de Video Seguridad IV del Litoral',
    'Coordinacion Regional de Video Seguridad V de la Patagonia',
    'CEAC',
  ];
  unidadOptions: string[] = [...this.fallbackUnidadOptions];
  private readonly fallbackAirportOptions: string[] = [
    'Aeropuerto Internacional Mtro. Pistarini',
    'Aeroparque Jorge Newbery',
    'Aeropuerto Internacional de San Fernando',
    'Aeropuerto Comandante Espora',
    'Aeropuerto Astor Piazzolla',
  ];
  airportOptions: string[] = [...this.fallbackAirportOptions];
  readonly hashAlgorithmOptions: { value: VideoReportHashAlgorithm; label: string }[] = [
    { value: 'sha3', label: 'SHA-3' },
    { value: 'sha256', label: 'SHA-256' },
    { value: 'sha512', label: 'SHA-512' },
    { value: 'otro', label: 'Otro' },
  ];

  readonly vmsAuthenticityOptions: { value: VideoReportVmsAuthenticityMode; label: string }[] = [
    { value: 'vms_propio', label: 'Propio VMS (Milestone / Avigilon)' },
    { value: 'hash_preventivo', label: 'Hash calculado externamente (ej: HashMyFiles)' },
    { value: 'sin_autenticacion', label: 'Sin método de verificación' },
    { value: 'otro', label: 'Otro' },
  ];
  private readonly hashAlgorithmLabelByCode: Record<VideoReportHashAlgorithm, string> = {
    sha1: 'SHA-1',
    sha3: 'SHA-3',
    sha256: 'SHA-256',
    sha512: 'SHA-512',
    otro: 'OTRO',
  };

  openHelpKey: HelpKey | null = null;

  get isAiProcessing(): boolean {
    return this.isImprovingNarrative || this.isImprovingMaterialFilmico;
  }

  ngOnInit() {
    if (!this.form.report_date) {
      this.form.report_date = new Date().toISOString().split('T')[0];
    }
    this.loadUnits();
    this.loadPersonnel();
  }

  private loadUnits() {
    this.assetService.getUnits().subscribe({
      next: (units) => {
        setTimeout(() => this.applyUnitsFromApi(units || []), 50);
      },
      error: (err) => {
        console.error('Error loading units:', err);
        setTimeout(() => this.applyFallbackUnits(), 50);
        this.toastService.show(
          'No se pudieron cargar las unidades desde la base de datos. Se usa lista local.',
          'warning'
        );
      }
    });
  }

  private applyUnitsFromApi(units: any[]): void {
    const sortedUnits = [...units].sort((a, b) =>
      (a.name || '').localeCompare((b.name || ''), 'es', { sensitivity: 'base' })
    );

    if (sortedUnits.length === 0) {
      this.applyFallbackUnits();
      return;
    }

    this.unitCodeByName = {};
    this.unitAirportByName = {};
    for (const unit of sortedUnits) {
      const name = (unit.name || '').trim();
      const code = this.normalizeUnitCode(unit.code || '');
      if (name && code) {
        this.unitCodeByName[name] = code;
      }
      if (name) {
        this.unitAirportByName[name] = this.inferAirportFromUnit(name, code);
      }
    }
    this.refreshAirportOptions();

    this.unidadOptions = sortedUnits.map((unit) => unit.name).filter((name) => !!name);

    const currentUnit = (this.form.unidad || '').trim();
    if (!currentUnit || !this.unidadOptions.includes(currentUnit)) {
      this.form.unidad = this.unidadOptions[0] || '';
    }
    this.syncAirportFromUnitSelection();
    this.applySuggestedReportNumber(true);
  }

  private applyFallbackUnits(): void {
    this.unitCodeByName = {};
    this.unitAirportByName = {};
    this.unidadOptions = [...this.fallbackUnidadOptions];
    this.refreshAirportOptions();
    if (!this.form.unidad) {
      this.form.unidad = this.unidadOptions[0];
    }
    this.syncAirportFromUnitSelection();
    this.applySuggestedReportNumber(true);
  }

  private loadPersonnel() {
    this.personnelService.getPeople().subscribe({
      next: (people) => {
        setTimeout(() => {
          this.personnelOptions = people;
          for (const person of this.personnelOptions) {
            this.registerGradeOption((person?.rank || '').trim());
          }
        }, 50);
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

      // Auto-seleccionar la unidad asignada al operador (si la tiene y existe en las opciones)
      if (person.unit_details && person.unit_details.name) {
        const unitName = person.unit_details.name.trim();
        if (this.unidadOptions.includes(unitName)) {
          this.form.unidad = unitName;
          this.syncAirportFromUnitSelection();
        }
      } else if (person.unit) {
        // Si por alguna razon solo viene el ID o el codigo
        const unitMatches = this.unidadOptions.filter(opt => opt.includes(person.unit) || this.unitCodeByName[opt] === person.unit);
        if (unitMatches.length > 0) {
          this.form.unidad = unitMatches[0];
          this.syncAirportFromUnitSelection();
        }
      }

      this.markDirty('operador');
    }
  }

  onOperatorGradeChange(value: string) {
    this.form.grado = this.normalizeGrade(value || '');
    this.markDirty('grado');
  }

  onOperatorLupChange(value: string) {
    this.form.lup = (value || '').replace(/\D/g, '');
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
    this.syncAirportFromUnitSelection();
    this.applySuggestedReportNumber(false);
    this.markDirty('unidad');
    this.markDirty('numero_informe');
    this.markDirty('aeropuerto');
  }

  onDatosVueloToggle(): void {
    this.markDirty();
  }

  onAirportSelect(value: string): void {
    const selectedAirport = (value || '').trim();
    this.form.aeropuerto = selectedAirport;
    this.ensureAirportOption(selectedAirport);

    const unitName = (this.form.unidad || '').trim();
    const inferredAirport =
      this.unitAirportByName[unitName] ||
      this.inferAirportFromUnit(unitName, this.unitCodeByName[unitName] || '');

    this.airportManualOverride = !!selectedAirport && selectedAirport !== inferredAirport;
    this.markDirty('aeropuerto');
  }

  toggleHashAlgorithm(algorithm: VideoReportHashAlgorithm): void {
    const current = this.form.hash_algorithms || [];
    if (current.includes(algorithm)) {
      this.form.hash_algorithms = current.filter((item) => item !== algorithm);
    } else {
      this.form.hash_algorithms = [...current, algorithm];
    }
    this.markDirty('hash_algorithms');
  }

  hasHashAlgorithm(algorithm: VideoReportHashAlgorithm): boolean {
    return (this.form.hash_algorithms || []).includes(algorithm);
  }

  toggleNativeHashAlgorithm(algorithm: VideoReportHashAlgorithm): void {
    const current = this.form.vms_native_hash_algorithms || [];
    if (current.includes(algorithm)) {
      this.form.vms_native_hash_algorithms = current.filter((item) => item !== algorithm);
    } else {
      this.form.vms_native_hash_algorithms = [...current, algorithm];
    }
    this.markDirty('vms_native_hash_algorithms');
  }

  hasNativeHashAlgorithm(algorithm: VideoReportHashAlgorithm): boolean {
    return (this.form.vms_native_hash_algorithms || []).includes(algorithm);
  }

  getSelectedNativeHashAlgorithmsSummary(): string {
    const algorithms = this.form.vms_native_hash_algorithms || [];
    const labels = algorithms.map(item => this.getHashAlgorithmLabel(item, this.form.vms_native_hash_algorithm_other || ''));
    return labels.length > 0 ? labels.join(', ') : 'No consignado';
  }

  onVmsAuthenticityModeChange(value: VideoReportVmsAuthenticityMode | ''): void {
    this.form.vms_authenticity_mode = value;
    if (value !== 'otro') {
      this.form.vms_authenticity_detail = '';
    }
    if (value !== 'vms_propio') {
      this.form.vms_native_hash_algorithms = [];
      this.form.vms_native_hash_algorithm_other = '';
    }
    if (value === 'sin_autenticacion' || value === 'otro') {
      this.utilizoHash = false;
      this.form.hash_program = '';
      this.form.hash_algorithms = [];
      this.form.hash_algorithm_other = '';
    }
    if (value === 'vms_propio') {
      this.utilizoHash = false;
      this.form.hash_program = '';
      this.form.hash_algorithms = [];
      this.form.hash_algorithm_other = '';
    }
    if (value === 'hash_preventivo') {
      this.utilizoHash = true;
      if (!(this.form.hash_program || '').trim()) {
        this.form.hash_program = 'HashMyFiles';
        this.markDirty('hash_program');
      }
    }
    this.markDirty('vms_authenticity_mode');
  }

  onUtilizaHashChange(checked: boolean): void {
    this.utilizoHash = checked;
    if (!checked) {
      this.form.hash_program = '';
      this.form.hash_algorithms = [];
      this.form.hash_algorithm_other = '';
    } else {
      this.form.motivo_sin_hash = '';
      if (
        this.form.vms_authenticity_mode === 'vms_propio' &&
        !(this.form.hash_program || '').trim()
      ) {
        this.form.hash_program = 'HashMyFiles';
        this.markDirty('hash_program');
      }
    }
  }

  getSelectedHashAlgorithmsSummary(): string {
    const labels = this.getSelectedHashAlgorithmLabels();
    return labels.length > 0 ? labels.join(', ') : 'No consignado';
  }



  getVmsAuthenticitySummary(): string {
    const mode = this.form.vms_authenticity_mode || '';
    const label = this.getVmsAuthenticityLabel(mode);
    if (mode === 'otro' && (this.form.vms_authenticity_detail || '').trim()) {
      return `${label} - ${this.form.vms_authenticity_detail.trim()}`;
    }
    return label;
  }

  onNumeroInformeChange(value: string) {
    this.form.numero_informe = (value || '').toUpperCase();
    this.markDirty('numero_informe');
  }

  onMaterialFilmicoChange(value: string): void {
    this.form.material_filmico = value || '';
    this.markDirty('material_filmico');
  }

  onDesarrolloChange(value: string): void {
    this.form.desarrollo = value || '';
    this.markDirty();
  }

  onConclusionChange(value: string): void {
    this.form.conclusion = value || '';
    this.markDirty();
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

  private inferAirportFromUnit(unitName: string, unitCode: string): string {
    const normalizedName = (unitName || '').trim().toLowerCase();
    const code = this.normalizeUnitCode(unitCode || this.getUnitCode(unitName));

    if (code === 'EZE' || normalizedName.includes('ezeiza')) {
      return 'Aeropuerto Internacional Mtro. Pistarini';
    }
    if (code === 'AEP' || normalizedName.includes('aeroparque')) {
      return 'Aeroparque Jorge Newbery';
    }
    if (code === 'FDO' || normalizedName.includes('san fernando')) {
      return 'Aeropuerto Internacional de San Fernando';
    }
    if (code === 'BHI' || normalizedName.includes('bahia blanca') || normalizedName.includes('bahía blanca')) {
      return 'Aeropuerto Comandante Espora';
    }
    if (code === 'MDQ' || normalizedName.includes('mar del plata')) {
      return 'Aeropuerto Astor Piazzolla';
    }
    return '';
  }

  private syncAirportFromUnitSelection(): void {
    const unitName = (this.form.unidad || '').trim();
    if (!unitName) {
      return;
    }

    const currentAirport = (this.form.aeropuerto || '').trim();
    if (this.airportManualOverride && !!currentAirport) {
      return;
    }

    const inferredAirport =
      this.unitAirportByName[unitName] ||
      this.inferAirportFromUnit(unitName, this.unitCodeByName[unitName] || '');

    if (inferredAirport) {
      this.form.aeropuerto = inferredAirport;
      this.ensureAirportOption(inferredAirport);
      this.airportManualOverride = false;
    }
  }

  private refreshAirportOptions(): void {
    const options = new Set<string>(this.fallbackAirportOptions);
    for (const value of Object.values(this.unitAirportByName)) {
      const normalized = (value || '').trim();
      if (normalized) {
        options.add(normalized);
      }
    }
    this.airportOptions = Array.from(options).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }

  private ensureAirportOption(value: string): void {
    const normalized = (value || '').trim();
    if (!normalized) {
      return;
    }
    if (this.airportOptions.includes(normalized)) {
      return;
    }
    this.airportOptions = [...this.airportOptions, normalized].sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }


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
    unidad: this.fallbackUnidadOptions[0],
    tipo_informe: 'Informe de análisis de videos',
    numero_informe: '',
    grado: '',
    operador: '',
    lup: '',
    sistema: '',
    cantidad_observada: '',
    sectores_analizados: '',
    franja_horaria_analizada: '',
    tiempo_total_analisis: '',
    sintesis_conclusion: '',
    vms_native_hash_algorithms: [],
    vms_native_hash_algorithm_other: '',
    hash_algorithms: [],
    hash_algorithm_other: '',
    hash_program: '',
    motivo_sin_hash: '',
    medida_seguridad_interna: '',
    vms_authenticity_mode: '',
    vms_authenticity_detail: '',
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
    aeropuerto: '',
    desarrollo: '',
    conclusion: '',
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
    sistema: 'Sistema o Dispositivo proveniente de la información',
    cantidad_observada: 'Cantidad observada',
    sectores_analizados: 'Sectores analizados',
    franja_horaria_analizada: 'Franja horaria analizada',
    tiempo_total_analisis: 'Tiempo total de análisis',
    sintesis_conclusion: 'Síntesis para conclusión',
    vms_native_hash_algorithms: 'Algoritmos Hash Nativos del VMS',
    vms_native_hash_algorithm_other: 'Otro algoritmo de hash nativo',
    hash_algorithms: 'Algoritmos SHA',
    hash_algorithm_other: 'Otro algoritmo de hash',
    hash_program: 'Programa de hash',
    motivo_sin_hash: 'Motivo por el cual no se efectuó hash',
    medida_seguridad_interna: 'Medida de seguridad interna',
    vms_authenticity_mode: 'Autenticidad del material exportado',
    vms_authenticity_detail: 'Detalle de autenticidad',
    material_filmico: 'Material Filmico Analizado',
    prevencion_sumaria: 'Prevencion Sumaria',
    caratula: 'Caratula',
    fiscalia: 'Fiscalia / Juzgado',
    fiscal: 'Fiscal / Juez / Secretario',
    denunciante: 'Denunciante',
    vuelo: 'Vuelo',
    empresa_aerea: 'Empresa Aérea',
    destino: 'Destino',
    fecha_hecho: 'Fecha del Hecho',
    objeto_denunciado: 'Objeto Denunciado / Marca',
    aeropuerto: 'Aeropuerto',
    desarrollo: 'Desarrollo',
    conclusion: 'Conclusion',
    firma: 'Firma',
  };

  readonly fieldHelp: Record<HelpKey, FieldHelpContent> = {
    operador_select: {
      quePoner: 'Selecciona el agente que realiza el informe.',
      ejemplo: 'Perez, Juan',
    },
    report_date: {
      quePoner: 'Fecha de confeccion del informe.',
      ejemplo: '2026-02-26',
    },
    destinatarios: {
      quePoner: 'Area o autoridad destinataria del informe.',
      ejemplo: 'URSA I - Jefe',
    },
    tipo_informe: {
      quePoner: 'Tipo de documento emitido.',
      ejemplo: 'Informe de analisis de videos',
    },
    numero_informe: {
      quePoner: 'Numero unico del informe con formato oficial.',
      ejemplo: '0001EZE/2026',
    },
    grado: {
      quePoner: 'Jerarquia del operador que firma.',
      ejemplo: 'OF. PRINCIPAL',
    },
    operador: {
      quePoner: 'Nombre del operador (se autocompleta desde Personal).',
      ejemplo: 'Perez, Juan',
    },
    lup: {
      quePoner: 'Legajo numerico de 6 digitos del operador.',
      ejemplo: '506896',
    },
    unidad: {
      quePoner: 'Unidad principal desde la que se emite el informe.',
      ejemplo: 'Coordinacion Regional de Video Seguridad I del Este',
    },
    sistema: {
      quePoner: 'Sistema de video donde se realizo el analisis.',
      ejemplo: 'MILESTONE',
    },
    cantidad_observada: {
      quePoner: 'Cantidad simple relacionada al hecho observado (personas, bultos, eventos, etc.).',
      ejemplo: '2 personas / 1 bulto / 3 eventos',
    },
    sectores_analizados: {
      quePoner: 'Sectores o áreas concretas donde se revisaron cámaras.',
      ejemplo: 'Hall de arribos, cinta 3, plataforma norte',
    },
    franja_horaria_analizada: {
      quePoner: 'Rango horario puntual revisado durante el análisis.',
      ejemplo: '14:05 a 15:42',
    },
    tiempo_total_analisis: {
      quePoner: 'Duración total invertida en el análisis visual.',
      ejemplo: '1 hora 37 minutos',
    },
    sintesis_conclusion: {
      quePoner: 'Resumen breve que quieras ver reflejado en la conclusión.',
      ejemplo: 'No se observa manipulación posterior del bulto denunciado',
    },
    vms_native_hash_algorithms: {
      quePoner: 'Algoritmos hash generados nativamente por el VMS.',
      ejemplo: 'SHA-256',
    },
    vms_native_hash_algorithm_other: {
      quePoner: 'Especificar otras firmas o hashes nativos generados.',
      ejemplo: 'Watermark propietaria Milestone',
    },
    hash_algorithms: {
      quePoner: 'Selecciona los algoritmos SHA usados para preservar integridad del material.',
      ejemplo: 'SHA-256, SHA-512',
    },
    hash_algorithm_other: {
      quePoner: 'Especifica el algoritmo cuando seleccionas "Otro".',
      ejemplo: 'BLAKE3',
    },
    hash_program: {
      quePoner: 'Herramienta utilizada para calcular hash de seguridad.',
      ejemplo: 'HASH MY FILE',
    },
    medida_seguridad_interna: {
      quePoner: 'Medida de seguridad interna declarada por el COC/VMS.',
      ejemplo: 'Control de auditoría de exportaciones y bitácora interna',
    },
    vms_authenticity_mode: {
      quePoner: 'Cómo se respalda autenticidad del material exportado.',
      ejemplo: 'Propio VMS',
    },
    vms_authenticity_detail: {
      quePoner: 'Detalle técnico cuando autenticidad = Otro.',
      ejemplo: 'Firma digital del exportador y constancia interna del sistema',
    },
    prevencion_sumaria: {
      quePoner: 'Numero/identificador de la prevencion sumaria.',
      ejemplo: '003BAR/2026',
    },
    caratula: {
      quePoner: 'Texto de la caratula de la causa.',
      ejemplo: 'DENUNCIA S/ PRESUNTO HURTO',
    },
    fiscalia: {
      quePoner: 'Fiscalia o juzgado interviniente (si corresponde).',
      ejemplo: 'Fiscalia Nro. 02',
    },
    fiscal: {
      quePoner: 'Autoridad interviniente (Fiscal, Juez o Secretario), si corresponde.',
      ejemplo: 'INTI ISLA / MARIA GOMEZ / JUAN PEREZ',
    },
    denunciante: {
      quePoner: 'Persona que realiza la denuncia.',
      ejemplo: 'PONZO Osvaldo',
    },
    fecha_hecho: {
      quePoner: 'Fecha en la que ocurrio el hecho investigado.',
      ejemplo: '2026-02-21',
    },
    vuelo: {
      quePoner: 'Numero de vuelo si el hecho involucra transporte aereo.',
      ejemplo: 'WJ 3045',
    },
    empresa_aerea: {
      quePoner: 'Aerolinea vinculada al vuelo (si corresponde).',
      ejemplo: 'Jet Smart',
    },
    destino: {
      quePoner: 'Destino del vuelo relacionado al hecho.',
      ejemplo: 'San Carlos de Bariloche',
    },
    objeto_denunciado: {
      quePoner: 'Objeto denunciado y/o marca afectada.',
      ejemplo: 'Telefono Samsung S24, color negro',
    },
    aeropuerto: {
      quePoner: 'Lugar de origen de la informacion (aeropuerto u otro lugar).',
      ejemplo: 'Aeropuerto Internacional Mtro. Pistarini / Plataforma Norte',
    },
    material_filmico: {
      quePoner: 'Detalla camaras, fechas, horarios y tramos revisados.',
      ejemplo: 'Camara 01 y 03, 21/02/2026 de 14:00 a 16:30, sector check-in.',
    },
    desarrollo: {
      quePoner: 'Narracion cronologica y observaciones relevantes del analisis.',
      ejemplo: 'Se observa ingreso del pasajero... luego retiro de equipaje...',
    },
    conclusion: {
      quePoner: 'Resultado final del analisis, concreto y verificable.',
      ejemplo: 'Las imagenes son compatibles con la denuncia presentada.',
    },
    firma: {
      quePoner: 'Firma digital del operador responsable.',
      ejemplo: 'Habilitar firma y dibujar en el recuadro.',
    },
    frame_upload: {
      quePoner: 'Adjunta fotogramas relevantes en formato imagen.',
      ejemplo: 'Subir JPG/PNG de capturas clave del hecho.',
    },
    frame_description: {
      quePoner: 'Desycribe brevemente que muestra cada fotograma.',
      ejemplo: 'Se observa al sospechoso retirando equipaje de cinta 3.',
    },
    motivo_sin_hash: {
      quePoner: 'Indica la razón por la que no se adjuntó un archivo de hash o no se verificó.',
      ejemplo: 'El sistema no permite exportación con hash nativo.',
    },
  };

  private readonly requiredFields: (keyof VideoReportFormData)[] = [
    'operador', 'grado', 'lup', 'report_date', 'destinatarios', 'unidad', 'numero_informe',
    'sistema', 'material_filmico', 'prevencion_sumaria', 'caratula', 'denunciante',
    'objeto_denunciado', 'vms_authenticity_mode',
  ];

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty && !this.isGenerating) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.openHelpKey) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && (target.closest('[data-help-trigger]') || target.closest('[data-help-panel]'))) {
      return;
    }
    this.openHelpKey = null;
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.openHelpKey = null;
  }

  ngOnDestroy(): void {
    this.stopAiFeedback();
    for (const frame of this.frames) {
      if (frame.preview_url) {
        URL.revokeObjectURL(frame.preview_url);
      }
    }
  }

  private startAiFeedback(label: string): void {
    this.stopAiFeedback();
    this.aiBaseLabel = label;
    this.aiStartedAt = Date.now();
    this.aiProgressLabel = `${label} · 0s`;
    this.aiToastId = this.toastService.loading(label);
    this.aiProgressTimer = window.setInterval(() => {
      const elapsedSeconds = this.getAiElapsedSeconds();
      this.aiProgressLabel = `${this.aiBaseLabel} · ${elapsedSeconds}s`;
      if (this.aiToastId !== null) {
        this.toastService.update(this.aiToastId, {
          message: `${this.aiBaseLabel} (${elapsedSeconds}s)`
        });
      }
    }, 1000);
  }

  private stopAiFeedback(): void {
    if (this.aiProgressTimer !== null) {
      window.clearInterval(this.aiProgressTimer);
      this.aiProgressTimer = null;
    }
    if (this.aiToastId !== null) {
      this.toastService.remove(this.aiToastId);
      this.aiToastId = null;
    }
    this.aiProgressLabel = '';
    this.aiStartedAt = 0;
    this.aiBaseLabel = '';
  }

  private getAiElapsedSeconds(): number {
    if (!this.aiStartedAt) {
      return 0;
    }
    return Math.max(1, Math.round((Date.now() - this.aiStartedAt) / 1000));
  }

  markDirty(field?: keyof VideoReportFormData): void {
    this.isDirty = true;
    if (field && this.invalidFields.has(field)) {
      this.invalidFields.delete(field);
    }
  }

  toggleHelp(helpKey: HelpKey, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.openHelpKey = this.openHelpKey === helpKey ? null : helpKey;
  }

  isHelpOpen(helpKey: HelpKey): boolean {
    return this.openHelpKey === helpKey;
  }

  getOpenHelpContent(): FieldHelpContent | null {
    if (!this.openHelpKey) {
      return null;
    }
    return this.fieldHelp[this.openHelpKey];
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
    if (typeof value === 'string') {
      return !value.trim();
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return !value;
  }

  isFieldInvalid(field: keyof VideoReportFormData): boolean {
    return this.invalidFields.has(field);
  }

  private validate(notify: boolean): boolean {
    const required = [...this.requiredFields, 'aeropuerto' as keyof VideoReportFormData];
    const missing = required.filter((field) => this.isBlankField(field));
    const invalid = new Set<keyof VideoReportFormData>(missing);

    let hasFormatError = false;
    let hasVmsDetailError = false;
    let hasNativeHashOtherError = false;
    let hasCustomHashError = false;
    let hasHashProgramError = false;
    let hasExternalHashWithoutAlgorithmError = false;

    if (!missing.includes('numero_informe') && !this.numeroInformePattern.test((this.form.numero_informe || '').trim())) {
      invalid.add('numero_informe');
      hasFormatError = true;
    }
    if ((this.form.vms_authenticity_mode || '') === 'otro' && !(this.form.vms_authenticity_detail || '').trim()) {
      invalid.add('vms_authenticity_detail');
      hasVmsDetailError = true;
    }
    if (this.hasNativeHashAlgorithm('otro') && !(this.form.vms_native_hash_algorithm_other || '').trim()) {
      invalid.add('vms_native_hash_algorithm_other');
      hasNativeHashOtherError = true;
    }
    if (this.hasHashAlgorithm('otro') && !(this.form.hash_algorithm_other || '').trim()) {
      invalid.add('hash_algorithm_other');
      hasCustomHashError = true;
    }
    if (this.utilizoHash) {
      if (this.getSelectedHashAlgorithmLabels().length === 0) {
        invalid.add('hash_algorithms');
        hasExternalHashWithoutAlgorithmError = true;
      }
      if (!(this.form.hash_program || '').trim()) {
        invalid.add('hash_program');
        hasHashProgramError = true;
      }
    }

    this.invalidFields = invalid;

    if (invalid.size === 0) {
      this.validationMessage = '';
      return true;
    }

    const labels = missing.map((field) => this.fieldLabels[field]);
    if (hasFormatError) labels.push('Numero de Informe (formato NNNNCODIGO/YYYY)');
    if (hasVmsDetailError) labels.push('Detalle de autenticidad (obligatorio cuando autenticidad = Otro)');
    if (hasNativeHashOtherError) labels.push('Otro algoritmo de hash nativo (completa el nombre)');
    if (hasCustomHashError) labels.push('Otro algoritmo de hash (completa el nombre del algoritmo)');
    if (hasHashProgramError) labels.push('Programa de hash (obligatorio cuando autenticidad = Hash externo)');
    if (hasExternalHashWithoutAlgorithmError) labels.push('Algoritmo SHA (obligatorio cuando autenticidad = Hash externo)');

    const message = `Completa los campos requeridos: ${labels.join(', ')}`;
    this.validationMessage = message;
    if (notify) this.toastService.error(message);
    return false;
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
    const reportData: VideoReportFormData = { ...this.form };
    if (!reportData.vms_native_hash_algorithms.includes('otro')) {
      reportData.vms_native_hash_algorithm_other = '';
    }
    if (!reportData.hash_algorithms.includes('otro')) {
      reportData.hash_algorithm_other = '';
    }
    if (
      (reportData.vms_authenticity_mode || '') === 'hash_preventivo' &&
      !(reportData.hash_program || '').trim()
    ) {
      reportData.hash_program = 'HashMyFiles';
    }
    if (
      (reportData.vms_authenticity_mode || '') === 'vms_propio' &&
      this.utilizoHash &&
      !(reportData.hash_program || '').trim()
    ) {
      reportData.hash_program = 'HashMyFiles';
    }
    if (!this.incluirFirma) {
      reportData.firma = '';
    }
    if (!this.incluirDatosVuelo) {
      reportData.fecha_hecho = '';
      reportData.vuelo = '';
      reportData.empresa_aerea = '';
      reportData.destino = '';
    }
    return {
      report_data: reportData,
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

  private getSelectedHashAlgorithmLabels(): string[] {
    const labels = (this.form.hash_algorithms || [])
      .map((item) => this.getHashAlgorithmLabel(item, this.form.hash_algorithm_other))
      .map((item) => (item || '').trim())
      .filter((item) => !!item);
    return Array.from(new Set(labels));
  }

  private buildMaterialSpeechContext(): MaterialSpeechContext {
    return {
      sistema: this.form.sistema,
      aeropuerto: this.form.aeropuerto,
      cantidad_observada: this.form.cantidad_observada,
      sectores_analizados: this.form.sectores_analizados,
      franja_horaria_analizada: this.form.franja_horaria_analizada,
      tiempo_total_analisis: this.form.tiempo_total_analisis,
      sintesis_conclusion: this.form.sintesis_conclusion,
      prevencion_sumaria: this.form.prevencion_sumaria,
      caratula: this.form.caratula,
      fecha_hecho: this.form.fecha_hecho,
      vuelo: this.form.vuelo,
      empresa_aerea: this.form.empresa_aerea,
      destino: this.form.destino,
      unidad: this.form.unidad,
      vms_native_hash_algorithms: this.form.vms_native_hash_algorithms,
      vms_native_hash_algorithm_other: this.form.vms_native_hash_algorithm_other,
      hash_algorithms: this.form.hash_algorithms,
      hash_algorithm_other: this.form.hash_algorithm_other,
      hash_program: this.form.hash_program,
      vms_authenticity_mode: this.form.vms_authenticity_mode,
      vms_authenticity_detail: this.form.vms_authenticity_detail,
      motivo_sin_hash: this.form.motivo_sin_hash,
    };
  }

  private buildMaterialFilmicoSeedFromContext(): string {
    const sistema = (this.form.sistema || '').trim() || 'sistema no consignado';
    const lugar = (this.form.aeropuerto || '').trim() || 'lugar de origen no consignado';
    const nativeAlgos = this.getSelectedNativeHashAlgorithmsSummary();
    const nativeHashPart =
      this.form.vms_authenticity_mode === 'vms_propio'
        ? ((this.form.vms_native_hash_algorithms || []).length > 0
          ? `hashes nativos: ${nativeAlgos}`
          : 'autenticación propietaria del sistema')
        : nativeAlgos;
    const autenticidad = this.getVmsAuthenticityLabel(this.form.vms_authenticity_mode || '');
    const cantidad = (this.form.cantidad_observada || '').trim();
    const sectores = (this.form.sectores_analizados || '').trim();
    const franja = (this.form.franja_horaria_analizada || '').trim();
    const tiempo = (this.form.tiempo_total_analisis || '').trim();
    const hashLabels = this.getSelectedHashAlgorithmLabels();
    const motivoSinHash = (this.form.motivo_sin_hash || '').trim();
    const hashText =
      hashLabels.length > 0
        ? hashLabels.join(', ')
        : motivoSinHash
          ? `no aplicado (${motivoSinHash})`
          : 'no aplicado';
    const hashProgram = (this.form.hash_program || '').trim() || 'programa de hash no consignado';
    const quantityText = cantidad ? ` Se consignó cantidad observada: ${cantidad}.` : '';
    const sectorText = sectores ? ` Sectores analizados: ${sectores}.` : '';
    const timingText =
      franja || tiempo
        ? ` Franja horaria: ${franja || 'no consignada'}; tiempo total: ${tiempo || 'no consignado'}.`
        : '';

    const hashDetail =
      hashLabels.length > 0
        ? `Verificación mediante ${hashProgram} bajo ${hashText}.`
        : motivoSinHash
          ? `Hash no efectuado (${motivoSinHash}).`
          : 'Hash no efectuado.';

    return `Material obtenido del sistema ${sistema}, con origen en ${lugar}. Método de autenticidad: ${autenticidad} (${nativeHashPart}). ${hashDetail}${quantityText}${sectorText}${timingText}`;
  }

  private hasStructuredSpeechContext(): boolean {
    const values = [
      this.form.cantidad_observada,
      this.form.sectores_analizados,
      this.form.franja_horaria_analizada,
      this.form.tiempo_total_analisis,
      this.form.sintesis_conclusion,
      this.form.sistema,
      this.form.aeropuerto,
      (this.form.vms_native_hash_algorithms || []).join(','),
      this.form.vms_authenticity_mode,
    ];
    return values.some((value) => !!(value || '').trim());
  }

  private buildDesarrolloSeedFromContext(): string {
    const sectores = (this.form.sectores_analizados || '').trim() || 'sectores no consignados';
    const franja = (this.form.franja_horaria_analizada || '').trim() || 'franja horaria no consignada';
    const tiempo = (this.form.tiempo_total_analisis || '').trim() || 'tiempo total no consignado';
    const cantidad = (this.form.cantidad_observada || '').trim() || 'cantidad observada no consignada';

    return `Se analizaron los sectores ${sectores}, en la franja horaria ${franja}, con un tiempo total de análisis de ${tiempo}. Cantidad observada: ${cantidad}.`;
  }

  private buildConclusionSeedFromContext(): string {
    const sintesis = (this.form.sintesis_conclusion || '').trim();
    if (sintesis) {
      return `Síntesis para conclusión: ${sintesis}.`;
    }

    const cantidad = (this.form.cantidad_observada || '').trim();
    if (cantidad) {
      return `Síntesis para conclusión: cantidad observada ${cantidad}.`;
    }

    return 'Síntesis para conclusión no consignada.';
  }

  private getHashAlgorithmLabel(code: VideoReportHashAlgorithm, customOther = ''): string {
    if (code === 'otro') {
      return (customOther || '').trim() || 'OTRO';
    }
    return this.hashAlgorithmLabelByCode[code] || code.toUpperCase();
  }



  private getVmsAuthenticityLabel(mode: VideoReportVmsAuthenticityMode | ''): string {
    if (mode === 'vms_propio') {
      return 'autenticación provista por el propio sistema VMS';
    }
    if (mode === 'hash_preventivo') {
      return 'autenticación basada en hash preventivo externo';
    }
    if (mode === 'sin_autenticacion') {
      return 'sin autenticación técnica declarada';
    }
    if (mode === 'otro') {
      return 'autenticación declarada por método alternativo';
    }
    return 'autenticación no consignada';
  }

  private buildMaterialFilmicoFallbackTextFromReport(report: VideoReportFormData): string {
    const sistema = (report.sistema || '').trim() || 'el sistema de videovigilancia';
    const lugar = (report.aeropuerto || '').trim();
    const hashProgram = (report.hash_program || '').trim() || 'herramienta de hash';
    const hashLabels = (report.hash_algorithms || []).map((item) =>
      this.getHashAlgorithmLabel(item, report.hash_algorithm_other),
    );
    const motivoSinHash = (report.motivo_sin_hash || '').trim();
    const vmsMode = (report.vms_authenticity_mode || '').trim();
    const vmsDetail = (report.vms_authenticity_detail || '').trim();
    const nativeAlgos = (report.vms_native_hash_algorithms || []).map((item) =>
      this.getHashAlgorithmLabel(item, report.vms_native_hash_algorithm_other || ''),
    );

    const lugarClause = lugar
      ? `desde donde se obtuvo la información en "**${lugar}**"`
      : 'desde donde se obtuvo el material analizado';

    let authClause: string;
    if (vmsMode === 'vms_propio') {
      if (nativeAlgos.length > 0) {
        authClause = `posee como medida de seguridad autenticación provista por el propio sistema "**${sistema}**", que incorpora algoritmos de hash nativos (**${nativeAlgos.join(' y ')}**)`;
      } else {
        authClause = `posee como medida de seguridad autenticación propietaria provista por el propio sistema "**${sistema}**"`;
      }
    } else if (vmsMode === 'hash_preventivo') {
      authClause = 'fue sometido a verificación de integridad mediante hash preventivo externo';
    } else if (vmsMode === 'sin_autenticacion') {
      const motivoPart = motivoSinHash ? ` (**${motivoSinHash}**)` : '';
      authClause = `no se aplicó método de verificación de integridad al material exportado${motivoPart}`;
    } else if (vmsMode === 'otro') {
      authClause = `se empleó un método alternativo de autenticación: **${vmsDetail || 'método alternativo no detallado'}**`;
    } else {
      authClause = 'cuenta con medidas de seguridad propias del sistema';
    }

    let hashClause = '';
    if (hashLabels.length > 0) {
      hashClause = ` Asimismo, previamente a su examen, esta instancia procedió a efectuar sobre el material digital un hash de seguridad mediante **${hashProgram}**, bajo los algoritmos **${hashLabels.join(' y ')}**, con la finalidad de preservar su integridad.`;
    } else if (motivoSinHash && vmsMode !== 'sin_autenticacion') {
      hashClause = ` Se deja constancia de que no se efectuó hash sobre el material (**${motivoSinHash}**).`;
    }

    return `Es oportuno mencionar que el sistema de videovigilancia denominado "**${sistema}**", ${lugarClause}, ${authClause}.${hashClause}`;
  }

  private buildDesarrolloFallbackTextFromReport(report: VideoReportFormData): string {
    const sectores = (report.sectores_analizados || '').trim();
    const franja = (report.franja_horaria_analizada || '').trim();
    const tiempo = (report.tiempo_total_analisis || '').trim();
    const cantidad = (report.cantidad_observada || '').trim();

    const partes: string[] = [];
    if (sectores) partes.push(`centrado en los sectores: **${sectores}**`);
    if (franja) partes.push(`abarcando la franja horaria **${franja}**`);
    if (tiempo) partes.push(`con una duración total de análisis de **${tiempo}**`);

    const base =
      partes.length > 0
        ? `Del análisis visual practicado sobre los registros fílmicos, se deja constancia de que la revisión fue ${partes.join(', ')}.`
        : 'Del análisis visual practicado sobre los registros fílmicos, se deja constancia de la revisión efectuada sobre el material disponible.';

    const cantidadPart = cantidad
      ? ` En cuanto al dato cuantitativo relevante, se consignó: **${cantidad}**.`
      : '';

    return `${base}${cantidadPart} La presente descripción se limita al contenido visual observado, sin interpretación pericial.`;
  }

  private buildConclusionFallbackTextFromReport(report: VideoReportFormData): string {
    const sintesis = (report.sintesis_conclusion || '').trim();
    if (sintesis) {
      return `En virtud del análisis efectuado, y sin apartarse de los extremos objetivamente observables, se concluye: **${sintesis}**.`;
    }
    const cantidad = (report.cantidad_observada || '').trim();
    if (cantidad) {
      return `En virtud del análisis efectuado, y dentro de los límites propios de la revisión visual, se concluye que la cantidad observada fue de **${cantidad}**. No se advierten elementos adicionales a los ya consignados en el desarrollo, quedando la valoración jurídica sujeta a la autoridad competente.`;
    }
    return 'En virtud del análisis efectuado sobre el material fílmico, y dentro de los límites propios de la revisión visual practicada, no se advierten elementos adicionales a los ya consignados en el desarrollo. La valoración jurídica del material queda sujeta a la autoridad competente.';
  }

  async improveNarrativeWithAi(): Promise<void> {
    if (this.isImprovingNarrative) {
      return;
    }

    const desarrollo = (this.form.desarrollo || '').trim();
    const conclusion = (this.form.conclusion || '').trim();
    const hasStructuredContext = this.hasStructuredSpeechContext();
    const desarrolloSeed = desarrollo || this.buildDesarrolloSeedFromContext();
    const conclusionSeed = conclusion || this.buildConclusionSeedFromContext();

    if (!desarrollo && !conclusion && !hasStructuredContext) {
      this.toastService.error('Completa texto o datos rápidos (sectores/tiempos/síntesis) para usar la mejora con IA.');
      return;
    }

    const materialContext = this.buildMaterialSpeechContext();
    this.isImprovingNarrative = true;
    this.startAiFeedback('Mejorando desarrollo y conclusión con IA');

    let deferredSuccess = false;
    try {
      const responses = await firstValueFrom(
        forkJoin({
          desarrollo: this.informeService.improveVideoText({
            material_filmico: '',
            desarrollo: desarrolloSeed,
            conclusion: '',
            material_context: materialContext,
            mode: 'desarrollo' as ImproveVideoTextMode,
          }),
          conclusion: this.informeService.improveVideoText({
            material_filmico: '',
            desarrollo: '',
            conclusion: conclusionSeed,
            material_context: materialContext,
            mode: 'conclusion' as ImproveVideoTextMode,
          }),
        })
      );

      const elapsedSeconds = this.getAiElapsedSeconds();
      const newDesarrollo = (responses.desarrollo?.desarrollo || '').trim();
      const newConclusion = (responses.conclusion?.conclusion || '').trim();
      const aiApplied = (responses.desarrollo?.ai_applied !== false) || (responses.conclusion?.ai_applied !== false);
      deferredSuccess = true;
      window.setTimeout(() => {
        if (newDesarrollo) {
          this.form.desarrollo = newDesarrollo;
        }
        if (newConclusion) {
          this.form.conclusion = newConclusion;
        }
        this.markDirty();
        this.cdr.detectChanges();
        if (!aiApplied) {
          this.toastService.warning(`Proceso IA finalizado en ${elapsedSeconds}s sin cambios en el texto.`);
        } else {
          this.toastService.success(`Desarrollo y conclusión mejorados con IA en ${elapsedSeconds}s.`);
        }
        this.isImprovingNarrative = false;
        this.stopAiFeedback();
      }, 50);
    } catch (error) {
      this.toastService.error(
        this.getSimpleApiErrorMessage(error as HttpErrorResponse, 'No se pudo mejorar el texto con IA.')
      );
    } finally {
      if (!deferredSuccess) {
        this.isImprovingNarrative = false;
        this.stopAiFeedback();
      }
    }
  }

  async improveMaterialFilmicoWithAi(): Promise<void> {
    if (this.isImprovingMaterialFilmico) {
      return;
    }
    if (this.form.vms_native_hash_algorithms?.includes('otro') && !(this.form.vms_native_hash_algorithm_other || '').trim()) {
      this.toastService.warning('Completa el nombre del algoritmo hash nativo.');
      return;
    }
    if (!this.form.vms_authenticity_mode) {
      this.toastService.warning('Selecciona el método de autenticidad del material exportado.');
      return;
    }
    if (this.form.vms_authenticity_mode === 'hash_preventivo' && this.getSelectedHashAlgorithmLabels().length === 0) {
      this.toastService.warning('Para hash externo debes seleccionar al menos un algoritmo de hash.');
      return;
    }
    if (this.form.vms_authenticity_mode === 'hash_preventivo' && !(this.form.hash_program || '').trim()) {
      this.form.hash_program = 'HashMyFiles';
      this.markDirty('hash_program');
    }

    const materialFilmico = (this.form.material_filmico || '').trim();
    const desarrollo = (this.form.desarrollo || '').trim();
    const materialSeed = materialFilmico || desarrollo || this.buildMaterialFilmicoSeedFromContext();
    const materialContext = this.buildMaterialSpeechContext();

    this.isImprovingMaterialFilmico = true;
    this.startAiFeedback('Analizando material fílmico con IA');
    let deferredSuccess = false;
    try {
      const response: ImproveVideoTextResponse = await firstValueFrom(
        this.informeService.improveVideoText({
          material_filmico: materialSeed,
          desarrollo: '',
          conclusion: '',
          material_context: materialContext,
          mode: 'material_filmico' as ImproveVideoTextMode,
        })
      );

      const elapsedSeconds = this.getAiElapsedSeconds();
      const improvedMaterialFilmico = (response?.material_filmico || '').trim();
      const fallbackFromDesarrollo = (response?.desarrollo || '').trim();
      deferredSuccess = true;
      window.setTimeout(() => {
        if (improvedMaterialFilmico) {
          this.form.material_filmico = improvedMaterialFilmico;
        } else if (!materialFilmico && fallbackFromDesarrollo) {
          this.form.material_filmico = fallbackFromDesarrollo;
        }
        this.markDirty('material_filmico');
        this.cdr.detectChanges();
        if (response.ai_applied === false) {
          this.toastService.warning(`Proceso IA finalizado en ${elapsedSeconds}s sin cambios en material fílmico.`);
        } else {
          this.toastService.success(`Material fílmico completado con IA en ${elapsedSeconds}s.`);
        }
        this.isImprovingMaterialFilmico = false;
        this.stopAiFeedback();
      }, 50);
    } catch (error) {
      this.toastService.error(
        this.getSimpleApiErrorMessage(error as HttpErrorResponse, 'No se pudo mejorar el material fílmico con IA.')
      );
    } finally {
      if (!deferredSuccess) {
        this.isImprovingMaterialFilmico = false;
        this.stopAiFeedback();
      }
    }
  }


  generateReport(): void {
    if (!this.validate(true)) {
      return;
    }
    this.saveOperatorData();

    this.isGenerating = true;
    const payload = this.buildPayload();
    this.loadingService.show();
    void this.generateReportLocally(payload);
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
    const hashAlgorithmsText =
      (report.hash_algorithms || [])
        .map((item) => this.getHashAlgorithmLabel(item, report.hash_algorithm_other))
        .join(', ') || (report.motivo_sin_hash || '').trim() || 'No aplicado';
    const nativeHashesText = this.getSelectedNativeHashAlgorithmsSummary();
    const hashProgramText = (report.hash_program || '').trim() || 'No consignado';
    const vmsModeText = this.getVmsAuthenticityLabel(report.vms_authenticity_mode || '');
    const vmsDetailText =
      report.vms_authenticity_mode === 'otro' && (report.vms_authenticity_detail || '').trim()
        ? ` (${this.escapeHtml(report.vms_authenticity_detail)})`
        : '';
    const materialFilmicoText = (report.material_filmico || '').trim() || this.buildMaterialFilmicoFallbackTextFromReport(report);
    const desarrolloText = (report.desarrollo || '').trim() || this.buildDesarrolloFallbackTextFromReport(report);
    const conclusionText = (report.conclusion || '').trim() || this.buildConclusionFallbackTextFromReport(report);
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
    const fiscalia = (report.fiscalia || '').trim();
    const fiscal = (report.fiscal || '').trim();
    const fiscaliaMeta = fiscalia
      ? `<p><strong>Fiscalia / Juzgado:</strong> ${this.escapeHtml(fiscalia)}</p>`
      : '';
    const fiscalMeta = fiscal
      ? `<p><strong>Fiscal / Juez / Secretario:</strong> ${this.escapeHtml(fiscal)}</p>`
      : '';
    const unidad = (report.unidad || '').trim();
    const aeropuerto = (report.aeropuerto || '').trim();
    const locationMeta =
      aeropuerto || unidad
        ? `
          <p><strong>Aeropuerto:</strong> ${this.escapeHtml(aeropuerto || 'No consignado')}</p>
          <p><strong>Unidad:</strong> ${this.escapeHtml(unidad || 'No consignada')}</p>
        `
        : '';
    const fiscaliaText = report.fiscalia ? this.escapeHtml(report.fiscalia) : '';
    const fiscalText = report.fiscal ? this.escapeHtml(report.fiscal) : '';

    const reqClause = fiscaliaText
      ? `En cumplimiento al requerimiento efectuado por la ${fiscaliaText}${fiscalText ? `, a cargo de ${fiscalText}` : ''}, relacionado a la Prevención Sumaria ${this.escapeHtml(report.prevencion_sumaria)} caratulada &quot;${this.escapeHtml(report.caratula)}&quot;`
      : `En relación a la Prevención Sumaria ${this.escapeHtml(report.prevencion_sumaria)} caratulada &quot;${this.escapeHtml(report.caratula)}&quot;`;

    const flightDetails: string[] = [];
    if (report.vuelo) {
      flightDetails.push(`del vuelo ${this.escapeHtml(report.vuelo)}`);
    }
    if (report.empresa_aerea) {
      flightDetails.push(`perteneciente a la empresa aerocomercial ${this.escapeHtml(report.empresa_aerea)}`);
    }
    if (report.destino) {
      flightDetails.push(`con destino a la ciudad de ${this.escapeHtml(report.destino)}`);
    }
    if (report.fecha_hecho) {
      // In a real application, consider converting date object into a nicely formatted string
      flightDetails.push(`el dia ${this.escapeHtml(report.fecha_hecho)}`);
    }

    const flightIntroClause = flightDetails.length > 0
      ? `, la cual se encontraba en el interior de su equipaje despachado por bodega ${flightDetails.join(', ')}`
      : '';

    const introParagraph = `${reqClause}, el ${this.escapeHtml(report.unidad || 'CReV')} eleva el presente informe, a los efectos de llevar a su conocimiento el resultado del análisis efectuado por personal de esta dependencia, según lo aportado en los registros fílmicos obrantes en el ${this.escapeHtml(report.aeropuerto || 'aeropuerto')}, sistema ${this.escapeHtml(report.sistema || 'No consignado')}, respecto de los hechos denunciados por ${this.escapeHtml(report.denunciante)}, quien manifiesta el faltante de ${this.escapeHtml(report.objeto_denunciado)}${flightIntroClause}.`;

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
        <div class="meta">
          <p><strong>Fecha:</strong> ${this.escapeHtml(report.report_date)}</p>
          <p><strong>Destinatarios:</strong> ${this.escapeHtml(report.destinatarios)}</p>
          <p><strong>Operador:</strong> ${this.escapeHtml(report.grado)} ${this.escapeHtml(report.operador)}, LUP: ${this.escapeHtml(report.lup)}</p>
          ${locationMeta}
          <p><strong>Sistema:</strong> ${this.escapeHtml(report.sistema)}</p>
          <p><strong>Cantidad observada:</strong> ${this.escapeHtml((report.cantidad_observada || '').trim() || 'No consignada')}</p>
          <p><strong>Sectores analizados:</strong> ${this.escapeHtml((report.sectores_analizados || '').trim() || 'No consignados')}</p>
          <p><strong>Franja horaria analizada:</strong> ${this.escapeHtml((report.franja_horaria_analizada || '').trim() || 'No consignada')}</p>
          <p><strong>Tiempo total de análisis:</strong> ${this.escapeHtml((report.tiempo_total_analisis || '').trim() || 'No consignado')}</p>
          <p><strong>Síntesis para conclusión:</strong> ${this.escapeHtml((report.sintesis_conclusion || '').trim() || 'No consignada')}</p>
          <p><strong>Algoritmos Hash Nativos del VMS:</strong> ${this.escapeHtml(nativeHashesText)}</p>
          <p><strong>Algoritmos SHA:</strong> ${this.escapeHtml(hashAlgorithmsText)}</p>
          <p><strong>Programa de hash:</strong> ${this.escapeHtml(hashProgramText)}</p>
          <p><strong>Autenticidad de exportación:</strong> ${this.escapeHtml(vmsModeText)}${vmsDetailText}</p>
          <p><strong>Prevencion sumaria:</strong> ${this.escapeHtml(report.prevencion_sumaria)}</p>
          <p><strong>Caratula:</strong> ${this.escapeHtml(report.caratula)}</p>
          ${fiscaliaMeta}
          ${fiscalMeta}
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
          ${introParagraph}
        </p>

        <h2>Material Fílmico Analizado</h2>
        <p>${this.escapeHtmlWithBold(materialFilmicoText).replace(/\n/g, '<br>')}</p>

        <h2>Desarrollo</h2>
        <p>${this.escapeHtmlWithBold(desarrolloText).replace(/\n/g, '<br>')}</p>

        <h2>Anexo de fotogramas (${orderedFrames.length})</h2>
        ${frameBlocks}

        <h2>Conclusion</h2>
        <p>${this.escapeHtmlWithBold(conclusionText).replace(/\n/g, '<br>')}</p>

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

  private escapeHtmlWithBold(value: string): string {
    return this.escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
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
