import { launch } from "puppeteer";
import axios from 'axios';
import captureStory from './snapshot.js';

const browser = launch();
const page = browser.then(b => b.newPage())


const run = async () => {
    try {
        // const getAll = await fetch('http://localhost:6006/index.json')
        const getAll = await axios.get('http://localhost:6006/index.json')
     
        
        const {data} = getAll;

        const {entries} = data;
        for (const storyId of Object.keys(entries)) {
            const res = await captureStory(storyId, browser, page)
            // console.log(">>res", res)
            
        }
    } catch (error) {
        console.log(">>ERROR", error)
    }
    

    // axios.get('http://localhost:6006/index.json')
    // .then(async ({data: {entries}}) => {
    //     for (const storyId of Object.keys(entries)) {
    //         await captureStory(storyId, browser, page)
    //     }
    // })
    // .then(async () => {
    //     await (await browser).close()
    // })
}

run()