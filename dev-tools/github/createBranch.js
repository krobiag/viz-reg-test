import { Octokit } from "@octokit/core";

const runCreateBranch = async () => {
    try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
        const owner = octokit.getInput('owner', { required: true });
        const repo = octokit.getInput('repo', { required: true });
        
        const responseListPullRequest = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
            owner,
            repo,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          })
          
          const pullNumber = responseListPullRequest.data[0].number
          const commentOnPR = await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner,
            repo,
            issue_number: pullNumber,
            body: `FROM ACTIONS ![im an alt](i am an image) <b>hellloo</b>`,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          })


    } catch (error) {
        console.log(">>ERROR", error)
    }
}

runCreateBranch()