const puppeteer = require('puppeteer')
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

  const browser = await puppeteer.launch({ ...puppeteerArgs, headless: true })

  const shouldBatch = Array.isArray(content)
  const contents = shouldBatch ? content : [{ ...content, output }]

  const buffers = await Promise.all(contents.map(content => {
    const { output, ...pageContent } = content
    return makeScreenshot(browser, { ...options, content: pageContent, output })
  }))

  await browser.close()

  return shouldBatch ? buffers : buffers[0]
}

async function makeScreenshot(browser, {
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

  const page = await browser.newPage()
  if (content) {
    const template = handlebars.compile(html)
    html = template(content, { waitUntil })
  }
  await page.setContent(html)
  const element = await page.$('body')
  const buffer = await element.screenshot({ path: output, type, omitBackground: transparent, encoding, ...screeshotArgs })

  return buffer
}
