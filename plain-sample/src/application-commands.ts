import { dragon } from "./dragon";
import { session } from "./session";

/*
 * Command set definitions
 *
 * Each command must be assigned to a command set.
 */

export const commandSet: dragon.applicationCommands.CommandSet = {
  id: "cmd-set",
  name: "My Command Set",
  description: "Description of my command set",
};

/*
 * Custom placeholder definitions
 *
 * Placeholders can be used in custom command variants.
 */

// Placeholder used by the addNamedControlCommand
export const namedControlPlaceholder: dragon.applicationCommands.CommandPlaceholder = {
  id: "my-controls",
  label: "My Custom Controls",
  placeholderValues: session.fields.map((control) => ({
    value: control,
    spokenForm: control.toLowerCase(),
  })),
};

/*
 * Command definitions
 *
 * A command set allows commands to be grouped together.
 */

/**
 * Simple command without placeholders.
 *
 * This command is triggered by dictating "add control" while dictation is active.
 */
export const addControlCommand: dragon.applicationCommands.Command = {
  commandSetId: commandSet.id,
  id: "add-control-cmd",
  variants: [
    {
      spokenForm: "add control",
      displayString: "Add control",
    },
  ],
  description: "Adds a new control to the form",
};

/**
 * Command with standard placeholder.
 *
 * This command is triggered by dictating "set number to X" where X is a number between 0 and 100.
 */
export const setNumberCommand: dragon.applicationCommands.Command = {
  commandSetId: commandSet.id,
  id: "set-number",
  variants: [
    {
      spokenForm: "set number to <standard:cardinal0-100>",
      displayString: "Set number to <standard:cardinal0-100>",
    },
  ],
  description: "Set number using standard placeholder",
};

/**
 * Command with custom placeholder.
 *
 * This command is triggered by dictating "Add control <name>" where <name> is one of the names defined in namedControlPlaceholder.
 */
export const addNamedControlCommand: dragon.applicationCommands.Command = {
  commandSetId: commandSet.id,
  id: "add-control",
  variants: [
    {
      spokenForm: `Add control <${namedControlPlaceholder.id}>`,
      displayString: `Add control <${namedControlPlaceholder.id}>`,
    },
  ],
  description: `Adds a control to the form defined in the ${namedControlPlaceholder.label} placeholder`,
};
