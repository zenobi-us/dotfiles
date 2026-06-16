#!/bin/bash

HERE=$(dirname "$(realpath "${BASH_SOURCE[0]:-$0}")")

llama-server \
  --host 0.0.0.0 \
  --port 2000 \
  --models-dir /run/media/zenobius/Backup/LLMModels/ \
  --models-preset "$HERE/models.ini" \
  --models-autoload \
  --models-max 1
