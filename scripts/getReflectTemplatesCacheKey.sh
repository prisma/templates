#!/bin/sh

rm -rf prisma-templates-repo

latestSha=$(gh repo clone prisma/templates prisma-templates-repo 2> /dev/null -- --depth 1 && cd prisma-templates-repo && git rev-parse HEAD)
generatorHash=$(find ./generator -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum)

# Base64 encode because GH cache action does not support at least commas.
cacheKey=$(echo "{ \"commit\":\"$latestSha\", \"generator\":\"$generatorHash\" }" | base64)

echo $cacheKey


rm -rf prisma-templates-repo
