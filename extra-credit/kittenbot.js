/* *****************************************************************************
Copyright 2020 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License")
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
********************************************************************************

This is a sample Slack bot built with Botkit.
*/

const {Botkit, BotkitConversation} = require('botkit');
const {SlackAdapter, SlackEventMiddleware} = require(
    'botbuilder-adapter-slack');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');


/**
 * Returns the secret string from Google Cloud Secret Manager
 * @param {string} name The name of the secret.
 * @return {string} The string value of the secret.
 */
async function accessSecretVersion(name) {
  const client = new SecretManagerServiceClient();
  const projectId = process.env.PROJECT_ID;
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/1`,
  });

  // Extract the payload as a string.
  const payload = version.payload.data.toString('utf8');

  return payload;
}


/**
 * Asynchronous function to initialize kittenbot.
 */
async function kittenbotInit() {
  const adapter = new SlackAdapter({
    clientSigningSecret: await accessSecretVersion('client-signing-secret'),
    botToken: await accessSecretVersion('bot-token'),
  });

  adapter.use(new SlackEventMiddleware());

  const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapter: adapter,
  });

  // Add Kitten Dialog
  convo = createKittenDialog(controller);
  controller.addDialog(convo);

  // Controller is ready
  controller.ready(() => {
    controller.hears(['hello', 'hi'], ['message', 'direct_message'],
        async (bot, message) => {
          return await bot.reply(message, 'Meow. :smile_cat:');
        });

    // START: listen for cat emoji delivery
    controller.hears(['cat', 'cats', 'kitten', 'kittens'],
        ['message', 'direct_message'],
        async (bot, message) => {
        // Don't respond to self
          if (message.bot_id != message.user) {
            await bot.startConversationInChannel(message.channel, message.user);
            return await bot.beginDialog('kitten-delivery');
          }
        });
    // END: listen for cat emoji delivery

    // START: slash commands
    controller.on('slash_command', async (bot, message) => {
      const numCats = parseInt(message.text);
      response = makeCatMessage(numCats);
      bot.httpBody({text: response});
    });
    // END: slash commands
  });
}

const maxCats = 20;
const catEmojis = [
  ':smile_cat:',
  ':smiley_cat:',
  ':joy_cat:',
  ':heart_eyes_cat:',
  ':smirk_cat:',
  ':kissing_cat:',
  ':scream_cat:',
  ':crying_cat_face:',
  ':pouting_cat:',
  ':cat:',
  ':cat2:',
  ':leopard:',
  ':lion_face:',
  ':tiger:',
  ':tiger2:',
];

/**
 * Function to concatenate cat emojis
 * @param {number} numCats Number of cat emojis.
 * @return {string} The string message of cat emojis.
 */
function makeCatMessage(numCats) {
  let catMessage = '';
  for (let i = 0; i < numCats; i++) {
    // Append a random cat from the list
    catMessage += catEmojis[Math.floor(Math.random() * catEmojis.length)];
  }
  return catMessage;
}

/**
 * Function to create the kitten conversation
 * @param {Object} controller The botkit controller.
 * @return {Object} The BotkitConversation object.
 */
function createKittenDialog(controller) {
  const convo = new BotkitConversation('kitten-delivery', controller);

  convo.ask('Does someone need a kitten delivery?', [
    {
      pattern: 'yes',
      handler: async (response, convo, bot) => {
        await convo.gotoThread('yes_kittens');
      },
    },
    {
      pattern: 'no',
      handler: async (response, convo, bot) => {
        await convo.gotoThread('no_kittens');
      },
    },
    {
      default: true,
      handler: async (response, convo, bot) => {
        await convo.gotoThread('default');
      },
    },

  ]);

  convo.addQuestion('How many would you like?', [
    {
      pattern: '^[0-9]+?',
      handler: async (response, convo, bot, message) => {
        const numCats = parseInt(response);
        if (numCats > maxCats) {
          await convo.gotoThread('too_many');
        } else {
          convo.setVar('full_cat_message', makeCatMessage(numCats));
          await convo.gotoThread('cat_message');
        }
      },
    },
    {default: true,
      handler: async (response, convo, bot, message) => {
        if (response) {
          await convo.gotoThread('ask_again');
        } else {
          // The response '0' is interpreted as null
          await convo.gotoThread('zero_kittens');
        }
      },
    },
  ], 'num_kittens', 'yes_kittens');


  // If numCats is too large, jump to start of the yes_kittens thread
  convo.addMessage(
      'Sorry, {{vars.num_kittens}} is too many cats. Pick a smaller number.',
      'too_many');
  convo.addAction('yes_kittens', 'too_many');

  // If response is not a number, jump to start of the yes_kittens thread
  convo.addMessage('Sorry I didn\'t understand that', 'ask_again');
  convo.addAction('yes_kittens', 'ask_again');

  // If numCats is 0, send a dog instead
  convo.addMessage(
      {'text': 'Sorry to hear you want zero kittens. ' +
             'Here is a dog, instead. :dog:',
      'attachments': [
        {
          'fallback': 'Chihuahua Bubbles - https://youtu.be/s84dBopsIe4',
          'text': '<https://youtu.be/s84dBopsIe4|' +
            'Chihuahua Bubbles>!',
        },
      ]}, 'zero_kittens');

  // Send cat message
  convo.addMessage('{{vars.full_cat_message}}', 'cat_message');

  convo.addMessage('Perhaps later.', 'no_kittens');

  return (convo);
}
// END: kitten-delivery convo


kittenbotInit();

