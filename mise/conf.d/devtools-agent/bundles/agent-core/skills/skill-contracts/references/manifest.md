# Local manifest specification

The authoritative structural specification is [manifest.schema.json](manifest.schema.json). scripts/contracts.ts uses that schema through Ajv. Do not maintain another manifest validator in an owner skill.

## Collections

A contracts.json object declares schemaVersion: skill-contract-manifest/v1 and four required collections. Empty arrays and an empty contracts object are valid.

| Field | Meaning |
| --- | --- |
| produces | Array of output contract identifiers |
| accepts | Array of supported input contract identifiers |
| contracts | Object mapping each identifier to one authoritative definition reference |
| upgrades | Array of objects with from, to, and procedure references |

Identifiers use lowercase, hyphen-separated record families and /v followed by a positive decimal integer without leading zeroes. For example, example-record/v1. A contract version is not a skill release version. Duplicate identifiers within a support collection are invalid. The same identifier can appear in both collections.

Every produced identifier, accepted identifier, and upgrade endpoint requires a contracts entry, except the built-in manifest identifier. All entries resolve before an operation returns, including unused definitions. Definition discovery does not add identifiers to produces or accepts.

## Local references

Use file: followed by a nonempty relative filesystem path. Paths are literal, not file URLs: do not percent-encode spaces or add URI fragments. Parent-relative paths can point to an authoritative definition owned by another installed skill. Absolute paths and empty paths are invalid. Each target must be a readable, nonempty file. Resolution reads the file as UTF-8 and returns its complete content without interpreting its domain rules.

The supplied --skill directory is the installed skill root. The manifest location, definitions, and procedures never depend on the caller working directory. Install referenced owner definitions together with their consumers.

The manifest format is built in. A manifest may accept or produce skill-contract-manifest/v1 without a contracts entry for it. A contracts entry for that identifier is rejected because it would compete with the built-in definition.

## Upgrade declarations

Each entry uses from and to identifiers and a procedure reference. Both endpoints must resolve. Endpoints must differ. Each endpoint pair has one procedure. Procedures must resolve to readable nonempty files. Inspection never executes them. Multiple destinations do not select a preferred upgrade; selection and execution are outside these local operations.

## Scope and failure

Unknown fields, unsupported schema versions, malformed identifiers, missing collections, and unresolved references fail the whole operation. There is no partial success. These local operations support only file: references. sourceRepository may identify provenance, but it does not enable Git resolution. Historical definition resolution and automatic upgrades belong to separate implementation slices.

The owner remains responsible for content validation, compatibility, safety, and conversion. Successful manifest validation does not prove that an artifact matches its contract.

