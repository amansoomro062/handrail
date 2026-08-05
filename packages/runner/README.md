# @railing/runner

The test runner. Executes a component specification against any harness over HTTP.

Part of [Railing](https://railing.dev), which measures React component
libraries against the W3C ARIA Authoring Practices Guide and publishes the
results. Every check cites the clause it measures, every score names an exact
version, and maintainers see their findings before anyone else.

```bash
npx @railing/runner run --target radix --component dialog \\
  --base-url http://localhost:5180 --repeat 3
```

The runner never learns which library it is testing. It speaks HTTP to a fixed
URL and reads the browser's accessibility tree, so it cannot favour a library
it has no way to identify.

- [How it works](https://railing.dev/method)
- [Scoring](https://railing.dev/scoring)
- [Source](https://github.com/amansoomro062/railing)

MIT licensed.
