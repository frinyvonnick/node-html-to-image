const makeImage = require('./src/index.js')

makeImage({
  output: './image.png',
  puppeteerArgs: {
    defaultViewport: {
      width: 320,
      height: 512,
    },
  },
  html: `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"
        integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
    <title>Post Card</title>
</head>
<style>
    body {
          width: 320px;
          height: 512px;
    }
</style>
<style>
    .row {
        margin-right: 0;
    }
    .background {
        background-image: url(https://yeebaa-uploads-staging.s3.eu-west-1.amazonaws.com/templates/backgrounds/97089/419a5/093e9/4f8e7/5144c/1492f/bdc27/ac952/5745b/91ba7/60f69/019b9/d588.png);
        background-position: inherit;
        background-repeat: no-repeat;
        background-size: 320px 512px;
        height: 512px;
        width: 320px;
    }

    .input,
    .input {
        position: absolute;
        background-color: rgb(0, 0, 0, 0);
        border: none;
        border-bottom: 1px solid white;
        width: 220px;
        color: #000000;
        text-align: center;
    }

    
    .to-input {
        left: 50px;
        top: 30px;
        font-size: 20px;
    }
    
    .from-input {
        left: 50px;
        top: 420px;
        font-size: 20px;
    }
</style>
<body>
    <div class="row">
        <div class="col-lg-4 col-md-4 col-1"></div>
        <div class="col-lg-4 col-md-4 col-11">
            <div class="background">
                <form>
                                <input class="input to-input" name="to" id="to" type="text" value="osama">
                                <input class="input from-input" name="from" id="from" type="text" value="nisreen">
                </form>
            </div>
        </div>
        <div class="col-lg-4 col-md-4"></div>
    </div>
</body>

</html>
  `
})
