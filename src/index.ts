import { Cluster } from "puppeteer-cluster";

import { Options } from "./types";
import { makeScreenshot } from "./screenshot";

export default async function (options: Options) {
  const {
    html,
    content,
    output,
    selector = "body",
    puppeteerArgs = {},
  } = options;

  if (!html) {
    throw Error("You must provide an html property.");
  }

  const cluster: Cluster<{
    content: object;
    output: string;
    selector: string;
  }> = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteerOptions: { ...puppeteerArgs, headless: true },
  });

  const buffers: Array<Buffer | string> = [];

  await cluster.task(async ({ page, data: { content, output, selector } }) => {
    const buffer = await makeScreenshot(page, {
      ...options,
      content,
      output,
      selector,
    });
    buffers.push(buffer);
  });

  cluster.on("taskerror", (err) => {
    throw err;
  });

  const shouldBatch = Array.isArray(content);
  const contents = shouldBatch ? content : [{ ...content, output, selector }];

  contents.forEach((content) => {
    const { output, selector: contentSelector, ...pageContent } = content;
    cluster.queue({
      output,
      content: pageContent,
      selector: contentSelector ? contentSelector : selector,
    });
  });

  await cluster.idle();
  await cluster.close();

  return shouldBatch ? buffers : buffers[0];
}
