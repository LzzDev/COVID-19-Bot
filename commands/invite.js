const Discord = require('discord.js'); // Discord API interaction

module.exports.run = async (bot, message, args, config, cooldown, db) => {
	let embed = new Discord.RichEmbed()
	.setDescription('You can invite '+bot.user.username+' bot by clicking [**here**](https://discordapp.com/oauth2/authorize?client_id=688757360398696493&permissions=8&scope=bot)')
	.setColor(config['COLOR']);

	message.channel.send(embed);
};

module.exports.config = {
	name: "invite",
	description: "Get an invite for the bot",
	usage() {
		return this.name;
	},
	aliases: ["invitelink", "invitebot", "botinvite"],
	OwnerCommand: false,
	PremiumCommand : false
};