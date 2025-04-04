import { IIdea } from "./game/IIdea";

export class IdeaAtLevel {
    constructor(private idea: IIdea, private level: number) {
        if (level < 1) {
            throw new Error("Invalid level for idea " + idea.getKey() + ": " + level);
        }
    }

    public getIdea() {
        return this.idea;
    }

    public getLevel() {
        return this.level;
    }
}
