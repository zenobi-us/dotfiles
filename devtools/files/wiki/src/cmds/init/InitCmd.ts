import { defineCommand } from "clerc";
import { Paths, UserConfigFile } from "../../services/ConfigService";
import { Logger } from "../../services/LoggerService";

export const InitCommand = defineCommand({
  name: "init",
  description: "Initialise global config",
}, async (ctx) => {
  Logger.debug("Init command executed");


  Logger.info(`Creating config directory at: ${UserConfigFile}`);
});

