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
    "confirmations": [
      "transition.2"
    ],
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
      "id": "transition",
      "claim": "Native delayed screen transition",
      "pass": "Both screens match native pixels",
      "fail": "Screen or native pixels differ",
      "steps": [
        {
          "do": "wait",
          "locator": "screen",
          "text": "Ready screen",
          "shot": "ready-screen"
        },
        {
          "do": "press",
          "says": "Open details.",
          "key": "n",
          "screen": "Ready screen"
        },
        {
          "do": "wait",
          "locator": "screen",
          "text": "Details screen",
          "shot": "details-screen"
        }
      ]
    }
  ]
};
