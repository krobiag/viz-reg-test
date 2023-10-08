import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
const port = 3000;
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import captureStory from '../snapshot.js';
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

const checkIfFileExists = (file) => {
  return fs.existsSync(file)
}

const getExpectedImage = (snapShotPath, parentBranch = 'ahmed-playground') => {
  try {
    return execSync(`git show ${parentBranch}:./${snapShotPath}.png`);
  } catch (error) {
    console.log(">>ERROR > getExpectedImage", error)
    return ""
    
  }
}
  

app.get('/checkStory/*/expected/img.png', (req, res) => {
  // TODO list branches later in tool
  console.log('>>11111');
  const snapShotPath = req.path.substring(12, req.path.length - 17);
  res.contentType(pngMimetype);
  res.send(getExpectedImage(snapShotPath, 'main'));
});

app.get('/checkStory/*/actual/img.png', (req, res) => {
  console.log('>>22222');
  const snapShotPath = req.path.substring(12, req.path.length - 15);
  const imageFile = `${snapShotPath}.png`
  
  if (!checkIfFileExists(imageFile)) res.send("No file")
  res.sendFile(imageFile, { root: '.' });
});

app.get('/checkStory/*/diff/img.png', (req, res) => {
  console.log('>>333');
  const snapShotPath = req.path.substring(12, req.path.length - 13);
  const actual = PNG.sync.read(readFileSync(`${snapShotPath}.png`));

  const expected = PNG.sync.read(getExpectedImage(snapShotPath));

  const { width, height } = actual;
  const diff = new PNG({ width, height });
  pixelmatch(actual.data, expected.data, diff.data, width, height, { threshold: 0.1 });

  res.contentType(pngMimetype);
  res.send(PNG.sync.write(diff));
});

app.get('/checkStory/*', (req, res) => {
  console.log('>>444', `${__dirname}/compare.html`);
  res.sendFile(`${__dirname}/compare.html`);
});

app.listen(port, () => {
  console.log(`Story diff server listening on port ${port}`);
});
