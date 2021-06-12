import * as core from '@actions/core'
import * as github from '@actions/github'
import {PullRequestEvent} from '@octokit/webhooks-types'
import * as yaml from 'js-yaml'
import {Config, Kit} from './types'
import {addLabels, fetchContent, getTeamMembers, removeLabels} from './utils'

async function loadConfig(client: Kit, path: string): Promise<Config> {
  const configurationContent: string = await fetchContent(client, path)
  const config = yaml.load(configurationContent) as Config
  core.debug(`config: ${JSON.stringify(config)}`)
  return config
}

async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const api: Kit = github.getOctokit(token)
    const config = await loadConfig(api, core.getInput('config'))

    // const baseOctokit = GitHub.plugin(restEndpointMethods)
    // or override some of the default values as well
    // const octokit = GitHub.plugin(enterpriseServer220Admin).defaults({userAgent: "MyNewUserAgent"})

    // const octokit = new baseOctokit(getOctokitOptions(token))

    // const API = Octokit.plugin(restEndpointMethods)
    const context = github.context
    // core.debug(JSON.stringify(context))

    core.debug(JSON.stringify(context.eventName))

    if (
      // context.eventName === 'pull_request' ||
      context.eventName === 'pull_request_target'
    ) {
      core.debug(`handling pull_request event`)
      const payload = github.context.payload as PullRequestEvent
      // core.debug(JSON.stringify(payload))

      if (payload.action === 'opened' || payload.action === 'synchronize') {
        const prNumber = payload.pull_request.number
        core.debug(`PR number: ${prNumber}`)

        const actor = payload.pull_request.user.login
        core.debug(JSON.stringify(actor))

        const members = await getTeamMembers(api, config.teams.internal)
        core.debug(`members: '${JSON.stringify(members)}'`)
        core.debug(`actor: ${actor}`)
        const isExternal = !members.includes(actor)

        if (config.labels.externalPRs && isExternal) {
          core.debug(
            `adding '${JSON.stringify(
              config.labels.externalPRs
            )}' to PR ${prNumber}`
          )
          await addLabels(api, prNumber, config.labels.externalPRs)
        }

        if (config.sync && !isExternal) {
          core.debug(
            `removing '${JSON.stringify(
              config.labels.externalPRs
            )}' from PR ${prNumber}`
          )
          try {
            await removeLabels(api, prNumber, config.labels.externalPRs)
          } catch (err) {
            core.debug(`removing labels failed ${err.message}`)
          }
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
