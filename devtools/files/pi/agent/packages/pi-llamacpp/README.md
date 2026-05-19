# LLamaCpp Provider for PI

## Idea

Takes settings from pi SettingsManager. 

`llamacpp#modelPresetsFile: string` - path to llama-server model preset file. (defaults to `~/.config/llamacpp/model-presets.ini`)
`llamacpp#serverBinaryPath: string` - path to llama-server binary (defaults to `llama-server` in PATH).

Auto behaviour:

- auto starts llama-server if not running, using the model presets file specified in settings.
  this doesn't load a model yet.
- registers a provider for llama-server, which lists available models in the `/models` 
https://github.com/ggml-org/llama.cpp/blob/dd7cad7197f991b18ded6aca46ff095972b95318/tools/server/README.md#get-models-list-available-models
- when a model is selected, it sends a request to load the model in llama-server, and waits for it to be ready.
- when request is made check that the model is loaded, if not, wait for it to be loaded before sending the request to llama-server.


Commands: 

- `/llamacpp reload` - reloads the model presets file and updates the list of available models. Useful if you add new models to the presets file while PI is running.
- `/llamacpp start` - starts llama-server if it's not already running.
- `/llamacpp stop` - stops llama-server if it's running.
- `/llamacpp status` - shows the status of llama-server, including whether it's running, which model is currently loaded, and any errors if applicable.
- `/llamacpp list` - lists the available models from the model presets file, along with their status (loaded/not loaded).
