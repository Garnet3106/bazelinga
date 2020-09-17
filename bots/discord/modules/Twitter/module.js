'use strict';

const fs = require('fs');
const TwitterClient = require('twitter');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');



// exports = class ~ できる？
exports.MainClass = class Twitter extends Module {
    finishRandomTweeting() {
        // tweetInterval が設定されていない場合は弾く
        if(this.tweetInterval == null || this.tweetInterval == undefined)
            return;

        clearInterval(this.tweetInterval);
        this.tweetInterval = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.setCommandPrefix('tw');

            fs.readFile("./modules/Twitter/messages.json", "utf-8", (error, data) => {
                if(error) {
                    this.log('Error', 'Load', 'The message data file', error.message);
                    this.messages = [];
                    reject();
                    return;
                }

                try {
                    let jsonData = JSON.parse(data);
                    this.messages = jsonData.messages;
                } catch(e) {
                    this.log('Error', 'Parse', 'The message data', e.message);
                }

                this.log('Event', 'Load', 'The message data file');
                resolve();
            });
        });
    }

    // モジュールの設定データを初期化します。
    // ready() 内で呼び出してください。
    initSettingData() {
        this.settings = this.mod_settings.getData(this.moduleName);

        if(!('loginData' in this.settings))
            this.settings.loginData = [];

        // テスト用
        this.settings.loginData.push({
            keys: {
                consumer_key: process.env.CONSUMER_KEY,
                consumer_secret: process.env.CONSUMER_SECRET,
                access_token_key: process.env.ACCESS_TOKEN_KEY,
                access_token_secret: process.env.ACCESS_TOKEN_SECRET
            },
            discordUserIDs: [
                '495511715425812481'
            ]
        });
    }

    proceedCommand(message, cmdPrefix, cmdName, cmdArgs) {
        if(cmdPrefix != this.prefix)
            return;

        switch(cmdName) {
            case 'send':

            let accountID = 'Garnet3106';
            message.channel.send({
                embed: {
                    title: 'ツイート送信 (@' + accountID + ')',
                    description: 'ツイート内容を入力してください。'
                }
            });

            // ツイート内容のメッセージを待機する
            let reserveMessage = () => {
                this.mod_messages.reserve()
                    .then(reservedMessage => {
                        // 送信者のIDが一致しなければもう一度メッセージを待つ
                        if(message.author.id != reservedMessage.author.id) {
                            reserveMessage();
                            return;
                        }

                        this.sendTweet(reservedMessage.content, reservedMessage.channel);
                    });
            }

            reserveMessage();
            break;
        }
    }

    ready() {
        this.mod_settings = bot.getModuleInstance('Settings');
        this.initSettingData();
        //this.startRandomTweeting();

        this.mod_messages = bot.getModuleInstance('Messages');

        this.mod_commands = bot.getModuleInstance('Commands');
        this.mod_commands.setEvent(this.mod_commands.events.receiveCommand, (message, cmdPrefix, cmdName, cmdArgs) => {
            this.proceedCommand(message, cmdPrefix, cmdName, cmdArgs);
        });
    }

    sendRandomTweet() {
        let messageID = 0;

        if(this.messages.length == 0) {
            this.log('Error', 'Send', 'Random tweet (' + messageID + ')', 'There\'s no messages.');
            return;
        }

        let message = this.messages[messageID];
        let messageWithoutNewLine = message.replace(/\n/g, ' ');
        let logMessage = messageWithoutNewLine.length > 20 ? messageWithoutNewLine.substring(0, 17) + '...' : messageWithoutNewLine;

        this.log('Event', 'Send', 'Random tweet (ID: ' + messageID + ')', logMessage);
    }

    sendTweet(text, channel) {
        let client = new TwitterClient(this.settings.loginData[0].keys);

        client.post('statuses/update', { status: text }, (error, tweet, response) => {
            if(error) {
                this.log('Error', 'Send', 'User tweet', '[' + error[0].code + '] ' + error[0].message);
                return;
            }

            let userName = tweet.user.screen_name;
            let tweetID = tweet.id_str;
            let tweetDataPair = userName + '/' + tweetID;

            this.log('Event', 'Send', 'User tweet', tweetDataPair);

            channel.send({
                embed: {
                    title: 'ツイート送信 (@' + userName + ')',
                    description: 'ツイートを送信しました。\n[' + tweetDataPair + '](https://twitter.com/' + userName + '/status/' + tweetID + ')'
                }
            });
        });
    }

    startRandomTweeting() {
        this.tweetInterval = setInterval(() => {
            //this.sendRandomTweet();
        }, 10000);
    }
}
