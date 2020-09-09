#!/bin/bash

function log() {
    local prefix='[DOTFILES-INSTALL]'
    local timestamp=`date +%y/%m/%d_%H:%M:%S`
    echo $prefix $timestamp :: "${*}"
}

function info() {
    [[ ! -z "${VERBOSE}" ]] && log "${*}"
}

account="airtonix"
repo="dotfiles"
branch="master"

dotfilesTempDir=$(mktemp -d -t $account-$repo-$branch-XXXXXX)
dotfilesInstallDir=~/.dotfiles
sourceFile="${dotfilesTempDir}/dotfiles.zip"

info "
  dotfilesTempDir: ${dotfilesTempDir}
  sourceFile: ${sourceFile}
  dotfilesInstallDir: ${dotfilesInstallDir}
"

function Download {
  local Url=$1
  local File=$2
  log "Downloading ${Url} to ${File}"
  [ -z "${NODOWNLOAD}" ] && curl -L $Url --output $File
  info $(ls -a1 $(dirname ${File}))
}

function Unzip {
  local File=$1
  local Destination=${2:-pwd}
  log "Unzipping ${File} to ${Destination}"
  [ -z "${NOUNZIP}" ] && \
    mkdir -p $Destination && \
    unzip $File -d $dotfilesTempDir && \
    mv $dotfilesTempDir/*/* $Destination
  info Files unzipped: $(find "$Destination" -type f | wc -l)
}

function Setup {
  local currentLocation=$(pwd)
  local setupDir=$1
  log "Setup ${setupDir}"
  cd $setupDir
  [ -z "${NOSETUP}" ] && \
    chmod +x ./zsh/setup && \
    ./zsh/setup
  cd $currentLocation
}

function Clean {
  local targetDir=$1
  log "Clean ${targetDir}"
  [ -z "${NOCLEAN}" ] && \
    [ -d "$targetDir" ] &&
    rm -rf $targetDir
}

log "Start"

Download "https://github.com/$account/$repo/archive/$branch.zip" $sourceFile
Clean $dotfilesInstallDir
Unzip $sourceFile $dotfilesInstallDir
Setup $dotfilesInstallDir

log "Done"
