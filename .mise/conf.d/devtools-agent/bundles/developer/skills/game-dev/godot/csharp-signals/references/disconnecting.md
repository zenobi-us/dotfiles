# Disconnecting Signals (C#)

Reference for `skills/csharp-signals/SKILL.md` — why C# MUST disconnect (unlike GDScript), `-=` operator + `_ExitTree`, SafeDisconnect helper.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Disconnecting Signals

### The `-=` operator and `_ExitTree()` cleanup

**C# delegates are not garbage-collected automatically when a node is freed.** If you do not disconnect, the signal source holds a delegate reference to the freed node, causing memory leaks and `ObjectDisposedException` or `InvalidOperationException` on the next emission.

```csharp
using Godot;

public partial class HudLayer : CanvasLayer
{
    private Player _player;

    public override void _Ready()
    {
        _player = GetNode<Player>("../Player");
        _player.HealthChanged += OnHealthChanged;
        _player.Died          += OnDied;
        _player.ItemCollected += OnItemCollected;
    }

    // _ExitTree is called before the node is removed from the tree.
    // This is the correct place to disconnect — _player is still valid here.
    public override void _ExitTree()
    {
        // Mirror every += from _Ready() with a -=.
        _player.HealthChanged -= OnHealthChanged;
        _player.Died          -= OnDied;
        _player.ItemCollected -= OnItemCollected;
    }

    private void OnHealthChanged(int current, int maximum) { /* ... */ }
    private void OnDied() { /* ... */ }
    private void OnItemCollected(string itemName) { /* ... */ }
}
```

### SafeDisconnect pattern

When the signal source may have already been freed (e.g., it lives in a different scene), guard the disconnection with `IsInstanceValid`.

```csharp
public override void _ExitTree()
{
    if (IsInstanceValid(_player))
    {
        _player.HealthChanged -= OnHealthChanged;
        _player.Died          -= OnDied;
    }
}
```

### Why C# MUST disconnect (unlike GDScript)

In GDScript, signals use Godot's internal reference system, which automatically invalidates connections when a node is freed. In C#, the `+=` operator creates a standard .NET multicast delegate, held by the emitting object. Godot's object lifetime system does not reach into .NET delegate lists. The result:

- The emitter keeps the subscriber alive longer than expected (memory leak).
- When the emitter fires the signal, the delegate invocation reaches a freed Godot node and throws.
- The bug is often silent in debug builds with `IsInstanceValid` guards, but crashes in release builds.

**Rule:** every `+=` in `_Ready()` must have a matching `-=` in `_ExitTree()`.

---

