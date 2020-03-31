/* *****************************************************************************
Copyright 2020 Google LLC

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

const {Botkit} = require('botkit');
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

  controller.ready(() => {
    controller.hears(['hello', 'hi'], ['message', 'direct_message'],
        async (bot, message) => {
          await bot.reply(message, 'Meow. :smile_cat:');
        });
  });
}

kittenbotInit();

