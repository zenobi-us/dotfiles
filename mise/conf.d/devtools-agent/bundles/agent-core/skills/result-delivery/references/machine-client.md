# Machine client output

Read this reference when the caller explicitly requests JSON and no stronger artifact handoff changes the delivery channel.

Emit one JSON document on stdout. Send diagnostics to stderr. Keep the original domain schema and fields. Do not wrap the document in a Markdown fence or prepend progress text. Human presentation is not selected merely because a terminal is available.

The result-delivery router supports route, emit, read and ack. Pass --context with an absolute context filename, or use RESULT_DELIVERY_CONTEXT. emit accepts --input with a JSON file or reads stdin. --format human or json selects unbound presentation. It cannot remove an artifact handoff. read returns the verified domain JSON. ack requires --sha256 from a verified result reference.

Use --help on the absolute installed entrypoint for command flags. Run it directly; do not bypass the mise shebang. A malformed context, schema mismatch, inaccessible target or hash conflict returns a nonzero exit status. Keep operation failure separate from delivery failure. The calling domain CLI retains its own exit and publication semantics.

