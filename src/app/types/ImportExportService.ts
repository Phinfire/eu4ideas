import { Injectable } from "@angular/core";
import { IIdea } from "./game/IIdea";
import JSZip from "jszip";
import { IdeaAtLevel } from "./IdeaAtLevel";
import { Jomini } from "jomini";
import { EU4Service } from "./game/EU4Service";

@Injectable({providedIn: 'root'})
export class ImportExportService {

    private static LOC_SEPARATOR = ":0";

    constructor(private eu4: EU4Service) {
        
    }

    parseIntoIdeas(ideaFileContent: string) {
        return Jomini.initialize().then((parser) => {
            const parsed = parser.parseText(ideaFileContent);
            return this.eu4.waitUntilReady().then(() => {
                for (const key in parsed) {
                    for (const subKey in parsed[key]) {
                        for (const subSubKey in parsed[key][subKey]) {
                            const value = parsed[key][subKey][subSubKey];
                            console.log("Key: " + key + ", SubKey: " + subKey + ", SubSubKey: " + subSubKey + ", Value: " + value);
                        }
                    }
                }
            });
        });
    }

    public downloadAsZip(tag: string, ideaString: string, locSnippet: string, ) {
        const zip = new JSZip();
        zip.file(`${tag}.yml`, locSnippet);
        zip.file(`${tag}.txt`, ideaString);

        zip.generateAsync({ type: "blob" }).then((content) => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `${tag}.zip`;
            a.click();
        });
        console.log(ideaString);
    }

    public getLocSnippet(tag: string, locTitles: string[], locDescriptions: string[]) {
        const lines = [];
        for (let i = 0; i < locTitles.length; i++) {
            const titleLine = this.getNThIdeaKey(tag, i) + ImportExportService.LOC_SEPARATOR + " \""  + locTitles[i].replace("\n", " ") + "\"";
            const descriptionLine = this.getNThIdeaKey(tag, i) + "_desc" + ImportExportService.LOC_SEPARATOR + " \""  + locDescriptions[i].replace("\n", " ") + "\"";
            lines.push(titleLine);
            lines.push(descriptionLine);
        }
        return lines.join("\n");
    }

    public getIdeaString(tag: string, ideaAtLevels: IdeaAtLevel[][]) {
        if (ideaAtLevels.length != 10) {
            throw new Error("Invalid number of ideas: " + ideaAtLevels.length);
        }

        let resultLines = [tag + "_nat_ideas = {\n"];
        resultLines.push(this.ideasToBlockLines("start", ideaAtLevels[0].concat(ideaAtLevels[1])).map(line => "\t" + line).join("\n"));
        resultLines.push(this.getWrappedInCurlyConstruct("trigger", ["tag = " + tag]).map(line => "\t" + line).join("\n"));
        resultLines.push("\tfree = yes");
        for (let i = 2; i < 9; i++) {
            const indexInIdeas = i - 2;
            resultLines.push(this.ideasToBlockLines(this.getNThIdeaKey(tag,indexInIdeas), ideaAtLevels[i]).map(line => "\t" + line).join("\n"));
        }
        resultLines.push(this.ideasToBlockLines("bonus", ideaAtLevels[9]).map(line => "\t" + line).join("\n"));
        resultLines.push("}");
        return resultLines.join("\n");
    }

    private ideasToBlockLines = (key: string, ideasAndLevels: IdeaAtLevel[]) => {
        const bodyLines = [];
        for (let i = 0; i < ideasAndLevels.length; i++) {
            const decimalsOfbaseValue = ideasAndLevels[i].getIdea().getModifierAtLevel(1).toString().split(".")[1]?.length || 0;
            const value = ideasAndLevels[i].getIdea().getModifierAtLevel(ideasAndLevels[i].getLevel());
            const valuetruncatedToDecimals = value.toFixed(decimalsOfbaseValue);
            // This is a hack to avoid floating point precision fucking with the output
            bodyLines.push(ideasAndLevels[i].getIdea().getKey() + " = "+ valuetruncatedToDecimals);
        }
        return this.getWrappedInCurlyConstruct(key, bodyLines);
    }

    private getWrappedInCurlyConstruct(key: string, lines: string[]) {
        return [
            key + " = {",
            ...lines.map(line => "\t" + line),
            "}"
        ];
    }

    private getNThIdeaKey(tag: string, n: number) {
        return tag + "_idea_" + n;
    }
}