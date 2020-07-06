import { Cluster } from 'puppeteer-cluster';
import type { NodeHtmlToImageOptions } from './options';
import makeScreenshot from './screenshot';

/**
 * `node-html-to-image` takes a screenshot of the body tag's content.
 * @param options Options to pass to the generatorr
 */
async function nodeHtmlToImage(options: NodeHtmlToImageOptions) {
  const { html, content, output, puppeteerArgs = {} } = options;

  if (!html) {
    throw Error('You must provide an html property.');
  }

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteerOptions: { ...puppeteerArgs, headless: true }
  });

  let buffers: Array<string | Buffer> = [];

  await cluster.task(async ({ page, data: { content, output } }) => {
    const buffer = await makeScreenshot(page, { ...options, content, output });

    buffers.push(buffer);
  });

  const contents: any[] = Array.isArray(content) ? content : [{ ...(content ?? {}), output }];

  for (const content of contents) {
    const { output, ...pageContent } = content;
    cluster.queue({ output, content: pageContent });
  }

  await cluster.idle();
  await cluster.close();

  return Array.isArray(content) ? buffers : buffers[0];
}

// CommonJS and ESM exports for nodeHtmlToImage
export default nodeHtmlToImage;
exports = nodeHtmlToImage;
module.exports = nodeHtmlToImage;

// Re-export options
export * from './options';

