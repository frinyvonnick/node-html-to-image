import { describe } from "jest-circus";
import { makeScreenshot } from "./screenshot";
import { Screenshot } from "./models/Screenshot";

describe("beforeScreenshot", () => {
  let page;
  const buffer = Symbol("Buffer");

  beforeEach(() => {
    page = {
      setContent: jest.fn(),
      $: jest.fn(() => ({ screenshot: jest.fn(() => buffer) })),
    };
  });

  it("should call beforeScreenshot with page", async () => {
    const beforeScreenshot = jest.fn();
    await makeScreenshot(page, {
      beforeScreenshot,
      screenshot: new Screenshot({
        html: "<html><body>Hello world!</body></html>",
      }),
    });

    expect(beforeScreenshot).toHaveBeenCalledWith(page);
  });

  it("should return a screenshot with a buffer", async () => {
    const screenshot = await makeScreenshot(page, {
      screenshot: new Screenshot({
        html: "<html><body>Hello world!</body></html>",
      }),
    });

    expect(screenshot.buffer).toEqual(buffer);
  });

  it("should compile a screenshot if there is content", async () => {
    await makeScreenshot(page, {
      screenshot: new Screenshot({
        html: "<html><body>{{message}}</body></html>",
        content: { message: "Hello world!" },
      }),
    });

    expect(page.setContent).toHaveBeenCalledWith(
      "<html><body>Hello world!</body></html>",
      expect.anything()
    );
  });

  it("should not compile a screenshot if content is empty", async () => {
    await makeScreenshot(page, {
      screenshot: new Screenshot({
        html: "<html><body>{{message}}</body></html>",
        content: {},
      }),
    });

    expect(page.setContent).toHaveBeenCalledWith(
      "<html><body>{{message}}</body></html>",
      expect.anything()
    );
  });

  it("should wait until load event", async () => {
    await makeScreenshot(page, {
      screenshot: new Screenshot({
        html: "<html><body>Hello world!</body></html>",
      }),
      waitUntil: "load",
    });

    expect(page.setContent).toHaveBeenCalledWith(expect.anything(), {
      waitUntil: "load",
    });
  });

  it("should throw an error if not element is found", async () => {
    page.$.mockImplementationOnce(jest.fn());
    await expect(async () => {
      await makeScreenshot(page, {
        screenshot: new Screenshot({
          selector: "toto",
          html: "<html><body>Hello world!</body></html>",
        }),
      });
    }).rejects.toThrow("No element matches selector: toto");
  });
});
