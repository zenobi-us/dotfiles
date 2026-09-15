> ← Back to [SKILL.md](../SKILL.md)

# Common Movement Recipes

Two recipes that come up in almost every platformer: **Dash** (timer-based velocity override for a short burst) and **Wall Jump** (vertical wall slide + bounce off `get_wall_normal()` / `GetWallNormal()` when jump is pressed). Both apply to a `CharacterBody2D` and slot into the standard `_physics_process` loop alongside gravity and horizontal movement.

---

## Dash (GDScript)

```gdscript
extends CharacterBody2D

@export var dash_speed: float = 600.0
@export var dash_duration: float = 0.2

var is_dashing: bool = false
var _dash_timer: float = 0.0
var _dash_direction: Vector2 = Vector2.ZERO

func _physics_process(delta: float) -> void:
    if Input.is_action_just_pressed("dash") and not is_dashing:
        is_dashing = true
        _dash_timer = dash_duration
        # Dash in input direction, or forward if no input
        _dash_direction = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
        if _dash_direction == Vector2.ZERO:
            _dash_direction = Vector2.RIGHT.rotated(rotation)

    if is_dashing:
        _dash_timer -= delta
        velocity = _dash_direction * dash_speed
        if _dash_timer <= 0.0:
            is_dashing = false

    move_and_slide()
```

## Dash (C#)

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    [Export] public float DashSpeed = 800f;
    [Export] public float DashDuration = 0.15f;

    private float _dashTimer;
    private Vector2 _dashDirection;

    public override void _PhysicsProcess(double delta)
    {
        if (_dashTimer > 0f)
        {
            _dashTimer -= (float)delta;
            Velocity = _dashDirection * DashSpeed;
            MoveAndSlide();
            return;
        }

        if (Input.IsActionJustPressed("dash"))
        {
            var inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
            if (inputDir != Vector2.Zero)
            {
                _dashDirection = inputDir.Normalized();
                _dashTimer = DashDuration;
            }
        }

        // Normal movement falls through here
    }
}
```

---

## Wall Jump (GDScript)

```gdscript
extends CharacterBody2D

@export var speed: float = 200.0
@export var jump_velocity: float = -400.0
@export var wall_jump_velocity: Vector2 = Vector2(250.0, -350.0)

var _gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity.y += _gravity * delta

    # Wall jump: bounce off in the direction of the wall normal
    if Input.is_action_just_pressed("ui_accept"):
        if is_on_floor():
            velocity.y = jump_velocity
        elif is_on_wall():
            var wall_normal: Vector2 = get_wall_normal()
            velocity = wall_normal * wall_jump_velocity.x + Vector2(0, wall_jump_velocity.y)

    var input_x: float = Input.get_axis("ui_left", "ui_right")
    velocity.x = move_toward(velocity.x, input_x * speed, 1000.0 * delta)

    move_and_slide()
```

## Wall Jump (C#)

```csharp
using Godot;

public partial class WallJumpPlayer : CharacterBody2D
{
    [Export] public float Speed = 200f;
    [Export] public float JumpVelocity = -400f;
    [Export] public Vector2 WallJumpVelocity = new(250f, -350f);

    private float _gravity = (float)ProjectSettings.GetSetting("physics/2d/default_gravity");

    public override void _PhysicsProcess(double delta)
    {
        var velocity = Velocity;

        if (!IsOnFloor())
            velocity.Y += _gravity * (float)delta;

        // Wall jump: bounce off in the direction of the wall normal
        if (Input.IsActionJustPressed("ui_accept"))
        {
            if (IsOnFloor())
            {
                velocity.Y = JumpVelocity;
            }
            else if (IsOnWall())
            {
                var wallNormal = GetWallNormal();
                velocity = wallNormal * WallJumpVelocity.X + new Vector2(0, WallJumpVelocity.Y);
            }
        }

        var inputX = Input.GetAxis("ui_left", "ui_right");
        velocity.X = Mathf.MoveToward(velocity.X, inputX * Speed, 1000f * (float)delta);

        Velocity = velocity;
        MoveAndSlide();
    }
}
```
