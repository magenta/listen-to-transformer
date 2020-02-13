Listen to Transformer
====================
[Piano Transformer](https://magenta.tensorflow.org/piano-transformer) is an open source machine learning model from the [Magenta](https://magenta.tensorflow.org/) research group at Google that can generate musical performances with some long-term structure. We find it interesting to see what these models can and can’t do, so we made this app to make it easier to explore and curate the model’s output.

<img width="500" alt="Screenshot of the main UI" src="https://user-images.githubusercontent.com/1369170/74384431-11659000-4da6-11ea-998e-36629cc490e7.png">

You can read more about the model in the [blog post](https://magenta.tensorflow.org/music-transformer) announcing it, the [research paper](https://arxiv.org/abs/1809.04281) it was published in, or the [blog post](https://magenta.tensorflow.org/listen-to-transformer) about this app.

## Running it locally
Clone this repo, start your favourite local dev server and navigate to the `index.html`
in your browser.

If you don't have a web server (like `http-server`) to run locally
(or don't know what this means), then you can install this project's dev dependencies
and run the `start` command:

```
git clone https://github.com/magenta/listen-to-transformer
cd listen-to-transformer
npm install
npm start  # Then navigate to http://127.0.0.1:8080/ in your browser.
```
