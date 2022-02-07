import { PuppeteerLifeCycleEvent, Page, LaunchOptions } from "puppeteer";
import { Screenshot } from "./models/Screenshot";

export type Content = Array<{ output: string; selector?: string }> | object;
export type Encoding = "base64" | "binary";
export type ImageType = "png" | "jpeg";

export interface ScreenshotParams {
  html: string;
  encoding?: Encoding;
  transparent?: boolean;
  type?: ImageType;
  quality?: number;
  selector?: string;
  content?: Content;
  output?: string;
}

export interface Options extends ScreenshotParams {
  puppeteerArgs?: LaunchOptions;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
  beforeScreenshot?: (page: Page) => void;
}

export interface MakeScreenshotParams {
  screenshot: Screenshot;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
  beforeScreenshot?: (page: Page) => void;
}
