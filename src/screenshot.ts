import handlebars from 'handlebars';
import type { Page, ScreenshotOptions } from 'puppeteer';
import { NodeHtmlToImageOptions } from './options';

async function makeScreenshot(
  page: Page,
  {
    output,
    type,
    quality,
    encoding,
    content,
    html,
    transparent = false,
    waitUntil = 'networkidle0'
  }: NodeHtmlToImageOptions
) {
  let screenshotArgs: Partial<ScreenshotOptions> = {};

  if (type === 'jpeg') {
    screenshotArgs.quality = quality ?? 80;
  }

  if (content) {
    const template = handlebars.compile(html);
    html = template(content);
  }

  await page.setContent(html, { waitUntil });
  const element = await page.$('body');
  const buffer = await element!.screenshot({
    path: output,
    type,
    omitBackground: transparent,
    encoding,
    ...screenshotArgs
  });

  return buffer;
}

// CommonJS and ESM exports for the screenshot function
export default makeScreenshot;
exports = makeScreenshot;
module.exports = makeScreenshot;
