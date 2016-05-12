/* *****************************************************************************
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
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

var Botkit = require('botkit');
var fs = require('fs');

var controller = Botkit.slackbot({debug: false});

if (!process.env.slack_token_path) {
  console.log('Error: Specify slack_token_path in environment');
  process.exit(1);
}

fs.readFile(process.env.slack_token_path, function(err, data) {
  if (err) {
    console.log('Error: Specify token in slack_token_path file');
    process.exit(1);
  }
  data = String(data);
  data = data.replace(/\s/g, '');
  controller.spawn({token: data}).startRTM(function (err) {
    if (err) {
      throw new Error(err);
    }
  });
});

controller.hears(
    ['hello', 'hi'], ['direct_message', 'direct_mention', 'mention'],
    function (bot, message) { bot.reply(message, 'Meow. :smile_cat:'); });

var maxCats = 20;
var catEmojis = [
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
  ':tiger2:'
];

controller.hears(
    ['cat', 'cats', 'kitten', 'kittens'],
    ['ambient', 'direct_message', 'direct_mention', 'mention'],
    function (bot, message) {
      bot.startConversation(message, function (err, convo) {
        if (err) {
          console.log(err);
          return;
        }
        convo.ask('Does someone need a kitten delivery? Say YES or NO.', [
          {
            pattern: bot.utterances.yes,
            callback: function (response, convo) {
              convo.say('Great!');
              convo.ask('How many?', [
                {
                  pattern: '[0-9]+',
                  callback: function (response, convo) {
                    var numCats =
                        parseInt(response.text.replace(/[^0-9]/g, ''), 10);
                    if (numCats === 0) {
                      convo.say({
                        'text': 'Sorry to hear you want zero kittens. ' +
                            'Here is a dog, instead. :dog:',
                        'attachments': [{
                          'fallback': 'Chihuahua Bubbles - https://youtu.be/s84dBopsIe4',
                          'text': '<https://youtu.be/s84dBopsIe4|' +
                              'Chihuahua Bubbles>!'
                        }]});
                    } else if (numCats > maxCats) {
                      convo.say('Sorry, ' + numCats + ' is too many cats.');
                    } else {
                      var catMessage = '';
                      for (var i = 0; i < numCats; i++) {
                        catMessage = catMessage +
                            catEmojis[Math.floor(Math.random() * catEmojis.length)];
                      }
                      convo.say(catMessage);
                    }
                    convo.next();
                  }
                },
                {
                  default: true,
                  callback: function (response, convo) {
                    convo.say(
                        'Sorry, I didn\'t understand that. Enter a number, please.');
                    convo.repeat();
                    convo.next();
                  }
                }
              ]);
              convo.next();
            }
          },
          {
            pattern: bot.utterances.no,
            callback: function (response, convo) {
              convo.say('Perhaps later.');
              convo.next();
            }
          },
          {
            default: true,
            callback: function (response, convo) {
              // Repeat the question.
              convo.repeat();
              convo.next();
            }
          }
        ]);
      });
    });
