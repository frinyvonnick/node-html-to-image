import { ImageType, Encoding, Content, ScreenshotParams } from "../types";

export class Screenshot {
  output: string;
  content: Content;
  selector: string;
  html: string;
  quality?: number;
  buffer?: Buffer | string;
  type?: ImageType;
  encoding?: Encoding;
  transparent?: boolean;

  constructor(params: ScreenshotParams) {
    if (!params || !params.html) {
      throw Error("You must provide an html property.");
    }

    const {
      html,
      encoding,
      transparent = false,
      output,
      content,
      selector = "body",
      quality = 80,
      type = "png",
    } = params;

    this.html = html;
    this.encoding = encoding;
    this.transparent = transparent;
    this.type = type;
    this.output = output;
    this.content = isEmpty(content) ? undefined : content;
    this.selector = selector;
    this.quality = type === "jpeg" ? quality : undefined;
  }

  setHTML(html: string) {
    if (!html) {
      throw Error("You must provide an html property.");
    }
    this.html = html;
  }

  setBuffer(buffer: Buffer | string) {
    this.buffer = buffer;
  }
}

function isEmpty(val: object) {
  return val == null || !Object.keys(val).length;
}
