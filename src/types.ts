import { PuppeteerLifeCycleEvent, Page, LaunchOptions } from "puppeteer";

export type Content = Array<{ output: string; selector?: string }> | object;

export interface Options {
  html: string;
  content?: Content;
  output?: string;
  puppeteerArgs?: LaunchOptions;

  // makeScreenshot
  quality?: number;
  selector?: string;
  type?: "png" | "jpeg";
  encoding?: "base64" | "binary";
  transparent?: boolean;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
  beforeScreenshot?: (page: Page) => void;
}
