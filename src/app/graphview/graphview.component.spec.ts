import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphviewComponent } from './graphview.component';

describe('GraphviewComponent', () => {
  let component: GraphviewComponent;
  let fixture: ComponentFixture<GraphviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
