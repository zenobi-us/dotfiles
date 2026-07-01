import {
  type HookAction,
  type HookAsyncConfig,
  type HookBashActionConfig,
  type HookBehavior,
  type HookCommandActionConfig,
  type HookCondition,
  type HookConfig,
  type HookConfirmActionConfig,
  type HookNotifyActionConfig,
  type HookNotifyLevel,
  type HookOverrideEntry,
  type HookRunIn,
  type HookScope,
  type HookPathConditionKey,
  type HookSetStatusActionConfig,
  type HookToolActionConfig,
  type HookValidationError,
  isHookBehavior,
  isHookEvent,
  isHookLegacyCondition,
  isHookPathConditionKey,
  isHookRunIn,
  isHookScope,
} from "../types.js"
import { isNonEmptyString, isRecord } from "./yaml-envelope.js"

export function createError(
  filePath: string,
  code: HookValidationError["code"],
  message: string,
  errorPath?: string,
): HookValidationError {
  return {
    code,
    filePath,
    message,
    ...(errorPath ? { path: errorPath } : {}),
  }
}

export function parseHookDefinition(
  filePath: string,
  hookDefinition: unknown,
  index: number,
  seenIds: Set<string>,
): { hook?: HookConfig; override?: HookOverrideEntry; errors: HookValidationError[] } {
  if (!isRecord(hookDefinition)) {
    return { errors: [createError(filePath, "invalid_hook", `hooks[${index}] must be an object.`, `hooks[${index}]`)] }
  }

  const idResult = parseHookId(filePath, hookDefinition.id, index, seenIds)
  const overrideResult = parseOverrideTarget(filePath, hookDefinition.override, hookDefinition.disable, index)

  if (overrideResult.isDisableOverride) {
    return {
      override: {
        targetId: overrideResult.targetId!,
        disable: true,
        source: { filePath, index },
      },
      errors: [...idResult.errors, ...overrideResult.errors],
    }
  }

  const event = hookDefinition.event
  if (!isHookEvent(event)) {
    return { errors: [...idResult.errors, ...overrideResult.errors, createError(filePath, "invalid_event", `hooks[${index}].event is not a supported hook event.`, `hooks[${index}].event`)] }
  }

  const scopeResult = parseScope(filePath, hookDefinition.scope, index)
  const runInResult = parseRunIn(filePath, hookDefinition.runIn, index)
  const actionResult = parseHookAction(filePath, hookDefinition.action, event, index)
  const asyncResult = parseAsync(filePath, hookDefinition.async, event, hookDefinition.actions, hookDefinition.action, index)

  const conditionsResult = parseConditions(filePath, hookDefinition.conditions, event, index)
  const actionsResult = parseActions(filePath, hookDefinition.actions, index)
  const errors = [...idResult.errors, ...overrideResult.errors, ...scopeResult.errors, ...runInResult.errors, ...actionResult.errors, ...asyncResult.errors, ...conditionsResult.errors, ...actionsResult.errors]

  if (errors.length > 0 || actionsResult.actions.length === 0) {
    return { errors }
  }

  const hook: HookConfig = {
    ...(idResult.id ? { id: idResult.id } : {}),
    event,
    ...(actionResult.action ? { action: actionResult.action } : {}),
    actions: actionsResult.actions,
    scope: scopeResult.scope,
    runIn: runInResult.runIn,
    ...(asyncResult.async ? { async: asyncResult.async } : {}),
    ...(conditionsResult.conditions ? { conditions: conditionsResult.conditions } : {}),
    source: { filePath, index },
  }

  if (overrideResult.targetId) {
    return {
      override: {
        targetId: overrideResult.targetId,
        disable: false,
        replacement: hook,
        source: { filePath, index },
      },
      errors,
    }
  }

  return {
    hook,
    errors,
  }
}

export function parseScope(
  filePath: string,
  scope: unknown,
  index: number,
): { scope: HookScope; errors: HookValidationError[] } {
  if (scope === undefined) {
    return { scope: "all", errors: [] }
  }

  if (!isHookScope(scope)) {
    return {
      scope: "all",
      errors: [createError(filePath, "invalid_scope", `hooks[${index}].scope must be one of: all, main, child.`, `hooks[${index}].scope`)],
    }
  }

  return { scope, errors: [] }
}

export function parseRunIn(
  filePath: string,
  runIn: unknown,
  index: number,
): { runIn: HookRunIn; errors: HookValidationError[] } {
  if (runIn === undefined) {
    return { runIn: "current", errors: [] }
  }

  if (!isHookRunIn(runIn)) {
    return {
      runIn: "current",
      errors: [createError(filePath, "invalid_run_in", `hooks[${index}].runIn must be one of: current, main.`, `hooks[${index}].runIn`)],
    }
  }

  return { runIn, errors: [] }
}

export function parseAsync(
  filePath: string,
  async_: unknown,
  event: unknown,
  actions: unknown,
  hookAction: unknown,
  index: number,
): { async?: true | HookAsyncConfig; errors: HookValidationError[] } {
  if (async_ === undefined) {
    return { errors: [] }
  }

  const normalized = normalizeAsyncConfig(filePath, async_, index)
  if (normalized.errors.length > 0 || !normalized.enabled) {
    return {
      errors: normalized.errors,
    }
  }

  if (typeof event === "string" && event.startsWith("tool.before")) {
    return {
      errors: [createError(filePath, "invalid_async", `hooks[${index}].async cannot be true for tool.before events because blocking requires synchronous execution.`, `hooks[${index}].async`)],
    }
  }

  if (typeof event === "string" && event === "session.idle") {
    return {
      errors: [createError(filePath, "invalid_async", `hooks[${index}].async cannot be true for session.idle events because idle dispatch must complete before tracked changes are consumed.`, `hooks[${index}].async`)],
    }
  }

  // P2 #21 fix: `action: stop` only takes effect on `tool.before.*` (those
  // events are already rejected above as async). For any other event the
  // combination is meaningless: the action runs after the tool has already
  // executed, and the runtime would silently drop the stop. Earlier we
  // returned silently here; now we surface a parse-time error so authors
  // see the misconfiguration instead of debugging a no-op at runtime.
  // The core-runtime lane added a runtime-side warning as a defence-in-depth
  // safety net; this rejection is the front-of-line gate.
  if (isHookBehavior(hookAction) && hookAction === "stop") {
    return {
      errors: [
        createError(
          filePath,
          "invalid_hook_action",
          `hooks[${index}] async hooks cannot use action: stop. action: stop only blocks tool.before.* events, which already disallow async execution.`,
          `hooks[${index}].action`,
        ),
      ],
    }
  }

  if (
    Array.isArray(actions) &&
    actions.some(
      (a) =>
        typeof a === "object" &&
        a !== null &&
        ("command" in a || "tool" in a || "notify" in a || "confirm" in a || "setStatus" in a),
    )
  ) {
    return {
      errors: [
        createError(
          filePath,
          "invalid_async",
          `hooks[${index}].async hooks must use only bash actions. command, tool, notify, confirm, and setStatus actions either have no timeout, depend on the live UI session, or block the agent turn, and would stall or misroute the async queue.`,
          `hooks[${index}].async`,
        ),
      ],
    }
  }

  return { async: normalized.config, errors: [] }
}

function normalizeAsyncConfig(
  filePath: string,
  value: unknown,
  index: number,
): { enabled: boolean; config?: true | HookAsyncConfig; errors: HookValidationError[] } {
  if (value === false) {
    return { enabled: false, errors: [] }
  }

  if (value === true) {
    return { enabled: true, config: true, errors: [] }
  }

  if (!isRecord(value)) {
    return {
      enabled: false,
      errors: [createError(filePath, "invalid_async", `hooks[${index}].async must be a boolean or { group?, concurrency? }.`, `hooks[${index}].async`)],
    }
  }

  const group = value.group
  if (group !== undefined && !isNonEmptyString(group)) {
    return {
      enabled: false,
      errors: [createError(filePath, "invalid_async", `hooks[${index}].async.group must be a non-empty string.`, `hooks[${index}].async.group`)],
    }
  }

  const concurrency = value.concurrency
  if (
    concurrency !== undefined &&
    (typeof concurrency !== "number" || !Number.isInteger(concurrency) || concurrency <= 0)
  ) {
    return {
      enabled: false,
      errors: [createError(filePath, "invalid_async", `hooks[${index}].async.concurrency must be a positive integer.`, `hooks[${index}].async.concurrency`)],
    }
  }

  if (Object.keys(value).some((key) => key !== "group" && key !== "concurrency")) {
    return {
      enabled: false,
      errors: [createError(filePath, "invalid_async", `hooks[${index}].async only supports group and concurrency.`, `hooks[${index}].async`)],
    }
  }

  const normalizedGroup = group?.trim()
  const config: HookAsyncConfig = {
    ...(normalizedGroup !== undefined ? { group: normalizedGroup } : {}),
    ...(concurrency !== undefined ? { concurrency } : {}),
  }

  return { enabled: true, config: Object.keys(config).length > 0 ? config : true, errors: [] }
}

function parseHookAction(
  filePath: string,
  action: unknown,
  event: HookConfig["event"],
  index: number,
): { action?: HookBehavior; errors: HookValidationError[] } {
  if (action === undefined) {
    return { errors: [] }
  }

  if (!isHookBehavior(action)) {
    return {
      errors: [createError(filePath, "invalid_hook_action", `hooks[${index}].action must be: stop.`, `hooks[${index}].action`)],
    }
  }

  if (!event.startsWith("tool.before.")) {
    return {
      errors: [createError(filePath, "invalid_hook_action", `hooks[${index}].action is only supported on tool.before.* events.`, `hooks[${index}].action`)],
    }
  }

  return { action, errors: [] }
}

export function parseConditions(
  filePath: string,
  conditions: unknown,
  event: HookConfig["event"],
  index: number,
): { conditions?: HookCondition[]; errors: HookValidationError[] } {
  if (conditions === undefined) {
    return { errors: [] }
  }

  if (!Array.isArray(conditions)) {
    return {
      errors: [createError(filePath, "invalid_conditions", `hooks[${index}].conditions must be an array.`, `hooks[${index}].conditions`)],
    }
  }

  const parsedConditions: HookCondition[] = []

  for (const [conditionIndex, condition] of conditions.entries()) {
    if (isHookLegacyCondition(condition)) {
      parsedConditions.push(condition)
      continue
    }

    const parsedCondition = parseStructuredCondition(filePath, condition, event, index, conditionIndex)
    if (parsedCondition.error) {
      return { errors: [parsedCondition.error] }
    }

    parsedConditions.push(parsedCondition.condition)
  }

  return { conditions: parsedConditions, errors: [] }
}

function parseStructuredCondition(
  filePath: string,
  condition: unknown,
  event: HookConfig["event"],
  hookIndex: number,
  conditionIndex: number,
): { condition: HookCondition; error?: undefined } | { condition?: undefined; error: HookValidationError } {
  const conditionPath = `hooks[${hookIndex}].conditions[${conditionIndex}]`

  if (!isRecord(condition)) {
    return {
      error: createError(filePath, "invalid_conditions", `${conditionPath} is not a supported condition.`, conditionPath),
    }
  }

  const keys = Object.keys(condition)
  if (keys.length !== 1) {
    return {
      error: createError(
        filePath,
        "invalid_conditions",
        `${conditionPath} must define exactly one supported condition key.`,
        conditionPath,
      ),
    }
  }

  const [key] = keys
  if (!isHookPathConditionKey(key)) {
    return {
      error: createError(filePath, "invalid_conditions", `${conditionPath}.${key} is not a supported condition key.`, `${conditionPath}.${key}`),
    }
  }

  if (!supportsPathConditions(event)) {
    return {
      error: createError(
        filePath,
        "invalid_conditions",
        `${conditionPath}.${key} is only supported on file.changed, session.idle, and tool.after.* hooks.`,
        `${conditionPath}.${key}`,
      ),
    }
  }

  const values = normalizePathConditionValues(condition[key], `${conditionPath}.${key}`)
  if (values.error) {
    return { error: createError(filePath, "invalid_conditions", values.error.message, values.error.path) }
  }

  return { condition: { [key]: values.values } as Record<HookPathConditionKey, readonly string[]> as HookCondition }
}

function normalizePathConditionValues(
  value: unknown,
  path: string,
): { values: readonly string[]; error?: undefined } | { values?: undefined; error: { message: string; path: string } } {
  if (isNonEmptyString(value)) {
    return { values: [value] }
  }

  if (!Array.isArray(value)) {
    return {
      error: {
        message: `${path} must be a non-empty string or non-empty string array.`,
        path,
      },
    }
  }

  if (value.length === 0) {
    return {
      error: {
        message: `${path} must not be an empty array.`,
        path,
      },
    }
  }

  const invalidIndex = value.findIndex((entry) => !isNonEmptyString(entry))
  if (invalidIndex >= 0) {
    return {
      error: {
        message: `${path}[${invalidIndex}] must be a non-empty string.`,
        path: `${path}[${invalidIndex}]`,
      },
    }
  }

  return { values: [...value] }
}

function supportsPathConditions(event: HookConfig["event"]): boolean {
  return event === "file.changed" || event === "session.idle" || event.startsWith("tool.after.")
}

export function parseActions(
  filePath: string,
  actions: unknown,
  index: number,
): { actions: HookAction[]; errors: HookValidationError[] } {
  if (!Array.isArray(actions)) {
    return {
      actions: [],
      errors: [createError(filePath, "invalid_actions", `hooks[${index}].actions must be a non-empty array.`, `hooks[${index}].actions`)],
    }
  }

  if (actions.length === 0) {
    return {
      actions: [],
      errors: [createError(filePath, "invalid_actions", `hooks[${index}].actions must be a non-empty array.`, `hooks[${index}].actions`)],
    }
  }

  const parsedActions: HookAction[] = []
  const errors: HookValidationError[] = []

  actions.forEach((action, actionIndex) => {
    const parsedAction = parseAction(filePath, action, index, actionIndex)
    if (parsedAction.action) {
      parsedActions.push(parsedAction.action)
    }
    errors.push(...parsedAction.errors)
  })

  return { actions: parsedActions, errors }
}

function parseAction(
  filePath: string,
  action: unknown,
  hookIndex: number,
  actionIndex: number,
): { action?: HookAction; errors: HookValidationError[] } {
  const path = `hooks[${hookIndex}].actions[${actionIndex}]`
  if (!isRecord(action)) {
    return { errors: [createError(filePath, "invalid_action", `${path} must be an object.`, path)] }
  }

  const keys = ["command", "tool", "bash", "notify", "confirm", "setStatus"].filter((key) => key in action)
  if (keys.length !== 1) {
    return {
      errors: [
        createError(
          filePath,
          "invalid_action",
          `${path} must define exactly one of command, tool, bash, notify, confirm, or setStatus.`,
          path,
        ),
      ],
    }
  }

  if ("command" in action) {
    const command = parseCommandAction(action.command)
    return command
      ? { action: { command }, errors: [] }
      : { errors: [createError(filePath, "invalid_action", `${path}.command must be a string or { name, args? }.`, `${path}.command`)] }
  }

  if ("tool" in action) {
    const tool = parseToolAction(action.tool)
    return tool
      ? { action: { tool }, errors: [] }
      : { errors: [createError(filePath, "invalid_action", `${path}.tool must be { name, args? }.`, `${path}.tool`)] }
  }

  if ("notify" in action) {
    const notify = parseNotifyAction(action.notify)
    return notify
      ? { action: { notify }, errors: [] }
      : {
          errors: [
            createError(
              filePath,
              "invalid_action",
              `${path}.notify must be a non-empty string or { text, level? } where level is one of info, success, warning, error.`,
              `${path}.notify`,
            ),
          ],
        }
  }

  if ("confirm" in action) {
    const confirm = parseConfirmAction(action.confirm)
    return confirm
      ? { action: { confirm }, errors: [] }
      : {
          errors: [
            createError(
              filePath,
              "invalid_action",
              `${path}.confirm must be { message, title? } with non-empty message.`,
              `${path}.confirm`,
            ),
          ],
        }
  }

  if ("setStatus" in action) {
    const setStatus = parseSetStatusAction(action.setStatus)
    return setStatus
      ? { action: { setStatus }, errors: [] }
      : {
          errors: [
            createError(
              filePath,
              "invalid_action",
              `${path}.setStatus must be a non-empty string or { text } with non-empty text.`,
              `${path}.setStatus`,
            ),
          ],
        }
  }

  const bash = parseBashAction(action.bash)
  return bash
    ? { action: { bash }, errors: [] }
    : { errors: [createError(filePath, "invalid_action", `${path}.bash must be a string or { command, timeout? }.`, `${path}.bash`)] }
}

function parseNotifyAction(value: unknown): string | HookNotifyActionConfig | undefined {
  if (isNonEmptyString(value)) {
    return value
  }

  if (!isRecord(value) || !isNonEmptyString(value.text)) {
    return undefined
  }

  if (value.level === undefined) {
    return { text: value.text }
  }

  if (!isHookNotifyLevel(value.level)) {
    return undefined
  }

  return { text: value.text, level: value.level }
}

function parseConfirmAction(value: unknown): HookConfirmActionConfig | undefined {
  if (!isRecord(value) || !isNonEmptyString(value.message)) {
    return undefined
  }

  if (value.title !== undefined && !isNonEmptyString(value.title)) {
    return undefined
  }

  return value.title !== undefined ? { title: value.title, message: value.message } : { message: value.message }
}

function parseSetStatusAction(value: unknown): string | HookSetStatusActionConfig | undefined {
  if (isNonEmptyString(value)) {
    return value
  }

  if (!isRecord(value) || !isNonEmptyString(value.text)) {
    return undefined
  }

  return { text: value.text }
}

function isHookNotifyLevel(value: unknown): value is HookNotifyLevel {
  return value === "info" || value === "success" || value === "warning" || value === "error"
}

function parseCommandAction(value: unknown): string | HookCommandActionConfig | undefined {
  if (isNonEmptyString(value)) {
    return value
  }

  if (!isRecord(value) || !isNonEmptyString(value.name)) {
    return undefined
  }

  if (value.args !== undefined && typeof value.args !== "string") {
    return undefined
  }

  return value.args !== undefined ? { name: value.name, args: value.args } : { name: value.name }
}

function parseToolAction(value: unknown): HookToolActionConfig | undefined {
  if (!isRecord(value) || !isNonEmptyString(value.name)) {
    return undefined
  }

  if (value.args !== undefined && !isRecord(value.args)) {
    return undefined
  }

  return value.args !== undefined ? { name: value.name, args: value.args } : { name: value.name }
}

function parseBashAction(value: unknown): string | HookBashActionConfig | undefined {
  if (isNonEmptyString(value)) {
    return value
  }

  if (!isRecord(value) || !isNonEmptyString(value.command)) {
    return undefined
  }

  const timeout = value.timeout
  if (timeout !== undefined && (typeof timeout !== "number" || !Number.isInteger(timeout) || timeout <= 0)) {
    return undefined
  }

  return timeout !== undefined ? { command: value.command, timeout } : { command: value.command }
}

export function parseHookId(
  filePath: string,
  id: unknown,
  index: number,
  seenIds: Set<string>,
): { id?: string; errors: HookValidationError[] } {
  if (id === undefined) {
    return { errors: [] }
  }

  if (!isNonEmptyString(id)) {
    return {
      errors: [createError(filePath, "invalid_hook", `hooks[${index}].id must be a non-empty string.`, `hooks[${index}].id`)],
    }
  }

  if (seenIds.has(id)) {
    return {
      id,
      errors: [createError(filePath, "duplicate_hook_id", `hooks[${index}].id duplicates hook id \"${id}\" within the same file.`, `hooks[${index}].id`)],
    }
  }

  seenIds.add(id)
  return { id, errors: [] }
}

export function parseOverrideTarget(
  filePath: string,
  override: unknown,
  disable: unknown,
  index: number,
): { targetId?: string; isDisableOverride: boolean; errors: HookValidationError[] } {
  const errors: HookValidationError[] = []

  if (override !== undefined && !isNonEmptyString(override)) {
    errors.push(createError(filePath, "invalid_override", `hooks[${index}].override must be a non-empty string.`, `hooks[${index}].override`))
  }

  if (disable !== undefined && typeof disable !== "boolean") {
    errors.push(createError(filePath, "invalid_override", `hooks[${index}].disable must be a boolean.`, `hooks[${index}].disable`))
  }

  const targetId = isNonEmptyString(override) ? override : undefined
  const isDisableOverride = targetId !== undefined && disable === true && errors.length === 0

  return { targetId, isDisableOverride, errors }
}
