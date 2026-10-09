function resign-commits () {
    email="${1:-$(command git_current_user_email)}"
    echo "Resigning commits with ${email}"

    git filter-branch --commit-filter """
    if [ "$GIT_COMMITTER_EMAIL" = "${email}" ]; then
        git commit-tree -S "$@";
    else
        git commit-tree "$@";
    fi
    """
    HEAD
}


function git_forge_all_commits () {
    email="${1:-$(command git_current_user_email)}"
    name="${1:-$(command git_current_user_name)}"
    echo "Forging all commits with ${name} <${email}>"

    git filter-branch -f --env-filter "
        GIT_AUTHOR_NAME=${name}
        GIT_AUTHOR_EMAIL=${email}
        GIT_COMMITTER_NAME=${name}
        GIT_COMMITTER_EMAIL=${email}
    " HEAD
}