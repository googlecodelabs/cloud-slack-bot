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
const assert = require('assert');


/**
 * Function to test Botkit Controller Configurations.
 */
function testBotkitController() {
  const {Botkit, BotkitConversation} = require('botkit');
  const {SlackAdapter, SlackEventMiddleware} = require(
      'botbuilder-adapter-slack');

  const adapter = new SlackAdapter({
    enable_incomplete: true,
    debug: true,
  });

  adapter.use(new SlackEventMiddleware());

  const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapter: adapter,
  });

  // test controller version
  assert(parseInt(controller.version) >= 4);

  // test webhook endpoint
  const config = controller.getConfig();
  assert(config.webhook_uri == '/api/messages');

  // testBotkitConversation
  const convo = new BotkitConversation('test-dialog', controller);
  controller.addDialog(convo);
  assert('test-dialog' in controller.dialogSet.dialogs);

  controller.shutdown();
}

/**
 * Function to test Secret Manager Client.
 */
function testSecretManagerClient() {
  const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
  const client = new SecretManagerServiceClient();
  assert(client);
};

testBotkitController();
testSecretManagerClient();
