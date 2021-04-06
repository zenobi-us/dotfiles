export GOPATH="$HOME/Projects/golang";
export GOROOT="$HOME/.go";
export PATH="$GOPATH/bin:$PATH";
export G_DOWNLOAD_URL=https://raw.githubusercontent.com/stefanmaric/g/master/bin/g;

# g-install: do NOT edit, see https://github.com/stefanmaric/g
if [ ! $(command -v g) ]; then
    mkdir -p "$GOPATH/bin"
    curl --location --silent --show-error $G_DOWNLOAD_URL > "$GOPATH/bin/g"
    chmod +x "$GOPATH/bin/g"
fi
