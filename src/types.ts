import type { Octokit } from '@octokit/core'
// import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods'
// import {GitHub, getOctokitOptions} from '@actions/github'
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types'
import { PaginateInterface } from '@octokit/plugin-paginate-rest'

export type Kit = Octokit &
  Api & {
    paginate: PaginateInterface
  }

export type LabelApplicator = 'externalPRs' | 'binaryFiles'
export type TeamType = 'internal'

export type LabelConfig = {
  [key in LabelApplicator]: string[]
}

export type TeamConfig = {
  [key in TeamType]: string[]
}

export interface Config {
  teams: TeamConfig
  labels: LabelConfig
  sync: boolean
}
