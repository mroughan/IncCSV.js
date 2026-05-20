# Release Process

This document describes how to release IncCSV.js as the npm package `inccsv`.

## One-Time Setup

1. Confirm that the package name is available or owned by the project:

   ```sh
   npm view inccsv
   ```

   A `404` means the name is currently unused. If it is already owned by the
   project, confirm that the package page and repository links are correct.

2. Create or confirm the GitHub repository:

   ```text
   https://github.com/mroughan/IncCSV.js
   ```

3. Confirm npm account access:

   ```sh
   npm whoami
   ```

4. Configure npm trusted publishing for the GitHub Actions workflow
   `.github/workflows/publish.yml`. Trusted publishing avoids long-lived npm
   tokens and publishes provenance information from CI.

5. If publishing manually instead, use an npm account protected by two-factor
   authentication.

## Release Checklist

1. Confirm the target INC specification version and update documentation if
   needed.

2. Update `package.json`:

   - `version`
   - `repository`
   - `homepage`
   - `bugs`

3. Update `CHANGELOG.md` with the release date and notable changes.

4. Run the release checks:

   ```sh
   npm run release:check
   ```

5. Inspect the package contents:

   ```sh
   npm pack --dry-run
   ```

   The package should include source, docs, release docs, README, and LICENSE.
   It should not include `.git/`, temporary files, or unrelated fixtures.

6. Commit the release changes:

   ```sh
   git add package.json README.md CHANGELOG.md RELEASE.md
   git commit -m "Release v0.1.0"
   ```

7. Create a git tag:

   ```sh
   git tag v0.1.0
   ```

8. Push the commit and tag:

   ```sh
   git push origin main
   git push origin v0.1.0
   ```

9. Create a GitHub release for the same tag. If trusted publishing is
   configured, publishing the GitHub release will trigger `.github/workflows/publish.yml`.

10. To publish manually instead of via trusted publishing:

   ```sh
   npm publish --access public
   ```

11. Verify the published package:

   ```sh
   npm view inccsv
   ```

## Manual Local Install Check

Before the first public release, test the packed tarball in a clean directory:

```sh
npm pack
mkdir -p /tmp/inccsv-install-check
cd /tmp/inccsv-install-check
npm init -y
npm install /home/matt/Dropbox/src/INC/IncCSV.js/inccsv-0.1.0.tgz
node --input-type=module -e 'import { parseInc } from "inccsv"; console.log(parseInc("a,b\n1,2\n").rows)'
```

## Notes

- `prepublishOnly` runs `npm test` before `npm publish`.
- The `files` field in `package.json` controls the npm package contents.
- Documentation demos are static files and are included in the package.
- CI expects the INC specification fixtures to be available from
  `mroughan/INCspec`.
