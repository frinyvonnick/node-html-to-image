/// <reference types="node" />

import { NodeHtmlToImageOptions } from './options';

/**
 * `node-html-to-image` takes a screenshot of the body tag's content.
 * @param options Options to pass to the generatorr
 */
declare function nodeHtmlToImage(options: NodeHtmlToImageOptions): Promise<string | Buffer | (string | Buffer)[]>;
export default nodeHtmlToImage;
export * from './options';