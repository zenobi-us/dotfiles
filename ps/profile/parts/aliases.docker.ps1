#docker rm $(docker ps -a -q)
function global:Docker-Remove-StoppedContainers {
  foreach ($id in & docker ps -a -q) {
    & docker rm $id }
}

#docker rmi $(docker images -f "dangling=true" -q)
function global:Docker-Remove-DanglingImages {
  foreach ($id in & docker images -q -f 'dangling=true') {
    & docker rmi $id }
}

#docker volume rm $(docker volume ls -qf dangling=true)
function global:Docker-Remove-DanglingVolumes {
  foreach ($id in & docker volume ls -q -f 'dangling=true') {
    & docker volume rm $id }
}


function global:EnsureDockerNetworkExist {
  Param(
    [string]$name = 'UntitledNetwork'
  )
  $existing = $(docker network ls --format "{{ .Name }}")
  $exists = $existing.Contains($name)

  if (!$exists) {
    write-host "Creating Network $name"
    docker network create "${name}"
  }

}

function global:Traefik {
  Param(
    [string]$network = 'LocalDevProxyNetwork'
  )

  EnsureDockerNetworkExist $network

  docker run `
  --rm `
  --publish="80:80" `
  --name="traefik" `
  --network="${network}" `
  --label="traefik.enable=true" `
  --label="traefik.http.routers.api.rule=Host(``traefik.localtest.me``)" `
  --label="traefik.http.routers.api.service=api@internal" `
  --volume="/var/run/docker.sock:/var/run/docker.sock" `
  traefik:v2.2 `
  --global.checkNewVersion="true" `
  --providers.docker="true" `
  --providers.docker.exposedbydefault="false" `
  --providers.docker.network="LocalDevProxyNetwork" `
  --providers.docker.defaultRule="Host(`{{ .Name }}.localtest.me`)" `
  --log.level="INFO" `
  --api
}

function global:Mirror-Website {
  Param(
    [string]$url
  )

  docker run --rm -it `
    -v "$(pwd):/app" `
    wget --mirror --convert-links --adjust-extension --page-requisites --no-parent $url

}

function global:Docker-Dry {
  docker run --rm -it `
    -v /var/run/docker.sock:/var/run/docker.sock `
    -e DOCKER_HOST=$DOCKER_HOST `
    moncho/dry
}

function global:aws-shell {
  docker run --rm -it `
    -w /root `
    -v ${HOME}/.aws/:/root/.aws/ `
    -v ${PWD}:/root/ `
    nexus.morgoth.studylink.com:5000/awscli `
    /bin/sh
}

function global:Docker-Dive {
  docker run --rm -it `
      -v /var/run/docker.sock:/var/run/docker.sock `
      wagoodman/dive:latest $args
}

New-Alias -Name dive -Value Docker-Dive

