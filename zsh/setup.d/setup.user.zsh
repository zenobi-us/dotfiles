log "User> Setup Git Identity"

log "User> Your First and LastName:"
read USER_GIT_NAME
git config --global user.name "${USER_GIT_NAME}"

log "User> Your email address"
read USER_GIT_EMAIL
git config --global user.email "${USER_GIT_EMAIL}"
