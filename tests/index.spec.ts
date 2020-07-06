import { existsSync, promises as fsp } from 'fs';
import { resolve } from 'path';
import rimraf from 'rimraf';
import { createWorker } from 'tesseract.js';
import nodeHtmlToImage from '../src/index';

describe('node-html-to-image', () => {
  beforeEach(async () => {
    rimraf.sync(resolve(__dirname, 'generated'));
    await fsp.mkdir(resolve(__dirname, 'generated'), { recursive: true });
  });

  afterAll(() => {
    rimraf.sync(resolve(__dirname, 'generated'));
  });

  describe('single image', () => {
    it('should generate output file', async () => {
      await nodeHtmlToImage({
        output: resolve(__dirname, 'generated', 'image.png'),
        html: '<html></html>'
      });

      expect(existsSync(resolve(__dirname, 'generated', 'image.png'))).toBe(true);
    });

    it('should return a buffer', async () => {
      const result = await nodeHtmlToImage({
        html: '<html></html>'
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw an error if html is not provided', async () => {
      let error;
      try {
        // @ts-expect-error should throw
        await nodeHtmlToImage({
          output: resolve(__dirname, 'generated', 'image.png')
        });
      } catch (e) {
        error = e;
      }
      expect(error.message).toEqual(expect.stringContaining('html'));
    });

    it('should generate an jpeg image', async () => {
      await nodeHtmlToImage({
        output: resolve(__dirname, 'generated', 'image.jpg'),
        html: '<html></html>',
        type: 'jpeg'
      });

      expect(existsSync(resolve(__dirname, 'generated', 'image.jpg'))).toBe(true);
    });

    it('should put html in output file', async () => {
      await nodeHtmlToImage({
        output: resolve(__dirname, 'generated', 'image.png'),
        html: '<html><body>Hello world!</body></html>'
      });

      const text = await getTextFromImage(resolve(__dirname, 'generated', 'image.png'));
      expect(text.trim()).toBe('Hello world!');
    });

    it('should use handlebars to customize content', async () => {
      await nodeHtmlToImage({
        output: resolve(__dirname, 'generated', 'image.png'),
        html: '<html><body>Hello {{name}}!</body></html>',
        content: { name: 'Yvonnick' }
      });

      const text = await getTextFromImage(resolve(__dirname, 'generated', 'image.png'));
      expect(text.trim()).toBe('Hello Yvonnick!');
    });
  });

  describe('batch', () => {
    it('should create two images', async () => {
      await nodeHtmlToImage({
        type: 'png',
        quality: 300,
        html: '<html><body>Hello {{name}}!</body></html>',
        content: [
          { name: 'Yvonnick', output: resolve(__dirname, 'generated', 'image1.png') },
          { name: 'World', output: resolve(__dirname, 'generated', 'image2.png') }
        ]
      });

      const text1 = await getTextFromImage(resolve(__dirname, 'generated', 'image1.png'));
      expect(text1.trim()).toBe('Hello Yvonnick!');

      const text2 = await getTextFromImage(resolve(__dirname, 'generated', 'image2.png'));
      expect(text2.trim()).toBe('Hello World!');
    });

    it('should return two buffers', async () => {
      const result = await nodeHtmlToImage({
        type: 'png',
        quality: 300,
        html: '<html><body>Hello {{name}}!</body></html>',
        content: [{ name: 'Yvonnick' }, { name: 'World' }]
      });

      expect(result[0]).toBeInstanceOf(Buffer);
      expect(result[1]).toBeInstanceOf(Buffer);
    });

    it.skip('should handle mass volume well', async () => {
      jest.setTimeout(60000 * 60);
      expect.hasAssertions();
      const NUMBER_OF_IMAGES = 2000;
      const content = Array.from(Array(NUMBER_OF_IMAGES), (_, i) => ({
        name: i,
        output: resolve(__dirname, 'generated', `${i}.jpg`)
      }));

      await nodeHtmlToImage({
        type: 'png',
        quality: 300,
        html: '<html><body>Hello {{name}}!</body></html>',
        content
      });

      expect(await fsp.readdir(resolve(__dirname, 'generated'))).toHaveLength(NUMBER_OF_IMAGES);
    });
  });
});

async function getTextFromImage(path: string) {
  const worker = createWorker();
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  const {
    data: { text }
  } = await worker.recognize(path);
  await worker.terminate();

  return text;
}
