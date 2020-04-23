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

function global:DockerTableToPowershell {
    $input |
    Select-Object -Skip 1 | # skip the header row
    ForEach-Object {
        # Split on space(s)
        $Values = $_ -split '\s+'

        # Put together object and store in $Objects array
        Write-Output [PSCustomObject]@{
            ContainerID = $Values[0]
            Image       = $Values[1]
            Command     = $Values[2]
            Created     = $Values[3]
            Status      = $Values[4]
            Ports       = $Values[5]
            Names       = $Values[6]
        }
    }
}

function global:EnsureDockerNetworkExist {
  Param(
    [string]$name = 'UntitledNetwork'
  )

  docker network ls |
    DockerTableToPowershell $name
}

function global:Traefik {
  Param(
    [string]$port = 80,
    [string]$name = 'LocalDevProxy',
    [string]$network = 'LocalDevProxyNetwork'
  )

  cd $PsScriptRoot/../../apps/docker/traefik
  docker-compose up
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

function global:aws {
  docker run --rm -it `
    -w /root `
    -v ${HOME}/.aws/:/root/.aws/ `
    -v ${PWD}:/root/ `
    nexus.morgoth.studylink.com:5000/awscli `
    aws $args
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

