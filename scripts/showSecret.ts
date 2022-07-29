const showSecret = () => {
  const env = process.env
  console.log("ENV")
  console.log(env)
  console.log("ARGS")
  const args = process.argv.slice(2)[0]?.split('/').slice(-2)[0]
  console.log(args)
}

showSecret()