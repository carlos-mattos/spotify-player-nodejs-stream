import fs from "fs";
import config from "./config.js";
import { extname, join } from "path";
import fsPromises from "fs/promises";

export class Service {
  createFileStream(filename) {
    return fs.createReadStream(filename);
  }

  async getFileInfo(file) {
    const fullFilePath = join(config.dir.publicDir, file);

    await fsPromises.access(fullFilePath);
    const fileType = extname(fullFilePath);

    return {
      type: fileType,
      name: fullFilePath,
    };
  }

  async getFileStream(file) {
    const { name, type } = await this.getFileInfo(file);

    return {
      stream: this.createFileStream(name),
      type,
    };
  }
}
