const Discord = require('discord.js'); // Discord API interaction

module.exports.run = async (bot, message, args, config) => {
  let noCode = new Discord.RichEmbed()
    .setDescription("No code to eval!")
    .setColor(config['COLOR']);

  if (args.length < 1) return message.channel.send({
    embed: noCode
  });

  const clean = text => {

    if (typeof(text) === "string") {

      text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));

    } else {
      return text;
    };

  };

  try {

    let code = args.join(" ");
    if (code.includes(bot.token)) {
      code = code.replace(bot.token, "[TOKEN]")
    };
    let evaled = eval(code);

    if (typeof evaled !== "string") {
      evaled = require("util").inspect(evaled);
    };

    if (evaled.includes(bot.token)) {
      evaled = evaled.replace(bot.token, "[TOKEN]");
    }

    let evaledEmbed = new Discord.RichEmbed()
      .setDescription("📥 ```js\n" + code + "\n```\n\n ```js\n" + evaled + "\n```")
      .setColor(config['COLOR']);

    message.channel.send({
      embed: evaledEmbed
    });

  } catch (err) {

    const errEmbed = new Discord.RichEmbed()
      .setDescription("Err: " + clean(err))
      .setColor(config['COLOR']);

    message.channel.send({
      embed: errEmbed
    });

  };
};

module.exports.config = {
	name: "eval",
	description: "Evaluation",
	usage() {
		return this.name + ' [Str]';
	},
	aliases: [],
	OwnerCommand: true,
};
