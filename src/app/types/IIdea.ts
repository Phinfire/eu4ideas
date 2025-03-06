export interface IIdea {

    getKey(): string;

    getCostAtLevel(level: number): number;

    getMaxCustomLevel(): number;

    getModifierAtLevel(level: number): number;
}