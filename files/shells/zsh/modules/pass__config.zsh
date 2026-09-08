export PASSWORD_STORE_ENABLE_EXTENSIONS=true
# if gopass doesn't exist, this will fail
if [ command -v gopass &> /dev/null ]; then
    $(gopass completion zsh)
fi

