const puppeteer = require('puppeteer')
const { Cluster } = require('puppeteer-cluster')

const { makeScreenshot } = require('./screenshot.js')

module.exports = async function(options) {
  const {
    html,
    content,
    output,
    selector = 'body',
    puppeteerArgs = {},
  } = options

  if (!html) {
    throw Error('You must provide an html property.')
  }

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteerOptions: { ...puppeteerArgs, headless: true },
  });

  let buffers = []

  await cluster.task(async ({ page, data: { content, output, selector } }) => {
    const buffer = await makeScreenshot(page, { ...options, content, output, selector })

    buffers.push(buffer);
  });

  const shouldBatch = Array.isArray(content)
  const contents = shouldBatch ? content : [{ ...content, output }]

  contents.forEach(content => {
    const { output, ...pageContent } = content
    cluster.queue({ output, content: pageContent, selector })
  })

  await cluster.idle();
  await cluster.close();

  return shouldBatch ? buffers : buffers[0]
}

