'use strict';

const { bot } = require('../../main.js');
const { Module } = require('../../module.js');



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
}
