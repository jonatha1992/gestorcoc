import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AssetService } from '../../services/asset.service';
import { InformeService, VideoAnalysisReportRecord } from '../../services/informe.service';
import { LoadingService } from '../../services/loading.service';
import { PersonnelService } from '../../services/personnel.service';
import { ToastService } from '../../services/toast.service';
import { InformesComponent } from './informes';

describe('InformesComponent', () => {
  let informeServiceMock: Partial<InformeService>;
  let personnelServiceMock: Partial<PersonnelService>;
  let assetServiceMock: Partial<AssetService>;
  let toastServiceMock: Partial<ToastService>;
  let loadingServiceMock: Partial<LoadingService>;

  beforeEach(async () => {
    window.localStorage.clear();
    informeServiceMock = {
      generateVideoAnalysisReport: () => of({} as any),
      getReport: () => of({} as VideoAnalysisReportRecord),
      getReportByRecord: () => of([]),
      improveVideoText: () =>
        of({
          material_filmico: 'Material generado',
          desarrollo: 'Desarrollo generado',
          conclusion: 'Conclusion generada',
        }),
      saveReportDraft: () =>
        of({
          id: 1,
          film_record: 10,
          status: 'BORRADOR',
          form_data: {},
        } as VideoAnalysisReportRecord),
      saveReport: () =>
        of({
          id: 2,
          film_record: 10,
          status: 'FINALIZADO',
          form_data: {},
        } as VideoAnalysisReportRecord),
      updateReport: () =>
        of({
          id: 2,
          film_record: 10,
          status: 'BORRADOR',
          form_data: {},
        } as VideoAnalysisReportRecord),
      listReports: () => of([]),
    };
    personnelServiceMock = {
      getPeople: () =>
        of([
          {
            id: 11,
            first_name: 'Juan',
            last_name: 'Perez',
            badge_number: '506896',
            rank: 'COMISIONADO_MAYOR',
            rank_display: 'Com. Mayor',
            unit: 'EZE',
          },
        ]),
    };
    assetServiceMock = {
      getUnits: () =>
        of([
          { id: 10, name: 'Unidad Ezeiza', code: 'EZE', airport: 'Ezeiza', parent: null },
        ] as any),
      getSystems: () => of([]),
    };
    toastServiceMock = {
      show: () => 1,
      success: () => 1,
      warning: () => 1,
      error: () => 1,
      loading: () => 1,
      update: () => undefined,
      remove: () => undefined,
    };
    loadingServiceMock = {
      show: () => undefined,
      hide: () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [InformesComponent],
      providers: [
        { provide: InformeService, useValue: informeServiceMock },
        { provide: PersonnelService, useValue: personnelServiceMock },
        { provide: AssetService, useValue: assetServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: LoadingService, useValue: loadingServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the AI completion button in the final action area', () => {
    const fixture = TestBed.createComponent(InformesComponent);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelector('[data-report-actions]') as HTMLElement;
    const aiButton = fixture.nativeElement.querySelector(
      '[data-ai-complete-button]',
    ) as HTMLButtonElement;
    const buttons = Array.from(actions.querySelectorAll('button')).map((button) =>
      button.textContent?.trim(),
    );

    expect(actions).toBeTruthy();
    expect(actions.contains(aiButton)).toBe(true);
    expect(buttons).toContain('Completar Todo el Informe');
    expect(buttons).toContain('Finalizar y Guardar');
    expect(buttons).toContain('Generar Informe (DOC)');
  });

  it('allows AI completion when there is context even if final validation still fails', async () => {
    const fixture = TestBed.createComponent(InformesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const aiButton = fixture.nativeElement.querySelector(
      '[data-ai-complete-button]',
    ) as HTMLButtonElement;

    expect(component.canGenerateFullReport()).toBe(false);
    expect(aiButton.disabled).toBe(true);

    component.form.sistema = 'MILESTONE';

    expect(component.canUseAiCompletion()).toBe(true);
    expect(component.canGenerateFullReport()).toBe(false);
  });

  it('keeps only the fixed grade options and maps backend codes to visible labels', () => {
    const fixture = TestBed.createComponent(InformesComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const gradeOptions = component.gradeOptions;

    expect(gradeOptions).toEqual([
      'OF. AYUDATE',
      'OF. PRINCIPAL',
      'OF. MAYOR',
      'OF. JEFE',
      'SUBINSPECTOR',
      'INSPECTOR',
      'COM. MAYOR',
      'COM. GENERAL',
      'CIVIL',
    ]);
    expect(gradeOptions).not.toContain('COMISIONADO_MAYOR');

    (component as any).applyLoadedFormData({ grado: 'COMISIONADO_MAYOR' });

    expect(component.form.grado).toBe('COM. MAYOR');
    expect(component.gradeOptions).not.toContain('COMISIONADO_MAYOR');
  });

  it('loads draft reports as editable and finalized reports as read only', () => {
    const fixture = TestBed.createComponent(InformesComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    (component as any).applyLoadedReport({
      id: 3,
      film_record: 10,
      status: 'BORRADOR',
      form_data: { operador: 'Perez, Juan' },
    } as VideoAnalysisReportRecord);
    expect(component.isReadOnly()).toBe(false);
    expect(component.reportStatus()).toBe('BORRADOR');

    (component as any).applyLoadedReport({
      id: 4,
      film_record: 10,
      status: 'FINALIZADO',
      form_data: { operador: 'Perez, Juan' },
    } as VideoAnalysisReportRecord);
    expect(component.isReadOnly()).toBe(true);
    expect(component.reportStatus()).toBe('FINALIZADO');
  });

  it('does not require operator hash data when authenticity is resolved by the system', () => {
    const fixture = TestBed.createComponent(InformesComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.operador = 'Perez, Juan';
    component.form.grado = 'INSPECTOR';
    component.form.lup = '506896';
    component.form.report_date = '2026-03-11';
    component.form.unidad = 'Unidad Ezeiza';
    component.form.numero_informe = '0001EZE/2026';
    component.form.sistema = 'MILESTONE';
    component.form.prevencion_sumaria = '003BAR/2026';
    component.form.caratula = 'DENUNCIA S/ PRESUNTO HURTO';
    component.form.denunciante = 'Perez, Ana';
    component.form.objeto_denunciado = 'Telefono celular';
    component.form.aeropuerto = 'Ezeiza';

    component.onVmsAuthenticityModeChange('vms_propio');

    const validation = (component as any).buildValidationResult() as {
      invalid: Set<string>;
      message: string;
    };

    expect(validation.invalid.has('hash_program')).toBe(false);
    expect(validation.invalid.has('hash_algorithms')).toBe(false);
  });

  it('clears native VMS hash metadata from the payload', () => {
    const fixture = TestBed.createComponent(InformesComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.vms_authenticity_mode = 'vms_propio';
    component.form.vms_native_hash_algorithms = ['sha256', 'otro'];
    component.form.vms_native_hash_algorithm_other = 'Firma propietaria';

    const payload = (component as any).buildPayload();

    expect(payload.report_data.vms_native_hash_algorithms).toEqual([]);
    expect(payload.report_data.vms_native_hash_algorithm_other).toBe('');
  });

  it('stores draft state locally without calling backend draft endpoints', () => {
    const fixture = TestBed.createComponent(InformesComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const saveDraftSpy = vi.spyOn(
      informeServiceMock as InformeService,
      'saveReportDraft',
    );
    const saveReportSpy = vi.spyOn(
      informeServiceMock as InformeService,
      'saveReport',
    );
    const updateReportSpy = vi.spyOn(
      informeServiceMock as InformeService,
      'updateReport',
    );

    component.form.operador = 'Perez, Juan';
    component.form.numero_informe = '0001EZE/2026';
    component.saveReportToDatabase();

    expect(saveDraftSpy).not.toHaveBeenCalled();
    expect(saveReportSpy).not.toHaveBeenCalled();
    expect(updateReportSpy).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('video-analysis-report-draft:new')).toContain(
      '0001EZE/2026',
    );
    expect(component.reportStatus()).toBe('BORRADOR');
  });
});
