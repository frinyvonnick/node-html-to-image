# Migration guide

## v5 → v6

v6 needs a newer Node.js and changes one option. Here is what to do.

### 1. Use Node.js 22.12 or newer

v6 needs Node.js 22.12 or newer. Update Node.js on your machine and on your CI
or server before you install v6.

### 2. The default `waitUntil` is now `load`

Before, the default was `networkidle0`. Now it is `load`.

`load` waits less. It does not wait for the network to be idle. So a remote
image or font may not be ready when the image is taken.

Fix: put your images and fonts in the HTML as base64 (see the README). Or wait
for them yourself in `beforeScreenshot`:

```js
await nodeHtmlToImage({
  html: "<html><body><img src='https://example.com/logo.png' /></body></html>",
  beforeScreenshot: async (page) => {
    // wait until all images are loaded
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((image) =>
          image.complete
            ? null
            : new Promise((done) => (image.onload = image.onerror = done)),
        ),
      ),
    );
  },
});
```

### 3. TypeScript: `networkidle0` and `networkidle2` are no longer allowed

Puppeteer 25 removed these two values. In TypeScript they now give an error:

```ts
// error TS2322
await nodeHtmlToImage({ html, waitUntil: "networkidle0" });

// use this instead
await nodeHtmlToImage({ html, waitUntil: "load" });
```

At runtime the old value still works for now, but do not rely on it.

### 4. Your own puppeteer

If you pass your own `puppeteer` or `puppeteer-core`, use a version that works
with Puppeteer 25.

### Steps

1. Update Node.js to 22.12 or newer.
2. Install: `npm install node-html-to-image@6`.
3. Replace `waitUntil: "networkidle0"` (or `"networkidle2"`) with `"load"`.
4. If you needed the network wait, put your images and fonts in the HTML as
   base64, or wait for them in `beforeScreenshot`.
5. Build your project again.

Nothing else changed. All other options work the same. The package is still
CommonJS: `require` and `import` both work.
