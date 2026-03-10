import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

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
    const aiButton = fixture.nativeElement.querySelector('[data-ai-complete-button]') as HTMLButtonElement;
    const buttons = Array.from(actions.querySelectorAll('button')).map((button) => button.textContent?.trim());

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
    const aiButton = fixture.nativeElement.querySelector('[data-ai-complete-button]') as HTMLButtonElement;

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
});
