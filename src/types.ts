export type LabelApplicator = 'externalPRs' | 'binaryFiles'

export type LabelConfig = {
  [key in LabelApplicator]: string[]
}

export interface Config {
  labels: LabelConfig
}
