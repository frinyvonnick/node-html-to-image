import { existsSync, mkdirSync, readdirSync } from "fs";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import rimraf from "rimraf";
import { createWorker } from "tesseract.js";

import { nodeHtmlToImage } from "./main";

describe("node-html-to-image", () => {
  let mockExit;
  let mockConsoleErr;
  const originalConsoleError = console.error;
  beforeEach(() => {
    rimraf.sync("./generated");
    mkdirSync("./generated");
    mockExit = jest.spyOn(process, "exit").mockImplementation((number) => {
      throw new Error("process.exit: " + number);
    });
    mockConsoleErr = jest
      .spyOn(console, "error")
      .mockImplementation((value) => originalConsoleError(value));
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleErr.mockRestore();
  });

  afterAll(() => {
    rimraf.sync("./generated");
  });
  describe("error", () => {
    it("should stop the program properly", async () => {
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      await expect(async () => {
        await nodeHtmlToImage({
          html: "<html></html>",
          type: "jpeg",
          // @ts-ignore
          quality: "wrong value",
        });
      }).rejects.toThrow();

      expect(mockExit).toHaveBeenCalledWith(1);
      /* eslint-enable @typescript-eslint/ban-ts-comment */
    });
  });

  describe("single image", () => {
    it("should generate output file", async () => {
      await nodeHtmlToImage({
        output: "./generated/image.png",
        html: "<html></html>",
      });

      expect(existsSync("./generated/image.png")).toBe(true);
    });

    it("should return a buffer", async () => {
      const result = await nodeHtmlToImage({
        html: "<html></html>",
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should throw an error if html is not provided", async () => {
      await expect(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await nodeHtmlToImage({
          output: "./generated/image.png",
        });
      }).rejects.toThrow();
      expect(mockConsoleErr).toHaveBeenCalledWith(
        new Error("You must provide an html property.")
      );
    });

    it("should throw timeout error", async () => {
      await expect(async () => {
        await nodeHtmlToImage({
          timeout: 500,
          html: "<html></html>"
        });
      }).rejects.toThrow();
      expect(mockConsoleErr).toHaveBeenCalledWith(
        new Error("Timeout hit: 500")
      );
    });

    it("should generate an jpeg image", async () => {
      await nodeHtmlToImage({
        output: "./generated/image.jpg",
        html: "<html></html>",
        type: "jpeg",
      });

      expect(existsSync("./generated/image.jpg")).toBe(true);
    });

    it("should put html in output file", async () => {
      await nodeHtmlToImage({
        output: "./generated/image.png",
        html: "<html><body>Hello world!</body></html>",
      });

      const text = await getTextFromImage("./generated/image.png");
      expect(text.trim()).toBe("Hello world!");
    });

    it("should use handlebars to customize content", async () => {
      await nodeHtmlToImage({
        output: "./generated/image.png",
        html: "<html><body>Hello {{name}}!</body></html>",
        content: { name: "Yvonnick" },
      });

      const text = await getTextFromImage("./generated/image.png");
      expect(text.trim()).toBe("Hello Yvonnick!");
    });

    it("should create selected element image", async () => {
      await nodeHtmlToImage({
        output: "./generated/image.png",
        html: '<html><body>Hello <div id="section">{{name}}!</div></body></html>',
        content: { name: "Sangwoo" },
        selector: "div#section",
      });

      const text = await getTextFromImage("./generated/image.png");
      expect(text.trim()).toBe("Sangwoo!");
    });
  });

  describe("batch", () => {
    it("should create two images", async () => {
      await nodeHtmlToImage({
        type: "png",
        quality: 300,
        html: "<html><body>Hello {{name}}!</body></html>",
        content: [
          { name: "Yvonnick", output: "./generated/image1.png" },
          { name: "World", output: "./generated/image2.png" },
        ],
      });

      const text1 = await getTextFromImage("./generated/image1.png");
      expect(text1.trim()).toBe("Hello Yvonnick!");

      const text2 = await getTextFromImage("./generated/image2.png");
      expect(text2.trim()).toBe("Hello World!");
    });

    it("should return two buffers", async () => {
      const result = await nodeHtmlToImage({
        type: "png",
        quality: 300,
        html: "<html><body>Hello {{name}}!</body></html>",
        content: [{ name: "Yvonnick" }, { name: "World" }],
      });

      expect(result?.[0]).toBeInstanceOf(Buffer);
      expect(result?.[1]).toBeInstanceOf(Buffer);
    });

    it("should create selected elements images", async () => {
      await nodeHtmlToImage({
        html: '<html><body>Hello <div id="section1">{{name}}!</div><div id="section2">World!</div></body></html>',
        content: [
          {
            name: "Sangwoo",
            output: "./generated/image1.png",
            selector: "div#section1",
          },
          { output: "./generated/image2.png", selector: "div#section2" },
        ],
      });

      const text1 = await getTextFromImage("./generated/image1.png");
      expect(text1.trim()).toBe("Sangwoo!");
      const text2 = await getTextFromImage("./generated/image2.png");
      expect(text2.trim()).toBe("World!");
    });

    it.skip("should handle mass volume well", async () => {
      jest.setTimeout(60000 * 60);
      expect.hasAssertions();
      const NUMBER_OF_IMAGES = 2000;
      const content = Array.from(Array(NUMBER_OF_IMAGES), (_, i) => ({
        name: i,
        output: `./generated/${i}.jpg`,
      }));

      await nodeHtmlToImage({
        type: "png",
        quality: 300,
        html: "<html><body>Hello {{name}}!</body></html>",
        content,
      });

      expect(readdirSync("./generated")).toHaveLength(NUMBER_OF_IMAGES);
    });
  });
  describe("different instance", () => {
    it("should pass puppeteer instance and generate image", async () => {
      const executablePath = puppeteer.executablePath();

      await nodeHtmlToImage({
        output: "./generated/image.png",
        html: "<html></html>",
        puppeteerArgs: { executablePath },
        puppeteer: puppeteerCore,
      });

      expect(existsSync("./generated/image.png")).toBe(true);
    });

    it("should throw an error if executablePath is not provided", async () => {
      await expect(async () => {
        await nodeHtmlToImage({
          output: "./generated/image.png",
          html: "<html></html>",
          puppeteer: puppeteerCore,
        });
      }).rejects.toThrow();
    });
  });
});

async function getTextFromImage(path) {
  const worker = await createWorker();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  const {
    data: { text },
  } = await worker.recognize(path);
  await worker.terminate();

  return text;
}
