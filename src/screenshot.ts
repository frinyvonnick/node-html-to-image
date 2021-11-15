import { Page } from "puppeteer";
import { compile } from "handlebars";

import { Options } from "./types";

export async function makeScreenshot(
  page: Page,
  {
    output,
    type,
    quality,
    encoding,
    content,
    html,
    selector,
    beforeScreenshot,
    transparent = false,
    waitUntil = "networkidle0",
  }: Options
) {
  const screenshotArgs: { quality?: number } = {};
  if (type === "jpeg") {
    screenshotArgs.quality = quality ? quality : 80;
  }

  if (content) {
    const template = compile(html);
    html = template(content);
  }
  await page.setContent(html, { waitUntil });
  const element = await page.$(selector);
  if (!element) {
    throw Error("No element matches selector: " + selector);
  }
  if (beforeScreenshot && typeof beforeScreenshot === "function") {
    await beforeScreenshot(page);
  }

  return element.screenshot({
    path: output,
    type,
    omitBackground: transparent,
    encoding,
    ...screenshotArgs,
  });
}
