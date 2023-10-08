const mustache = require('mustache');
const detectDiff = require('x-img-diff-js');
const fs= require('fs');

const mkdirp = require('mkdirp');

const path = require('path');
const loadFaviconAsDataURL = function loadFaviconAsDataURL(type) {
  const fname = path.resolve(__dirname, '../report/assets/favicon_' + type + '.png');
  const buffer = fs.readFileSync(fname);
  return 'data:image/png;base64,' + buffer.toString('base64');
};

const encodeFilePath = function encodeFilePath(filePath) {
  return filePath.split(path.sep).map(function (p) {
    return encodeURIComponent(p);
  }).join(path.sep);
};

const createJSONReport = function createJSONReport(params) {
  return {
    failedItems: params.failedItems,
    newItems: params.newItems,
    deletedItems: params.deletedItems,
    passedItems: params.passedItems,
    expectedItems: params.expectedItems,
    actualItems: params.actualItems,
    diffItems: params.diffItems,
    actualDir: '' + params.urlPrefix + path.default.relative(path.default.dirname(params.json), params.actualDir),
    expectedDir: '' + params.urlPrefix + path.default.relative(path.default.dirname(params.json), params.expectedDir),
    diffDir: '' + params.urlPrefix + path.default.relative(path.default.dirname(params.json), params.diffDir)
  };
};

const createHTMLReport = function createHTMLReport(params) {
  const file = path.join(__dirname, '../template/template.html');
  const js = fs.readFileSync(path.default.join(__dirname, '../report/ui/dist/report.js'));
  const template = fs.readFileSync(file);
  const json = {
    type: params.failedItems.length === 0 ? 'success' : 'danger',
    hasNew: params.newItems.length > 0,
    newItems: params.newItems.map(function (item) {
      return { raw: item, encoded: encodeFilePath(item) };
    }),
    hasDeleted: params.deletedItems.length > 0,
    deletedItems: params.deletedItems.map(function (item) {
      return { raw: item, encoded: encodeFilePath(item) };
    }),
    hasPassed: params.passedItems.length > 0,
    passedItems: params.passedItems.map(function (item) {
      return { raw: item, encoded: encodeFilePath(item) };
    }),
    hasFailed: params.failedItems.length > 0,
    failedItems: params.failedItems.map(function (item) {
      return { raw: item, encoded: encodeFilePath(item) };
    }),
    actualDir: params.fromJSON ? params.actualDir : '' + params.urlPrefix + path.relative(path.dirname(params.report), params.actualDir),
    expectedDir: params.fromJSON ? params.expectedDir : '' + params.urlPrefix + path.relative(path.dirname(params.report), params.expectedDir),
    diffDir: params.fromJSON ? params.diffDir : '' + params.urlPrefix + path.relative(path.dirname(params.report), params.diffDir),
    ximgdiffConfig: {
      enabled: params.enableClientAdditionalDetection,
      workerUrl: params.urlPrefix + 'worker.js'
    }
  };
  const faviconType = json.hasFailed || json.hasNew || json.hasDeleted ? 'failure' : 'success';
  const view = {
    js: js,
    report: JSON.stringify(json),
    faviconData: loadFaviconAsDataURL(faviconType)
  };
  return mustache.render(template.toString(), view);
};

function createXimdiffWorker(params) {
  const file = path.join(__dirname, './template/worker_pre.js');
  const moduleJs = fs.readFileSync(path.join(__dirname, './report/ui/dist/worker.js'), 'utf8');
  const wasmLoaderJs = fs.readFileSync(detectDiff.getBrowserJsPath(), 'utf8');
  const template = fs.readFileSync(file);
  const ximgdiffWasmUrl = params.urlPrefix + 'detector.wasm';
  return mustache.render(template.toString(), { ximgdiffWasmUrl: ximgdiffWasmUrl }) + '\n' + moduleJs + '\n' + wasmLoaderJs;
}

exports.default = function (params) {
  if (!!params.report) {
    const html = createHTMLReport(params);
    mkdirp.sync(path.dirname(params.report));
    fs.writeFileSync(params.report, html);
    if (!!params.enableClientAdditionalDetection) {
      const workerjs = createXimdiffWorker(params);
      fs.writeFileSync(path.resolve(path.dirname(params.report), 'worker.js'), workerjs);
      const wasmBuf = fs.readFileSync(detectDiff.getBrowserWasmPath());
      fs.writeFileSync(path.resolve(path.dirname(params.report), 'detector.wasm'), wasmBuf);
    }
  }

  const json = createJSONReport(params);
  if (!params.fromJSON) {
    mkdirp.sync(path.dirname(params.json));
    fs.writeFileSync(params.json, JSON.stringify(json));
  }
  return json;
};