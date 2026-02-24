const minMajor = 20
const minMinorFor20 = 19

const [major, minor] = process.versions.node
  .split('.')
  .map((part) => Number(part))

const isSupported =
  major > minMajor || (major === minMajor && minor >= minMinorFor20)

if (!isSupported) {
  console.error(
    [
      `Node ${process.versions.node} is not supported.`,
      `Use Node >= ${minMajor}.${minMinorFor20}.0 (recommended: 22).`,
      'Run: nvm use',
    ].join('\n'),
  )
  process.exit(1)
}
