# TASK-001: Publish package to npm

**Status**: TODO
**Created**: 2026-02-04
**Completed**: -
**Plan**: -

## Problem Statement

The java-decimal-format package is complete and ready for distribution, but needs to be published to npm so users can install it with `npm install java-decimal-format`.

## Requirements

From project documentation:
- Package must be built and tested before publishing
- Package name "java-decimal-format" should be available on npm
- npm account must have publish permissions
- All files specified in `package.json` "files" field should be included
- Version should start at 1.0.0

## Implementation Approach

1. **Pre-publish Checks**:
   - Verify package name availability: `npm search java-decimal-format`
   - Ensure npm login: `npm whoami`
   - Run build: `npm run build`
   - Run tests: `npm test`
   - Check package contents: `npm pack --dry-run`

2. **Publish**:
   - Login if needed: `npm login`
   - Publish: `npm publish`
   - Verify publication: Check npmjs.com/package/java-decimal-format

3. **Post-publish**:
   - Update CLAUD.md with npm package link
   - Update README.md badges if needed
   - Create git tag: `git tag v1.0.0`
   - Push tag: `git push origin v1.0.0`

## Acceptance Criteria

- [ ] Package successfully published to npm
- [ ] Package can be installed: `npm install java-decimal-format`
- [ ] Package includes all necessary files (dist/, README.md, LICENSE)
- [ ] Package page on npmjs.com shows correct information
- [ ] Git tag v1.0.0 created and pushed

## Files to Update

After publishing:
- `workflow/tasks/README.md` - Mark task as DONE
- `workflow/tasks/TASK_HISTORY.md` - Add completion entry
- `CLAUD.md` - Add npm package link
- Git: Create and push v1.0.0 tag

## Notes

### Package Configuration

Current `package.json` settings:
- Name: `java-decimal-format`
- Version: `1.0.0`
- Main: `dist/index.js`
- Types: `dist/index.d.ts`
- Files: `["dist", "README.md", "LICENSE"]`

### Potential Issues

1. **Name conflict**: If "java-decimal-format" is taken, may need alternative name
2. **npm login**: Requires npm account with publish permissions
3. **Build errors**: Must resolve before publishing

### Alternative Names (if needed)

If "java-decimal-format" is taken:
- `java-decimalformat`
- `jvm-decimal-format`
- `java-number-format`
- `decimal-format-java`

### Post-Publish Marketing

Consider:
- Tweet/announce on social media
- Post on Reddit (r/javascript, r/typescript)
- Share on relevant Discord/Slack communities
- Update personal portfolio/blog

## References

- [npm publish documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic versioning](https://semver.org/)
- Project README: `../../README.md`
- Package configuration: `../../package.json`
