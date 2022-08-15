#!/bin/sh

dependenciesHash=$(find ./yarn.lock -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum)
templatesHash=$(find ./templates-raw -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum)
generatorHash=$(find ./generator -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum)

# Base64 encode because GH cache action does not support at least commas.
cacheKey=$(echo "{ \"templates\":\"$templatesHash\", \"generator\":\"$generatorHash\", \"dependencies\": \"$dependenciesHash\" }" | base64)

echo $cacheKey
