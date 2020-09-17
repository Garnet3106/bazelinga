'use strict';

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');
const { resolve } = require('path');



exports.MainClass = class Messages extends Module {
    delete(message, timeout = 0, reason = '') {
        if(message.deleted)
            return;

        let options = {
            timeout: timeout,
            reason: reason
        };

        message.delete(options);
        this.log('Event', 'Delete', 'A message', 'ID: ' + message.id);
    }

    init() {
        return new Promise((resolve, reject) => {
            this.setCommandPrefix('msg');

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

    send(channel, contents, deleteAfter = -1) {
        return new Promise((resolve, reject) => {
            channel.send(contents)
                .then(message => {
                    if(deleteAfter != -1) {
                        setTimeout(() => {
                            this.delete(message);
                        }, deleteAfter);
                    }

                    this.log('Event', 'Send', 'A message', 'ID: ' + message.id);
                    resolve(message);
                })
                .catch(error => {
                    this.log('Error', 'Send', 'A message', error.message);
                    reject(error);
                });
        });
    }
}
