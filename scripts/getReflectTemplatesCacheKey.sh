#!/bin/sh

rm -rf prisma-templates-repo


latestSha=$(git clone https://github.com/prisma/templates prisma-templates-repo && cd prisma-templates-repo && git rev-parse HEAD)
generatorHash=$(find ./generator -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum)

# Base64 encode because GH cache action does not support at least commas.
cacheKey=$(echo "{ \"commit\":\"$latestSha\", \"generator\":\"$generatorHash\" }" | base64)

echo $cacheKey

echo $latestSha
echo "$PWD"

rm -rf prisma-templates-repo

