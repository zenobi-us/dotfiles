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
      "id": "interruption",
      "claim": "Interrupt native wait",
      "pass": "No run is sealed after interruption",
      "fail": "An interrupted run is sealed",
      "steps": [
        {
          "do": "wait",
          "locator": "screen",
          "text": "Never appears",
          "timeoutMs": 60000
        }
      ]
    }
  ]
};
