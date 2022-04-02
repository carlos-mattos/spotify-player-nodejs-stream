import config from "./config.js";
import { Controller } from "./controller.js";
import { logger } from "./utils.js";
import { once } from "events";

const controller = new Controller();

async function routes(request, response) {
  const { method, url } = request;

  if (method === "GET" && url === "/") {
    response.writeHead(302, {
      Location: config.location.home,
    });

    return response.end();
  }

  if (method === "GET" && url === "/home") {
    const { stream } = await controller.getFileStream(config.pages.homeHTML);

    return stream.pipe(response);
  }

  if (method === "GET" && url === "/controller") {
    const { stream } = await controller.getFileStream(
      config.pages.controllerHTML
    );

    return stream.pipe(response);
  }

  if (method === "GET" && url.includes("/stream")) {
    const { onClose, stream } = controller.createClientStream();

    request.on("close", onClose);

    response.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
    });

    return stream.pipe(response);
  }

  if (method === "POST" && url === "/controller") {
    const data = await once(request, "data");

    const item = JSON.parse(data);

    const result = await controller.handleCommand(item);

    return response.end(JSON.stringify(result));
  }

  if (method === "GET") {
    const { stream, type } = await controller.getFileStream(url);

    const contentType = config.constants.CONTENT_TYPE[type];

    if (contentType) {
      response.writeHead(200, {
        "Content-Type": contentType,
      });
    }

    return stream.pipe(response);
  }

  response.writeHead(404);
  return response.end("END");
}

function handleError(error, response) {
  if (error.message.includes("ENOENT")) {
    logger.warn(`asset not found ${error.stack}`);
    response.writeHead(404);
    return response.end("404");
  }

  logger.error(`cause error ${error.stack}`);
  response.writeHead(500);
  return response.end("500");
}

export async function handler(request, response) {
  return routes(request, response).catch((error) =>
    handleError(error, response)
  );
}
