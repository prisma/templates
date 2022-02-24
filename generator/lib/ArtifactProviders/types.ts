import { File } from '~/src/types'
import { Index } from '~/src/utils'
import { TemplateInfo } from '~/src/templates'

export type ArtifactProvider = (params: { templateInfo: TemplateInfo; files: Index<File> }) => File[]
