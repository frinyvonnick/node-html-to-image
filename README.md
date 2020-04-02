<h1 align="center">Welcome to node-html-to-image 🌄</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/frinyvonnick/node-html-to-image#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/frinyvonnick/node-html-to-image/blob/master/LICENSE" target="_blank">
    <img alt="License: Apache--2.0" src="https://img.shields.io/badge/License-Apache--2.0-yellow.svg" />
  </a>
  <a href="https://twitter.com/yvonnickfrin" target="_blank">
    <img alt="Twitter: yvonnickfrin" src="https://img.shields.io/twitter/follow/yvonnickfrin.svg?style=social" />
  </a>
</p>

> A Node.js library that generates images from HTML

### 🏠 [Homepage](https://github.com/frinyvonnick/node-html-to-image)


## Description

This module exposes a function that generates images (png, jpeg) from HTML. It uses puppeteer in headless mode to achieve it. Additionally, it embarks [Handlebars](https://handlebarsjs.com/) to provide a way to add logic in your HTML.

## Install

```sh
npm install node-html-to-image
# or
yarn add node-html-to-image
```

## Usage

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body>Hello world!</body></html>'
})
  .then(() => console.log('The image was created successfully!'))
```

### Options

List of all available options:

| option                  | description                                                                                     | type                       | required    |
|-------------------------|-------------------------------------------------------------------------------------------------|----------------------------|-------------|
| ouput                   | The ouput path for generated image                                                              | string                     | required    |
| html                    | The html used to generate image content                                                         | string                     | required    |
| type                    | The type of the generated image                                                                 | jpeg or png (default: png) | optional    |
| content                 | If provided html property is considered an handlebars template and use content value to fill it | object                     | optional    |
| waitUntil               | Define when to consider markup succeded. [Learn more](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagesetcontenthtml-options).                                                        | string or Array<string>    | optional    |
| puppeteerArgs           | The puppeteerArgs property let you pass down custom configuration to puppeteer. [Learn more](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).                  | object                     | optional    |
| transparent             | The transparent property let you generate images with transparent background (for png type).    | boolean                    | optional    |

### Setting output image resolution

`node-html-to-image` takes a screenshot of the body tag's content. If you want to set output image's resolution you need to set its dimension using CSS like in the following example.

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  html: `<html>
    <head>
      <style>
        body {
          width: 2480px;
          height: 3508px;
        }
      <style>
      </style>
    </head>
    <body>Hello world!</body>
  </html>
  `
})
  .then(() => console.log('The image was created successfully!'))
```

### Example with Handlebars

[Handlerbars](https://handlebarsjs.com/) is a templating language. It generates HTML from a template and an input object. In the following example we provide a template to `node-html-to-image` and a content object to fill the template.

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body>Hello {{name}}!</body></html>',
  content: { name: 'you' }
})
  .then(() => console.log('The image was created successfully!'))
```

[Handlebars](https://handlebarsjs.com/) provides a lot of expressions to handle common use cases like conditions or loops.

### Dealing with images

If you want to display an image which is stored remotely do it as usual. In case your image is stored locally I recommend having your image in `base64`. Then you need to pass it to the template with the content property. Here is an example:

```js
const nodeHtmlToImage = require('node-html-to-image')
const fs = require('fs');

const image = fs.readFileSync('./image.jpg');
const base64Image = new Buffer.from(image).toString('base64');
const dataURI = 'data:image/jpeg;base64,' + base64Image

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body><img src="{{imageSource}}" /></body></html>',
  content: { imageSource: dataURI }
})
```

## Related

- [node-html-to-image-cli](https://github.com/frinyvonnick/node-html-to-image-cli) - CLI for this module

## Run tests

```sh
yarn test
```

## Author

👤 **FRIN Yvonnick <frin.yvonnick@gmail.com>**

* Website: [https://yvonnickfrin.dev](https://yvonnickfrin.dev)
* Twitter: [@yvonnickfrin](https://twitter.com/yvonnickfrin)
* Github: [@frinyvonnick](https://github.com/frinyvonnick)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/frinyvonnick/node-html-to-image/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [FRIN Yvonnick <frin.yvonnick@gmail.com>](https://github.com/frinyvonnick).<br />
This project is [Apache--2.0](https://github.com/frinyvonnick/node-html-to-image/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
