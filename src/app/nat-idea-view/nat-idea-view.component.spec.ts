import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NatIdeaViewComponent } from './nat-idea-view.component';

describe('NatIdeaViewComponent', () => {
  let component: NatIdeaViewComponent;
  let fixture: ComponentFixture<NatIdeaViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NatIdeaViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NatIdeaViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
