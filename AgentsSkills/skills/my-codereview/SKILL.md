---
name: my-codereview
description: Review source code for hardcoded secrets such as API keys, tokens, passwords, and private keys. Use when asked to check code, a diff, or a branch for secrets before commit or merge.
---

# my-codereview

Check source code for secrets that should not be committed. Report findings; do not fix or rewrite anything unless asked.

## Scope

Pick the narrowest target the user gave:

- A path or file: scan that.
- A branch or PR: scan the diff against the base (`git diff <base>...HEAD`) and, because history is permanent, the added lines of each commit (`git log -p <base>..HEAD`).
- Nothing specified: scan staged and unstaged changes (`git diff HEAD`), then say the rest of the repo was not scanned and offer to scan it.

Skip `node_modules`, `dist`, `cdk.out`, lock files, and binary files.

## Method

1. If `gitleaks` or `trufflehog` is installed, run it first (`gitleaks detect --no-banner --redact`, or `trufflehog filesystem <path> --no-update`) and include its results.
2. Search the scope yourself for these, which scanners often miss:
   - Cloud and vendor keys: AWS access key IDs (`AKIA`/`ASIA` + 16 characters) and secret keys, GitHub tokens (`ghp_`, `gho_`, `github_pat_`), Slack (`xox[baprs]-`), Stripe (`sk_live_`), Google API keys (`AIza`), Wiz and other service-account client secrets.
   - Private keys and certificates: `-----BEGIN ... PRIVATE KEY-----`, `.pem`, `.p12`, `.pfx`, `.key` files.
   - Credentials in URLs and connection strings: `scheme://user:password@host`, `Password=`, `pwd=`.
   - Assignments to names like `password`, `secret`, `token`, `api_key`, `client_secret`, `authorization`, `bearer` with a literal value.
   - Committed env and config files: `.env*`, `credentials`, `*.tfvars`, kubeconfig, `mcp.json` with inline tokens or `Authorization` headers.
   - High-entropy strings of 20+ characters assigned to a variable or passed as an argument.
3. Check each hit before reporting it. Drop placeholders and examples (`changeme`, `<token>`, `${VAR}`, `process.env.X`, `AKIAIOSFODNN7EXAMPLE`), test fixtures clearly marked as fake, and values read from the environment or a secret store.

## Reporting

Never print a full secret. Show at most the first 4 characters, then `…`, and the length.

List findings most severe first, each with:

- `file:line`
- what it appears to be (for example "AWS secret access key")
- confidence: confirmed (matches a vendor format or is a private key), likely, or possible
- whether it is only in the working tree or also in git history (`git log -S` on a redacted fragment)

End with a one-line verdict: "No secrets found in <scope>" or "<n> findings in <scope>".

## When a real secret is found

Tell the user, in this order:

1. Revoke or rotate the secret now. Removing it from the code does not make it safe, and history keeps it.
2. Move it to an environment variable or secret store (AWS Secrets Manager, SSM Parameter Store, GitHub Actions secrets).
3. If it was committed, history needs rewriting (`git filter-repo`) and a force push, which the user must decide on. Do not do this yourself.

Suggest adding a pre-commit scanner such as gitleaks if the repo has none.
