const fs = require('fs')
const rimraf = require('rimraf')
const { createWorker } = require('tesseract.js')

const nodeHtmlToImage = require('./index.js')

describe('node-html-to-image', () => {
  beforeEach(() => {
    rimraf.sync('./generated')
    fs.mkdirSync('./generated')
  })

  describe('single image', () => {
    it('should generate output file', async () => {
      await nodeHtmlToImage({
        output: './generated/image.png',
        html: '<html></html>'
      })

      expect(fs.existsSync('./generated/image.png')).toBe(true)
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
          output: './generated/image.png',
        })
      } catch (e) {
        error = e
      }
      expect(error.message).toEqual(expect.stringContaining('html'))
    })

    it('should generate an jpeg image', async () => {
      await nodeHtmlToImage({
        output: './generated/image.jpg',
        html: '<html></html>',
        type: 'jpeg',
      })

      expect(fs.existsSync('./generated/image.jpg')).toBe(true)
    })

    it('should put html in output file', async () => {
      await nodeHtmlToImage({
        output: './generated/image.png',
        html: '<html><body>Hello world!</body></html>'
      })

      const text = await getTextFromImage('./generated/image.png')
      expect(text.trim()).toBe('Hello world!')
    })

    it('should use handlebars to customize content', async () => {
      await nodeHtmlToImage({
        output: './generated/image.png',
        html: '<html><body>Hello {{name}}!</body></html>',
        content: { name: 'Yvonnick' }
      })

      const text = await getTextFromImage('./generated/image.png')
      expect(text.trim()).toBe('Hello Yvonnick!')
    })
  })

  describe('batch', () => {
    it('should create two images', async () => {
      await nodeHtmlToImage({
        type: 'png',
        quality: 300,
        html: '<html><body>Hello {{name}}!</body></html>',
        content: [{ name: 'Yvonnick', output: './generated/image1.png' }, { name: 'World', output: './generated/image2.png' }]
      })

      const text1 = await getTextFromImage('./generated/image1.png')
      expect(text1.trim()).toBe('Hello Yvonnick!')

      const text2 = await getTextFromImage('./generated/image2.png')
      expect(text2.trim()).toBe('Hello World!')
    })

    it('should return two buffers', async () => {
      const result = await nodeHtmlToImage({
        type: 'png',
        quality: 300,
        html: '<html><body>Hello {{name}}!</body></html>',
        content: [{ name: 'Yvonnick' }, { name: 'World' }]
      })

      expect(result[0]).toBeInstanceOf(Buffer)
      expect(result[1]).toBeInstanceOf(Buffer)
    })

    it.skip('should handle mass volume well', async () => {
      jest.setTimeout(60000 * 60)
      expect.hasAssertions();
      const NUMBER_OF_IMAGES = 2000;
      const content = Array.from(Array(NUMBER_OF_IMAGES), (_, i) => ({
        name: i,
        output: `./generated/${i}.jpg`,
      }));

      await nodeHtmlToImage({
        type: 'png',
        quality: 300,
        html: '<html><body>Hello {{name}}!</body></html>',
        content,
      })

      expect(fs.readdirSync('./generated')).toHaveLength(NUMBER_OF_IMAGES)
    })
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
