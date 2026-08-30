## Summary

<!-- One-paragraph description of what this PR does -->

## Related issue

<!-- Link the issue this PR addresses. Use "Closes #123" to auto-close. -->

Closes #

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## How to test

<!-- Step-by-step instructions for reviewers to verify your change.
     Include the exact commands and any required input files. -->

1. `yarn install`
2. `yarn build`
3. `yarn test`
4. Run the example deck:
   ```bash
   node packages/cli/bin/mddeck.js examples/basic.md -o /tmp/out.html
   ```

## Checklist

- [ ] My code follows the project's style guidelines (see CONTRIBUTING.md if it exists)
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally (`yarn test`)
- [ ] I have updated relevant documentation (README, DEV, or package README)
- [ ] I have added an entry to CHANGELOG.md under "Unreleased"
- [ ] My changes don't introduce new warnings or lint errors

## Screenshots / output

<!-- If your change has a visual effect, add screenshots. For CLI changes,
     paste the relevant stdout/stderr. -->

## Additional context

<!-- Any other context reviewers should know. -->
