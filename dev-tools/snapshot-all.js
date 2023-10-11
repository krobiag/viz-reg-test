import { launch } from "puppeteer";
import axios from 'axios';
import captureStory from './snapshot.js';
import { execSync } from 'child_process';
const browser = launch();
const page = browser.then(b => b.newPage())
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
    try {
        // const getAll = await fetch('http://localhost:6006/index.json')
        const getAll = await axios.get('http://localhost:6006/index.json')
     
        
        const {data} = getAll;
        const storybookPath = path.join(__dirname, "../.storybook/__snapshots__")
        const storybookAssetsPath = `${storybookPath}/docs/assets`
        execSync(`rm -rf ${storybookAssetsPath}/current ${storybookAssetsPath}/diff ${storybookPath}/reg.json ${storybookPath}/report.html`)
        const {entries} = data;
        const storyEntries = Object.keys(entries)

        let index = 1;
        for (const storyId of storyEntries) {
            try {
                const res = await captureStory(storyId, browser, page)
            } catch (error) {
                console.log(">>ERROR", error)
            }
            if ((index) === storyEntries.length) {
                process.exit(0)
            }
            index++;
            
        }
    } catch (error) {
        console.log(">>ERROR", error)
    }
}

run()