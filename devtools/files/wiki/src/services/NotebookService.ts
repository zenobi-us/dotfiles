import { ConfigService, type Config } from "./ConfigService";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { Glob } from "bun";
import { type } from "arktype";
import { dedent, slugify } from "../core/strings";
import { Logger } from "./LoggerService";

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

export function createNotebookService(serviceOptions: {
  config: Config
}) {

  async function createNotebook(args: {
    name: string,
    path: string,
  }) {
    const notebookPath = join(args.path, slugify(args.name));
    await fs.mkdir(notebookPath, { recursive: true });

    const configPath = join(notebookPath, serviceOptions.config.configFilePath);
    const defaultConfig: NotebookConfig = {
      name: args.name,
      templates: {},
      groups: [],
    };

    await writeNotebookConfig(configPath, defaultConfig);

    console.log(`Created notebook '${args.name}' at '${notebookPath}'`);
    return notebookPath;

  }

  async function getNotebook(notebookPath: string): Promise<Notebook | null> {
    const configPath = join(notebookPath, serviceOptions.config.configFilePath);
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

  const NotebookGlob = new Glob(`**/.${serviceOptions.config.configFilePath}`);

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
    if (serviceOptions.config.notebookPath) {
      Logger.debug('discoverNotebookPath: USE_DECLARED_PATH %s', serviceOptions.config.notebookPath);
      return serviceOptions.config.notebookPath;
    }

    // STEP 2: Check for notebook configs in config.notebooks
    for (const notebookPath of serviceOptions.config.notebooks) {
      Logger.debug('discoverNotebookPath: CHECKING_NOTEBOOK_PATH %s', notebookPath);
      if (!await fs.exists(notebookPath)) {
        Logger.debug('discoverNotebookPath: NOTEBOOK_PATH_NOT_FOUND %s', notebookPath);
        continue;
      }

      const notebooks = await Array.fromAsync(NotebookGlob.scan({
        absolute: true,
        cwd: notebookPath,
        followSymlinks: true,
        onlyFiles: true,
      }));

      for await (const configFile of notebooks) {
        Logger.debug('discoverNotebookPath: FOUND_NOTEBOOK_CONFIG %s', configFile);

        const notebookConfig = await loadNotebookConfig(configFile);
        if (!notebookConfig?.contexts) continue;
        Logger.debug('discoverNotebookPat: CHECKING_CONTEXTS %o', notebookConfig.contexts);
        const matchedContext = notebookConfig.contexts.find(context => cwd.startsWith(context));
        if (!matchedContext) {
          Logger.debug('discoverNotebookPath: NO_CONTEXT_MATCH %o', { cwd, contexts: notebookConfig.contexts });
          continue;
        }
        Logger.debug('discoverNotebookPath: MATCHED_CONTEXT %s', matchedContext);
        return dirname(configFile);
      }
    }


    // Step 3: Search ancestor directories
    let current = cwd;
    while (current !== "/") {
      const configPath = join(current, serviceOptions.config.configFilePath);
      Logger.debug('discoverNotebookPath: CHECKING_ANCESTOR %s', configPath);
      if (await fs.exists(configPath)) {
        Logger.debug('discoverNotebookPath: FOUND_ANCESTOR_NOTEBOOK %s', current);
        return current;
      }
      current = dirname(current);
    }

    Logger.debug('discoverNotebookPath: NO_NOTEBOOK_FOUND');
    return null;
  }

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

  async function createNotebookTemplate(args: {
    name: string,
    template: { frontmatter: NotebookMetadata, content: string },
    notebookPath: string,
  }) {
    const notebook = await getNotebook(args.notebookPath);
    if (!notebook) {
      throw new Error(`No notebook found at path: ${args.notebookPath}`);
    }

    const slug = slugify(args.name);
    const templatePath = join(args.notebookPath, 'templates', `${slug}.md`);

    try {
      await fs.mkdir(dirname(templatePath), { recursive: true });
    } catch (error) {
      console.error("Error creating template directory:", error);
      throw error;
    }

    try {
      // Write template file
      await fs.writeFile(templatePath, dedent(
        `
      ---
      ${Object.entries(args.template.frontmatter).map(([key, value]) => `${key}: ${value}`).join('\n')}
      ---
      
      ${args.template.content}
      `
      ), "utf-8");
    } catch (error) {
      console.error("Error writing template file:", error);
      throw error;
    }

    // Update notebook config
    const config = notebook.config;
    config.templates[slug] = templatePath;
    await writeNotebookConfig(join(args.notebookPath, serviceOptions.config.configFilePath), config);

    console.log(`Created template '${args.name}' at '${templatePath}'`);
  }


  /**
   * Return the public API
   */
  return {
    createNotebook,
    discoverNotebookPath,
    addNotebookContext,
    getNotebook,
    createNotebookTemplate,
  }

}


export const NotebookService = createNotebookService({ config: ConfigService });
