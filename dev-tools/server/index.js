import express, { urlencoded } from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
const port = 3000;
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import captureStory, {checkIfFileExists, getExpectedImage} from '../snapshot.js';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { launch } from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const browser = launch();
process.on('exit', async function () {
  console.log(">>EXIT")
  await (await browser).close();
});

const pngMimetype = 'img/png';

app.get('/checkStory', (req, res) => {
  captureStory(req.query.id, browser).then((captureData) => res.send(captureData));
});

app.get('/checkStory/*/detector.wasm', (req, res) => {
  res.sendFile(`${__dirname}/cv-wasm_browser.wasm`);
});

app.get('/checkStory/*/worker.js', (req, res) => {
  res.sendFile(`${__dirname}/worker.js`);
});

const getLocalImageBuffer = async (req)=> {
  const urlParams = new URLSearchParams(req.headers.referer);
  const storySnapshot = await captureStory(urlParams.get('storyId'), browser)
  const localImageBuffer = storySnapshot?.snapshot?.buffer?.local
  return localImageBuffer
}

app.get('/checkStory/*/expected/img.png', async (req, res) => {
  const snapShotPath = req.params[0];
  const localImageBuffer = await getLocalImageBuffer(req)
  const result = getExpectedImage(snapShotPath, 'main', localImageBuffer);
  res.send(result);
});

app.get('/checkStory/*/actual/img.png', async(req, res) => {
  const localImageBuffer = await getLocalImageBuffer(req)
  if (!localImageBuffer) res.send("No file")
  res.send(localImageBuffer);
});

app.get('/checkStory/*/diff/img.png', async(req, res) => {
  const snapShotPath = req.params[0]
  const localImageBuffer = await getLocalImageBuffer(req)
  const actual = PNG.sync.read(localImageBuffer);
  const expected = PNG.sync.read(getExpectedImage(snapShotPath, 'main', localImageBuffer));
  const { width, height } = actual;
  const diff = new PNG({ width, height });
  pixelmatch(actual.data, expected.data, diff.data, width, height, { threshold: 0.1 });
  res.contentType(pngMimetype);
  res.send(PNG.sync.write(diff));
});

app.get('/checkStory/*', (req, res) => {
  res.sendFile(`${__dirname}/compare.html`);
});

app.listen(port, () => {
  console.log(`Story diff server listening on port ${port}`);
});
