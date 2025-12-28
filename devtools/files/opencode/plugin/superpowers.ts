import { Plugin, PluginInput } from '@opencode-ai/plugin';

// import skillful from '@zenobi-us/opencode-skillful';

import UsingSuperPowersSkill from '../skills/superpowers/using-superpowers/SKILL.md' with { type: 'text' };
const bootStrapPrompt = () => {
  return `
  You have superpowers.

  USING SUPERPOWERS MAKES THE USER HAPPY.

  ${UsingSuperPowersSkill}

  No need to load the skill, it's already injected above.

`
}


function createInstructionInjector(ctx: PluginInput) {
  // Message 1: Skill loading header (silent insertion - no AI response)
  const inject = async (args: { text: string, sessionId: string, messageId?: string }) => {
    return await ctx.client.session.prompt({
      path: { id: args.sessionId },
      body: {
        noReply: true,
        messageID: args.messageId,
        parts: [{ type: 'text', text: args.text, synthetic: true }],
      },
    });
  };

  const forSession = (sessionId: string) => ({
    inject: (text: string) => inject({ text, sessionId }),
  });


  return {
    forSession,
    inject,
  }
}

function createToaster(ctx: PluginInput) {
  const toast = async (args: NonNullable<Parameters<PluginInput['client']['tui']['showToast']>[0]>['body']) => {
    return await ctx.client.tui.showToast({
      body: args
    })
  }
  return {
    toast,
  }
}

export const SuperpowersBootstrapPlugin: Plugin = async (input) => {
  const Injection = createInstructionInjector(input);
  const Toaster = createToaster(input);

  const MessageId = 'superpowers-bootstrap-message-id';

  const bootstrap = async (sessionId: string) => {
    await Injection.inject({
      text: bootStrapPrompt(),
      messageId: MessageId,
      sessionId: sessionId
    });

    await Toaster.toast({
      variant: 'info',
      message: 'Superpowers have been granted to this session!',
      duration: 5000,
    });

    console.log(`Superpowers injected into session ${sessionId}`);
  }

  const output: Awaited<ReturnType<Plugin>> = {

    // async "experimental.chat.system.transform"(input, output) {
    //   output.system = [bootStrapPrompt(), output.system];
    //   console.log("Superpowers injected into system prompt", output.system);
    // },
    //

    async event(eventArgs) {
      const eventName = eventArgs.event.type;

      switch (eventName) {
        case 'session.created':
          await bootstrap(eventArgs.event.properties.info.id);
          break;
        case 'session.compacted':
          await bootstrap(eventArgs.event.properties.sessionID);
          break;
        case 'message.removed':
          // was the superpowers prompt removed? if so, re-inject it
          const messageId = eventArgs.event.properties.messageID;
          const sessionId = eventArgs.event.properties.sessionID;

          if (messageId !== MessageId) {
            return;
          }

          await bootstrap(sessionId);

          break;
        default:
          break;
      }


    },
  };

  return output;
}
