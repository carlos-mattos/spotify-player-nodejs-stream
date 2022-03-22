import config from "./config.js";
import server from "./server.js";
import { logger } from "./utils.js";

server.listen(config.port, () => {
  logger.info(`========Server is running on port ${config.port}========`);
});
