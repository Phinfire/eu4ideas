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
        
    }

    setSelected(key: string, selected: boolean): void {
        this.selectedTag = selected ? key : null;
        this.listeners.forEach(listener => listener());
    }

    canAlterSelection(key: string): boolean {
        return true;
    }
}