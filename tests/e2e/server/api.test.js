import { jest, expect, describe, test, beforeEach } from "@jest/globals";
import config from "../../../server/config";
import { Controller } from "../../../server/controller";
import Server from "../../../server/server.js";
import { handler } from "../../../server/routes";
import TestUtil from "../_util/testUtil";
import superTest from "supertest";
import portfinder from "portfinder";
import { Transform } from "stream";
import { setTimeout } from "timers/promises";

const RETENTION_DATA_PERIOD = 200;

const getAvailablePort = portfinder.getPortPromise();

describe("#api - test api e2e", () => {
  function pipeAndReadStreamData(stream, onChunk) {
    const transform = new Transform({
      transform(chunk, encoding, cb) {
        onChunk(chunk);

        cb(null, chunk);
      },
    });

    return stream.pipe(transform);
  }

  describe("client workflow", () => {
    async function getTestServer() {
      const getSuperTest = (port) => superTest("http://localhost:" + port);

      const port = await getAvailablePort();

      return new Promise((resolve, reject) => {
        Server.listen(port)
          .once("listening", () => {
            const testServer = getSuperTest(port);
            const response = {
              testServer,
              kill() {
                return Server.close();
              },
            };

            return resolve(response);
          })
          .once("error", reject);
      });
    }

    function commandSender(testServer) {
      return {
        async send(command) {
          const response = await testServer
            .post("/controller")
            .send({ command });

          expect(response.text).toHaveProperty("result");
        },
      };
    }

    test("should not receive data stream if the process is not running", async () => {
      const server = await getTestServer();

      const fn = jest.fn();

      pipeAndReadStreamData(server.testServer.get("/stream"), fn);

      await setTimeout(() => {}, RETENTION_DATA_PERIOD);

      server.kill();

      expect(fn).not.toHaveBeenCalled();
    });

    test("should receive data stream if the process is running", async () => {
      const server = await getTestServer();

      const fn = jest.fn();

      const { send } = commandSender(server.testServer);

      pipeAndReadStreamData(server.testServer.get("/stream"), fn);

      await send("start");

      await setTimeout(() => {}, RETENTION_DATA_PERIOD);

      await send("stop");

      const [[buffer]] = fn.mock.calls;

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);

      server.kill();
    });
  });
});
