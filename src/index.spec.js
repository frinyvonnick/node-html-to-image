const fs = require('fs')
const { createWorker } = require('tesseract.js')

const nodeHtmlToImage = require('./index.js')

describe('node-html-to-image', () => {
  afterEach(() => {
    if (fs.existsSync('./image.jpg'))
      fs.unlinkSync('./image.jpg')
    if (fs.existsSync('./image.png'))
      fs.unlinkSync('./image.png')
  })

  it('should generate output file', async () => {
    await nodeHtmlToImage({
      output: './image.png',
      html: '<html></html>'
    })

    expect(fs.existsSync('./image.png')).toBe(true)
  })

  it('should return a buffer', async () => {
    const result = await nodeHtmlToImage({
      html: '<html></html>'
    })

    expect(result).toBeInstanceOf(Buffer)
  })

  it('should throw an error if html is not provided', async () => {
    let error
    try {
      await nodeHtmlToImage({
        output: './image.png',
      })
    } catch (e) {
      error = e
    }
    expect(error.message).toEqual(expect.stringContaining('html'))
  })

  it('should generate an jpeg image', async () => {
    await nodeHtmlToImage({
      output: './image.jpg',
      html: '<html></html>',
      type: 'jpeg',
    })

    expect(fs.existsSync('./image.jpg')).toBe(true)
  })

  it('should put html in output file', async () => {
    await nodeHtmlToImage({
      output: './image.png',
      html: '<html><body>Hello world!</body></html>'
    })

    const text = await getTextFromImage('./image.png')
    expect(text.trim()).toBe('Hello world!')
  })

  it('should use handlebars to customize content', async () => {
    await nodeHtmlToImage({
      output: './image.png',
      html: '<html><body>Hello {{name}}!</body></html>',
      content: { name: 'Yvonnick' }
    })

    const text = await getTextFromImage('./image.png')
    expect(text.trim()).toBe('Hello Yvonnick!')
  })
})

describe('batch', () => {
  it('should create two images', async () => {
    await nodeHtmlToImage({
      type: 'png',
      quality: 300,
      html: '<html><body>Hello {{name}}!</body></html>',
      content: [{ name: 'Yvonnick', output: './image1.png' }, { name: 'World', output: './image2.png' }]
    })

    const text1 = await getTextFromImage('./image1.png')
    expect(text1.trim()).toBe('Hello Yvonnick!')

    const text2 = await getTextFromImage('./image2.png')
    expect(text2.trim()).toBe('Hello World!')
  })

  it('should return two buffer', async () => {
    const result = await nodeHtmlToImage({
      type: 'png',
      quality: 300,
      html: '<html><body>Hello {{name}}!</body></html>',
      content: [{ name: 'Yvonnick' }, { name: 'World' }]
    })

    expect(result[0]).toBeInstanceOf(Buffer)
    expect(result[1]).toBeInstanceOf(Buffer)
  })

})

async function getTextFromImage(path) {
  const worker = createWorker()
  await worker.load()
  await worker.loadLanguage('eng')
  await worker.initialize('eng')

  const { data: { text } } = await worker.recognize(path);
  await worker.terminate();

  return text
}
