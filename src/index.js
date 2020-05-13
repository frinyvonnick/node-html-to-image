const puppeteer = require('puppeteer')
const handlebars = require('handlebars')

module.exports = async function({
  html,
  output,
  type,
  content,
  quality = 80, // only applicable for jpg
  waitUntil = 'load',
  transparent = false,
  puppeteerArgs = {},
  encoding
}) {
  if (!html) {
    throw Error('You must provide an html property.')
  }
  if (!output) {
    throw Error('You must provide an output property.')
  }
  const browser = await puppeteer.launch({ ...puppeteerArgs, headless: true })
  const page = await browser.newPage()
  if (content) {
    const template = handlebars.compile(html)
    html = template(content, { waitUntil })
  }
  await page.setContent(html)
  const element = await page.$('body')
  const buffer = await element.screenshot({ path: output, type, quality, omitBackground: transparent, encoding })
  await browser.close()
  return buffer
}
