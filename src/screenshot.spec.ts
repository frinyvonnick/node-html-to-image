import { describe } from "jest-circus";
import handlebars from "handlebars";
import { makeScreenshot } from "./screenshot";
import { Screenshot } from "./models/Screenshot";

describe("beforeScreenshot", () => {
  let page;
  const buffer = new ArrayBuffer();

  beforeEach(() => {
    page = {
      setContent: jest.fn(),
      setDefaultTimeout: jest.fn(),
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

    expect(screenshot.buffer).toEqual(Buffer.from(buffer));
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
      expect.anything(),
    );
  });

  it("should call 'setDefaultTimeout' with option's timeout", async () => {
    const TIMEOUT = 40 * 1000;

    await makeScreenshot(page, {
      timeout: TIMEOUT,
      screenshot: new Screenshot({
        html: "<html><body>{{message}}</body></html>",
        content: { message: "Hello world!" },
      }),
    });

    expect(page.setDefaultTimeout).toHaveBeenCalledWith(TIMEOUT);
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
      expect.anything(),
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

describe("handlebarsHelpers", () => {
  let page;
  const buffer = new ArrayBuffer();

  beforeEach(() => {
    page = {
      setContent: jest.fn(),
      setDefaultTimeout: jest.fn(),
      $: jest.fn(() => ({ screenshot: jest.fn(() => buffer) })),
    };
    if (
      Object.prototype.hasOwnProperty.call(handlebars.helpers, "equals") &&
      !!handlebars.helpers.equals
    ) {
      handlebars.registerHelper({ equals: undefined });
    }
  });

  const compactHtml = (htmlString) => htmlString.replace(/((^|\n)\s+)/gm, "");

  describe("if no logic is given in the template", () => {
    const html = "<html><body><h1>Hello world!</h1></body></html>";

    const cleanTests = [
      {
        label: "handlebarsHelpers is not passed",
        options: { content: { myVar: "foo" }, html: html },
      },
      {
        label: "handlebarsHelpers is undefined",
        options: {
          content: { myVar: "foo" },
          handlebarsHelpers: undefined,
          html: html,
        },
      },
      {
        label: "handlebarsHelpers is not an object",
        options: {
          content: { myVar: "foo" },
          handlebarsHelpers: "I'm not an object",
          html: html,
        },
      },
      {
        label: "all helpers are functions but no content is passed",
        options: {
          handlebarsHelpers: {
            equals: (a, b) => a === b,
          },
          html: html,
        },
      },
      {
        label:
          "all helpers are functions but content has not the sought variable",
        options: {
          content: { myOtherVar: "bar" },
          handlebarsHelpers: {
            equals: (a, b) => a === b,
          },
          html: html,
        },
      },
    ];

    for (const test of cleanTests) {
      it(`if no logic is given in the template, it should not throw error when ${test.label}`, async () => {
        await expect(
          makeScreenshot(page, {
            screenshot: new Screenshot(test.options),
            handlebarsHelpers: test.options.handlebarsHelpers,
          }),
        ).resolves.not.toThrow();
      });

      it(`if no logic is given in the template, it should render the original template when ${test.label}`, async () => {
        const p = jest.fn(() => page);
        await makeScreenshot(p(), {
          screenshot: new Screenshot(test.options),
          handlebarsHelpers: test.options.handlebarsHelpers,
        });
        expect(p().setContent).toHaveBeenCalledWith(html, expect.anything());
      });
    }

    it("if no logic is given in the template, it should throw error when handlebarsHelpers is an object but some helper is not a function", async () => {
      await expect(
        makeScreenshot(page, {
          handlebarsHelpers: {
            foo: () => myVar === "foo",
            bar: "I'm not a valid function",
          },
          screenshot: new Screenshot({
            content: { myVar: "foo" },
            html: html,
          }),
        }),
      ).rejects.toThrow(/Some helper is not a valid function/);
    });
  });

  describe("if logic is given in the template", () => {
    const html = compactHtml(`
      <html>
        <body>
          <h1>Hello world!</h1>
          {{#if (equals myVar 'foo')}}<div>Foo</div>{{/if}}
        </body>
      </html>
    `);

    const errorTests = [
      {
        label: "handlebarsHelpers is not passed",
        options: { content: { myVar: "foo" }, html: html },
        error: /Missing helper: "equals"/,
      },
      {
        label: "handlebarsHelpers is passed as undefined",
        options: {
          content: { myVar: "foo" },
          handlebarsHelpers: undefined,
          html: html,
        },
        error: /Missing helper: "equals"/,
      },
      {
        label: "handlebarsHelpers is not an object",
        options: {
          content: { myVar: "foo" },
          handlebarsHelpers: "I'm not an object",
          html: html,
        },
        error: /Missing helper: "equals"/,
      },
      {
        label:
          "handlebarsHelpers is an object, but some helper is not a function",
        options: {
          handlebarsHelpers: {
            equals: (a, b) => a === b,
            bar: "I'm not a function",
          },
          html: html,
        },
        error: /Some helper is not a valid function/,
      },
    ];

    for (const test of errorTests) {
      it(`if logic is given in the template, it should throw error when ${test.label}`, async () => {
        await expect(
          makeScreenshot(page, {
            screenshot: new Screenshot(test.options),
            handlebarsHelpers: test.options.handlebarsHelpers,
          }),
        ).rejects.toThrow(test.error);
      });
    }

    // --

    const emptyHtml = compactHtml(`
      <html>
        <body>
          <h1>Hello world!</h1>
        </body>
      </html>
    `);

    const validTests = [
      {
        label: "all helpers are functions but no content is passed",
        options: {
          handlebarsHelpers: {
            equals: (a, b) => a === b,
          },
          html: html,
        },
        expectedHtml: emptyHtml,
      },
      {
        label: "all helpers are functions but content is passed as undefined",
        options: {
          content: undefined,
          handlebarsHelpers: {
            equals: (a, b) => a === b,
          },
          html: html,
        },
        expectedHtml: emptyHtml,
      },
      {
        label:
          "all helpers are functions but content has not the sought variable",
        options: {
          content: { myOtherVar: "bar" },
          handlebarsHelpers: {
            equals: (a, b) => a === b,
          },
          html: html,
        },
        expectedHtml: emptyHtml,
      },
      {
        label: "helpers and content are valid, and the condition is met",
        options: {
          content: { myVar: "foo" },
          handlebarsHelpers: {
            equals: (a, b) => a === b,
          },
          html: html,
        },
        expectedHtml: compactHtml(`
          <html>
            <body>
              <h1>Hello world!</h1>
              <div>Foo</div>
            </body>
          </html>
        `),
      },
      {
        label: "helpers and content are valid, and the condition is not met",
        options: {
          content: { myVar: "bar" },
          handlebarsHelpers: {
            equals: (a, b) => a === b,
          },
          html: html,
        },
        expectedHtml: emptyHtml,
      },
    ];

    for (const test of validTests) {
      it(`if logic is given in the template, it should not throw error when ${test.label}`, async () => {
        await expect(
          makeScreenshot(page, {
            screenshot: new Screenshot(test.options),
            handlebarsHelpers: test.options.handlebarsHelpers,
          }),
        ).resolves.not.toThrow();
      });

      it(`if logic is given in the template, it should render the expected template when ${test.label}`, async () => {
        const p = jest.fn(() => page);
        await makeScreenshot(p(), {
          screenshot: new Screenshot(test.options),
          handlebarsHelpers: test.options.handlebarsHelpers,
        });
        expect(p().setContent).toHaveBeenCalledWith(
          test.expectedHtml,
          expect.anything(),
        );
      });
    }
  });

  describe("functional tests", () => {
    it("should do conditional rendering correctly", async () => {
      await makeScreenshot(page, {
        screenshot: new Screenshot({
          html: "<html><body>{{#if (equals hello 'world')}}<div>Hello world!</div>{{/if}}</body></html>",
          content: { hello: "world" },
        }),
        handlebarsHelpers: {
          equals: (a, b) => a === b,
        },
      });

      expect(page.setContent).toHaveBeenCalledWith(
        "<html><body><div>Hello world!</div></body></html>",
        expect.anything(),
      );
    });

    it("should do conditional rendering on an array correctly", async () => {
      await makeScreenshot(page, {
        screenshot: new Screenshot({
          html: "<html><body>{{#each arr}}{{#if (shows this)}}<div>{{this.word}}</div>{{/if}}{{/each}}</body></html>",
          content: {
            arr: [
              { show: true, word: "Hi!" },
              { show: false, word: "I'm hidden!" },
              { show: true, word: "Hello!" },
            ],
          },
        }),
        handlebarsHelpers: {
          shows: (a) => a.show,
        },
      });

      expect(page.setContent).toHaveBeenCalledWith(
        "<html><body><div>Hi!</div><div>Hello!</div></body></html>",
        expect.anything(),
      );
    });

    it("should do conditional rendering with unless correctly", async () => {
      await makeScreenshot(page, {
        screenshot: new Screenshot({
          html: "<html><body>{{#unless (equals hello 'there')}}<div>Not hello world!</div>{{/unless}}</body></html>",
          content: { hello: "world" },
        }),
        handlebarsHelpers: {
          equals: (a, b) => a === b,
        },
      });

      expect(page.setContent).toHaveBeenCalledWith(
        "<html><body><div>Not hello world!</div></body></html>",
        expect.anything(),
      );
    });

    it("should do conditional rendering with unless on an array correctly", async () => {
      await makeScreenshot(page, {
        screenshot: new Screenshot({
          html: "<html><body>{{#each arr}}{{#unless (shows this)}}<div>{{{this.word}}}</div>{{/unless}}{{/each}}</body></html>",
          content: {
            arr: [
              { show: true, word: "Hi!" },
              { show: false, word: "I'm not hidden!" },
              { show: true, word: "Hello!" },
            ],
          },
        }),
        handlebarsHelpers: {
          shows: (a) => a.show,
        },
      });

      expect(page.setContent).toHaveBeenCalledWith(
        "<html><body><div>I'm not hidden!</div></body></html>",
        expect.anything(),
      );
    });

    it("should transform a string correctly", async () => {
      await makeScreenshot(page, {
        screenshot: new Screenshot({
          html: "<html><body>{{#with (upcase str) as |upstr|}}<div>{{upstr}}</div>{{/with}}</body></html>",
          content: {
            str: "Hi there",
          },
        }),
        handlebarsHelpers: {
          upcase: (a: string) => a.toUpperCase(),
        },
      });

      expect(page.setContent).toHaveBeenCalledWith(
        "<html><body><div>HI THERE</div></body></html>",
        expect.anything(),
      );
    });

    it("should transform a number correctly", async () => {
      await makeScreenshot(page, {
        screenshot: new Screenshot({
          html: "<html><body>{{#with (addTwo number) as |numPlusTwo|}}<div>{{numPlusTwo}}</div>{{/with}}</body></html>",
          content: {
            number: 5,
          },
        }),
        handlebarsHelpers: {
          addTwo: (a: number) => a + 2,
        },
      });

      expect(page.setContent).toHaveBeenCalledWith(
        "<html><body><div>7</div></body></html>",
        expect.anything(),
      );
    });

    it("should replace a character correctly", async () => {
      await makeScreenshot(page, {
        screenshot: new Screenshot({
          html: "<html><body>{{#with (fooToBar str) as |newstr|}}<div>{{newstr}}</div>{{/with}}</body></html>",
          content: {
            str: "This is foo",
          },
        }),
        handlebarsHelpers: {
          fooToBar: (a: string) => a.replace(/foo/, "bar"),
        },
      });

      expect(page.setContent).toHaveBeenCalledWith(
        "<html><body><div>This is bar</div></body></html>",
        expect.anything(),
      );
    });
  });
});
