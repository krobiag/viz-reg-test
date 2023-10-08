// const fs = require('fs');
// const YAML = require('yaml');

import fs from 'fs'
import YAML from 'yaml'

const captureStory = async (storyId, browserPromise, pagePromise) => {
  console.log(`Capturing story for id: ${storyId}`);
  const start = Date.now();
  const browser = await browserPromise;
  const page = pagePromise ? await pagePromise : await browser.newPage();
  const storyUrl = `http://localhost:6006/iframe.html?globals=backgrounds.grid:!false&id=${storyId}&viewMode=story`;
  await page.goto(storyUrl);
  // add event listener and wait for event to fire before returning
  await page.evaluate(function () {

    return new Promise(function (resolve) {
      document.body.addEventListener('__interactions_done__', function (e) {
        resolve(e.detail); // resolves when the event fires
      });
    });
  });
  await new Promise((r) => setTimeout(r, 0.2 * 1000));
  const testData = await page.evaluate(function () {
    return window['__TEST_DATA__'];
  });
  const snapShotPath =
    testData.fileName
      .split('/')
      .reverse()
      .filter((_, i) => i !== 0)
      .reverse()
      .join('/') + '/__snapshots__';
  const snapshotName = testData.title.split('/').reverse()[0] + '-' + testData.story;
  
  if (!fs.existsSync(snapShotPath)) {
    fs.mkdirSync(snapShotPath);
  }
  const snapshotData = {
    input: testData.input,
    output: testData.output,
    interactions: testData.interactions.map((i) => ({
      [i.label]: i.selection || i.text || (i.click ? 'Clicked' : 'Unknown'),
    })),
  };
  fs.writeFileSync(`${snapShotPath}/${snapshotName}.yaml`, YAML.stringify(snapshotData));
  await page.screenshot({ path: `${snapShotPath}/${snapshotName}.png`, fullPage: true });
  if (!pagePromise) page.close();
  console.log(`Completed capture of ${storyId} in ${Date.now() - start} ms.`);
  return {
    snapshotData,
    visualSnapShot: `${snapShotPath}/${snapshotName}.png`,
  };
};

// module.exports = captureStory;
export default captureStory
