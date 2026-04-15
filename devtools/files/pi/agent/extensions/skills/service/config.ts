import {
  createConfigService,
  type ConfigService,
} from "@zenobius/pi-extension-config";
import { type Static, Type } from "typebox";
import { Value } from "typebox/value";

const SearchStrategySchema = Type.Union([
  Type.Literal("lexical"),
  Type.Literal("bm25"),
  Type.Literal("vector"),
  Type.Literal("hybrid"),
]);

export type SearchStrategy = Static<typeof SearchStrategySchema>;

export const RuntimeSettingsSchema = Type.Object(
  {
    searchStrategy: SearchStrategySchema,
    lexicalThreshold: Type.Number({ minimum: 0, maximum: 1 }),
    lazySkills: Type.Boolean(),
  },
  { additionalProperties: false },
);

const RuntimeSettingsOverridesSchema = Type.Object(
  {
    searchStrategy: Type.Optional(SearchStrategySchema),
    lexicalThreshold: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    lazySkills: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export type RuntimeSettings = Static<typeof RuntimeSettingsSchema>;
export type RuntimeSettingsService = ConfigService<RuntimeSettings>;

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  searchStrategy: "hybrid",
  lexicalThreshold: 0.5,
  lazySkills: true,
};

function parseRuntimeSettings(raw: unknown): RuntimeSettings {
  try {
    const overrides = Value.Parse(RuntimeSettingsOverridesSchema, raw ?? {});
    const merged = {
      ...DEFAULT_RUNTIME_SETTINGS,
      ...overrides,
    };

    return Value.Parse(RuntimeSettingsSchema, merged);
  } catch {
    return DEFAULT_RUNTIME_SETTINGS;
  }
}

export async function createRuntimeSettingsService(): Promise<RuntimeSettingsService> {
  return createConfigService<RuntimeSettings>("skills", {
    defaults: DEFAULT_RUNTIME_SETTINGS,
    parse: parseRuntimeSettings,
  });
}
