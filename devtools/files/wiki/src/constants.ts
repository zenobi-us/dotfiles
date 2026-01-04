import { join } from "path";
import { homedir } from "os";


/**
 * TODO: These will most likely get provided by stacksjs/bunfig
 */
export const GLOBAL_NOTEBOOKS_DIR = process.env.NOTEBOOKS || join(homedir(), "Notes");
export const NOTEBOOK_ZK_CONFIG = ".zk/config.toml";


