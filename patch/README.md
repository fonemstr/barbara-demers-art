# Patch: "Curated Scrapbook" design system integration

This folder mirrors the target paths in `barbara-demers-art/`. Copy its
contents on top of the repo, commit, open a PR.

```
rsync -a --exclude README.md --exclude PR_DESCRIPTION.md patch/ ../barbara-demers-art/
cd ../barbara-demers-art
pnpm install        # no new deps, but re-links are cheap
pnpm dev
```

Then commit everything in one go using `PR_DESCRIPTION.md` as the PR body.

See `PR_DESCRIPTION.md` for the full change summary, review checklist, and
screenshots checklist.
