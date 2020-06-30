const handlebars = require('handlebars')

module.exports = {
  makeScreenshot: async function(page, {
    output,
    type,
    quality,
    encoding,
    content,
    html,
    transparent = false,
    waitUntil = 'networkidle0',
  }) {
    let screeshotArgs = {}
    if (type === 'jpeg') {
      screeshotArgs.quality = quality ? quality : 80
    }

    if (content) {
      const template = handlebars.compile(html)
      html = template(content)
    }
    await page.setContent(html, { waitUntil })
    const element = await page.$('body')
    const buffer = await element.screenshot({ path: output, type, omitBackground: transparent, encoding, ...screeshotArgs })

    return buffer
  }
}
