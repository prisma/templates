export type Handle = {
  jsdoc: string
  value: string
}
export type TemplateInfo = {
  handles: {
    kebab: Handle
    camel: Handle
    snake: Handle
    pascal: Handle
    upper: Handle
  }
  displayName: string
  description: string
  path: string
}
