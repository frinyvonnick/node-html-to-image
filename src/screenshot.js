const handlebars = require('handlebars')

module.exports = {
  makeScreenshot: async function (page, {
    output,
    type,
    quality,
    encoding,
    content,
    html,
    beforeScreenshot,
    element,
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
    const htmlElement = await page.$(element)
    if (beforeScreenshot && typeof beforeScreenshot === "function") {
      await beforeScreenshot(page);
    }
    const buffer = await htmlElement.screenshot({ path: output, type, omitBackground: transparent, encoding, ...screeshotArgs })

    return buffer
  }
}
