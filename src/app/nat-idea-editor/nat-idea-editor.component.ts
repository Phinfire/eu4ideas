import { Component } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EU4Service, NumberKind } from '../types/EU4Service';
import { IIdea } from '../types/IIdea';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface TreeNode {
  key: string;
  children?: TreeNode[];
}

interface SliderConfig {
  key: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  showTicks: boolean;

  getImageUrl(): string;
  getCurrentCost(): number;
  getCurrentModifier(): string;
}

@Component({
  selector: 'app-nat-idea-editor',
  standalone: true,
  imports: [MatSliderModule, FormsModule, CommonModule, MatTreeModule, MatIconModule, MatTooltipModule],
  templateUrl: './nat-idea-editor.component.html',
  styleUrl: './nat-idea-editor.component.scss'
})
export class NatIdeaEditorComponent {

  sliders: SliderConfig[] = [];
  treeData: TreeNode[] = [];

  constructor(private eu4: EU4Service) {
    
  }

  ngOnInit() {
    this.eu4.waitUntilReady().then(() => {
      const treeData: TreeNode[] = [];
      for (let [manaType, ideas] of this.eu4.getCustomIdeas().entries()) {
        const children: TreeNode[] = [];
        for (let [ideaKey, idea] of ideas.entries()) {
          children.push({key: ideaKey});
        }
        treeData.push({key: manaType, children: children.sort((a, b) => this.eu4.localizeIdea(a.key).localeCompare(this.eu4.localizeIdea(b.key)))});
      }
      this.treeData = treeData;
    });
  }

  
getSliderConfig(idea: IIdea) {
  const outerThis = this;
  return {
    key: idea.getKey(),
    name: outerThis.eu4.localizeIdea(idea.getKey()),
    value: 1,
    min: 1,
    max: idea.getMaxCustomLevel(),
    step: 1,
    showTicks: true,
    getImageUrl: function() {
      return outerThis.eu4.getIdeaIconImageUrl(idea.getKey());
    },
    getCurrentCost: function() {
      return idea.getCostAtLevel(this.value);
    },
    getCurrentModifier: function() {
      const modifierAsNumber = idea.getModifierAtLevel(this.value);
      const type = outerThis.eu4.getTypeOfIdea(idea.getKey());
      if (type == NumberKind.ADDITIVE) {
        if (Math.floor(modifierAsNumber) == modifierAsNumber) {
          return modifierAsNumber.toFixed(0);
        }
        return modifierAsNumber.toFixed(3) == modifierAsNumber.toFixed(2) + "0" ? modifierAsNumber.toFixed(2) : modifierAsNumber.toFixed(3); 
      } else if (type == NumberKind.MULTIPLICATIVE) {
        const percentage = (modifierAsNumber * 100);
        if (Math.floor(percentage) == percentage) {
          return percentage.toFixed(0) + "%";
        }
        return percentage.toFixed(1) + "%";
      } else if (type == NumberKind.CONSTANT) {
        return modifierAsNumber.toString();
      }
      throw new Error("Unknown number kind: " + type);
    }
  };
}

  onValueChange(event: any, index: number) {
    this.sliders[index].value = event;
  }

  getCustomLabel(value: number, div: HTMLDivElement) {
    div.innerHTML = value.toString();
  }

  getRealWorldCost(index: number, div: HTMLDivElement | null) {
    return this.eu4.getCustomIdeaWeights()[index] * this.sliders[index].getCurrentCost();
  }

  getTotalCost() {
    let total = 0;
    for (let i = 0; i < this.sliders.length; i++) {
      total += this.getRealWorldCost(i, null);
    }
    return total;
  }

  getImageUrl(key: string) {
    return this.eu4.getIdeaIconImageUrl(key);
  }

  getNodeLabel(key: string) {
    return this.eu4.localizeIdea(key);
  }

  onLeafNodeClick(node: TreeNode): void {
    if (this.leafIsSelected(node)) {
      const index = this.sliders.findIndex(slider => slider.key === node.key);
      this.sliders.splice(index, 1);
      console.log("Removed " + node.key, this.sliders.length);
    } else if (this.sliders.length < 10) {
      this.sliders.push(this.getSliderConfig(this.eu4.getIdea(node.key)));
    }
  }

  leafIsSelected(node: TreeNode): boolean {
    return this.sliders.map(slider => slider.key).includes(node.key);
  }

  childrenAccessor = (node: TreeNode) => node.children ?? [];

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;
}