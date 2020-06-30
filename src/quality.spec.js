const nodeHtmlToImage = require('./index.js')
const puppeteer = require('puppeteer')

describe.skip('quality', () => {
  let screenshot
  let puppeteer

  beforeEach(() => {
    puppeteer = require('puppeteer')
    screenshot = puppeteer.launch().newPage().$().screenshot
  })

  it('should not set quality option for png images', async () => {
    await nodeHtmlToImage({
      type: 'png',
      quality: 300,
      html: '<html><body>Hello world!</body></html>',
    })
    
    expect(screenshot).toHaveBeenCalledWith(expect.objectContaining({'encoding': undefined, 'omitBackground': false, 'path': undefined, 'type': 'png'}))
  })

  it('should set quality option for jpg images', async () => {
    await nodeHtmlToImage({
      type: 'jpeg',
      quality: 30,
      html: '<html><body>Hello world!</body></html>',
    })
    
    expect(screenshot).toHaveBeenCalledWith(expect.objectContaining({ quality: 30 }))
  })

  it('should set quality option to 80 by default for jpg images', async () => {
    await nodeHtmlToImage({
      type: 'jpeg',
      html: '<html><body>Hello world!</body></html>',
    })
    
    expect(screenshot).toHaveBeenCalledWith(expect.objectContaining({ quality: 80 }))
  })
})

jest.mock('puppeteer', () => {
  const screenshot = jest.fn()
  return {
    launch: () => ({
      close: jest.fn(),
      newPage: () => ({
        setContent: jest.fn(),
        close: jest.fn(),
        $: () => ({
          screenshot,
        })
      })
    })
  }
})
