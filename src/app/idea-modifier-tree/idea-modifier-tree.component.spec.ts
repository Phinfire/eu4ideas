import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeaModifierTreeComponent } from './idea-modifier-tree.component';

describe('IdeaModifierTreeComponent', () => {
  let component: IdeaModifierTreeComponent;
  let fixture: ComponentFixture<IdeaModifierTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeaModifierTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeaModifierTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
