'use strict';

const fs = require('fs');

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');



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

    ready() {
        this.mod_settings = bot.getModuleInstance('Settings');
        this.startRandomTweeting();
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

    startRandomTweeting() {
        this.tweetInterval = setInterval(() => {
            this.sendRandomTweet();
        }, 10000);
    }
}
