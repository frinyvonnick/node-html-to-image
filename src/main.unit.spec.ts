import { nodeHtmlToImage } from "./main";
import { Cluster } from "puppeteer-cluster";

import { Screenshot } from "./models/Screenshot";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("node-html-to-image | Unit", () => {
  let mockExit;
  let launchMock;
  const buffer1 = Buffer.alloc(1);
  const buffer2 = Buffer.alloc(1);
  const html = "<html><body>{{message}}</body></html>";

  beforeEach(() => {
    launchMock = jest.spyOn(Cluster, "launch").mockImplementation(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      jest.fn(() => ({
        execute: jest
          .fn()
          .mockImplementationOnce(async () => {
            const screenshot = new Screenshot({ html });
            screenshot.setBuffer(buffer1);
            await sleep(10);
            return screenshot;
          })
          .mockImplementationOnce(() => {
            const screenshot = new Screenshot({ html });
            screenshot.setBuffer(buffer2);
            return screenshot;
          }),
        idle: jest.fn(),
        close: jest.fn(),
      }))
    );
    mockExit = jest.spyOn(process, "exit").mockImplementation((number) => {
      throw new Error("process.exit: " + number);
    });
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it("should sort buffer in the right order", async () => {
    const result = await nodeHtmlToImage({
      html,
      content: [{ message: "Hello world!" }, { message: "Bonjour monde!" }],
    });

    expect(result).toEqual([buffer1, buffer2]);
  });

  it("should pass 'timeout' to 'puppeteer-cluster' via options", async () => {
    const CLUSTER_TIMEOUT = 60 * 1000;
    await nodeHtmlToImage({
        html,
        timeout: CLUSTER_TIMEOUT,
    });

    expect(launchMock).toHaveBeenCalledWith(expect.objectContaining({ timeout: CLUSTER_TIMEOUT }))
  });
});

jest.mock("puppeteer-cluster");
