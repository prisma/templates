import { File } from '~/src/types'
import { Index } from '~/src/utils'
import { TemplateInfo } from '../types'

export type ArtifactProvider = (params: { templateInfo: TemplateInfo; files: Index<File> }) => File[]
