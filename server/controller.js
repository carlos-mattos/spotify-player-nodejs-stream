import { Service } from "./service.js";
import { logger } from "./utils.js";

export class Controller {
  constructor() {
    this.service = new Service();
  }

  async getFileStream(fileName) {
    return this.service.getFileStream(fileName);
  }

  createClientStream() {
    const { id, clientStream } = this.service.createClientStream();

    const onClose = () => {
      logger.info(`closing connection of ${id}`);
      this.service.removeClientStream(id);
    };

    return {
      stream: clientStream,
      onClose,
    };
  }

  async handleCommand({ command }) {
    logger.info(`command received: ${command}`);

    const cmd = command.toLowerCase();

    if (cmd.includes("start")) {
      this.service.startStreaming();
      return {
        result: "Streaming started",
      };
    }
   
    if (cmd.includes("stop")) {
      this.service.stopStreaming();
      return {
        result: "Streaming stopped",
      };
    }

  }
}
