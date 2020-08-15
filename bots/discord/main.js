'use strict';

const BOT = new require('./modules/BOT/module.js').MainClass;

var bot = new BOT();
exports.bot = bot;

bot.launchBOT();
