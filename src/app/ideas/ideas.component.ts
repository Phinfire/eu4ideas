import { Component, ViewChild } from '@angular/core';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { NatIdeaViewComponent } from '../nat-idea-view/nat-idea-view.component';
import { IconPoolComponent } from '../icon-pool/icon-pool.component';
import { EU4Service } from '../types/game/EU4Service';
import { IdeasConnector } from '../types/IdeasConnector';
import { IIconProvider } from '../types/keyedIcons/IIconProvider';
import { UserConfigurationProvider } from '../types/UserConfigurationProvider';
import { TagSelectConnector } from '../types/glue/TagSelectConnector';
import { ImportExportService } from '../types/ImportExportService';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IdeaAtLevel } from '../types/IdeaAtLevel';

@Component({
  selector: 'app-ideas',
  imports: [CdkAccordionModule, CommonModule, NatIdeaViewComponent, IconPoolComponent, MatTooltipModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './ideas.component.html',
  styleUrls: ['./ideas.component.scss']
})
export class IdeasComponent {

  ideaLocalisations = Array.from({ length: 7 }, () => ({ key: "", value: "" }));
  items = ["Nation","Ideas", "Localisation", "Export"];
  expandedIndex: number | null = 0;

  @ViewChild(NatIdeaViewComponent) natIdeaViewComponent!: NatIdeaViewComponent;

  nationProvider: IIconProvider;
  nationSelectConnector = new TagSelectConnector();

  constructor(public eu4: EU4Service, private exportService: ImportExportService, public lobbyConfigProvider: UserConfigurationProvider, public ideasConnector: IdeasConnector) {
    this.nationProvider = lobbyConfigProvider.getNationProvider();
  }

  ngOnInit() {
    this.nationSelectConnector.registerSelectionChangedListener(() => {
      const icons = this.nationProvider.getIcons().then(icons => {
        const match = icons.find(icon => this.nationSelectConnector.isSelected(icon.key));
        if (match) {
          this.natIdeaViewComponent.setNation(match.key, match.name, match.imageUrl);
        }
      });
    });
    this.nationSelectConnector.registerSelectionChangedListener(() => {
      this.storeTagInLocalStorage();
    });
    this.loadTagAndLocalisationsFromLocalStorage();
  }

  toggleAccordion(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  getHeaderClass(index: number): string {
    if (index == 0 && this.nationSelectConnector.getSelectedKeys().size == 1) {
      return "header-green";
    }
    if (index == 1 && this.ideasConnector.getSelectedIdeas().size == 10) {
      return "header-green";
    }
    if (index == 2 && this.ideaLocalisations.every(localisation => localisation.key.length > 0 && localisation.value.length > 0)) {
      return "header-green";
    }
    if (index == 3 && !this.getExportTooltipMessageOrNull()) {
      return "header-green";
    }
    return "";
  }

  getExportTooltipMessageOrNull() {
    if (this.natIdeaViewComponent == null) {
      return true;
    }
    const ideas = this.natIdeaViewComponent.getIdeasInOrder();
    return this.lobbyConfigProvider.getIllegalIdeaErrorMessageIfExists(ideas.map(id => id.idea), ideas.map(id => id.level), this.natIdeaViewComponent.getManaPercentages());
  }

  isExportDisabled() {
    return this.getExportTooltipMessageOrNull() != null;
  }

  getExportTooltip() {
    if (this.natIdeaViewComponent == null) {
      return null;
    }
    const ideas = this.natIdeaViewComponent.getIdeasInOrder();
    return this.lobbyConfigProvider.getIllegalIdeaErrorMessageIfExists(ideas.map(id => id.idea), ideas.map(id => id.level), [0,1,2].map(i => this.natIdeaViewComponent.getManaPercentage(i)));
  }

  onExportClick() {
    let nationTag = Array.from(this.nationSelectConnector.getSelectedKeys())[0];
    if (nationTag === "REB") {
      nationTag = prompt("Enter a tag for the nation:")!;
      const newName = prompt("Enter a name for the nation:");
      if (nationTag && newName) {
        this.natIdeaViewComponent.setNation(nationTag, newName, this.natIdeaViewComponent.nationFlagImageUrl);
      } else {
        return;
      }
    }
    if (!nationTag) {
      return;
    }
    const ideasAndLevels = this.natIdeaViewComponent.getSliders().map(slider => {
      const sliderIdea = slider!.getIdea();
      const sliderLevel = slider!.value;
      const freeStuff = this.lobbyConfigProvider.getFreeBonus(sliderIdea, sliderLevel);
      return [new IdeaAtLevel(sliderIdea, sliderLevel)].concat(freeStuff);
    });
    const ideaFileContent = this.exportService.getIdeaString(nationTag, ideasAndLevels);
    const locFileContent = this.exportService.getLocSnippet(nationTag, this.ideaLocalisations.map(localisation => localisation.key), this.ideaLocalisations.map(localisation => localisation.value));
    this.exportService.downloadAsZip(nationTag, ideaFileContent, locFileContent);
  }

  onIdeaLocalisationChange(index: number, field: 'key' | 'value', newValue: string): void {
    this.ideaLocalisations[index][field] = newValue;
    setTimeout(() => {
      this.storeLocalisationsInLocalStorage();
    });
  }

  getIdeaIcon(index: number) {
    const idea = this.natIdeaViewComponent.getIdeaAtIndex(2 + index);
    if (idea) {
      return this.eu4.getIdeaIconImageUrl(idea.getKey());
    }
    return "";
  }

  private storeTagInLocalStorage() {
    const tag = Array.from(this.nationSelectConnector.getSelectedKeys())[0];
    if (tag) {
      localStorage.setItem('nationTag', tag);
    } else {
      localStorage.removeItem('nationTag');
    }
  }

  private storeLocalisationsInLocalStorage() {
    localStorage.setItem('ideaLocalisations', JSON.stringify(this.ideaLocalisations));
  }

  private loadTagAndLocalisationsFromLocalStorage() {
    const tag = localStorage.getItem('nationTag');
    if (tag) {
      this.nationSelectConnector.setSelected(tag, true);
    }
    const localisations = localStorage.getItem('ideaLocalisations');
    if (localisations) {
      this.ideaLocalisations = JSON.parse(localisations);
    }
  }
}