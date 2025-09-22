---
description: Bump package version and create release branch
argument-hint: [patch|minor|major]
---

Run the version bump script to increment the package version and create a release branch.

Execute the following command:

```bash
deno run --allow-read --allow-write --allow-run tools/version-bump.ts $ARGUMENTS
```

This will:

1. Check for uncommitted changes (exits if any exist)
2. Read the current version from deno.json
3. Increment the version based on the provided type (patch, minor, or major)
4. Checkout main branch and pull latest changes
5. Create a new release branch (release/vX.X.X)
6. Update the version in deno.json
7. Commit the changes with message "chore: bump version to X.X.X"
8. Create a git tag (vX.X.X)
9. Push the branch and tag to origin

Usage examples:

- `/version-bump` - bumps patch version
- `/version-bump minor` - bumps minor version
- `/version-bump major` - bumps major version
