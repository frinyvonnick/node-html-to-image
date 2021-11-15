import { describe } from "jest-circus";
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-ignore
import puppeteer from "puppeteer";
/* eslint-enable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
import { makeScreenshot } from "./screenshot";

describe("quality", () => {
  let screenshot;
  let puppeteer;
  let page;

  beforeEach(() => {
    puppeteer = require("puppeteer");
    page = puppeteer.launch().newPage();
    screenshot = page.$().screenshot;
  });

  it("should not set quality option for png images", async () => {
    await makeScreenshot(page, {
      type: "png",
      quality: 300,
      html: "<html><body>Hello world!</body></html>",
    });

    expect(screenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        encoding: undefined,
        omitBackground: false,
        path: undefined,
        type: "png",
      })
    );
  });

  it("should set quality option for jpg images", async () => {
    await makeScreenshot(page, {
      type: "jpeg",
      quality: 30,
      html: "<html><body>Hello world!</body></html>",
    });

    expect(screenshot).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 30 })
    );
  });

  it("should set quality option to 80 by default for jpg images", async () => {
    await makeScreenshot(page, {
      type: "jpeg",
      html: "<html><body>Hello world!</body></html>",
    });

    expect(screenshot).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 80 })
    );
  });
});

describe("beforeScreenshot", () => {
  let puppeteer;
  let page;

  beforeEach(() => {
    puppeteer = require("puppeteer");
    page = puppeteer.launch().newPage();
  });

  it("beforeScreenshot is called with page", async () => {
    const beforeScreenshot = jest.fn();
    await makeScreenshot(page, {
      beforeScreenshot,
      html: "<html><body>Hello world!</body></html>",
    });

    expect(beforeScreenshot).toHaveBeenCalledWith(page);
  });
});

jest.mock("puppeteer", () => {
  const screenshot = jest.fn();
  return {
    launch: () => ({
      close: jest.fn(),
      newPage: () => ({
        setContent: jest.fn(),
        close: jest.fn(),
        $: () => ({
          screenshot,
        }),
      }),
    }),
  };
});
