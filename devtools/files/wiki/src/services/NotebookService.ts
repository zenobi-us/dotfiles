import { ConfigService, type Config } from "./ConfigService";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { Glob } from "bun";
import { type } from "arktype";

const NotebookMetadataSchema = type({
  "[string]": 'string | number | boolean'
})
export type NotebookMetadata = typeof NotebookMetadataSchema.infer;

const NotebookTemplatesSchema = type({
  "[string]": 'string'
})
export type NotebookTemplates = typeof NotebookTemplatesSchema.infer;

const NotebookGroupSchema = type({
  name: 'string',
  description: 'string?',
  globs: 'string[]',
  metadata: NotebookMetadataSchema,
})

export type NotebookGroup = typeof NotebookGroupSchema.infer;

const NotebookConfigSchema = type({
  name: 'string',
  contexts: 'string[]?',
  templates: NotebookTemplatesSchema,
  groups: NotebookGroupSchema.array()
})

type NotebookConfig = typeof NotebookConfigSchema.infer;


const NotebookSchema = type({
  path: 'string',
  config: NotebookConfigSchema,
})

export type Notebook = typeof NotebookSchema.infer;

export function createNotebookService(args: {
  config: Config
}) {

  async function getNotebook(notebookPath: string): Promise<Notebook | null> {
    const configPath = join(notebookPath, args.config.configFilePath);
    const config = await loadNotebookConfig(configPath);
    if (!config) return null;

    // Load templates
    // templates are listed as a mapping of template name to file path
    for (const [templateName, templatePath] of Object.entries(config.templates)) {
      try {
        const template = await import(templatePath, { assert: { type: "markdown" } }).then(mod => mod.default);
        config.templates[templateName] = template;
      } catch (error) {
        console.error(`Error loading template at ${templatePath}:`, error);
      }
    }

    const notebook = NotebookSchema({
      name: config.name,
      config,
      templates: {},
      groups: {}
    })

    if (notebook instanceof type.errors) {
      console.warn(`Invalid notebook at ${notebookPath}:`, notebook);
      return null;
    }

    return notebook;
  }


  async function globNotebookTemplates(
    /**
     * Path to start globbing from
     */
    path: string
  ) {
  }


  async function loadNotebookConfig(configPath: string): Promise<NotebookConfig | null> {
    try {
      const content = await fs.readFile(configPath, "utf-8");
      const parsed = JSON.parse(content);
      const result = NotebookConfigSchema(parsed);
      if (result instanceof type.errors) {
        console.warn(`Invalid notebook config at ${configPath}:`, result);
        return null;
      } else {
        return result;
      }
    } catch (error) {
      console.error(`Error loading notebook config at ${configPath}:`, error);
      return null;
    }
  }

  async function writeNotebookConfig(configPath: string, config: NotebookConfig): Promise<void> {
    try {
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(configPath, content, "utf-8");
    } catch (error) {
      console.error(`Error writing notebook config at ${configPath}:`, error);
    }
  }

  /**
   * Discover the notebook path based on the current working directory
   *
   * Priority:
   *
   *  1. Declared Notebook Path
   *  2. Context Matching in Notebook Configs
   *  3. Ancestor Directory Search
   *
   * @param cwd Current working directory (defaults to process.cwd())
   * @returns Resolved notebook path or null if not found
   */
  async function discoverNotebookPath(cwd: string = process.cwd()): Promise<string | null> {
    // Step 1: Check environment/cli-arg variable (resolved and provided by the ConfigService)
    if (args.config.notebookPath) {
      return args.config.notebookPath;
    }

    // STEP 2: Check for notebook configs in config.notebooks
    for (const notebookPath in args.config.notebooks) {
      for await (const configFile of await globNotebookConfigs(notebookPath)) {
        const notebookConfig = await loadNotebookConfig(configFile);
        if (!notebookConfig?.contexts) continue;
        const matchedContext = notebookConfig.contexts.find(context => cwd.startsWith(context));
        if (!matchedContext) continue;
        return dirname(configFile);
      }
    }

    // Step 3: Search ancestor directories
    let current = cwd;
    while (current !== "/") {
      const configPath = join(current, args.config.configFilePath);
      if (await fs.exists(configPath)) {
        return current;
      }
      current = dirname(current);
    }

    return null;
  }


  const NotebookGlob = new Glob(`**/${args.config.configFilePath}`);
  async function globNotebookConfigs(
    /**
     * Path to start globbing from
     */
    path: string
  ) {
    return NotebookGlob.scan({
      absolute: true,
      cwd: path,
      followSymlinks: true,
      onlyFiles: true,
    })
  }

  async function createNotebook() { }


  /**
   * Add a path as a context for a notebook
   */
  async function addNotebookContext(
    notebookPath: string,
    contextPath: string = process.cwd()
  ): Promise<void> {
    if (!notebookPath) {
      throw new Error("No notebook path provided. Cannot add context.");
    }


    const configFile = await loadNotebookConfig(notebookPath);


    if (!configFile) {
      throw new Error(`No notebook config found at path: ${notebookPath}`);
    }

    // Check if context already exists
    if (configFile.contexts?.includes(contextPath)) {
      console.log(`Context '${contextPath}' already exists in notebook config at '${configFile}'.`);
      return;
    }

    // Add the context
    configFile.contexts = [
      ...(configFile.contexts || []),
      contextPath,
    ]

    await writeNotebookConfig(notebookPath, configFile);


    console.log(`Added context '${contextPath}' to notebook config at '${configFile}'.`);
  }


  /**
   * Return the public API
   */
  return {
    createNotebook,
    discoverNotebookPath,
    addNotebookContext,
    getNotebook,
  }

}


export const NotebookService = createNotebookService({ config: ConfigService });
