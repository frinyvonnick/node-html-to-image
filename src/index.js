const puppeteer = require('puppeteer')
const handlebars = require('handlebars')

module.exports = async function({
  html,
  output,
  type,
  content,
  puppeteerArgs = {},
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
    html = template(content)
  } 
  await page.setContent(html)
  const elements = await page.$$('body')
  const element = elements[0]
  await element.screenshot({ path: output, type })
  await browser.close()
}
