/// <reference types="node" />
import type { Page } from 'puppeteer';
import type { NodeHtmlToImageOptions } from './options';

declare function makeScreenshot(page: Page, { output, type, quality, encoding, content, html, beforeScreenshot, transparent, waitUntil }: NodeHtmlToImageOptions): Promise<string | Buffer>;
export default makeScreenshot;