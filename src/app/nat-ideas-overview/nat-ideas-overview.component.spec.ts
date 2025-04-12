import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NatIdeasOverviewComponent } from './nat-ideas-overview.component';

describe('NatIdeasOverviewComponent', () => {
  let component: NatIdeasOverviewComponent;
  let fixture: ComponentFixture<NatIdeasOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NatIdeasOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NatIdeasOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
