const nodeHtmlToImage = require('./src/index.js')

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body>Hello world 🙌!</body></html>'
})
  .then(() => console.log('The image was created successfully!'))
