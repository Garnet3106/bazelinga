'use strict';

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');
const { resolve } = require('path');



exports.MainClass = class Messages extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.setPrefix('msg');

            this.events = this.getEnumArray([
                'deleteMessage',
                'receiveMessage'
            ]);

            bot.client.on('message', message => {
                this.emitEvent(this.events.receiveMessage, message);
            });

            resolve();
        });
    }

    ready() {}

    reserve() {
        return new Promise((resolve, reject) => {
            this.setOnceEvent(this.events.receiveMessage, message => {
                resolve(message);
            });
        });
    }

    send(channel, ...contents) {
        return new Promise((resolve, reject) => {
            channel.send(...contents)
                .then(message => {
                    this.log('Error', 'Send', 'A message', 'Text: \'' + message.content + '\'');
                    resolve(message);
                })
                .catch(error => {
                    this.log('Error', 'Send', 'A message', error.message);
                    reject(error);
                });
        });
    }
}
