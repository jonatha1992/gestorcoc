import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipmentFormComponent } from './equipment-form';
import { ReactiveFormsModule } from '@angular/forms';
import { EquipmentService } from '../../services/equipment';
import { CatalogService } from '../../services/catalog.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

describe('EquipmentFormComponent', () => {
  let component: EquipmentFormComponent;
  let fixture: ComponentFixture<EquipmentFormComponent>;
  let mockEquipmentService: any;
  let mockCatalogService: any;

  beforeEach(async () => {
    mockEquipmentService = {
      getEquipmentById: () => of({}),
      addEquipment: () => Promise.resolve(),
      updateEquipment: () => Promise.resolve()
    };

    mockCatalogService = {
      getItemsByCatalogCode: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentFormComponent, ReactiveFormsModule],
      providers: [
        { provide: EquipmentService, useValue: mockEquipmentService },
        { provide: CatalogService, useValue: mockCatalogService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {} }
          }
        }
      ]
    })
      .overrideComponent(EquipmentFormComponent, {
        set: { template: '<form></form>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(EquipmentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
