// import { Octokit } from "@octokit/core";
// //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
// const runCreateBranch = async () => {
//     try {
//         // const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
//         const octokit = new Octokit({ auth: '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' })
//         const { data } = await octokit.request("/user");
//         console.log(">>sdfsddf", data)
//         // const owner = octokit.getInput('owner', { required: true });
//         // const repo = octokit.getInput('repo', { required: true });
        
//         // const responseListPullRequest = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
//         //     owner,
//         //     repo,
//         //     headers: {
//         //       'X-GitHub-Api-Version': '2022-11-28'
//         //     }
//         //   })
          
//         //   const pullNumber = responseListPullRequest.data[0].number
//         //   const commentOnPR = await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
//         //     owner,
//         //     repo,
//         //     issue_number: pullNumber,
//         //     body: `FROM ACTIONS ![im an alt](i am an image) <b>hellloo</b>`,
//         //     headers: {
//         //       'X-GitHub-Api-Version': '2022-11-28'
//         //     }
//         //   })


//     } catch (error) {
//         console.log(">>ERROR", error)
//     }
// }

import { exec, execFileSync, execSync } from "child_process"

const runCreateBranch = async () => {
    try {
        console.log(">>hello")
        // exec('./node_modules/.bin/loki --requireReference --reactUri file:./storybook-static')
        execSync('node ./node_modules/.bin/loki --requireReference --reactUri file:./storybook-static')   
        console.log(">>finished") 
    } catch (error) {
        console.log(">>asdas", error.message)
    }
}

runCreateBranch()
