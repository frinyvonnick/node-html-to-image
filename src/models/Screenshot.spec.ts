import { describe } from "jest-circus";
import { Screenshot } from "./Screenshot";

describe("Screenshot", () => {
  const html = "<html><body>Hello world!</body></html>";

  it("should create a minimal Screenshot", () => {
    const screenshot = new Screenshot({
      html,
    });

    expect(screenshot.html).toEqual(html);
  });

  it("should store buffer", () => {
    const screenshot = new Screenshot({
      html,
    });

    const expectedBuffer = Buffer.alloc(1);

    screenshot.setBuffer(expectedBuffer);

    expect(screenshot.buffer).toEqual(expectedBuffer);
  });

  it("should set html", () => {
    const screenshot = new Screenshot({
      html,
    });

    const expectedHtml = "<div>Hello</div>";

    screenshot.setHTML(expectedHtml);

    expect(screenshot.html).toEqual(expectedHtml);
  });

  it("should throw an error when setting html with nothing", () => {
    const screenshot = new Screenshot({
      html,
    });

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      screenshot.setHTML();
    }).toThrow("You must provide an html property.");

    expect(screenshot.html).toEqual(html);
  });

  it("should throw an error when setting html with null", () => {
    const screenshot = new Screenshot({
      html,
    });

    expect(() => {
      screenshot.setHTML(null);
    }).toThrow("You must provide an html property.");

    expect(screenshot.html).toEqual(html);
  });

  it("should throw an error when setting html with empty string", () => {
    const screenshot = new Screenshot({
      html,
    });

    expect(() => {
      screenshot.setHTML("");
    }).toThrow("You must provide an html property.");

    expect(screenshot.html).toEqual(html);
  });

  it("should create a Screenshot with a few attributes", () => {
    const attributes = {
      html,
      output: "something",
      content: { hello: "Salut" },
      encoding: "base64",
    } as const;
    const screenshot = new Screenshot(attributes);

    expect(screenshot).toEqual({
      ...attributes,
      transparent: false,
      selector: "body",
      type: "png",
    });
  });

  it("should create a Screenshot with different value from defaults", () => {
    const attributes = {
      html,
      transparent: true,
      selector: "something",
      type: "jpeg",
    } as const;
    const screenshot = new Screenshot(attributes);

    expect(screenshot).toEqual(expect.objectContaining(attributes));
  });

  it("should not set quality if type is different from jpeg", () => {
    const screenshot = new Screenshot({
      html,
      quality: 3,
    });

    expect(screenshot.quality).toEqual(undefined);
  });

  it("should handle empty content", () => {
    const screenshot = new Screenshot({
      html,
      content: {},
    });

    expect(screenshot.content).toEqual(undefined);
  });

  it("should set quality if type is jpeg", () => {
    const screenshot = new Screenshot({
      html,
      type: "jpeg",
      quality: 3,
    });

    expect(screenshot.quality).toEqual(3);
  });

  it("should set quality by default if type is jpeg", () => {
    const screenshot = new Screenshot({
      html,
      type: "jpeg",
    });

    expect(screenshot.quality).toEqual(80);
  });

  it("should throw an Error if no params are passed", () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      new Screenshot();
    }).toThrow("You must provide an html property.");
  });

  it("should throw an Error if html is missing", () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      new Screenshot({});
    }).toThrow("You must provide an html property.");
  });

  it("should throw an Error if html is null", () => {
    expect(() => {
      new Screenshot({ html: null });
    }).toThrow("You must provide an html property.");
  });

  it("should throw an Error if html is empty", () => {
    expect(() => {
      new Screenshot({ html: "" });
    }).toThrow("You must provide an html property.");
  });
});
