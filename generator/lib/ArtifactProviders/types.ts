import { TemplateInfo } from '~/src/templates'
import { File } from '~/src/types'
import { Index } from '~/src/utils'

export type ArtifactProvider = (params: { templateInfo: TemplateInfo; files: Index<File> }) => File[]
