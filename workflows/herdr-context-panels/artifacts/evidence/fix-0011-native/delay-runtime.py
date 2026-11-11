#!/usr/bin/python3
# Native verification only. Delay one real canonical response without changing panel source.
import json, os, pathlib, subprocess, sys, time
root = pathlib.Path(__file__).parent
request = json.loads(sys.argv[2])
configuration = root / 'delay-config.json'
try:
    config = json.loads(configuration.read_text())
    matches = all(request.get(key) == value for key, value in config['match'].items())
    if matches:
        configuration.rename(root / (config['id'] + '-started.json'))
    else:
        config = None
except FileNotFoundError:
    config = None
result = subprocess.run(['/var/home/zenobius/.local/share/mise/installs/bun/1.4.3/bin/bun', *sys.argv[1:]], capture_output=True)
if config:
    observation = {'request': request, 'code': result.returncode, 'stdout': result.stdout.decode(), 'stderr': result.stderr.decode(), 'captured_at': time.time()}
    (root / (config['id'] + '-response.json')).write_text(json.dumps(observation, indent=2))
    while not (root / (config['id'] + '-release')).exists():
        time.sleep(0.025)
    observation['released_at'] = time.time()
    (root / (config['id'] + '-response.json')).write_text(json.dumps(observation, indent=2))
sys.stdout.buffer.write(result.stdout)
sys.stderr.buffer.write(result.stderr)
sys.exit(result.returncode)
