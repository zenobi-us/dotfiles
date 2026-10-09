---
name: software-design
description: Organizes reusable software design pattern references, when choosing a structural, creational, or behavioral pattern, resulting in faster selection of the right pattern-specific reference.
---

# Software Design Patterns

Read the reference file that matches the design constraint you face. Each
file gives intent, applicability signals, contraindications, an
implementation checklist, and misuse checks for one pattern.

## Creational Patterns

Use these when object creation itself is the problem.

- [Abstract Factory](references/abstract-factory.md) — Use when you must create compatible sets of related objects without binding client code to concrete classes.
- [Builder](references/builder.md) — Use when object construction requires many ordered or optional steps and constructor signatures are becoming brittle.
- [Factory Method](references/factory-method.md) — Use when object creation varies by context and you need to extend product types without rewriting client orchestration code.
- [Prototype](references/prototype-pattern.md) — Use when object creation is expensive or dynamic and cloning existing configured instances is safer than rebuilding from scratch.
- [Singleton](references/singleton.md) — Use when exactly one coordinated instance is required and its lifecycle, access, and state boundaries can be strictly controlled.

## Structural Patterns

Use these when the problem is how objects and classes fit together.

- [Adapter](references/adapter.md) — Use when an existing class has useful behavior but an incompatible interface blocks integration with client code.
- [Bridge](references/bridge.md) — Use when abstractions and implementations need to evolve independently without creating subclass explosion.
- [Composite](references/composite.md) — Use when clients must treat individual objects and nested object groups uniformly through one interface.
- [Decorator](references/decorator.md) — Use when responsibilities must be added dynamically to objects without subclass proliferation.
- [Facade](references/facade.md) — Use when a subsystem is too complex for clients and you need a focused, stable entry point.
- [Flyweight](references/flyweight.md) — Use when huge numbers of similar objects cause memory pressure and shared intrinsic state can be externalized.
- [Proxy](references/proxy.md) — Use when access to an object must be controlled, deferred, secured, or monitored through a surrogate.

## Behavioral Patterns

Use these when the problem is how objects communicate or change behavior.

- [Chain of Responsibility](references/chain-of-responsibility.md) — Use when multiple handlers may process a request and you need flexible routing without hard-coding sender-to-receiver coupling.
- [Command](references/command.md) — Use when operations must be represented as objects so execution, scheduling, undo, and logging can vary independently from invokers.
- [Iterator](references/iterator.md) — Use when clients must traverse aggregate data uniformly without exposing internal collection representation.
- [Mediator](references/mediator.md) — Use when many components communicate in tangled peer-to-peer paths and interactions should be coordinated through a central policy hub.
- [Memento](references/memento.md) — Use when object state must be snapshotted and restored later without exposing internal representation details.
- [Observer](references/observer.md) — Use when state changes in one object must notify many dependents while keeping publishers decoupled from subscriber implementations.
- [State](references/state.md) — Use when an object's behavior changes by internal mode and conditional branches are growing around state transitions.
- [Strategy](references/strategy.md) — Use when multiple interchangeable algorithms are needed and clients should switch behavior without branching on concrete implementations.
- [Template Method](references/template-method.md) — Use when an algorithm skeleton is stable but specific steps must vary across implementations without duplicating workflow structure.
- [Visitor](references/visitor.md) — Use when stable object structures need new operations added frequently without modifying each element class.
