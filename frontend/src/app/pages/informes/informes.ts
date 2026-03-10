import { Component, HostListener, OnDestroy, OnInit, inject, signal, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  InformeService,
  ImproveVideoTextMode,
  ImproveVideoTextResponse,
  MaterialSpeechContext,
  VideoAnalysisReportRecord,
  VideoAnalysisReportStatus,
  VideoReportFormData,
  VideoReportFrame,
  VideoReportHashAlgorithm,
  VideoReportInvolvedPerson,
  VideoReportPayload,
  VideoReportVmsAuthenticityMode,
} from '../../services/informe.service';
import { ToastService } from '../../services/toast.service';
import { LoadingService } from '../../services/loading.service';
import { PersonnelService } from '../../services/personnel.service';
import { AssetService, SystemAsset } from '../../services/asset.service';

type HelpKey = keyof VideoReportFormData | 'operador_select' | 'frame_upload' | 'frame_description';

type FieldHelpContent = {
  quePoner: string;
  ejemplo: string;
};

const FIXED_GRADE_OPTIONS = [
  'OF. AYUDATE',
  'OF. PRINCIPAL',
  'OF. MAYOR',
  'OF. JEFE',
  'SUBINSPECTOR',
  'INSPECTOR',
  'COM. MAYOR',
  'COM. GENERAL',
  'CIVIL',
] as const;

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes.html'
})
export class InformesComponent implements OnInit, OnDestroy {
  private informeService = inject(InformeService);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);
  private personnelService = inject(PersonnelService);
  private assetService = inject(AssetService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  existingReportId = signal<number | null>(null);
  linkedRecordId = signal<number | null>(null);
  reportStatus = signal<VideoAnalysisReportStatus>('PENDIENTE');
  isReadOnly = signal(false);

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

  showAirportDropdown = false;
  sourceSystemOptions: SystemAsset[] = [];
  selectedSourceSystemOption: number | 'otro' | null = null;
  isLoadingSourceSystems = false;

  get filteredAirportOptions(): string[] {
    const q = (this.form.aeropuerto || '').toLowerCase();
    return this.airportOptions.filter(o => o.toLowerCase().includes(q));
  }

  onAirportInputBlur(): void {
    setTimeout(() => { this.showAirportDropdown = false; }, 150);
  }

  selectAirportOption(opt: string): void {
    this.form.aeropuerto = opt;
    this.showAirportDropdown = false;
    this.onAirportSelect(opt);
  }

  isGenerating = false;
  isGeneratingFullReport = false;
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
  airportManualOverride = false;
  api_key = '';
  selectedAiProvider = 'gemini';
  hora_inicio = '';
  hora_fin = '';
  private lastPos = { x: 0, y: 0 };
  frames: VideoReportFrame[] = [];
  personnelOptions: any[] = [];
  selectedOperatorId: number | null = null;
  invalidFields = new Set<keyof VideoReportFormData>();
  validationMessage = '';
  private lastSuggestedReportNumber = '';
  private readonly numeroInformePattern = /^\d{4}[A-Z]{3,4}\/\d{4}$/;
  private unitIdByName: Record<string, number> = {};
  private unitCodeByName: Record<string, string> = {};
  private unitAirportByName: Record<string, string> = {};
  unidadOptions: string[] = [];
  airportOptions: string[] = [];
  readonly hashAlgorithmOptions: { value: VideoReportHashAlgorithm; label: string }[] = [
    { value: 'sha1', label: 'SHA-1' },
    { value: 'sha3', label: 'SHA-3' },
    { value: 'sha256', label: 'SHA-256' },
    { value: 'sha512', label: 'SHA-512' },
    { value: 'md5', label: 'MD5' },
    { value: 'otro', label: 'Otro' },
  ];

  readonly vmsAuthenticityOptions: { value: VideoReportVmsAuthenticityMode; label: string }[] = [
    { value: 'vms_propio', label: 'El material fue recibido con hash propio del sistema' },
    { value: 'hash_preventivo', label: 'El material fue recibido sin hash — el operador calculó el hash' },
    { value: 'sin_autenticacion', label: 'No fue posible aplicar hash' },
    { value: 'otro', label: 'Otro método' },
  ];
  private readonly hashAlgorithmLabelByCode: Record<VideoReportHashAlgorithm, string> = {
    sha1: 'SHA-1',
    sha3: 'SHA-3',
    sha256: 'SHA-256',
    sha512: 'SHA-512',
    md5: 'MD5',
    otro: 'OTRO',
  };

  openHelpKey: HelpKey | null = null;

  get isAiProcessing(): boolean {
    return this.isGeneratingFullReport;
  }

  ngOnInit() {
    if (!this.form.report_date) {
      this.form.report_date = new Date().toISOString().split('T')[0];
    }
    this.loadUnits();
    this.loadPersonnel();
    this.handleQueryParams();
  }

  private handleQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const recordId = params.get('record_id');
    const informeId = params.get('informe_id');

    if (informeId) {
      const id = parseInt(informeId, 10);
      if (!isNaN(id)) {
        this.informeService.getReport(id).subscribe({
          next: (informe) => {
            return this.applyLoadedReport(informe);
            this.existingReportId.set(informe.id);
            this.isReadOnly.set(true);
            if (informe.film_record != null) {
              this.linkedRecordId.set(informe.film_record ?? null);
            }
            if (informe.form_data && typeof informe.form_data === 'object') {
              this.applyLoadedFormData(informe.form_data);
            }
            this.toastService.show('Informe en modo lectura — no se puede modificar.', 'info');
          },
          error: () => this.toastService.show('No se pudo cargar el informe.', 'error')
        });
      }
    } else if (recordId) {
      const id = parseInt(recordId, 10);
      if (!isNaN(id)) {
        this.linkedRecordId.set(id);
        this.informeService.getReportByRecord(id).subscribe({
          next: (informes) => {
            if (informes.length > 0) {
              return this.applyLoadedReport(informes[0]);
              const informe = informes[0];
              this.existingReportId.set(informe.id);
              this.isReadOnly.set(true);
              if (informe.form_data && typeof informe.form_data === 'object') {
                this.applyLoadedFormData(informe.form_data);
              }
              this.toastService.show('Informe en modo lectura — no se puede modificar.', 'info');
            } else {
              this.prefillFromRecord(id);
            }
          },
          error: () => this.prefillFromRecord(id)
        });
      }
    }
  }

  private prefillFromRecord(recordId: number): void {
    // GET film-records/{id}/ via HttpClient directly
    const baseUrl: string = (this.informeService as any).baseUrl || '';
    const http = (this.informeService as any).http as import('@angular/common/http').HttpClient | undefined;
    if (!http) return;
    (http.get(`${baseUrl}/api/film-records/${recordId}/`) as import('rxjs').Observable<any>).subscribe({
      next: (record: any) => {
        this.reportStatus.set('PENDIENTE');
        this.isReadOnly.set(false);
        const involvedPeople = this.mapRecordInvolvedPeople(record?.involved_people);
        const involvedPeopleSummary = this.buildInvolvedPeopleSummary(involvedPeople);
        const mainComplainant = this.pickMainComplainant(involvedPeople);
        const judicialOffice = this.normalizeText(record?.judicial_office || record?.requester);
        const judicialHolder = this.normalizeText(record?.judicial_holder);
        const judicialSecretary = this.normalizeText(record?.judicial_secretary);

        if (record.judicial_case_number) {
          this.form.prevencion_sumaria = record.judicial_case_number;
        }
        if (record.case_title) {
          this.form.caratula = record.case_title;
        }
        if (record.incident_date) {
          this.form.fecha_hecho = record.incident_date;
        }
        if (record.sistema) {
          this.form.sistema = record.sistema;
        }
        if (record.criminal_problematic) {
          this.form.objeto_denunciado = record.criminal_problematic;
        } else if (record.crime_type) {
          this.form.objeto_denunciado = record.crime_type;
        } else if (record.incident_modality) {
          this.form.objeto_denunciado = record.incident_modality;
        } else if (record.description) {
          this.form.objeto_denunciado = record.description;
        }
        if (judicialOffice && judicialOffice !== 'N/C') {
          this.form.fiscalia = judicialOffice;
        }
        if (judicialHolder && judicialHolder !== 'N/C') {
          this.form.fiscal = judicialHolder;
        } else if (judicialSecretary && judicialSecretary !== 'N/C') {
          this.form.fiscal = judicialSecretary;
        }
        if (record.report_number) {
          this.form.numero_informe = record.report_number;
        }
        if (record.generator_unit_name) {
          this.form.unidad = record.generator_unit_name;
        } else if (record.intervening_department) {
          this.form.unidad = record.intervening_department;
        }
        if (mainComplainant) {
          this.form.denunciante = mainComplainant;
        }
        if (involvedPeopleSummary) {
          this.form.involved_people_summary = involvedPeopleSummary;
        }
        this.form.involved_people = involvedPeople;
        if (!this.form.cantidad_observada && involvedPeople.length > 0) {
          const label = involvedPeople.length === 1 ? '1 persona' : `${involvedPeople.length} personas`;
          this.form.cantidad_observada = label;
        }

        const place = this.normalizeText(record?.incident_place);
        const sector = this.normalizeText(record?.incident_sector);
        const locationCandidates = [place, sector].filter((value) => !!value && value !== 'N/C');
        const locationParts = locationCandidates.filter(
          (value, index) =>
            locationCandidates.findIndex((candidate) => candidate.toUpperCase() === value.toUpperCase()) === index
        );
        const unifiedLocation = locationParts.join(' / ');
        if (unifiedLocation) {
          this.form.sectores_analizados = unifiedLocation;
        }
        if (!this.form.aeropuerto && unifiedLocation) {
          this.form.aeropuerto = unifiedLocation;
        }

        if (record.start_time && record.end_time) {
          const s = new Date(record.start_time);
          const e = new Date(record.end_time);
          const pad = (n: number) => n.toString().padStart(2, '0');
          this.form.franja_horaria_analizada =
            `${pad(s.getHours())}:${pad(s.getMinutes())} a ${pad(e.getHours())}:${pad(e.getMinutes())}`;
        } else {
          const incidentTime = this.normalizeTimeLabel(record?.incident_time);
          if (incidentTime) {
            this.form.franja_horaria_analizada = incidentTime;
          }
        }

        // Auto-detectar hash y algoritmo del registro
        this.prefillHashFromRecord(record);
        this.syncAirportManualOverride();
        this.syncFlightSectionVisibility();
        this.loadSourceSystemsForCurrentUnit();

        this.toastService.show('Campos pre-cargados desde el registro.', 'info');
      },
      error: () => { }
    });
  }

  private normalizeText(value: unknown): string {
    return String(value ?? '').trim();
  }

  private normalizeTimeLabel(value: unknown): string {
    const text = this.normalizeText(value);
    if (!text) {
      return '';
    }
    if (text.includes(':')) {
      return text.slice(0, 5);
    }
    return '';
  }

  private mapRecordInvolvedPeople(input: unknown): VideoReportInvolvedPerson[] {
    if (!Array.isArray(input)) {
      return [];
    }

    const mapped: VideoReportInvolvedPerson[] = [];
    for (const rawPerson of input) {
      if (!rawPerson || typeof rawPerson !== 'object') {
        continue;
      }

      const person = rawPerson as Record<string, unknown>;
      const lastName = this.normalizeText(person['last_name']);
      const firstName = this.normalizeText(person['first_name']);
      const fullName = [lastName, firstName].filter((item) => !!item).join(', ');
      if (!fullName) {
        continue;
      }

      const role = this.normalizeText(person['role']).toUpperCase() || 'OTRO';
      const birthDate = this.normalizeText(person['birth_date']);
      mapped.push({
        role,
        full_name: fullName,
        document_type: this.normalizeText(person['document_type']),
        document_number: this.normalizeText(person['document_number']),
        nationality: this.normalizeText(person['nationality']),
        birth_date: birthDate,
        age: this.calculateAgeFromBirthDate(birthDate),
      });
    }

    return mapped;
  }

  private calculateAgeFromBirthDate(birthDate: string): number | null {
    if (!birthDate) {
      return null;
    }

    const parsed = new Date(birthDate);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const now = new Date();
    let age = now.getFullYear() - parsed.getFullYear();
    const hasNotHadBirthday =
      now.getMonth() < parsed.getMonth() ||
      (now.getMonth() === parsed.getMonth() && now.getDate() < parsed.getDate());
    if (hasNotHadBirthday) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  private buildInvolvedPeopleSummary(people: VideoReportInvolvedPerson[]): string {
    if (!Array.isArray(people) || people.length === 0) {
      return '';
    }

    const chunks: string[] = [];
    for (const person of people) {
      const role = this.normalizeText(person.role).toUpperCase() || 'OTRO';
      const fullName = this.normalizeText(person.full_name) || 'Sin nombre';
      const documentType = this.normalizeText(person.document_type);
      const documentNumber = this.normalizeText(person.document_number);
      const documentLabel = [documentType, documentNumber].filter((item) => !!item).join(' ');
      const base = `${role}: ${fullName}`;
      chunks.push(documentLabel ? `${base} (${documentLabel})` : base);
    }
    return chunks.join(' | ');
  }

  private pickMainComplainant(people: VideoReportInvolvedPerson[]): string {
    if (!Array.isArray(people) || people.length === 0) {
      return '';
    }

    const preferred = people.find((person) => this.normalizeText(person.role).toUpperCase() === 'DENUNCIANTE');
    if (preferred?.full_name) {
      return preferred.full_name;
    }
    const fallback = people.find((person) => this.normalizeText(person.role).toUpperCase() === 'DAMNIFICADO');
    if (fallback?.full_name) {
      return fallback.full_name;
    }
    return this.normalizeText(people[0]?.full_name);
  }

  /**
   * Detecta el hash y el algoritmo utilizado en el registro fílmico
   * y auto-configura los campos de integridad del informe.
   */
  private prefillHashFromRecord(record: any): void {
    const fileHash = (record.file_hash || '').trim();
    if (!fileHash) {
      return;
    }

    // Determinar el algoritmo: primero usar el campo explícito, sino inferir por longitud
    let detectedAlgorithm = (record.hash_algorithm || '').trim().toLowerCase();

    if (!detectedAlgorithm) {
      detectedAlgorithm = this.inferHashAlgorithmByLength(fileHash);
    }

    if (!detectedAlgorithm) {
      return;
    }

    // Mapear a los valores del formulario
    const algorithmMap: Record<string, typeof this.form.hash_algorithms[number]> = {
      sha256: 'sha256',
      sha512: 'sha512',
      sha3: 'sha3',
      sha1: 'sha1',
      md5: 'md5',
    };

    const formAlgorithm = algorithmMap[detectedAlgorithm];

    // Auto-configurar modo de autenticidad y algoritmos
    this.form.vms_authenticity_mode = 'hash_preventivo';
    this.utilizoHash = true;
    this.onVmsAuthenticityModeChange('hash_preventivo');

    if (formAlgorithm) {
      this.form.hash_algorithms = [formAlgorithm];
    }

    // Pre-setear programa de hash por defecto si no tiene
    if (!(this.form.hash_program || '').trim()) {
      this.form.hash_program = 'HashMyFiles';
    }
  }

  /**
   * Infiere el algoritmo de hash basándose en la longitud del string hexadecimal.
   * SHA-256 = 64 chars, SHA-512 = 128 chars, SHA-1 = 40 chars, SHA-3 (256) = 64 chars
   */
  private inferHashAlgorithmByLength(hash: string): string {
    const length = hash.length;
    if (length === 128) return 'sha512';
    if (length === 64) return 'sha256'; // También podría ser SHA-3 (256), pero asumimos SHA-256
    if (length === 40) return 'sha1';
    if (length === 32) return 'md5';
    return '';
  }

  private loadUnits() {
    this.assetService.getUnits().subscribe({
      next: (units) => {
        this.applyUnitsFromApi(units);
      },
      error: (err) => {
        console.error('Error loading units:', err);
        this.resetUnitCatalog();
        this.loadSourceSystemsForCurrentUnit();
        this.toastService.show('No se pudieron cargar las unidades desde la base de datos.', 'warning');
      }
    });
  }

  private resetUnitCatalog(): void {
    this.unitIdByName = {};
    this.unitCodeByName = {};
    this.unitAirportByName = {};
    this.unidadOptions = [];
    this.refreshAirportOptions();
  }

  private applyUnitsFromApi(units: any): void {
    const unitList = Array.isArray(units?.results) ? units.results : Array.isArray(units) ? units : [];
    const sortedUnits = [...unitList].sort((a, b) =>
      (a.name || '').localeCompare((b.name || ''), 'es', { sensitivity: 'base' })
    );

    this.resetUnitCatalog();

    if (sortedUnits.length === 0) {
      this.loadSourceSystemsForCurrentUnit();
      return;
    }

    for (const unit of sortedUnits) {
      const name = (unit.name || '').trim();
      const code = this.normalizeUnitCode(unit.code || '');
      if (name && unit.id != null) {
        this.unitIdByName[name] = Number(unit.id);
      }
      if (name && code) {
        this.unitCodeByName[name] = code;
      }
      if (name) {
        const apiAirport = (unit.airport || '').trim();
        if (apiAirport) {
          this.unitAirportByName[name] = apiAirport;
        }
      }
    }
    this.refreshAirportOptions();

    const apiUnitOptions = sortedUnits
      .map((unit) => (unit.name || '').trim())
      .filter((name) => !!name);

    const currentUnit = (this.form.unidad || '').trim();
    this.unidadOptions =
      currentUnit && !apiUnitOptions.includes(currentUnit)
        ? [currentUnit, ...apiUnitOptions]
        : apiUnitOptions;

    this.syncAirportFromUnitSelection();
    this.applySuggestedReportNumber(false);
    this.loadSourceSystemsForCurrentUnit();
  }

  private loadPersonnel() {
    this.personnelService.getPeople().subscribe({
      next: (people) => {
        const results = Array.isArray((people as any)?.results) ? (people as any).results : people;
        this.personnelOptions = Array.isArray(results) ? results : [];
        this.syncSelectedOperatorFromCurrentForm();
      },
      error: (err) => {
        console.error('Error loading personnel:', err);
        this.personnelOptions = [];
        this.toastService.show('No se pudo cargar personal. Puede completarlo manualmente.', 'warning');
      }
    });
  }

  onOperatorChange(personId: number | null) {
    if (!personId) {
      this.form.operador = '';
      this.form.lup = '';
      this.selectedOperatorId = null;
      this.markDirty('operador');
      this.markDirty('lup');
      return;
    }

    const person = this.personnelOptions.find(p => p.id === personId);
    if (person) {
      this.selectedOperatorId = person.id;
      this.form.operador = this.getPersonDisplayName(person);
      this.form.lup = person.badge_number || '';

      this.markDirty('operador');
      this.markDirty('lup');
    }
  }

  private applyLoadedReport(report: VideoAnalysisReportRecord): void {
    this.existingReportId.set(report.id);
    this.reportStatus.set(report.status || 'PENDIENTE');
    this.isReadOnly.set((report.status || 'PENDIENTE') === 'FINALIZADO');
    if (report.film_record != null) {
      this.linkedRecordId.set(report.film_record ?? null);
    }
    if (report.form_data && typeof report.form_data === 'object') {
      this.applyLoadedFormData(report.form_data);
    }
    if (this.isReadOnly()) {
      this.toastService.show('Informe finalizado en modo lectura.', 'info');
      return;
    }
    if (this.reportStatus() === 'BORRADOR') {
      this.toastService.show('Borrador cargado. Puedes seguir editando el informe.', 'info');
    }
  }

  getReportStatusLabel(): string {
    if (this.reportStatus() === 'BORRADOR') {
      return 'Borrador';
    }
    if (this.reportStatus() === 'FINALIZADO') {
      return 'Finalizado';
    }
    return 'Pendiente';
  }

  onOperatorInputChange(value: string): void {
    this.form.operador = (value || '').trim();
    if (!this.form.operador) {
      this.selectedOperatorId = null;
      this.markDirty('operador');
      return;
    }

    const matchedOperator = this.personnelOptions.find((person) =>
      this.getPersonDisplayName(person).toLowerCase() === this.form.operador.toLowerCase()
    );
    if (matchedOperator?.id) {
      this.selectedOperatorId = matchedOperator.id;
      this.onOperatorChange(matchedOperator.id);
      return;
    }

    this.selectedOperatorId = null;
    this.markDirty('operador');
  }

  private applyLoadedFormData(rawData: unknown): void {
    if (!rawData || typeof rawData !== 'object') {
      return;
    }

    const formData = rawData as Record<string, unknown>;
    Object.assign(this.form, formData);

    const sourceSystemId = formData['source_system_id'];
    this.form.source_system_id =
      typeof sourceSystemId === 'number'
        ? sourceSystemId
        : typeof sourceSystemId === 'string' && sourceSystemId.trim()
          ? Number(sourceSystemId)
          : null;

    this.form.grado = this.normalizeGrade(this.normalizeText(formData['grado']));
    this.ensureGradeOptionVisible(this.form.grado);
    this.form.sintesis = this.resolvePreferredSintesis(formData);
    this.ensureAirportOption(this.form.aeropuerto || '');
    this.syncAirportManualOverride();
    this.syncSelectedOperatorFromCurrentForm();
    this.syncFlightSectionVisibility();
    this.loadSourceSystemsForCurrentUnit();
  }

  private resolvePreferredSintesis(data: Record<string, unknown>): string {
    const direct = this.normalizeText(data['sintesis']);
    if (direct) {
      return direct;
    }

    return (
      this.normalizeText(data['sintesis_desarrollo']) ||
      this.normalizeText(data['sintesis_conclusion'])
    );
  }

  private syncFlightSectionVisibility(): void {
    this.incluirDatosVuelo = [
      this.form.fecha_hecho,
      this.form.vuelo,
      this.form.empresa_aerea,
      this.form.destino,
    ].some((value) => !!this.normalizeText(value));
  }

  private syncAirportManualOverride(): void {
    const currentAirport = this.normalizeText(this.form.aeropuerto);
    if (!currentAirport) {
      this.airportManualOverride = false;
      return;
    }

    const unitName = this.normalizeText(this.form.unidad);
    const databaseAirport = this.unitAirportByName[unitName] || '';

    this.airportManualOverride = !!databaseAirport && currentAirport !== databaseAirport;
  }

  private syncSelectedOperatorFromCurrentForm(): void {
    const currentOperator = this.normalizeText(this.form.operador).toLowerCase();
    if (!currentOperator || !Array.isArray(this.personnelOptions) || this.personnelOptions.length === 0) {
      this.selectedOperatorId = null;
      return;
    }

    const matchedOperator = this.personnelOptions.find((person) =>
      this.getPersonDisplayName(person).toLowerCase() === currentOperator
    );
    this.selectedOperatorId = matchedOperator?.id ?? null;
  }

  getPersonDisplayName(person: any): string {
    return `${person?.last_name || ''}, ${person?.first_name || ''}`.trim();
  }

  onOperatorGradeChange(value: string) {
    this.form.grado = this.normalizeGrade(value || '');
    this.ensureGradeOptionVisible(this.form.grado);
    this.markDirty('grado');
  }

  onOperatorLupChange(value: string) {
    this.form.lup = (value || '').replace(/\D/g, '');
    this.markDirty('lup');
  }

  private normalizeGrade(value: string): string {
    const normalized = (value || '').trim();
    if (!normalized) {
      return '';
    }

    const aliasKey = this.normalizeGradeAliasKey(normalized);
    const canonical = this.gradeAliasMap[aliasKey];
    if (canonical) {
      return canonical;
    }

    const existingOption = this.gradeOptions.find((option) => option.toUpperCase() === normalized.toUpperCase());
    return existingOption || normalized;
  }

  private ensureGradeOptionVisible(value: string): void {
    const normalized = (value || '').trim();
    if (!normalized) {
      return;
    }

    if (FIXED_GRADE_OPTIONS.includes(normalized as (typeof FIXED_GRADE_OPTIONS)[number])) {
      return;
    }

    const exists = this.gradeOptions.some((option) => option.toUpperCase() === normalized.toUpperCase());

    if (!exists) {
      this.gradeOptions = [...this.gradeOptions, normalized];
    }
  }

  private normalizeGradeAliasKey(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  onUnidadChange(_val: string) {
    this.scheduleUnitContextRefresh();
    this.markDirty('unidad');
    this.markDirty('numero_informe');
    this.markDirty('aeropuerto');
  }

  private scheduleUnitContextRefresh(forceSuggestedReportNumber = false): void {
    window.setTimeout(() => {
      this.syncAirportFromUnitSelection();
      this.applySuggestedReportNumber(forceSuggestedReportNumber);
      this.loadSourceSystemsForCurrentUnit();
    }, 0);
  }

  onSourceSystemSelectionChange(value: number | 'otro' | null): void {
    this.selectedSourceSystemOption = value;

    if (value === 'otro' || value === null) {
      this.form.source_system_id = null;
      if (value === null) {
        this.form.sistema = '';
      }
      this.markDirty('source_system_id');
      this.markDirty('sistema');
      return;
    }

    const selectedSystem = this.sourceSystemOptions.find((system) => system.id === value);
    if (!selectedSystem) {
      return;
    }

    this.form.source_system_id = selectedSystem.id;
    this.form.sistema = selectedSystem.name || '';
    this.applySourceSystemDefaults(selectedSystem);
    this.markDirty('source_system_id');
    this.markDirty('sistema');
  }

  onSistemaManualChange(value: string): void {
    this.form.sistema = (value || '').trim();
    this.form.source_system_id = null;
    this.selectedSourceSystemOption = this.form.sistema ? 'otro' : null;
    this.markDirty('source_system_id');
    this.markDirty('sistema');
  }

  private loadSourceSystemsForCurrentUnit(): void {
    this.isLoadingSourceSystems = true;
    this.assetService.getSystems({ is_active: 'true' }).subscribe({
      next: (response) => {
        const results = (response as any)?.results ?? response;
        this.sourceSystemOptions = this.sortSystemsForDisplay(Array.isArray(results) ? results : []);
        this.syncSourceSystemSelection();
      },
      error: (err) => {
        console.error('Error loading source systems:', err);
        this.sourceSystemOptions = [];
        this.syncSourceSystemSelection();
      },
      complete: () => {
        this.isLoadingSourceSystems = false;
      }
    });
  }

  private sortSystemsForDisplay(systems: SystemAsset[]): SystemAsset[] {
    const currentUnitId = this.unitIdByName[(this.form.unidad || '').trim()];
    return [...systems].sort((a, b) => {
      const aMatch = currentUnitId != null && a.unit?.id === currentUnitId ? 0 : 1;
      const bMatch = currentUnitId != null && b.unit?.id === currentUnitId ? 0 : 1;
      if (aMatch !== bMatch) {
        return aMatch - bMatch;
      }
      return (a.name || '').localeCompare((b.name || ''), 'es', { sensitivity: 'base' });
    });
  }

  private syncSourceSystemSelection(): void {
    if (this.form.source_system_id != null) {
      const selectedById = this.sourceSystemOptions.find((system) => system.id === this.form.source_system_id);
      if (selectedById) {
        this.selectedSourceSystemOption = selectedById.id;
        this.form.sistema = selectedById.name || this.form.sistema;
        return;
      }
    }

    const currentSystemName = (this.form.sistema || '').trim().toLowerCase();
    if (currentSystemName) {
      const selectedByName = this.sourceSystemOptions.find(
        (system) => (system.name || '').trim().toLowerCase() === currentSystemName
      );
      if (selectedByName) {
        this.selectedSourceSystemOption = selectedByName.id;
        this.form.source_system_id = selectedByName.id;
        this.form.sistema = selectedByName.name || this.form.sistema;
        return;
      }
      this.selectedSourceSystemOption = 'otro';
      this.form.source_system_id = null;
      return;
    }

    this.selectedSourceSystemOption = null;
    this.form.source_system_id = null;
  }

  private applySourceSystemDefaults(system: SystemAsset): void {
    const authenticityMode = (system.report_authenticity_mode_default || '') as VideoReportVmsAuthenticityMode | '';
    if (authenticityMode) {
      this.onVmsAuthenticityModeChange(authenticityMode);
    }
    this.form.vms_authenticity_detail = system.report_authenticity_detail_default || '';
    this.form.vms_native_hash_algorithms = [...(system.report_native_hash_algorithms_default || [])];
    this.form.vms_native_hash_algorithm_other = system.report_native_hash_algorithm_other_default || '';

    if ((system.report_hash_program_default || '').trim()) {
      this.form.hash_program = system.report_hash_program_default || '';
    } else if (authenticityMode === 'hash_preventivo' || authenticityMode === 'vms_propio') {
      this.form.hash_program = 'HashMyFiles';
    }

    this.markDirty('vms_authenticity_mode');
    this.markDirty('vms_authenticity_detail');
    this.markDirty('vms_native_hash_algorithms');
    this.markDirty('vms_native_hash_algorithm_other');
    this.markDirty('hash_program');
  }

  /**
   * Calcula automáticamente franja_horaria_analizada y tiempo_total_analisis
   * a partir de hora_inicio y hora_fin (valores datetime-local: YYYY-MM-DDTHH:MM).
   */
  onTimeChange(): void {
    const start = this.hora_inicio;
    const end = this.hora_fin;

    if (!start || !end) {
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return;
    }

    // Formato legible: DD/MM/YYYY HH:MM
    const fmt = (d: Date): string => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    };

    this.form.franja_horaria_analizada = `${fmt(startDate)} a ${fmt(endDate)}`;
    this.markDirty('franja_horaria_analizada');

    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) {
      this.form.tiempo_total_analisis = 'Fecha fin anterior al inicio';
      this.markDirty('tiempo_total_analisis');
      return;
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);

    this.form.tiempo_total_analisis = parts.length > 0 ? parts.join(' ') : '0 minutos';
    this.markDirty('tiempo_total_analisis');
  }

  onDatosVueloToggle(): void {
    this.markDirty();
  }

  onAirportSelect(value: string): void {
    const selectedAirport = (value || '').trim();
    this.form.aeropuerto = selectedAirport;
    this.ensureAirportOption(selectedAirport);

    const unitName = (this.form.unidad || '').trim();
    const databaseAirport = this.unitAirportByName[unitName] || '';

    this.airportManualOverride = !!selectedAirport && selectedAirport !== databaseAirport;
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
      this.utilizoHash = true;
      if (!(this.form.hash_program || '').trim()) {
        this.form.hash_program = 'HashMyFiles';
        this.markDirty('hash_program');
      }
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
    const normalizedUnitName = (unitName || '').trim();
    if (!normalizedUnitName) {
      return '';
    }
    const now = new Date();
    const year = now.getFullYear();
    const unitCode = this.getUnitCode(normalizedUnitName);
    if (!unitCode) {
      return '';
    }
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
    return this.normalizeUnitCode(this.unitCodeByName[rawName] || '');
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

    const databaseAirport = this.unitAirportByName[unitName] || '';

    if (databaseAirport) {
      this.form.aeropuerto = databaseAirport;
      this.ensureAirportOption(databaseAirport);
      this.airportManualOverride = false;
      return;
    }

    this.form.aeropuerto = '';
    this.airportManualOverride = false;
  }

  private refreshAirportOptions(): void {
    const options = new Set<string>();
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
  gradeOptions: string[] = [...FIXED_GRADE_OPTIONS];
  private readonly gradeAliasMap: Record<string, string> = {
    'OF AYUDATE': 'OF. AYUDATE',
    'OF AYTE': 'OF. AYUDATE',
    'OFICIAL AYUDANTE': 'OF. AYUDATE',
    'OFICIAL AYTE': 'OF. AYUDATE',
    'OF PRINCIPAL': 'OF. PRINCIPAL',
    'OF PPAL': 'OF. PRINCIPAL',
    'OFICIAL PRINCIPAL': 'OF. PRINCIPAL',
    'OF MAYOR': 'OF. MAYOR',
    'OFICIAL MAYOR': 'OF. MAYOR',
    'OF JEFE': 'OF. JEFE',
    'OFICIAL JEFE': 'OF. JEFE',
    SUBINSPECTOR: 'SUBINSPECTOR',
    INSPECTOR: 'INSPECTOR',
    'COM MAYOR': 'COM. MAYOR',
    'COMISIONADO MAYOR': 'COM. MAYOR',
    'COM GENERAL': 'COM. GENERAL',
    'COM GRAL': 'COM. GENERAL',
    'COMISIONADO GENERAL': 'COM. GENERAL',
    CIVIL: 'CIVIL',
  };

  form: VideoReportFormData = {
    report_date: new Date().toISOString().slice(0, 10),
    destinatarios: '',
    unidad: '',
    tipo_informe: 'Informe de análisis de videos',
    numero_informe: '',
    grado: '',
    operador: '',
    lup: '',
    sistema: '',
    source_system_id: null,
    cantidad_observada: '',
    sectores_analizados: '',
    franja_horaria_analizada: '',
    tiempo_total_analisis: '',
    sintesis: '',
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
    involved_people_summary: '',
    involved_people: [],
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
    sistema: 'Sistema o Dispositivo proveniente de la informaci??n',
    source_system_id: 'Sistema origen registrado',
    cantidad_observada: 'Cantidad observada',
    sectores_analizados: 'Sectores analizados',
    franja_horaria_analizada: 'Franja horaria analizada',
    tiempo_total_analisis: 'Tiempo total de an??lisis',
    sintesis: 'Sintesis del analisis',
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
    involved_people_summary: 'Resumen de Personas Involucradas',
    involved_people: 'Personas Involucradas',
    vuelo: 'Vuelo',
    empresa_aerea: 'Empresa Aérea',
    destino: 'Destino',
    fecha_hecho: 'Fecha del Hecho',
    objeto_denunciado: 'Objeto Denunciado / Marca',
    aeropuerto: 'Lugar de origen de la informacion',
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
    source_system_id: {
      quePoner: 'Sistema registrado en inventario para sugerir autenticidad y hash.',
      ejemplo: 'Milestone XProtect - CReV I',
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
      quePoner: 'Duraci??n total invertida en el an??lisis visual.',
      ejemplo: '1 hora 37 minutos',
    },
    sintesis: {
      quePoner: 'Resumen breve del hallazgo para guiar desarrollo y conclusion.',
      ejemplo: 'No se observa manipulacion posterior del bulto denunciado',
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
    involved_people_summary: {
      quePoner: 'Resumen consolidado de todas las personas involucradas en el requerimiento.',
      ejemplo: 'DENUNCIANTE: Perez, Ana (DNI 30111222) | DETENIDO: Gomez, Luis (DNI 29888777)',
    },
    involved_people: {
      quePoner: 'Listado estructurado de involucrados precargado desde Registros Filmicos.',
      ejemplo: 'DENUNCIANTE Perez, Ana; DETENIDO Gomez, Luis',
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
    'operador', 'grado', 'lup', 'report_date', 'unidad', 'numero_informe',
    'sistema', 'prevencion_sumaria', 'caratula', 'denunciante',
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
    if (this.validationMessage) {
      const result = this.buildValidationResult();
      this.invalidFields = result.invalid;
      this.validationMessage = result.message;
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

  private buildValidationResult(): { invalid: Set<keyof VideoReportFormData>; message: string } {
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

    if (invalid.size === 0) {
      return { invalid, message: '' };
    }

    const labels = missing.map((field) => this.fieldLabels[field]);
    if (hasFormatError) labels.push('Numero de Informe (formato NNNNCODIGO/YYYY)');
    if (hasVmsDetailError) labels.push('Detalle de autenticidad (obligatorio cuando autenticidad = Otro)');
    if (hasNativeHashOtherError) labels.push('Otro algoritmo de hash nativo (completa el nombre)');
    if (hasCustomHashError) labels.push('Otro algoritmo de hash (completa el nombre del algoritmo)');
    if (hasHashProgramError) labels.push('Programa de hash (obligatorio cuando autenticidad = Hash externo)');
    if (hasExternalHashWithoutAlgorithmError) labels.push('Algoritmo SHA (obligatorio cuando autenticidad = Hash externo)');

    return {
      invalid,
      message: `Completa los campos requeridos: ${labels.join(', ')}`,
    };
  }

  private validate(notify: boolean): boolean {
    const result = this.buildValidationResult();
    this.invalidFields = result.invalid;
    this.validationMessage = result.message;

    if (!result.message) {
      return true;
    }
    if (notify) {
      this.toastService.error(result.message);
    }
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
    reportData.destinatarios = this.getStandardDestinatarios(reportData.fiscalia);
    reportData.sintesis = '';
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
    reportData.involved_people = this.normalizeReportInvolvedPeople(reportData.involved_people);
    if (!(reportData.involved_people_summary || '').trim()) {
      reportData.involved_people_summary = this.buildInvolvedPeopleSummary(reportData.involved_people);
    }
    if (!(reportData.denunciante || '').trim()) {
      const mainComplainant = this.pickMainComplainant(reportData.involved_people);
      if (mainComplainant) {
        reportData.denunciante = mainComplainant;
      }
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

  private normalizeReportInvolvedPeople(people: VideoReportInvolvedPerson[]): VideoReportInvolvedPerson[] {
    if (!Array.isArray(people)) {
      return [];
    }

    const normalized: VideoReportInvolvedPerson[] = [];
    for (const item of people) {
      const fullName = this.normalizeText(item?.full_name);
      if (!fullName) {
        continue;
      }

      const role = this.normalizeText(item?.role).toUpperCase() || 'OTRO';
      const birthDate = this.normalizeText(item?.birth_date);
      const computedAge = this.calculateAgeFromBirthDate(birthDate);
      const age = typeof item?.age === 'number' ? item.age : computedAge;

      normalized.push({
        role,
        full_name: fullName,
        document_type: this.normalizeText(item?.document_type),
        document_number: this.normalizeText(item?.document_number),
        nationality: this.normalizeText(item?.nationality),
        birth_date: birthDate,
        age,
      });
    }
    return normalized;
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
      source_system_id: this.form.source_system_id,
      aeropuerto: this.form.aeropuerto,
      cantidad_observada: this.form.cantidad_observada,
      sectores_analizados: this.form.sectores_analizados,
      franja_horaria_analizada: this.form.franja_horaria_analizada,
      tiempo_total_analisis: this.form.tiempo_total_analisis,
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
      involved_people_summary: this.form.involved_people_summary,
      involved_people: this.form.involved_people,
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
          : 'autenticacion propietaria del sistema')
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
    const quantityText = cantidad ? ` Se consigno cantidad observada: ${cantidad}.` : '';
    const sectorText = sectores ? ` Sectores analizados: ${sectores}.` : '';
    const timingText =
      franja || tiempo
        ? ` Franja horaria: ${franja || 'no consignada'}; tiempo total: ${tiempo || 'no consignado'}.`
        : '';

    const hashDetail =
      hashLabels.length > 0
        ? `Verificacion mediante ${hashProgram} bajo ${hashText}.`
        : motivoSinHash
          ? `Hash no efectuado (${motivoSinHash}).`
          : 'Hash no efectuado.';

    return `Material obtenido del sistema ${sistema}, con origen en ${lugar}. Metodo de autenticidad: ${autenticidad} (${nativeHashPart}). ${hashDetail}${quantityText}${sectorText}${timingText}`;
  }

  private buildDesarrolloSeedFromContext(): string {
    const sectores = (this.form.sectores_analizados || '').trim() || 'sectores no consignados';
    const franja = (this.form.franja_horaria_analizada || '').trim() || 'franja horaria no consignada';
    const tiempo = (this.form.tiempo_total_analisis || '').trim() || 'tiempo total no consignado';
    const cantidad = (this.form.cantidad_observada || '').trim() || 'cantidad observada no consignada';
    const objeto = (this.form.objeto_denunciado || '').trim();
    const denunciante = (this.form.denunciante || '').trim();
    const involvedSummary =
      (this.form.involved_people_summary || '').trim() ||
      this.buildInvolvedPeopleSummary(this.normalizeReportInvolvedPeople(this.form.involved_people || []));
    const flightSummary = [
      (this.form.vuelo || '').trim(),
      (this.form.empresa_aerea || '').trim(),
      (this.form.destino || '').trim(),
    ].filter((value) => !!value).join(' / ');
    const objectPart = objeto ? ` Hecho vinculado a: ${objeto}.` : '';
    const complainantPart = denunciante ? ` Denunciante registrado: ${denunciante}.` : '';
    const peoplePart = involvedSummary ? ` Personas vinculadas: ${involvedSummary}.` : '';
    const flightPart = flightSummary ? ` Datos de vuelo asociados: ${flightSummary}.` : '';

    return `Se analizaron los sectores ${sectores}, en la franja horaria ${franja}, con un tiempo total de analisis de ${tiempo}. Cantidad observada: ${cantidad}.${objectPart}${complainantPart}${peoplePart}${flightPart}`;
  }

  private buildConclusionSeedFromContext(): string {
    const sistema = (this.form.sistema || '').trim() || 'sistema no consignado';
    const origen = (this.form.aeropuerto || '').trim() || 'origen no consignado';
    const objeto = (this.form.objeto_denunciado || '').trim() || 'los hechos investigados';
    const cantidad = (this.form.cantidad_observada || '').trim();
    const involvedSummary =
      (this.form.involved_people_summary || '').trim() ||
      this.buildInvolvedPeopleSummary(this.normalizeReportInvolvedPeople(this.form.involved_people || []));
    const cantidadPart = cantidad
      ? `se registro ${cantidad}`
      : 'no se consigno una cantidad observada especifica';
    const peoplePart = involvedSummary ? ` Personas vinculadas: ${involvedSummary}.` : '';

    return `Con base en la revision del material del sistema ${sistema}, con origen en ${origen}, y respecto de ${objeto}, se informa que ${cantidadPart}.${peoplePart}`;
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
    const sistema = (report.sistema || '').trim() || 'el sistema analizado';
    const origen = (report.aeropuerto || '').trim() || 'origen no consignado';
    const objeto = (report.objeto_denunciado || '').trim() || 'los hechos investigados';
    const cantidad = (report.cantidad_observada || '').trim();
    const involvedSummary =
      (report.involved_people_summary || '').trim() ||
      this.buildInvolvedPeopleSummary(this.normalizeReportInvolvedPeople(report.involved_people || []));

    const cantidadPart = cantidad
      ? `se consigno una cantidad observada de **${cantidad}**`
      : 'no se consigno una cantidad observada especifica';
    const peoplePart = involvedSummary ? ` Personas vinculadas: **${involvedSummary}**.` : '';

    return `En virtud del analisis efectuado sobre el material del sistema **${sistema}**, con origen en **${origen}**, y respecto de **${objeto}**, se concluye que ${cantidadPart}.${peoplePart} La valoracion juridica del contenido corresponde a la autoridad competente.`;
  }

  canUseAiCompletion(): boolean {
    const narrativeFields = [
      this.form.material_filmico,
      this.form.desarrollo,
      this.form.conclusion,
    ];
    if (narrativeFields.some((value) => !!(value || '').trim())) {
      return true;
    }

    const materialContext = this.buildMaterialSpeechContext();
    return Object.values(materialContext).some((value) => {
      if (typeof value === 'string') {
        return !!value.trim();
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return false;
    });
  }

  canGenerateFullReport(): boolean {
    return this.buildValidationResult().invalid.size === 0;
  }

  fillSampleData(): void {
    const year = new Date().getFullYear();
    this.form.operador = 'GARCIA, Juan';
    this.form.grado = 'INSPECTOR';
    this.form.lup = '506896';
    this.form.report_date = new Date().toISOString().slice(0, 10);
    this.form.numero_informe = `0001EZE/${year}`;
    this.form.tipo_informe = 'Informe de análisis de videos';
    this.form.destinatarios = 'JEFATURA DE SEGURIDAD AEROPORTUARIA';
    this.form.aeropuerto = 'Aeropuerto Internacional Ministro Pistarini - EZE';
    this.form.sistema = 'HONEYWELL';
    this.form.cantidad_observada = '2 personas';
    this.form.sectores_analizados = 'Hall de Arribos, Cinta 3, Plataforma Norte';
    this.form.franja_horaria_analizada = '08:00 a 12:00';
    this.form.tiempo_total_analisis = '04:00:00';
    this.form.sintesis = 'Se analiza material de video del sistema de seguridad aeroportuaria a solicitud de autoridad competente.';
    this.toastService.show('Datos de prueba cargados hasta Sectores Analizados.', 'success');
  }

  async generateFullReportWithAi(): Promise<void> {
    if (this.isGeneratingFullReport) return;

    if (!this.canUseAiCompletion()) {
      this.toastService.warning('Completa algun texto o datos del contexto antes de usar IA.');
      return;
    }

    // Pre-seed any unpopulated values from context in case they are empty
    const materialFilmico = (this.form.material_filmico || '').trim();
    const desarrollo = (this.form.desarrollo || '').trim();
    const conclusion = (this.form.conclusion || '').trim();

    const materialSeed = materialFilmico || this.buildMaterialFilmicoSeedFromContext();
    const desarrolloSeed = desarrollo || this.buildDesarrolloSeedFromContext();
    const conclusionSeed = conclusion || this.buildConclusionSeedFromContext();

    const materialContext = this.buildMaterialSpeechContext();
    this.isGeneratingFullReport = true;
    this.startAiFeedback('Completando todo el informe');

    let deferredSuccess = false;
    try {
      const response = await firstValueFrom(
        this.informeService.improveVideoText({
          material_filmico: materialSeed,
          desarrollo: desarrolloSeed,
          conclusion: conclusionSeed,
          material_context: materialContext,
          mode: 'full',
          preferred_provider: this.selectedAiProvider,
        })
      );

      const elapsedSeconds = this.getAiElapsedSeconds();
      const newMF = (response?.material_filmico || '').trim();
      const newDesarrollo = (response?.desarrollo || '').trim();
      const newConclusion = (response?.conclusion || '').trim();

      deferredSuccess = true;
      window.setTimeout(() => {
        if (newMF) {
          this.form.material_filmico = newMF;
          this.markDirty('material_filmico');
        }
        if (newDesarrollo) {
          this.form.desarrollo = newDesarrollo;
          this.markDirty('desarrollo');
        }
        if (newConclusion) {
          this.form.conclusion = newConclusion;
          this.markDirty('conclusion');
        }

        this.cdr.detectChanges();
        if (response.ai_applied === false) {
          this.toastService.warning(`Proceso finalizado en ${elapsedSeconds}s sin cambios en el texto.`);
        } else {
          this.toastService.success(`Informe completado en ${elapsedSeconds}s.`);
        }
        this.isGeneratingFullReport = false;
        this.stopAiFeedback();
      }, 50);
    } catch (error) {
      this.toastService.error(
        this.getSimpleApiErrorMessage(error as HttpErrorResponse, 'No se pudo generar el informe completo.')
      );
    } finally {
      if (!deferredSuccess) {
        this.isGeneratingFullReport = false;
        this.stopAiFeedback();
      }
    }
  }


  generateReport(): void {
    if (!this.validate(true)) {
      return;
    }
    this.isGenerating = true;
    const payload = this.buildPayload();
    this.loadingService.show();
    void this.generateReportLocally(payload);
  }

  private async generateReportLocally(payload: VideoReportPayload): Promise<void> {
    try {
      const response = await firstValueFrom(this.informeService.generateVideoAnalysisReport(payload));
      const blob = response.body;
      if (!(blob instanceof Blob)) {
        throw new Error('Respuesta vacia al generar informe.');
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.resolveGeneratedFilename(response, this.form.report_date || 'hoy');
      link.click();
      window.URL.revokeObjectURL(url);
      this.toastService.success('Informe DOCX generado.');
    } catch (error) {
      const message = await this.getReportGenerationErrorMessage(error);
      this.toastService.error(message);
    } finally {
      this.isGenerating = false;
      this.loadingService.hide();
    }
  }

  private resolveGeneratedFilename(response: import('@angular/common/http').HttpResponse<Blob>, fallbackDate: string): string {
    const contentDisposition = response.headers.get('content-disposition') || '';
    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]).replace(/["']/g, '');
    }

    const plainMatch = /filename=\"?([^\";]+)\"?/i.exec(contentDisposition);
    if (plainMatch?.[1]) {
      return plainMatch[1].replace(/["']/g, '');
    }

    return `informe_analisis_video_${fallbackDate}.docx`;
  }

  private async getReportGenerationErrorMessage(error: unknown): Promise<string> {
    const defaultMessage = 'No se pudo generar el informe.';
    if (!(error instanceof HttpErrorResponse)) {
      return defaultMessage;
    }

    if (error.error instanceof Blob) {
      try {
        const rawText = await error.error.text();
        const parsed = JSON.parse(rawText);
        if (parsed?.error) {
          return String(parsed.error);
        }
        if (parsed?.errors) {
          return `No se pudo generar el informe: ${JSON.stringify(parsed.errors)}`;
        }
      } catch {
        return defaultMessage;
      }
      return defaultMessage;
    }

    if (typeof error.error === 'object' && error.error !== null) {
      if ('error' in error.error) {
        return String((error.error as any).error);
      }
      if ('errors' in error.error) {
        return `No se pudo generar el informe: ${JSON.stringify((error.error as any).errors)}`;
      }
    }

    return defaultMessage;
  }

  private saveCurrentReport(status: VideoAnalysisReportStatus): void {
    if (this.isReadOnly()) {
      return;
    }

    const payload = this.buildPayload();
    const reportData = {
      film_record: this.linkedRecordId() ?? null,
      numero_informe: payload.report_data.numero_informe || '',
      report_date: payload.report_data.report_date || undefined,
      status,
      form_data: { ...payload.report_data },
    };

    const onSuccess = (saved: VideoAnalysisReportRecord): void => {
      this.existingReportId.set(saved.id);
      this.reportStatus.set(saved.status || status);
      this.isReadOnly.set((saved.status || status) === 'FINALIZADO');
      if (saved.film_record != null) {
        this.linkedRecordId.set(saved.film_record ?? null);
      }
      this.isDirty = false;
      this.toastService.success(
        (saved.status || status) === 'FINALIZADO'
          ? 'Informe finalizado y guardado en la base de datos.'
          : 'Borrador del informe guardado en la base de datos exitosamente.'
      );
    };

    const onError = (err: HttpErrorResponse): void => {
      this.toastService.error(
        this.getSimpleApiErrorMessage(
          err,
          status === 'FINALIZADO'
            ? 'Error al finalizar el informe.'
            : 'Error al guardar el borrador del informe.'
        )
      );
    };

    const existingId = this.existingReportId();
    if (existingId) {
      this.informeService.updateReport(existingId, reportData).subscribe({
        next: onSuccess,
        error: onError
      });
      return;
    }

    if (status === 'BORRADOR' && this.linkedRecordId()) {
      this.informeService.saveReportDraft(this.linkedRecordId()!, reportData).subscribe({
        next: onSuccess,
        error: onError
      });
      return;
    }

    this.informeService.saveReport(reportData).subscribe({
      next: onSuccess,
      error: onError
    });
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
    const involvedSummary =
      (report.involved_people_summary || '').trim() ||
      this.buildInvolvedPeopleSummary(this.normalizeReportInvolvedPeople(report.involved_people || []));
    const involvedPeopleMeta = involvedSummary
      ? `<p><strong>Personas involucradas:</strong> ${this.escapeHtml(involvedSummary)}</p>`
      : '';
    const unidad = (report.unidad || '').trim();
    const aeropuerto = (report.aeropuerto || '').trim();
    const locationMeta =
      aeropuerto || unidad
        ? `
          <p><strong>Lugar de origen de la informacion:</strong> ${this.escapeHtml(aeropuerto || 'No consignado')}</p>
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
          <p><strong>Operador:</strong> ${this.escapeHtml(report.grado)} ${this.escapeHtml(report.operador)}, LUP: ${this.escapeHtml(report.lup)}</p>
          ${locationMeta}
          <p><strong>Sistema:</strong> ${this.escapeHtml(report.sistema)}</p>
          <p><strong>Cantidad observada:</strong> ${this.escapeHtml((report.cantidad_observada || '').trim() || 'No consignada')}</p>
          <p><strong>Sectores analizados:</strong> ${this.escapeHtml((report.sectores_analizados || '').trim() || 'No consignados')}</p>
          <p><strong>Franja horaria analizada:</strong> ${this.escapeHtml((report.franja_horaria_analizada || '').trim() || 'No consignada')}</p>
          <p><strong>Tiempo total de análisis:</strong> ${this.escapeHtml((report.tiempo_total_analisis || '').trim() || 'No consignado')}</p>
          <p><strong>Algoritmos Hash Nativos del VMS:</strong> ${this.escapeHtml(nativeHashesText)}</p>
          <p><strong>Algoritmos SHA:</strong> ${this.escapeHtml(hashAlgorithmsText)}</p>
          <p><strong>Programa de hash:</strong> ${this.escapeHtml(hashProgramText)}</p>
          <p><strong>Autenticidad de exportación:</strong> ${this.escapeHtml(vmsModeText)}${vmsDetailText}</p>
          <p><strong>Prevencion sumaria:</strong> ${this.escapeHtml(report.prevencion_sumaria)}</p>
          <p><strong>Caratula:</strong> ${this.escapeHtml(report.caratula)}</p>
          ${fiscaliaMeta}
          ${fiscalMeta}
          <p><strong>Denunciante:</strong> ${this.escapeHtml(report.denunciante)}</p>
          ${involvedPeopleMeta}
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

  saveReportToDatabase(): void {
    if (this.isReadOnly()) {
      return;
    }
    this.saveCurrentReport('BORRADOR');
    return;
    if (!this.linkedRecordId()) {
      this.toastService.warning('No hay un registro fílmico vinculado para guardar el borrador.');
      return;
    }

    const currentData = this.buildPayload().report_data;

    this.informeService.saveReportDraft(this.linkedRecordId()!, currentData as any).subscribe({
      next: (res: any) => {
        this.toastService.success('Borrador del informe guardado en la base de datos exitosamente.');
        if (res.report_id && !this.existingReportId()) {
          this.existingReportId.set(res.report_id);
        }
      },
      error: (err) => {
        this.toastService.error(
          this.getSimpleApiErrorMessage(err, 'Error al guardar el borrador del informe.')
        );
      }
    });
  }

  finalizeReportInDatabase(): void {
    if (!this.validate(true)) {
      return;
    }
    this.saveCurrentReport('FINALIZADO');
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private getStandardDestinatarios(fiscaliaValue: string): string {
    const fiscalia = (fiscaliaValue || '').trim();
    return fiscalia || 'Fiscalia / Juzgado';
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






