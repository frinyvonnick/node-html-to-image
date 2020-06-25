const puppeteer = require('puppeteer')
const handlebars = require('handlebars')

module.exports = async function(options) {
  const {
    html,
    content,
    puppeteerArgs = {},
  } = options

  if (!html) {
    throw Error('You must provide an html property.')
  }

  if (Array.isArray(content)) {
    const browser = await puppeteer.launch({ ...puppeteerArgs, headless: true })

    const buffers = await Promise.all(content.map(c => {
      const { output, ...pageContent } = c
      return makeScreenshot(browser, { ...options, content: pageContent, output })
    }))

    await browser.close()
    return buffers
  }

  const browser = await puppeteer.launch({ ...puppeteerArgs, headless: true })
  const buffer = await makeScreenshot(browser, options)
  await browser.close()
  return buffer
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
