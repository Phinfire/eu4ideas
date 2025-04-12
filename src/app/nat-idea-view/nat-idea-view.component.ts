import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { EU4Service } from '../types/game/EU4Service';
import { IIdea } from '../types/game/IIdea';
import { IdeasConnector } from '../types/IdeasConnector';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ISliderConfig, SliderConfig } from './ISliderConfig';
import { UserConfigurationProvider } from '../types/UserConfigurationProvider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Mana } from '../types/game/Mana';
import { ImportExportService } from '../types/ImportExportService';
import { CustomNatIdeaService } from '../types/game/CustomNatIdeaService';
import { IdeaAtLevel } from '../types/IdeaAtLevel';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { min } from 'rxjs';

@Component({
  selector: 'app-nat-idea-view',
  imports: [MatSliderModule, FormsModule, CommonModule, DragDropModule, MatTooltipModule, MatButtonModule, MatIconModule],
  templateUrl: './nat-idea-view.component.html',
  styleUrl: './nat-idea-view.component.scss'
})
export class NatIdeaViewComponent {

  private sliders: (ISliderConfig | null)[] = [];
  private entries: (IIdea | null)[] = Array.from({ length: 10 }, () => null);

  private previouslySetIdeaValues: Map<string, number> = new Map();
  private previouslySetIdeaPositions: Map<string, number> = new Map();

  @Input() ideasConnector!: IdeasConnector;

  nationName: string = "";
  nationTag: string = "";
  nationFlagImageUrl: string = "";

  constructor(private ideaService: CustomNatIdeaService, private eu4: EU4Service, private userConfig: UserConfigurationProvider, private importExportService: ImportExportService) {
    this.loadPreviouslySetIdeaValuesFromLocalStorage();
  }

  ngOnInit() {
    this.ideasConnector.registerSelectionChangedListener(() => this.refreshEntries());
    this.refreshEntries();
    const dropArea = document.getElementsByClassName('idea-set-header');
    /*
    this.importExportService.initFileDragAndDropImport(dropArea[0] as HTMLElement, (results: Map<string,{ideas: IdeaAtLevel[], loc: Map<string,string>}>) => {
      for (let [tag, { ideas, loc }] of results) {
        this.importIdeas(ideas);
      }
    });
    */
  }

  private refreshEntries() {
    const newSelection = this.ideasConnector.getSelectedIdeas();
    const adddedIdeas = Array.from(newSelection).filter(idea => !this.entries.includes(idea));
    if (adddedIdeas.length > 0) {
      for (let adddedIdea of adddedIdeas) {
        if (this.previouslySetIdeaPositions.has(adddedIdea.getKey())) {
          const index = this.previouslySetIdeaPositions.get(adddedIdea.getKey())!;
          if (this.entries[index] == null) {
            this.entries[index] = adddedIdea;
            continue;
          }
        }
        for (let i = 0; i < this.entries.length; i++) {
          if (this.entries[i] == null) {
            this.entries[i] = adddedIdea;
            break;
          }
        }
      }
    } else {
      for (let i = 0; i < this.entries.length; i++) {
        if (this.entries[i] != null && !newSelection.has(this.entries[i]!)) {
          this.previouslySetIdeaValues.set(this.entries[i]!.getKey(), this.sliders[i]!.value);
          this.entries[i] = null;
        }
      }
    }
    this.refreshSliders();
  }

  private refreshSliders() {
    this.sliders = this.entries.map((entry) => {
      if (entry == null) {
        return null;
      } else {
        const previousValue = this.previouslySetIdeaValues.get(entry!.getKey());
        return new SliderConfig(entry!, this.eu4, previousValue || 1);
      }
    });
  }

  getIdeaAtIndex(index: number) {
    return this.entries[index];
  }

  getIdeasInOrder() {
    return this.entries.map((idea, index) => {
      if (idea != null) {
        return { idea, level: this.sliders[index]!.value };
      }
      return null;
    }).filter(idea => idea != null);
  }

  getSliders() {
    return this.sliders;
  }

  getChildren(slider: ISliderConfig) {
    return this.userConfig.getFreeBonus(slider.getIdea(), slider.value).map(idea => {
      return new SliderConfig(idea.getIdea(), this.eu4, idea.getLevel());
    });
  }

  private getIdeasAndLevels() {
    return this.entries.map(ideaOrNull => {
      if (ideaOrNull == null) {
        return null;
      }
      return new IdeaAtLevel(ideaOrNull, this.previouslySetIdeaValues.get(ideaOrNull.getKey())!);
    });
  }

  getRealWorldCost(index: number, div: HTMLDivElement | null) {
    if (this.sliders[index] == null) {
      return 0;
    }
    return this.ideaService.getRealWorldCost(index, new IdeaAtLevel(this.sliders[index].getIdea(), this.sliders[index].value));
  }

  getTotalCost() {
    return this.ideaService.getTotalCost(this.getIdeasAndLevels());
  }

  getMaxLegalCost() {
    return this.userConfig.getMaxTotalNationIdeaCost();
  }

  getImageUrl(key: string) {
    return this.eu4.getIdeaIconImageUrl(key);
  }

  drop(event: CdkDragDrop<string[]>) {
    const start = event.previousIndex;
    const end = event.currentIndex;

    const b = this.entries[start];
    this.entries[start] = this.entries[end];
    this.entries[end] = b;
    if (this.entries[start] != null) {
      this.previouslySetIdeaPositions.set(this.entries[start]!.getKey(), start);
    }
    if (this.entries[end] != null) {
      this.previouslySetIdeaPositions.set(this.entries[end]!.getKey(), end);
    }
    this.refreshSliders();
  }

  getManaIcon(index: number) {
    return [Mana.ADM, Mana.DIP, Mana.MIL][index].getIconUrl();
  }

  getCostsPerMana() {
    return this.ideaService.getCostsPerMana(this.getIdeasAndLevels().filter(idea => idea != null) as IdeaAtLevel[]);
  }

  getManaPercentages() {
    return this.ideaService.getManaPercentages(this.getIdeasAndLevels().filter(idea => idea != null) as IdeaAtLevel[]);
  }

  getManaPercentage(index: number) {
    return this.getManaPercentages()[index];
  }

  setNation(tag: string, name: string, flagImageUrl: string) {
    this.nationTag = tag;
    this.nationName = name;
    this.nationFlagImageUrl = flagImageUrl;
  }

  getTitleText() {
    if (this.nationName == "") {
      return "...";
    }
    return this.nationName + "'s National Ideas";
  }

  reportValueChange() {
    this.sliders.filter(slider => slider != null).forEach(slider => {
      this.previouslySetIdeaValues.set(slider!.getKey(), slider!.value);
    });
    this.storePreviouslySetValuesAndPositionsInLocalStorage();
  }

  storePreviouslySetValuesAndPositionsInLocalStorage() {
    localStorage.setItem("previouslySetIdeaValues", JSON.stringify(Array.from(this.previouslySetIdeaValues.entries())));
    localStorage.setItem("previouslySetIdeaPositions", JSON.stringify(Array.from(this.previouslySetIdeaPositions.entries())));
  }

  loadPreviouslySetIdeaValuesFromLocalStorage() {
    const previouslySetIdeaValues = localStorage.getItem("previouslySetIdeaValues");
    const previouslySetIdeaPositions = localStorage.getItem("previouslySetIdeaPositions");
    if (previouslySetIdeaValues) {
      this.previouslySetIdeaValues = new Map(JSON.parse(previouslySetIdeaValues));
    }
    if (previouslySetIdeaPositions) {
      this.previouslySetIdeaPositions = new Map(JSON.parse(previouslySetIdeaPositions));
    }
  }

  onIdeaIconClick(slider: ISliderConfig) {
    this.previouslySetIdeaPositions.delete(slider.getKey());
    this.ideasConnector.setSelected(slider.getIdea().getKey(), false);
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent) {
    this.storePreviouslySetValuesAndPositionsInLocalStorage();
  }

  clearAllIdeas() {
    this.ideasConnector.clearSelection();
  }

  importIdeas(ideas: IdeaAtLevel[]) {
    this.clearAllIdeas();
    for (let idea of ideas) {
      this.previouslySetIdeaValues.set(idea.getIdea().getKey(), Math.min(idea.getLevel(), idea.getIdea().getMaxCustomLevel()));
    }
    this.ideasConnector.setSelection(ideas.map(idea => idea.getIdea().getKey()));
  }
}