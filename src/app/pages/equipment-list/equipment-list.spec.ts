import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipmentListComponent } from './equipment-list';
import { EquipmentService } from '../../services/equipment';
import { CatalogService } from '../../services/catalog.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('EquipmentListComponent', () => {
  let component: EquipmentListComponent;
  let fixture: ComponentFixture<EquipmentListComponent>;
  let mockEquipmentService: any;

  beforeEach(async () => {
    mockEquipmentService = {
      getEquipment: () => of([]),
      deleteEquipment: () => Promise.resolve()
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentListComponent],
      providers: [
        { provide: EquipmentService, useValue: mockEquipmentService },
        { provide: CatalogService, useValue: { getItemsByCatalogCode: () => of([]) } },
        provideRouter([])
      ]
    })
      .overrideComponent(EquipmentListComponent, {
        set: { template: '<table></table>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(EquipmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
