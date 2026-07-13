import type { Page } from "puppeteer";
import handlebars, { compile } from "handlebars";

import { MakeScreenshotParams } from "./types";

export async function makeScreenshot(
  page: Page,
  {
    screenshot,
    beforeScreenshot,
    waitUntil = "load",
    timeout,
    handlebarsHelpers,
  }: MakeScreenshotParams,
) {
  if (timeout !== undefined) {
    page.setDefaultTimeout(timeout);
  }
  const hasHelpers = handlebarsHelpers && typeof handlebarsHelpers === "object";
  if (hasHelpers) {
    if (
      Object.values(handlebarsHelpers).every((h) => typeof h === "function")
    ) {
      handlebars.registerHelper(handlebarsHelpers);
    } else {
      throw Error("Some helper is not a valid function");
    }
  }

  if (screenshot?.content || hasHelpers) {
    const template = compile(screenshot.html);
    screenshot.setHTML(template(screenshot.content));
  }

  await page.setContent(screenshot.html, { waitUntil });
  const element = await page.$(screenshot.selector);
  if (!element) {
    throw Error("No element matches selector: " + screenshot.selector);
  }

  if (typeof beforeScreenshot === "function") {
    await beforeScreenshot(page);
  }

  const result = await element.screenshot({
    path: screenshot.output,
    type: screenshot.type,
    omitBackground: screenshot.transparent,
    encoding: screenshot.encoding,
    quality: screenshot.quality,
  });

  // With `encoding: "base64"` Puppeteer returns a string; keep it as-is instead
  // of wrapping the base64 text in a Buffer.
  screenshot.setBuffer(
    typeof result === "string" ? result : Buffer.from(result),
  );

  return screenshot;
}
