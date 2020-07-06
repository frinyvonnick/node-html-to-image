// @ts-ignore
const puppeteer = require('puppeteer');
import type { Page } from 'puppeteer';
import makeScreenshot from '../src/screenshot';

jest.mock('puppeteer', () => {
  const screenshot = jest.fn();
  return {
    launch: () => ({
      close: jest.fn(),
      newPage: () => ({
        setContent: jest.fn(),
        close: jest.fn(),
        $: () => ({
          screenshot
        })
      })
    })
  };
});

describe('Screenshot', () => {
  describe('quality', () => {
    let screenshot: ReturnType<Page['screenshot']>;
    let puppeteer: any;
    let page: Page;

    beforeEach(() => {
      puppeteer = require('puppeteer');
      page = puppeteer.launch().newPage();
      screenshot = (page.$('body') as any).screenshot;
    });

    it('should not set quality option for png images', async () => {
      await makeScreenshot(page, {
        type: 'png',
        quality: 300,
        html: '<html><body>Hello world!</body></html>'
      });

      expect(screenshot).toHaveBeenCalledWith(
        expect.objectContaining({ encoding: undefined, omitBackground: false, path: undefined, type: 'png' })
      );
    });

    it('should set quality option for jpg images', async () => {
      await makeScreenshot(page, {
        type: 'jpeg',
        quality: 30,
        html: '<html><body>Hello world!</body></html>'
      });

      expect(screenshot).toHaveBeenCalledWith(expect.objectContaining({ quality: 30 }));
    });

    it('should set quality option to 80 by default for jpg images', async () => {
      await makeScreenshot(page, {
        type: 'jpeg',
        html: '<html><body>Hello world!</body></html>'
      });

      expect(screenshot).toHaveBeenCalledWith(expect.objectContaining({ quality: 80 }));
    });
  });
});
