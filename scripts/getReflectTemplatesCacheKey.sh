#!/bin/sh

rm -rf prisma-templates-repo

latestSha=$(gh repo clone prisma/templates prisma-templates-repo 2> /dev/null -- --depth 1 && cd prisma-templates-repo && git rev-parse HEAD)
generatorHash=$(find ./generator -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum)

echo "{ \"commit\":\"$latestSha\", \"generator\":\"$generatorHash\" }" 

rm -rf prisma-templates-repo
