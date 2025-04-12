import { Injectable } from "@angular/core";
import { UserConfigurationProvider } from "../UserConfigurationProvider";
import { IdeaAtLevel } from "../IdeaAtLevel";
import { Mana } from "./Mana";

@Injectable({providedIn: 'root'})
export class CustomNatIdeaService {

    constructor(private userConfig: UserConfigurationProvider) {

    }

    getRealWorldCost(index: number, idea: IdeaAtLevel): number {
        return Math.ceil(this.userConfig.getCustomIdeaWeights()[index] * idea.getIdea().getCostAtLevel(idea.getLevel()));
    }
    
    getTotalCost(ideas: (IdeaAtLevel | null)[]): number {
        let total = 0;
        for (let i = 0; i < ideas.length; i++) {
            total += ideas[i] != null ? this.getRealWorldCost(i, ideas[i]!) : 0;
        }
        return total;
    }

    getCostsPerMana(ideas: IdeaAtLevel[]): number[] {
        if (ideas.length == 0) {
          return [0, 0, 0];
        }
        return [Mana.ADM, Mana.DIP, Mana.MIL].map(mana => {
            return ideas.filter(idea => idea.getIdea().getMana() == mana).map(idea => {
                return idea.getIdea().getCostAtLevel(idea.getLevel());
            }).reduce((a, b) => a + b, 0);
        });
      }

    getManaPercentages(ideas: IdeaAtLevel[]) {
        const costPerMana = this.getCostsPerMana(ideas);
        const totalCost = costPerMana.reduce((a, b) => a + b, 0);
        return costPerMana.map(cost => {
            if (totalCost == 0) {
            return 0;
            }
            return Math.floor(cost / totalCost * 100);
        });
    }
}