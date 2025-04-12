import { ISelectConnector } from "./ISelectConnectors";

export class TagSelectConnector implements ISelectConnector{
    private selectedTag: string | null = null;
    private listeners: (() => void)[] = [];

    registerSelectionChangedListener(listener: () => void): void {
        this.listeners.push(listener);
    }

    getSelectedKeys(): Set<string> {
        return this.selectedTag == null ? new Set() : new Set([this.selectedTag]);
    }

    isSelected(key: string): boolean {
        return this.selectedTag == key;
    }

    setSelection(keys: string[]) {
        if (keys.length > 1) {
            throw new Error("Too many tags selected: " + keys.length);
        }
        this.selectedTag = keys.length === 0 ? null : keys[0];
        this.listeners.forEach(listener => listener());
    }

    setSelected(key: string, selected: boolean): void {
        this.selectedTag = selected ? key : null;
        this.listeners.forEach(listener => listener());
    }

    canAlterSelection(key: string): boolean {
        return true;
    }
}