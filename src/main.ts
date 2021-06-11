import * as core from '@actions/core'
import * as github from '@actions/github'
import {PullRequestEvent} from '@octokit/webhooks-types'
import * as fs from 'fs-extra'
import * as yaml from 'js-yaml'
import {Config} from './types'

async function loadConfig(path: string): Promise<Config> {
  return yaml.load(fs.readFileSync(path, {encoding: 'utf8'})) as Config
}

async function run(): Promise<void> {
  try {
    const config = await loadConfig(core.getInput('config'))
    const token = core.getInput('token')
    const octokit = github.getOctokit(token)
    const context = github.context
    const actor = github.context.actor

    if (context.eventName === 'pull_request') {
      const payload = github.context.payload as PullRequestEvent
      if (payload.action === 'opened' || payload.action === 'synchronize') {
        const collaborators = await octokit.request(
          `GET /repos/{owner}/{repo}/collaborators`,
          {
            owner: context.repo.owner,
            repo: context.repo.repo
          }
        )
        const isExternal = !collaborators.data.some(
          user => user.login === actor
        )

        if (config.labels.externalPRs && isExternal) {
          await octokit.request(
            'POST /repos/{owner}/{repo}/issues/{issue_number}/labels',
            {
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: payload.pull_request.number,
              labels: config.labels.externalPRs.map(label => {
                return {name: label}
              })
            }
          )
        }
      }
    }

    // const payload = JSON.stringify(github.context.payload, undefined, 2)
    // core.debug(`The event payload: ${payload}`)

    // const ms: string = core.getInput('milliseconds')
    // core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    // core.debug(new Date().toTimeString())
    // await wait(parseInt(ms, 10))
    // core.debug(new Date().toTimeString())

    // core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
