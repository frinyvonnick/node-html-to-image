<h1 align="center">Welcome to node-html-to-image 👋</h1>
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

This module exposes a function that generates images (png, jpeg) from HTML. It uses puppeteer in headless mode to achieve it. Additionally, it embarks [handlebars](https://handlebarsjs.com/) to provide a way to add logic in your HTML.

## Install

```sh
npm install node-html-to-image
# or
yarn add node-html-to-image
```

## Usage

```js
const nodeHtmlToImage = require('node-html-to-image')

async function makeNiceImage() {
  await nodeHtmlToImage({
    output: './image.png',
    html: '<html><body>Hello world!</body></html>'
  })
}
```

### Options

List of all available options:

| option                  | description                                                                                     | type                       | required    |
|-------------------------|-------------------------------------------------------------------------------------------------|----------------------------|-------------|
| ouput                   | The ouput path for generated image                                                              | string                     | required    |
| html                    | The html used to generate image content                                                         | string                     | required    |
| type                    | The type of the generated image                                                                 | jpeg or png (default: png) | optional    |
| content                 | If provided html property is considered an handlebars template and use content value to fill it | object                     | optional    |

### Example with handlebars

```js
const nodeHtmlToImage = require('node-html-to-image')

async function makeNiceImage() {
  await nodeHtmlToImage({
    output: './image.png',
    html: '<html><body>Hello {{name}}!</body></html>'
    content: { name: 'you' }
  })
}
```

## Run tests

You need to install tesseract on your computer before launching tests. Here is the procedure for Mac users:

```sh
brew install tesseract
brew install tesseract-lang
```

Launch test:

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
