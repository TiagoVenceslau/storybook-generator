import path from "path";
import fs, { Stats } from "fs";
import { FileConflict, FileNotFound, IOMismatch } from "./errors";
import { Logging } from "@decaf-ts/logging";


export class FileApi {

  protected static log = Logging.for(FileApi.name);

  static cwd: string = path.join(process.cwd(), "..", "..");

  private constructor() {
  }

  private static stat(p: string){
    let stat: Stats;
    try {
      stat = fs.statSync(p);
    } catch (e: unknown) {
      return false;
    }
    return stat;
  }


  static fileExists(p: string) {
    const stat = this.stat(p);
    if (!stat)  return false;
    if (!stat.isFile())
      throw new IOMismatch(`object ${p} exists but is not a file`)
    return true;
  }

  static folderExists(p: string) {
    const stat = this.stat(p);
    if (!stat)  return false;
    if (!stat.isDirectory())
      throw new IOMismatch(`object ${p} exists but is not a directory`)
    return true;
  }

  static readFile(p: string){
    if (!this.fileExists(p))
      throw new FileNotFound(`file ${p} does not exist`);
    return fs.readFileSync(p);
  }

  static createFile(p: string, data: Buffer){
    if (this.fileExists(p))
      throw new FileConflict(`file ${p} does already exists`);
    return fs.writeFileSync(p, data);
  }

  static updateFile(p: string, data: Buffer){
    if (!this.fileExists(p))
      throw new FileNotFound(`file ${p} does not exist`);
    return fs.writeFileSync(p, data);
  }

  static dirname(p: string){
    return path.dirname(p)
  }

  static fileName(p: string, removeExt: boolean = false){
    return path.basename(p, removeExt ? this.extension(p) : undefined);
  }

  static extension(p: string){
    return path.extname(p).substring(1);
  }

  static replaceExtension(p: string, ext: string){
    const split = p.split(".");
    return [...split.slice(0, split.length -2), ext].join(".");
  }

  static createVariation(p :string, data: Buffer,  suffix?: string){
    const stat = this.stat(p);
    if (!stat)
      throw new FileNotFound(`file ${p} does not exist`);
    const dir = this.dirname(p);
    const fileName = this.fileName(p, true);
    const ext = this.extension(p);
    const regexp = new RegExp(`([0-9]+)\.\w+$`);
    const match = regexp.exec(fileName);
    const number = match ? parseInt(match[1]) : 0;
    const newFileName = `${fileName}${suffix ? `-${suffix}-` : "-"}${number + 1}.${ext}`;
    const newPath = path.join(dir, newFileName);
    this.createFile(newPath, data);
    return newPath;
  }
}