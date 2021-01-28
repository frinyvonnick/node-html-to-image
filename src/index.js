const puppeteer = require('puppeteer')
const { Cluster } = require('puppeteer-cluster')
const { makeScreenshot } = require('./screenshot.js')

module.exports = function(options) {
  let instance = {};

  const {
    puppeteerArgs = {},
  } = options;

  const _cp = Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteerOptions: { ...puppeteerArgs, headless: true },
  });

  instance.shutdown = async () => {
    const _cluster = await _cp;
    await _cluster.close();
  }

  instance.render = async (renderOpts) => {
    const {
      html,
      content,
      output,
    } = renderOpts;

    if (!html) {
      throw Error('You must provide an html property.')
    }

    let buffers = [];

    const _cluster = await _cp;
    await _cluster.task(async ({ page, data: { content, output } }) => {
      const buffer = await makeScreenshot(page, { ...renderOpts, content, output })
      buffers.push(buffer);
    });

    const shouldBatch = Array.isArray(content)
    const contents = shouldBatch ? content : [{ ...content, output }]

    let promises = [];

    contents.forEach(content => {
      const { output, ...pageContent } = content;
      promises.push(_cluster.execute({ output, content: pageContent }));
    })

    await Promise.all(promises);
    return shouldBatch ? buffers : buffers[0];
  };

  return instance;
}
