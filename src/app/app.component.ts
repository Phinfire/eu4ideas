import { Component, ElementRef, ViewChild } from '@angular/core';
import { IdeasComponent } from './ideas/ideas.component';
import { CommonModule } from '@angular/common';
import { NatIdeasOverviewComponent } from './nat-ideas-overview/nat-ideas-overview.component';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { GraphviewComponent } from './graphview/graphview.component';
import { ImportExportService } from './types/ImportExportService';
import { IdeaAtLevel } from './types/IdeaAtLevel';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  imports: [CommonModule, IdeasComponent, NatIdeasOverviewComponent, MatTabsModule, GraphviewComponent, MatSnackBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  @ViewChild(GraphviewComponent) graphview!: GraphviewComponent;
  @ViewChild(IdeasComponent) ideasComponent!: IdeasComponent;
  @ViewChild(NatIdeasOverviewComponent) natIdeasOverview!: NatIdeasOverviewComponent;
  title = 'eu4ideas';

  private activeTabIndex: number = 0;

  constructor(private importExportService: ImportExportService, private elementRef: ElementRef, private snackBar: MatSnackBar) {
  
  }

  ngOnInit() {
    const hostElement = this.elementRef.nativeElement;
    this.importExportService.initFileDragAndDropImport(hostElement, (results: Map<string,{ideas: IdeaAtLevel[], loc: Map<string,string>}>) => {
          this.natIdeasOverview.import(results);
          this.ideasComponent.import(results);
          this.graphview.showIdeaHistogram(results);
          this.snackBar.open(results.size + ' entries imported!', 'Close', {
            duration: 1000,
            verticalPosition: 'bottom',
            horizontalPosition: 'center'
          }); 
        });
  }

  onTabChange(event: MatTabChangeEvent): void {
    console.log(`Selected tab index: ${event.index}`);
    console.log(`Selected tab label: ${event.tab.textLabel}`);
    this.activeTabIndex = event.index;
  }

}