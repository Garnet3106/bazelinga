const Discord = require('discord.js');

const dotenv = require('dotenv');
dotenv.config();

const ModulePack = require('../Module/module.js');
const Module = ModulePack.MainClass;
const ModuleStatus = ModulePack.ModuleStatus;



exports.MainClass = class BOT extends Module {
    final() {}

    init() {
        this.token = process.env.ELEMBOT_DISCORD_TOKEN;
        this.client = new Discord.Client();

        this.client.login(this.token)
            .then(() => {
                this.log('Event', 'Succeeded', 'Logging in');
            })
            .catch((exep) => {
                this.log('Event', 'Failed', 'Logging in');
            });

        super.init();
    }
}
