import type { LaunchOptions, LoadEvent } from 'puppeteer';

/**
 * Available options to pass to the library
 */
export interface NodeHtmlToImageOptions {
    /**
     * The html used to generate image content
     */
    html: string;
    /**
     * The ouput path for generated image
     * If none is specified
     */
    output?: string;
    /**
     * The type of the generated image
     * @default png
     */
    type?: 'jpeg' | 'png';
    /**
     * The quality of the generated image (only applicable to jpg)
     * @default 80
     */
    quality?: number;
    /**
     * If provided html property is considered an handlebars template and use content value to fill it
     */
    content?: Array<unknown> | Record<string, any>;
    /**
     * Define when to consider markup succeded.
     * {@link https://github.com/puppeteer/puppeteer/blob/8370ec88ae94fa59d9e9dc0c154e48527d48c9fe/docs/api.md#pagesetcontenthtml-options Learn more}
     */
    waitUntil?: LoadEvent;
    /**
     * The puppeteerArgs property let you pass down custom configuration to puppeteer.
     * {@link https://github.com/puppeteer/puppeteer/blob/8370ec88ae94fa59d9e9dc0c154e48527d48c9fe/docs/api.md#puppeteerlaunchoptions Learn more}
     */
    puppeteerArgs?: LaunchOptions;
    /**
     * The transparent property lets you generate images with transparent background (for png type).
     */
    transparent?: boolean;
    /**
     * The encoding property of the image. Options are `binary` (default) or `base64`.
     * @default binary
     */
    encoding?: 'binary' | 'base64';
}