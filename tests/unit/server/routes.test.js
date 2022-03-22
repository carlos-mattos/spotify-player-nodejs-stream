import { jest, expect, describe, test, beforeEach } from "@jest/globals";
import config from "../../../server/config";
import { Controller } from "../../../server/controller";
import { handler } from "../../../server/routes";
import TestUtil from "../_util/testUtil";

describe("#routes - test suite for api response", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("GET / - should redirect to home page", async () => {
    const params = TestUtil.defaultHandlerParams();

    params.request.method = "GET";
    params.request.url = "/";

    await handler(...params.values());

    expect(params.response.writeHead).toHaveBeenCalledWith(302, {
      Location: config.location.home,
    });

    expect(params.response.end).toHaveBeenCalled();
  });

  test(`GET /home - should response with ${config.pages.homeHTML} file stream`, async () => {
    const params = TestUtil.defaultHandlerParams();

    params.request.method = "GET";
    params.request.url = "/home";

    const mockFileStream = TestUtil.generateReadableStream(["data"]);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
      });

    jest.spyOn(mockFileStream, "pipe").mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toBeCalledWith(
      config.pages.homeHTML
    );
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response);
  });

  test(`GET /controller - should response with ${config.pages.controllerHTML} file stream`, async () => {
    const params = TestUtil.defaultHandlerParams();

    params.request.method = "GET";
    params.request.url = "/controller";

    const mockFileStream = TestUtil.generateReadableStream(["data"]);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
      });

    jest.spyOn(mockFileStream, "pipe").mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toBeCalledWith(
      config.pages.controllerHTML
    );
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response);
  });

  test(`GET /index.html - should response with file stream`, async () => {
    const params = TestUtil.defaultHandlerParams();

    params.request.method = "GET";
    params.request.url = "/index.html";
    const expectedType = ".html";

    const mockFileStream = TestUtil.generateReadableStream(["data"]);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType,
      });

    jest.spyOn(mockFileStream, "pipe").mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toBeCalledWith("/index.html");
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response);
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      "Content-Type": config.constants.CONTENT_TYPE[expectedType],
    });
  });

  test(`GET /file.ext - should response with file stream`, async () => {
    const params = TestUtil.defaultHandlerParams();

    params.request.method = "GET";
    params.request.url = "/file.ext";
    const expectedType = ".ext";

    const mockFileStream = TestUtil.generateReadableStream(["data"]);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType,
      });

    jest.spyOn(mockFileStream, "pipe").mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toBeCalledWith("/file.ext");
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response);
    expect(params.response.writeHead).not.toHaveBeenCalled();
  });

  test(`POST /unknown - given an inexistent file should response with 404`, async () => {
    const params = TestUtil.defaultHandlerParams();

    params.request.method = "POST";
    params.request.url = "/unknown";

    await handler(...params.values());

    expect(params.response.writeHead).toHaveBeenCalledWith(404);
    expect(params.response.end).toHaveBeenCalled();
  });

  describe("Exceptions", () => {
    test("given an inexistent file it should respond with 404", async () => {
      const params = TestUtil.defaultHandlerParams();

      params.request.method = "GET";
      params.request.url = "/index.png";

      jest
        .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(
          new Error(
            "Error: ENOENT: no such file or directory, open 'index.png'"
          )
        );

      await handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(404);
      expect(params.response.end).toHaveBeenCalled();
    });

    test("given an error it should respond with 500", async () => {
      const params = TestUtil.defaultHandlerParams();

      params.request.method = "GET";
      params.request.url = "/index.png";

      jest
        .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error("Error:"));

      await handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(500);
      expect(params.response.end).toHaveBeenCalled();
    });
  });
});
