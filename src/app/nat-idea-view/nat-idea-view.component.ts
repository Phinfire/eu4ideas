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

@Component({
  selector: 'app-nat-idea-view',
  imports: [MatSliderModule, FormsModule, CommonModule, DragDropModule, MatTooltipModule],
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

  constructor(private eu4: EU4Service, private userConfig: UserConfigurationProvider, private importExportService: ImportExportService) {
    this.loadPreviouslySetIdeaValuesFromLocalStorage();
  }

  ngOnInit() {
    this.ideasConnector.registerSelectionChangedListener(() => this.refreshEntries());
    this.refreshEntries();
    this.initFileDragAndDropImport();
  }

  private refreshEntries() {
    const newSelection = this.ideasConnector.getSelectedIdeas();
    const adddedIdeas = Array.from(newSelection).filter(idea => !this.entries.includes(idea));
    if (adddedIdeas.length > 0) {
      for (let adddedIdea of adddedIdeas) {
        if (this.previouslySetIdeaPositions.has(adddedIdea.getKey())) {
          const index = this.previouslySetIdeaPositions.get(adddedIdea.getKey())!;
          this.entries[index] = adddedIdea;
          continue;
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
    const newSliders = [];
    for (let i = 0; i < this.entries.length; i++) {
      if (this.entries[i] == null) {
        newSliders.push(null);
      } else {
        let value = this.previouslySetIdeaValues.get(this.entries[i]!.getKey()) || 1;
        if (this.sliders[i] != null) {
          value = this.sliders[i]!.value;
        }
        newSliders.push(new SliderConfig(this.entries[i]!, this.eu4, value));
      }
    }
    this.sliders = newSliders;
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

  getRealWorldCost(index: number, div: HTMLDivElement | null) {
    if (this.sliders[index] == null) {
      return 0;
    }
    return Math.ceil(this.userConfig.getCustomIdeaWeights()[index] * this.sliders[index].getCurrentCost());
  }

  getTotalCost() {
    let total = 0;
    for (let i = 0; i < this.sliders.length; i++) {
      total += this.getRealWorldCost(i, null);
    }
    return total;
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
    if (this.ideasConnector.getSelectedIdeas().size < 1) {
      return [0, 0, 0];
    }
    const costPerMana = [Mana.ADM, Mana.DIP, Mana.MIL].map(mana => {
      return Array.from(this.getSliders()).map(slider => {
        if (slider == null || slider.getIdea().getMana() != mana) {
          return 0;
        }
        return slider.getIdea().getCostAtLevel(slider.value);
      }).reduce((a, b) => a + b, 0);
    });
    return costPerMana;
  }

  getManaPercentages() {
    const costPerMana = this.getCostsPerMana();
    const totalCost = costPerMana.reduce((a, b) => a + b, 0);
    return costPerMana.map(cost => {
      if (totalCost == 0) {
        return 0;
      }
      return Math.floor(cost / totalCost * 100);
    });
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

  private initFileDragAndDropImport() {
    const dropArea = document.getElementsByClassName('idea-set-header');
    if (dropArea.length > 0) {
      dropArea[0].addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      dropArea[0].addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const files = (event as DragEvent).dataTransfer!.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.name.endsWith('.zip')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
              if (e.target?.result instanceof ArrayBuffer) {
                const JSZip = (await import('jszip')).default;
                const zip = await JSZip.loadAsync(e.target.result);
                const fileNames = Object.keys(zip.files);
                for (const fileName of fileNames) {
                  const fileContent = await zip.files[fileName].async("string");
                  if (fileName.endsWith(".txt")) {
                    this.importExportService.parseIntoIdeas(fileContent).then((parsed) => {
                    });
                  }
                }
              }
            };
            reader.readAsArrayBuffer(file);
          } else {
            console.log("The dropped file is not a zip file.");
          }
        }
      });
    }
  }
}