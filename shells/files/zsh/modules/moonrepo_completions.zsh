#compdef moon

autoload -U is-at-least

_moon() {
    typeset -A opt_args
    typeset -a _arguments_options
    local ret=1

    if is-at-least 5.2; then
        _arguments_options=(-s -S -C)
    else
        _arguments_options=(-s -C)
    fi

    local context curcontext="$curcontext" state line
    _arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
":: :_moon_commands" \
"*::: :->moon" \
&& ret=0
    case $state in
    (moon)
        words=($line[1] "${words[@]}")
        (( CURRENT += 1 ))
        curcontext="${curcontext%:*:*}:moon-command-$line[1]:"
        case $line[1] in
            (action-graph)
_arguments "${_arguments_options[@]}" : \
'--host=[The host address]:HOST:_default' \
'--port=[The port to bind to]:PORT:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--dependents[Include dependents of the focused target(s)]' \
'--dot[Print the graph in DOT format]' \
'--json[Print the graph in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'*::targets -- Task targets to *only* graph:_default' \
&& ret=0
;;
(bin)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
':toolchain -- The toolchain to query:_default' \
&& ret=0
;;
(check)
_arguments "${_arguments_options[@]}" : \
'--affected=[Only run tasks if affected by changed files]::AFFECTED:_default' \
'--base=[Base branch, commit, or revision to compare against]:BASE:_default' \
'--head=[Current branch, commit, or revision to compare with]:HEAD:_default' \
'*--status=[Filter changed files based on a changed status]:STATUS:_default' \
'-s+[Print a summary of all actions that were ran in the pipeline]::SUMMARY:(none minimal normal detailed)' \
'--summary=[Print a summary of all actions that were ran in the pipeline]::SUMMARY:(none minimal normal detailed)' \
'--downstream=[Control the depth of downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--dependents=[Control the depth of downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--upstream=[Control the depth of upstream dependencies]:UPSTREAM:(none direct deep)' \
'--dependencies=[Control the depth of upstream dependencies]:UPSTREAM:(none direct deep)' \
'--job=[Index of the current job]:JOB:_default' \
'--job-total=[Total amount of jobs to run]:JOB_TOTAL:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--all[Check all projects]' \
'--closest[Check the closest project]' \
'-g[Include graph relations for affected checks, instead of just changed files]' \
'--include-relations[Include graph relations for affected checks, instead of just changed files]' \
'--stdin[Accept changed files from stdin for affected checks]' \
'-f[Force run and bypass cache, ignore changed files, and skip affected checks]' \
'--force[Force run and bypass cache, ignore changed files, and skip affected checks]' \
'-i[Run the pipeline and tasks interactively]' \
'--interactive[Run the pipeline and tasks interactively]' \
'--no-actions[Run the pipeline without sync and setup related actions]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'*::ids -- List of explicit project IDs to check:_default' \
&& ret=0
;;
(ci)
_arguments "${_arguments_options[@]}" : \
'--base=[Base branch, commit, or revision to compare against]:BASE:_default' \
'--head=[Current branch, commit, or revision to compare with]:HEAD:_default' \
'*--status=[Filter changed files based on a changed status]:STATUS:_default' \
'-s+[Print a summary of all actions that were ran in the pipeline]::SUMMARY:(none minimal normal detailed)' \
'--summary=[Print a summary of all actions that were ran in the pipeline]::SUMMARY:(none minimal normal detailed)' \
'--downstream=[Control the depth of downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--dependents=[Control the depth of downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--upstream=[Control the depth of upstream dependencies]:UPSTREAM:(none direct deep)' \
'--dependencies=[Control the depth of upstream dependencies]:UPSTREAM:(none direct deep)' \
'--job=[Index of the current job]:JOB:_default' \
'--job-total=[Total amount of jobs to run]:JOB_TOTAL:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'-g[Include graph relations for affected checks, instead of just changed files]' \
'--include-relations[Include graph relations for affected checks, instead of just changed files]' \
'--stdin[Accept changed files from stdin for affected checks]' \
'-f[Force run and bypass cache, ignore changed files, and skip affected checks]' \
'--force[Force run and bypass cache, ignore changed files, and skip affected checks]' \
'-i[Run the pipeline and tasks interactively]' \
'--interactive[Run the pipeline and tasks interactively]' \
'--no-actions[Run the pipeline without sync and setup related actions]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'*::targets -- List of explicit task targets to run:_default' \
&& ret=0
;;
(clean)
_arguments "${_arguments_options[@]}" : \
'--lifetime=[Lifetime of cached artifacts]:LIFETIME:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--all[Clean all cached items and reset state]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(completions)
_arguments "${_arguments_options[@]}" : \
'--shell=[Shell to generate for]:SHELL:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(debug)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
":: :_moon__debug_commands" \
"*::: :->debug" \
&& ret=0

    case $state in
    (debug)
        words=($line[1] "${words[@]}")
        (( CURRENT += 1 ))
        curcontext="${curcontext%:*:*}:moon-debug-command-$line[1]:"
        case $line[1] in
            (config)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(vcs)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
        esac
    ;;
esac
;;
(docker)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
":: :_moon__docker_commands" \
"*::: :->docker" \
&& ret=0

    case $state in
    (docker)
        words=($line[1] "${words[@]}")
        (( CURRENT += 1 ))
        curcontext="${curcontext%:*:*}:moon-docker-command-$line[1]:"
        case $line[1] in
            (file)
_arguments "${_arguments_options[@]}" : \
'--build-task=[ID of a task to build the project]:BUILD_TASK:_default' \
'--image=[Base Docker image to use]:IMAGE:_default' \
'--start-task=[ID of a task to run the project]:START_TASK:_default' \
'--template=[Template path, relative from the workspace root, to render the Dockerfile with]:TEMPLATE:_files' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--defaults[Use default options instead of prompting]' \
'--no-prune[Do not prune dependencies in the build stage]' \
'--no-setup[Do not setup dependencies in the build stage]' \
'--no-toolchain[Do not use the toolchain and instead use system binaries]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
':id -- ID of project to create a Dockerfile for:_default' \
'::dest -- Destination path, relative from the project root:_files' \
&& ret=0
;;
(prune)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(scaffold)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'*::ids -- List of project IDs to copy sources for:_default' \
&& ret=0
;;
(setup)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
        esac
    ;;
esac
;;
(exec)
_arguments "${_arguments_options[@]}" : \
'--ci=[Execute the pipeline as if it'\''s a CI environment]::CI:(true false)' \
'--on-failure=[When a task fails, either bail the pipeline, or continue executing]:ON_FAILURE:(bail continue)' \
'--query=[Filter tasks based on the result of a query]:QUERY:_default' \
'--affected=[Only run tasks if affected by changed files]::AFFECTED:_default' \
'--base=[Base branch, commit, or revision to compare against]:BASE:_default' \
'--head=[Current branch, commit, or revision to compare with]:HEAD:_default' \
'*--status=[Filter changed files based on a changed status]:STATUS:_default' \
'-s+[Print a summary of all actions that were ran in the pipeline]::SUMMARY:(none minimal normal detailed)' \
'--summary=[Print a summary of all actions that were ran in the pipeline]::SUMMARY:(none minimal normal detailed)' \
'--downstream=[Control the depth of downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--dependents=[Control the depth of downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--upstream=[Control the depth of upstream dependencies]:UPSTREAM:(none direct deep)' \
'--dependencies=[Control the depth of upstream dependencies]:UPSTREAM:(none direct deep)' \
'--job=[Index of the current job]:JOB:_default' \
'--job-total=[Total amount of jobs to run]:JOB_TOTAL:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--ignore-ci-checks[Ignore "run in CI" task checks]' \
'-g[Include graph relations for affected checks, instead of just changed files]' \
'--include-relations[Include graph relations for affected checks, instead of just changed files]' \
'--stdin[Accept changed files from stdin for affected checks]' \
'-f[Force run and bypass cache, ignore changed files, and skip affected checks]' \
'--force[Force run and bypass cache, ignore changed files, and skip affected checks]' \
'-i[Run the pipeline and tasks interactively]' \
'--interactive[Run the pipeline and tasks interactively]' \
'--no-actions[Run the pipeline without sync and setup related actions]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'*::targets -- List of task targets to execute in the action pipeline:_default' \
&& ret=0
;;
(ext)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
':id -- Extension ID to execute:_default' \
'*::passthrough -- Arguments to pass through to the extension:_default' \
&& ret=0
;;
(extension)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
":: :_moon__extension_commands" \
"*::: :->extension" \
&& ret=0

    case $state in
    (extension)
        words=($line[1] "${words[@]}")
        (( CURRENT += 1 ))
        curcontext="${curcontext%:*:*}:moon-extension-command-$line[1]:"
        case $line[1] in
            (add)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--minimal[Add with minimal configuration and prompts]' \
'--yes[Skip prompts and use default values]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
':id -- Unique ID of the extension to add:_default' \
'::plugin -- Plugin locator string to find and load the extension:_default' \
&& ret=0
;;
(info)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
':id -- Extension ID to inspect:_default' \
'::plugin -- Plugin locator string to find and load the extension:_default' \
&& ret=0
;;
        esac
    ;;
esac
;;
(generate)
_arguments "${_arguments_options[@]}" : \
'--to=[Destination path, relative from workspace root or working directory]:DEST:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--defaults[Use the default value of all variables instead of prompting]' \
'--dry-run[Run entire generator process without writing files]' \
'--force[Force overwrite any existing files at the destination]' \
'--template[Create a new template]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::id -- Template ID to generate:_default' \
'*::vars -- Arguments to define as variable values:_default' \
&& ret=0
;;
(hash)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--json[Print in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
':hash -- Hash to inspect:_default' \
'::diff_hash -- Another hash to diff against:_default' \
&& ret=0
;;
(init)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--force[Overwrite existing configurations]' \
'--minimal[Initialize with minimal configuration and prompts]' \
'--yes[Skip prompts and use default values]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::dest -- Destination to initialize into:_files' \
&& ret=0
;;
(mcp)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(migrate)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
":: :_moon__migrate_commands" \
"*::: :->migrate" \
&& ret=0

    case $state in
    (migrate)
        words=($line[1] "${words[@]}")
        (( CURRENT += 1 ))
        curcontext="${curcontext%:*:*}:moon-migrate-command-$line[1]:"
        case $line[1] in
            (v2)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--yes[Skip prompts and apply all migrations]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
        esac
    ;;
esac
;;
(project)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--json[Print in JSON format]' \
'--no-tasks[Do not include tasks in output]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::id -- Project ID to inspect:_default' \
&& ret=0
;;
(project-graph)
_arguments "${_arguments_options[@]}" : \
'--host=[The host address]:HOST:_default' \
'--port=[The port to bind to]:PORT:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--dependents[Include direct dependents of the focused project]' \
'--dot[Print the graph in DOT format]' \
'--json[Print the graph in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::id -- Project ID to *only* graph:_default' \
&& ret=0
;;
(projects)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--json[Print in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(query)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
":: :_moon__query_commands" \
"*::: :->query" \
&& ret=0

    case $state in
    (query)
        words=($line[1] "${words[@]}")
        (( CURRENT += 1 ))
        curcontext="${curcontext%:*:*}:moon-query-command-$line[1]:"
        case $line[1] in
            (affected)
_arguments "${_arguments_options[@]}" : \
'--downstream=[Include downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--dependents=[Include downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--upstream=[Include upstream dependencies]:UPSTREAM:(none direct deep)' \
'--dependencies=[Include upstream dependencies]:UPSTREAM:(none direct deep)' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::by -- Conditions in which to track affected:_default' \
&& ret=0
;;
(changed-files)
_arguments "${_arguments_options[@]}" : \
'--base=[Base branch, commit, or revision to compare against]:BASE:_default' \
'--default-branch=[When on the default branch, compare against the previous revision]::DEFAULT_BRANCH:(true false)' \
'--head=[Current branch, commit, or revision to compare with]:HEAD:_default' \
'*--status=[Filter files based on a changed status]:STATUS:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--local[Gather files from your local state instead of the remote]' \
'--remote[Gather files from the remote state instead of your local]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(projects)
_arguments "${_arguments_options[@]}" : \
'--affected=[Filter projects that are affected based on changed files]::AFFECTED:_default' \
'--downstream=[Include downstream dependents of queried projects]:DOWNSTREAM:(none direct deep)' \
'--dependents=[Include downstream dependents of queried projects]:DOWNSTREAM:(none direct deep)' \
'--upstream=[Include upstream dependencies of queried projects]:UPSTREAM:(none direct deep)' \
'--dependencies=[Include upstream dependencies of queried projects]:UPSTREAM:(none direct deep)' \
'--alias=[Filter projects that match this alias]:ALIAS:_default' \
'--id=[Filter projects that match this ID]:ID:_default' \
'--language=[Filter projects of this programming language]:LANGUAGE:_default' \
'--layer=[Filter projects of this layer]:LAYER:_default' \
'--stack=[Filter projects that match this source path]:STACK:_default' \
'--source=[Filter projects of this tech stack]:SOURCE:_default' \
'--tags=[Filter projects that have the following tags]:TAGS:_default' \
'--tasks=[Filter projects that have the following tasks]:TASKS:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::query -- Filter projects using a query (takes precedence over options):_default' \
&& ret=0
;;
(tasks)
_arguments "${_arguments_options[@]}" : \
'--affected=[Filter tasks that are affected based on changed files]::AFFECTED:_default' \
'--downstream=[Include downstream dependents of queried tasks]:DOWNSTREAM:(none direct deep)' \
'--dependents=[Include downstream dependents of queried tasks]:DOWNSTREAM:(none direct deep)' \
'--upstream=[Include upstream dependencies of queried tasks]:UPSTREAM:(none direct deep)' \
'--dependencies=[Include upstream dependencies of queried tasks]:UPSTREAM:(none direct deep)' \
'--id=[Filter tasks that match this ID]:ID:_default' \
'--command=[Filter tasks with the provided command]:COMMAND:_default' \
'--project=[Filter tasks that belong to a project]:PROJECT:_default' \
'--script=[Filter tasks with the provided script]:SCRIPT:_default' \
'--toolchain=[Filter tasks that belong to a toolchain]:TOOLCHAIN:_default' \
'--type=[Filter projects of this type]:TYPE_OF:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::query -- Filter tasks using a query (takes precedence over options):_default' \
&& ret=0
;;
        esac
    ;;
esac
;;
(run)
_arguments "${_arguments_options[@]}" : \
'--query=[Filter tasks based on the result of a query]:QUERY:_default' \
'--affected=[Only run tasks if affected by changed files]::AFFECTED:_default' \
'--base=[Base branch, commit, or revision to compare against]:BASE:_default' \
'--head=[Current branch, commit, or revision to compare with]:HEAD:_default' \
'*--status=[Filter changed files based on a changed status]:STATUS:_default' \
'-s+[Print a summary of all actions that were ran in the pipeline]::SUMMARY:(none minimal normal detailed)' \
'--summary=[Print a summary of all actions that were ran in the pipeline]::SUMMARY:(none minimal normal detailed)' \
'--downstream=[Control the depth of downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--dependents=[Control the depth of downstream dependents]:DOWNSTREAM:(none direct deep)' \
'--upstream=[Control the depth of upstream dependencies]:UPSTREAM:(none direct deep)' \
'--dependencies=[Control the depth of upstream dependencies]:UPSTREAM:(none direct deep)' \
'--job=[Index of the current job]:JOB:_default' \
'--job-total=[Total amount of jobs to run]:JOB_TOTAL:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'-g[Include graph relations for affected checks, instead of just changed files]' \
'--include-relations[Include graph relations for affected checks, instead of just changed files]' \
'--stdin[Accept changed files from stdin for affected checks]' \
'-f[Force run and bypass cache, ignore changed files, and skip affected checks]' \
'--force[Force run and bypass cache, ignore changed files, and skip affected checks]' \
'-i[Run the pipeline and tasks interactively]' \
'--interactive[Run the pipeline and tasks interactively]' \
'--no-actions[Run the pipeline without sync and setup related actions]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'*::targets -- List of explicit task targets to run:_default' \
&& ret=0
;;
(setup)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(sync)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
":: :_moon__sync_commands" \
"*::: :->sync" \
&& ret=0

    case $state in
    (sync)
        words=($line[1] "${words[@]}")
        (( CURRENT += 1 ))
        curcontext="${curcontext%:*:*}:moon-sync-command-$line[1]:"
        case $line[1] in
            (code-owners)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--clean[Clean and remove previously generated file]' \
'--force[Bypass cache and force create file]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(config-schemas)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--force[Bypass cache and force create schemas]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(projects)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(vcs-hooks)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--clean[Clean and remove previously generated hooks]' \
'--force[Bypass cache and force create hooks]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
        esac
    ;;
esac
;;
(task)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--json[Print in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::target -- Task target to inspect:_default' \
&& ret=0
;;
(task-graph)
_arguments "${_arguments_options[@]}" : \
'--host=[The host address]:HOST:_default' \
'--port=[The port to bind to]:PORT:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--dependents[Include direct dependents of the focused target]' \
'--dot[Print the graph in DOT format]' \
'--json[Print the graph in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::target -- Task target to *only* graph:_default' \
&& ret=0
;;
(tasks)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--json[Print in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::project -- Filter tasks to a specific project:_default' \
&& ret=0
;;
(teardown)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(template)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--json[Print in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
'::id -- Template ID to inspect:_default' \
&& ret=0
;;
(templates)
_arguments "${_arguments_options[@]}" : \
'--filter=[Filter templates based on this pattern]:FILTER:_default' \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--json[Print in JSON format]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
(toolchain)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
":: :_moon__toolchain_commands" \
"*::: :->toolchain" \
&& ret=0

    case $state in
    (toolchain)
        words=($line[1] "${words[@]}")
        (( CURRENT += 1 ))
        curcontext="${curcontext%:*:*}:moon-toolchain-command-$line[1]:"
        case $line[1] in
            (add)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--minimal[Add with minimal configuration and prompts]' \
'--yes[Skip prompts and use default values]' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
':id -- Unique ID of the toolchain to add:_default' \
'::plugin -- Plugin locator string to find and load the toolchain:_default' \
&& ret=0
;;
(info)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
':id -- Toolchain ID to inspect:_default' \
'::plugin -- Plugin locator string to find and load the toolchain:_default' \
&& ret=0
;;
        esac
    ;;
esac
;;
(upgrade)
_arguments "${_arguments_options[@]}" : \
'--cache=[Mode for cache operations]:CACHE:_default' \
'-c+[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--concurrency=[Maximum number of threads to utilize]:CONCURRENCY:_default' \
'--log=[Lowest log level to output]:LOG:(off error warn info debug trace verbose)' \
'--log-file=[Path to a file to write logs to]:LOG_FILE:_files' \
'--theme=[Terminal theme to print with]:THEME:(dark light)' \
'--color[Force colored output]' \
'--dump[Dump a trace profile to the working directory]' \
'-q[Hide all moon console output]' \
'--quiet[Hide all moon console output]' \
'-h[Print help]' \
'--help[Print help]' \
'-V[Print version]' \
'--version[Print version]' \
&& ret=0
;;
        esac
    ;;
esac
}

(( $+functions[_moon_commands] )) ||
_moon_commands() {
    local commands; commands=(
'action-graph:Display an interactive dependency graph of actions.' \
'bin:Return an absolute path to a binary within the toolchain.' \
'check:Run build and test related tasks for one or many projects.' \
'ci:Run all affected tasks in a CI environment.' \
'clean:Clean the workspace and delete any stale or invalid artifacts.' \
'completions:Generate command completions for your current shell.' \
'debug:Debug internals.' \
'docker:Operations for integrating with Docker and Dockerfiles.' \
'exec:Low-level command for executing tasks in the action pipeline.' \
'ext:Execute an extension plugin.' \
'extension:Manage extension plugins.' \
'generate:Generate and scaffold files from a pre-defined template.' \
'hash:Inspect or diff the contents of a generated hashes.' \
'init:Initialize a new moon repository.' \
'mcp:Start an MCP (model context protocol) server that can respond to AI agent requests.' \
'migrate:Operations for migrating existing projects to moon.' \
'project:Display information about a single project.' \
'project-graph:Display an interactive graph of projects.' \
'projects:Display a table of all projects.' \
'query:Query information about moon, the environment, and more as JSON.' \
'run:Run one or many tasks in the action pipeline.' \
'setup:Setup the environment by installing all toolchains.' \
'sync:Sync the workspace and all projects to a healthy state.' \
'task:Display information about a single task.' \
'task-graph:Display an interactive graph of tasks.' \
'tasks:Display a table of all tasks.' \
'teardown:Teardown the environment by uninstalling all toolchains and deleting cache files.' \
'template:Display information about a single template.' \
'templates:List all templates that are available for code generation.' \
'toolchain:Manage toolchain plugins.' \
'upgrade:Upgrade to the latest version of moon.' \
    )
    _describe -t commands 'moon commands' commands "$@"
}
(( $+functions[_moon__action-graph_commands] )) ||
_moon__action-graph_commands() {
    local commands; commands=()
    _describe -t commands 'moon action-graph commands' commands "$@"
}
(( $+functions[_moon__bin_commands] )) ||
_moon__bin_commands() {
    local commands; commands=()
    _describe -t commands 'moon bin commands' commands "$@"
}
(( $+functions[_moon__check_commands] )) ||
_moon__check_commands() {
    local commands; commands=()
    _describe -t commands 'moon check commands' commands "$@"
}
(( $+functions[_moon__ci_commands] )) ||
_moon__ci_commands() {
    local commands; commands=()
    _describe -t commands 'moon ci commands' commands "$@"
}
(( $+functions[_moon__clean_commands] )) ||
_moon__clean_commands() {
    local commands; commands=()
    _describe -t commands 'moon clean commands' commands "$@"
}
(( $+functions[_moon__completions_commands] )) ||
_moon__completions_commands() {
    local commands; commands=()
    _describe -t commands 'moon completions commands' commands "$@"
}
(( $+functions[_moon__debug_commands] )) ||
_moon__debug_commands() {
    local commands; commands=(
'config:Debug loaded configuration.' \
'vcs:Debug the VCS.' \
    )
    _describe -t commands 'moon debug commands' commands "$@"
}
(( $+functions[_moon__debug__config_commands] )) ||
_moon__debug__config_commands() {
    local commands; commands=()
    _describe -t commands 'moon debug config commands' commands "$@"
}
(( $+functions[_moon__debug__vcs_commands] )) ||
_moon__debug__vcs_commands() {
    local commands; commands=()
    _describe -t commands 'moon debug vcs commands' commands "$@"
}
(( $+functions[_moon__docker_commands] )) ||
_moon__docker_commands() {
    local commands; commands=(
'file:Generate a Dockerfile for a project.' \
'prune:Remove extraneous dependencies within a Dockerfile.' \
'scaffold:Scaffold a repository skeleton for use within a Dockerfile.' \
'setup:Setup a Dockerfile by installing toolchains and dependencies for necessary projects.' \
    )
    _describe -t commands 'moon docker commands' commands "$@"
}
(( $+functions[_moon__docker__file_commands] )) ||
_moon__docker__file_commands() {
    local commands; commands=()
    _describe -t commands 'moon docker file commands' commands "$@"
}
(( $+functions[_moon__docker__prune_commands] )) ||
_moon__docker__prune_commands() {
    local commands; commands=()
    _describe -t commands 'moon docker prune commands' commands "$@"
}
(( $+functions[_moon__docker__scaffold_commands] )) ||
_moon__docker__scaffold_commands() {
    local commands; commands=()
    _describe -t commands 'moon docker scaffold commands' commands "$@"
}
(( $+functions[_moon__docker__setup_commands] )) ||
_moon__docker__setup_commands() {
    local commands; commands=()
    _describe -t commands 'moon docker setup commands' commands "$@"
}
(( $+functions[_moon__exec_commands] )) ||
_moon__exec_commands() {
    local commands; commands=()
    _describe -t commands 'moon exec commands' commands "$@"
}
(( $+functions[_moon__ext_commands] )) ||
_moon__ext_commands() {
    local commands; commands=()
    _describe -t commands 'moon ext commands' commands "$@"
}
(( $+functions[_moon__extension_commands] )) ||
_moon__extension_commands() {
    local commands; commands=(
'add:Add and configure an extension plugin.' \
'info:Show detailed information about an extension plugin.' \
    )
    _describe -t commands 'moon extension commands' commands "$@"
}
(( $+functions[_moon__extension__add_commands] )) ||
_moon__extension__add_commands() {
    local commands; commands=()
    _describe -t commands 'moon extension add commands' commands "$@"
}
(( $+functions[_moon__extension__info_commands] )) ||
_moon__extension__info_commands() {
    local commands; commands=()
    _describe -t commands 'moon extension info commands' commands "$@"
}
(( $+functions[_moon__generate_commands] )) ||
_moon__generate_commands() {
    local commands; commands=()
    _describe -t commands 'moon generate commands' commands "$@"
}
(( $+functions[_moon__hash_commands] )) ||
_moon__hash_commands() {
    local commands; commands=()
    _describe -t commands 'moon hash commands' commands "$@"
}
(( $+functions[_moon__init_commands] )) ||
_moon__init_commands() {
    local commands; commands=()
    _describe -t commands 'moon init commands' commands "$@"
}
(( $+functions[_moon__mcp_commands] )) ||
_moon__mcp_commands() {
    local commands; commands=()
    _describe -t commands 'moon mcp commands' commands "$@"
}
(( $+functions[_moon__migrate_commands] )) ||
_moon__migrate_commands() {
    local commands; commands=(
'v2:Migrate an existing moon v1 workspace to moon v2.' \
    )
    _describe -t commands 'moon migrate commands' commands "$@"
}
(( $+functions[_moon__migrate__v2_commands] )) ||
_moon__migrate__v2_commands() {
    local commands; commands=()
    _describe -t commands 'moon migrate v2 commands' commands "$@"
}
(( $+functions[_moon__project_commands] )) ||
_moon__project_commands() {
    local commands; commands=()
    _describe -t commands 'moon project commands' commands "$@"
}
(( $+functions[_moon__project-graph_commands] )) ||
_moon__project-graph_commands() {
    local commands; commands=()
    _describe -t commands 'moon project-graph commands' commands "$@"
}
(( $+functions[_moon__projects_commands] )) ||
_moon__projects_commands() {
    local commands; commands=()
    _describe -t commands 'moon projects commands' commands "$@"
}
(( $+functions[_moon__query_commands] )) ||
_moon__query_commands() {
    local commands; commands=(
'affected:Query affected status for projects and tasks.' \
'changed-files:Query for changed files between revisions.' \
'projects:Query for projects within the project graph.' \
'tasks:Query for tasks within the task graph, grouped by project.' \
    )
    _describe -t commands 'moon query commands' commands "$@"
}
(( $+functions[_moon__query__affected_commands] )) ||
_moon__query__affected_commands() {
    local commands; commands=()
    _describe -t commands 'moon query affected commands' commands "$@"
}
(( $+functions[_moon__query__changed-files_commands] )) ||
_moon__query__changed-files_commands() {
    local commands; commands=()
    _describe -t commands 'moon query changed-files commands' commands "$@"
}
(( $+functions[_moon__query__projects_commands] )) ||
_moon__query__projects_commands() {
    local commands; commands=()
    _describe -t commands 'moon query projects commands' commands "$@"
}
(( $+functions[_moon__query__tasks_commands] )) ||
_moon__query__tasks_commands() {
    local commands; commands=()
    _describe -t commands 'moon query tasks commands' commands "$@"
}
(( $+functions[_moon__run_commands] )) ||
_moon__run_commands() {
    local commands; commands=()
    _describe -t commands 'moon run commands' commands "$@"
}
(( $+functions[_moon__setup_commands] )) ||
_moon__setup_commands() {
    local commands; commands=()
    _describe -t commands 'moon setup commands' commands "$@"
}
(( $+functions[_moon__sync_commands] )) ||
_moon__sync_commands() {
    local commands; commands=(
'code-owners:Sync aggregated code owners to a \`CODEOWNERS\` file.' \
'config-schemas:Sync and generate configuration JSON schemas for use within editors.' \
'projects:Sync all projects and configs in the workspace.' \
'vcs-hooks:Sync and generate hook scripts for the workspace configured VCS.' \
    )
    _describe -t commands 'moon sync commands' commands "$@"
}
(( $+functions[_moon__sync__code-owners_commands] )) ||
_moon__sync__code-owners_commands() {
    local commands; commands=()
    _describe -t commands 'moon sync code-owners commands' commands "$@"
}
(( $+functions[_moon__sync__config-schemas_commands] )) ||
_moon__sync__config-schemas_commands() {
    local commands; commands=()
    _describe -t commands 'moon sync config-schemas commands' commands "$@"
}
(( $+functions[_moon__sync__projects_commands] )) ||
_moon__sync__projects_commands() {
    local commands; commands=()
    _describe -t commands 'moon sync projects commands' commands "$@"
}
(( $+functions[_moon__sync__vcs-hooks_commands] )) ||
_moon__sync__vcs-hooks_commands() {
    local commands; commands=()
    _describe -t commands 'moon sync vcs-hooks commands' commands "$@"
}
(( $+functions[_moon__task_commands] )) ||
_moon__task_commands() {
    local commands; commands=()
    _describe -t commands 'moon task commands' commands "$@"
}
(( $+functions[_moon__task-graph_commands] )) ||
_moon__task-graph_commands() {
    local commands; commands=()
    _describe -t commands 'moon task-graph commands' commands "$@"
}
(( $+functions[_moon__tasks_commands] )) ||
_moon__tasks_commands() {
    local commands; commands=()
    _describe -t commands 'moon tasks commands' commands "$@"
}
(( $+functions[_moon__teardown_commands] )) ||
_moon__teardown_commands() {
    local commands; commands=()
    _describe -t commands 'moon teardown commands' commands "$@"
}
(( $+functions[_moon__template_commands] )) ||
_moon__template_commands() {
    local commands; commands=()
    _describe -t commands 'moon template commands' commands "$@"
}
(( $+functions[_moon__templates_commands] )) ||
_moon__templates_commands() {
    local commands; commands=()
    _describe -t commands 'moon templates commands' commands "$@"
}
(( $+functions[_moon__toolchain_commands] )) ||
_moon__toolchain_commands() {
    local commands; commands=(
'add:Add and configure a toolchain plugin.' \
'info:Show detailed information about a toolchain plugin.' \
    )
    _describe -t commands 'moon toolchain commands' commands "$@"
}
(( $+functions[_moon__toolchain__add_commands] )) ||
_moon__toolchain__add_commands() {
    local commands; commands=()
    _describe -t commands 'moon toolchain add commands' commands "$@"
}
(( $+functions[_moon__toolchain__info_commands] )) ||
_moon__toolchain__info_commands() {
    local commands; commands=()
    _describe -t commands 'moon toolchain info commands' commands "$@"
}
(( $+functions[_moon__upgrade_commands] )) ||
_moon__upgrade_commands() {
    local commands; commands=()
    _describe -t commands 'moon upgrade commands' commands "$@"
}

if [ "$funcstack[1]" = "_moon" ]; then
    _moon "$@"
else
    compdef _moon moon
fi
