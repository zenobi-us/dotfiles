export const plan = {
  "schema": "collect-evidence/v1",
  "kind": "plan",
  "workId": "native-validation",
  "driver": "tui",
  "base": "terminal://private",
  "terminal": {
    "command": [
      "/usr/bin/python3",
      "/tmp/ce-native-recovery-LxHQWV/fixture.py"
    ],
    "cwd": "/tmp/ce-native-recovery-LxHQWV",
    "columns": 80,
    "rows": 24,
    "font": "monospace:size=12",
    "lineHeight": 20
  },
  "approval": {
    "origins": [],
    "confirmations": [],
    "terminal": {
      "command": [
        "/usr/bin/python3",
        "/tmp/ce-native-recovery-LxHQWV/fixture.py"
      ],
      "cwd": "/tmp/ce-native-recovery-LxHQWV"
    }
  },
  "tests": [
    {
      "id": "safety",
      "claim": "Stop before unsafe input",
      "pass": "No unsafe input is sent",
      "fail": "Unsafe input is sent",
      "steps": [
        {
          "do": "press",
          "says": "Do not send unapproved input.",
          "key": "n",
          "screen": "Ready screen"
        }
      ]
    }
  ]
};
