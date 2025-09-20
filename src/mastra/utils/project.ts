import fs  from 'fs';
import path from "path";
import { Stats } from "fs";
import { FileApi } from "../../FileApi";

export class Project {

  private static get BASE_PATH() {
    return path.join(FileApi.cwd, "projects");
  }


  private constructor() {}

  private static createProjectFolder(...args: string[]){
    const p = args.length ? path.join(this.BASE_PATH, ...args) : this.BASE_PATH;
    try {
      const stat: Stats = fs.statSync(p)
    } catch (e: unknown){
      try {
        fs.mkdirSync(p, {recursive: true});
      } catch (e: unknown){
        throw new Error(`Failed to create project folder ${args}: ${e}`);
      }
    }
  }

  private static createFile(data: Buffer, fileName: string, format: "png" | "jpeg", ...args: string[]){
    const p = path.join(this.BASE_PATH, ...args, fileName + `-${Date.now()}.${format}`);
    try {
      fs.writeFileSync(p, data);
    } catch (e: unknown){
      throw new Error(`failed to create project file ${fileName} ${args}: ${e}`);
    }
    return p;
  }

  static storeCharacter(data: Buffer, project: string, character: string, pose: string, format: "png" | "jpeg", props?: string){
    this.createProjectFolder(project, character)
    return this.createFile(data, `${pose}${props ? props : ""}`, format, project, character)
  }
}