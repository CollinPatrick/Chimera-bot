/**
 * @typedef {Object} command
 * @property {boolean} admin - Indicates if the command is only avalible for users with admin privilages.
 * @property {string[]} roles - Indicates any required roles to use the command.
 */

/**
 * @typedef {Object.<string, string>} changeLog
 */

/**
 * An object containing module info
 * @typedef {Object} package
 * @property @protected {string} moduleName - The name of the module. Format: "Module-Name"
 * @property {string} version - The version number of the module.
 * @property {string} author - The creator of the module.
 * @property {string} description - A brief explationation of the module's functionality
 * @property {string} defGroup - Defintion group for the module's commands
 * @property {changeLog} changelog - Dictionary of changes between versions [K = version, V = string]
 */

/**
 * @typedef {Object.<string, package>} packages
 */

/**
 * An object containing settings for a command module.
 * @typedef {Object.<string, *>} settings
 */

/**
 * A dictionary containing all module settings where x is the module name.
 * @typedef {Object.<string, settings>} settingsList
 */

 /**
  * @typedef {Object.<string, command} commands
  */

 /**
  * @typedef {Object} guildSettings
  * @property {string} id - The ID of the guild the settings belong to.
  * @property {settingsList} settings - The settings object for all installed modules
  * @property {commands} commands - All saved commands
  * @property {packages} packages - All saved module info packages
  * @property {string} prefix
  */

 /**
  * @typedef {Object} moduleSettings
  * @property {string} id - The ID of the guild the settings belong to.
  * @property {settings} settings - The settings object for the specific modules
  * @property {commands} commands - All saved commands for the module
  * @property {package} package - Info package for the module
  * @property {string} prefix 
  */