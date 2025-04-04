export interface ISelectConnector {
    
    registerSelectionChangedListener(listener: () => void): void;

    getSelectedKeys(): Set<string>;

    isSelected(key: string): boolean;

    setSelection(keys: string[]): void;

    setSelected(key: string, selected: boolean): void;

    canAlterSelection(key: string): boolean;

}