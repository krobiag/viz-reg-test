// const fs = require('fs');
// const YAML = require('yaml');

import fs from 'fs'
import YAML from 'yaml'
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { execSync } from 'child_process'

export const checkIfFileExists = (file) => {
  return fs.existsSync(file)
}

export const getExpectedImage = (snapShotPath, parentBranch = 'ahmed-playground', imageToCompare) => {
  try {
    return execSync(`git show ${parentBranch}:./${snapShotPath}.png`);
  } catch (error) {
    // console.log(">>ERROR > getExpectedImage", error)
    const imageFromBuffer = PNG.sync.read(imageToCompare)
    const {width, height} = imageFromBuffer
    const png = new PNG({ width, height });
    // Optionally, you can set the background color (white in this example)
    // for (let y = 0; y < height; y++) {
    //   for (let x = 0; x < width; x++) {
    //     const idx = (width * y + x) << 2; // Calculate the index of the pixel
    //     png.data[idx] = 255; // Red channel
    //     png.data[idx + 1] = 255; // Green channel
    //     png.data[idx + 2] = 255; // Blue channel
    //     png.data[idx + 3] = 255; // Alpha channel (fully opaque)
    //   }
    // }

    // Get the PNG image data as a buffer
    const buffer = PNG.sync.write(png);
    return buffer
  }
}

const getImageDiff = (localImage, remoteImage) => {
  let actual = ''
  let expected = ''
  let match = 0

  try {
    actual = PNG.sync.read(localImage);
  } catch (error) {
    // console.log(">>actual error", error)
  }

  try {
    expected = PNG.sync.read(remoteImage);
  } catch (error) {
    // console.log(">>expected error", error)
  }
  
  const maybeCanCompare = actual && expected;
  if (maybeCanCompare) {
    const { width, height } = actual;

    const diff = new PNG({ width, height });
    match = pixelmatch(actual.data, expected.data, diff.data, width, height, { threshold: 0.1 });
  }
  
  return {
    match,
    isNew: !maybeCanCompare && Object.keys(actual || {}).length > 0
  }
}

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
  const snapshotPathWithName =`${snapShotPath}/${snapshotName}`
  fs.writeFileSync(`${snapshotPathWithName}.yaml`, YAML.stringify(snapshotData));
  const imageBuffer = await page.screenshot({ fullPage: true })//({ path: `${snapshotPathWithName}.png`, fullPage: true });
  const remoteImageBuffer = getExpectedImage(`${snapshotPathWithName}`, 'main', imageBuffer)

  const imageDiff = getImageDiff(imageBuffer, remoteImageBuffer)
  
  if (!pagePromise) page.close();
  console.log(`Completed capture of ${storyId} in ${Date.now() - start} ms.`);
  // http://localhost:3000/checkStory/src/stories/__snapshots__/Button-Primary/?id=changed-img.png
  const comparePath = imageDiff?.match > 0 || imageDiff?.isNew ? `; Compare: http://localhost:3000/checkStory/${snapshotPathWithName}/?id=changed-img.png&storyId=${storyId}` : ''
  console.log(`\x1b[102mStory book snaphot! \x1b[0m New: ${imageDiff?.isNew}; Change detected: ${imageDiff?.match > 0}${comparePath}`);
  //log('%c hello world ', 'background: #222; color: #bada55')
  return {
    snapshotData,
    visualSnapShot: `${snapshotPathWithName}.png`,
    snapshot: {
      image: `${snapshotPathWithName}.png`,
      buffer: {
        local: imageBuffer,
        remote: remoteImageBuffer
      },
      ...imageDiff
    }
  };
};

// module.exports = captureStory;
export default captureStory
