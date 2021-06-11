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

    if (
      context.eventName === 'pull_request' ||
      context.eventName === 'pull_request_target'
    ) {
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
          const response = await octokit.request(
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
          if (response.status !== 200) {
            core.setFailed(JSON.stringify(response.data))
          }
          // SUCCESS!
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
