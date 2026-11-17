# Changelog

## Unreleased

- Fix evidence argument errors at the Crust router boundary. Missing arguments and invalid flags now exit 2. With --json, they emit one collect-evidence/v1 error record with success false and code 2. Other report commands retain their existing error behavior.
- Add public-command regressions for missing arguments, unknown flags, invalid boolean values, plain errors, help and existing report commands.


- Classify malformed or unsupported saved annotations as invalid input (exit 2) in feedback reports. Preserve operation failures and the single collect-evidence/v1 error envelope. Cover both cases through public commands from /tmp.

