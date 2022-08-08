# templates-node

[![trunk](https://github.com/prisma/templates-node/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma/templates-node/actions/workflows/trunk.yml)

Prisma [templates](https://github.com/prisma/prisma-schema-examples) packaged up for programmatic consumption.

[Documentation](https://paka.dev/npm/@prisma/templates)

## Start developing:

1) `yarn run dev:gen`
2) Install sha1sum library
3) `yarn run build:gen`
4) if `yarn test` fails - run `yarn test -u`

## Creating a File Transformer

1. Create a file transformer module in `src/fileTransformers`
2. Export its contents in `src/fileTransformers/index_.ts` 

That's it, it will now be run in the file transform stack. How? Look in the [code generator template code](https://github.com/prisma/templates-node/blob/0eba1d714087a49bbb4674b51f8ad5fa8c8fecb3/generator/cli/generate-type-script.ts#L421-L426).
