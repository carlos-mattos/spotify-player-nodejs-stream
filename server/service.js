import fs from "fs";
import config from "./config.js";
import { extname, join } from "path";
import fsPromises from "fs/promises";
import { randomUUID } from "crypto";
import { PassThrough, Writable } from "stream";
import Throttle from "throttle";
import child_process from "child_process";
import { logger } from "./utils.js";
import streamsPromises from "stream/promises";
import { once } from "events";

export class Service {
  constructor() {
    this.clientStreams = new Map();
    this.currentSong = config.constants.englishConversation;
    this.currentBitRate = 0;
    this.throttleTransformer = {};
    this.currentReadable = {};
  }

  createClientStream() {
    const id = randomUUID();

    const clientStream = new PassThrough();

    this.clientStreams.set(id, clientStream);

    return { id, clientStream };
  }

  removeClientStream(id) {
    this.clientStreams.delete(id);
  }

  createFileStream(filename) {
    return fs.createReadStream(filename);
  }

  _executeSoxCommand(args) {
    return child_process.spawn("sox", args);
  }

  async getBitRate(song) {
    try {
      const args = ["--i", "-B", song];

      const { stderr, stdout, stdin } = this._executeSoxCommand(args);

      await Promise.all([once(stderr, "readable"), once(stdout, "readable")]);

      const [success, error] = [stdout, stderr].map((stream) => stream.read());

      if (error) {
        return await Promise.reject(error);
      }

      return success.toString().trim().replace(/k/, "000");
    } catch (error) {
      logger.error("Error getting bitrate", error);
      return config.constants.fallBackBitrate;
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk, encoding, cb) => {
        for (const [key, stream] of this.clientStreams) {
          if (stream.writableEnded) {
            this.clientStreams.delete(key);
            continue;
          }

          stream.write(chunk);
        }

        cb();
      },
    });
  }

  async startStreaming() {
    logger.info(`start with ${this.currentSong}`);

    const bitRate = (this.currentBitRate =
      (await this.getBitRate(this.currentSong)) /
      config.constants.bitRateDivisor);

    const throttleTransformer = new Throttle(bitRate);

    const songReadable = (this.currentReadable = this.createFileStream(
      this.currentSong
    ));

    return streamsPromises.pipeline(
      songReadable,
      throttleTransformer,
      this.broadCast()
    );
  }

  async stopStreaming() {
    this.throttleTransformer?.end?.();
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
