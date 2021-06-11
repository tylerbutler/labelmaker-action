import * as core from '@actions/core'
import * as github from '@actions/github'
import {Kit} from './types'

// import {Minimatch, IMinimatch} from 'minimatch'
export function getPrNumber(): number | undefined {
  const pullRequest = github.context.payload.pull_request
  if (!pullRequest) {
    return undefined
  }

  return pullRequest.number
}

// export async function getChangedFiles(
//   client: Kit,
//   prNumber: number
// ): Promise<string[]> {
//   const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
//     owner: github.context.repo.owner,
//     repo: github.context.repo.repo,
//     pull_number: prNumber
//   })

//   const listFilesResponse = await client.paginate(listFilesOptions)
//   const changedFiles = listFilesResponse.map(
//     (f: {filename: string}) => f.filename
//   )

//   core.debug('found changed files:')
//   for (const file of changedFiles) {
//     core.debug(`  ${file}`)
//   }

//   return changedFiles
// }

export async function fetchContent(
  client: Kit,
  repoPath: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await client.rest.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: repoPath,
    ref: github.context.sha
  })

  return Buffer.from(response.data.content, response.data.encoding).toString()
}

export async function addLabels(
  client: Kit,
  prNumber: number,
  labels: string[]
): Promise<void> {
  core.debug(`adding '${JSON.stringify(labels)} to PR ${prNumber}`)

  await client.rest.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels
  })
}

export async function removeLabels(
  client: Kit,
  prNumber: number,
  labels: string[]
): Promise<void> {
  core.debug(`removing '${JSON.stringify(labels)} from PR ${prNumber}`)

  await Promise.all(
    labels.map(async label =>
      client.rest.issues.removeLabel({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        name: label
      })
    )
  )
}

export async function getTeamMembers(
  client: Kit,
  teams: string[]
): Promise<string[]> {
  const allMembers = new Set<string>()
  for (const team of teams) {
    core.debug(`team: ${team}`)
    const members = await client.request(
      'GET /orgs/{org}/teams/{team_slug}/members',
      {
        org: github.context.repo.owner,
        team_slug: team
      }
    )
    for (const user of members.data) {
      if (user) {
        core.debug(`member: ${user}`)
        allMembers.add(user.login)
      }
    }
  }
  return Array.from(allMembers)
}

// const collaborators = await api.request(
//   `GET /repos/{owner}/{repo}/collaborators`,
//   {
//     owner: context.repo.owner,
//     repo: context.repo.repo
//   }
// )
