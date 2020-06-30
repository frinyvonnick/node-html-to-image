const puppeteer = require('puppeteer')
const { Cluster } = require('puppeteer-cluster')
const handlebars = require('handlebars')

module.exports = async function(options) {
  const {
    html,
    content,
    output,
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

  await cluster.task(async ({ page, data: { content, output } }) => {
    const buffer = await makeScreenshot(page, { ...options, content, output })

    buffers.push(buffer);
  });

  const shouldBatch = Array.isArray(content)
  const contents = shouldBatch ? content : [{ ...content, output }]

  contents.forEach(content => {
    const { output, ...pageContent } = content
    cluster.queue({ output, content: pageContent })
  })

  await cluster.idle();
  await cluster.close();

  return shouldBatch ? buffers : buffers[0]
}

async function makeScreenshot(page, {
  output,
  type,
  quality,
  encoding,
  content,
  html,
  transparent = false,
  waitUntil = 'load',
}) {
  let screeshotArgs = {}
  if (type === 'jpeg') {
    screeshotArgs.quality = quality ? quality : 80
  }

  if (content) {
    const template = handlebars.compile(html)
    html = template(content, { waitUntil })
  }
  await page.setContent(html)
  const element = await page.$('body')
  const buffer = await element.screenshot({ path: output, type, omitBackground: transparent, encoding, ...screeshotArgs })

  return buffer
}
