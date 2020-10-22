const puppeteer = require('puppeteer')
const { Cluster } = require('puppeteer-cluster')

const { makeScreenshot } = require('./screenshot.js')

module.exports = async function(options) {
  const {
    html,
    content,
    output,
    element = 'body',
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

  await cluster.task(async ({ page, data: { content, output , element } }) => {
    const buffer = await makeScreenshot(page, { ...options, content, output, element})

    buffers.push(buffer);
  });

  const shouldBatch = Array.isArray(content)
  const contents = shouldBatch ? content : [{ ...content, output, element }]

  contents.forEach(content => {
    const { output, element, ...pageContent} = content
    cluster.queue({ output, element, content: pageContent })
  })

  await cluster.idle();
  await cluster.close();

  return shouldBatch ? buffers : buffers[0]
}