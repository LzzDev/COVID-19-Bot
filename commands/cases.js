const Discord = require('discord.js'); // Discord API interaction
const fetch = require('node-fetch');
function format(num) {
  let formatted = new Intl.NumberFormat().format(num);
  return formatted;
};
function percentage(y, x) {
  let num = Math.round((y / x) * 100);
  if (num == 0) {
    return 'less than 0'
  } else {
    return num;
  };
};

module.exports.run = async (bot, message, args, config, cooldown, db) => {
    
  let data = await fetch('https://corona.lmao.ninja/v2/all').then(res => res.json());
  if(!data) return message.channel.send(':x: Error fetching data from API, please try again later.');

  let embed = new Discord.RichEmbed()
  .setTitle('COVID-19 Global Summary')
  .addField('Cases', format(data.cases), true)
  .addField('Todays Cases', format(data.todayCases), true)
  .addField('Deaths', format(data.deaths)+' ('+percentage(data.deaths, data.cases)+'%)', true)
  .addField('Todays Deaths', format(data.todayDeaths), true)
  .addField('Recovered', format(data.recovered)+' ('+percentage(data.recovered, data.cases)+'%)', true)
  .addField('Active', format(data.active)+' ('+percentage(data.active, data.cases)+'%)', true)
  .addField('Critical', format(data.critical)+' ('+percentage(data.critical, data.cases)+'%)', true)
  .addField('Cases Per One Million', format(Math.round(data.casesPerOneMillion)), true)
  .addField('Deaths Per One Million', format(Math.round(data.deathsPerOneMillion)), true)
  .addField('Tests Complete', format(data.tests)+' ('+percentage(data.tests, 7777529088)+'%)', true)
  .addField('Tests Per One Million', format(Math.round(data.testsPerOneMillion)), true)
  .addField('Affected Countries', format(data.affectedCountries)+' ('+percentage(data.affectedCountries, 211)+'%)', true)
  .setThumbnail('https://ml8ygptwlcsq.i.optimole.com/KqGSMw-9RVWI4Qp/w:820/h:552/q:auto/https://www.securities.io/wp-content/uploads/2019/12/Earth-e1576529664499.jpg')
  .setColor(config['COLOR']);

  message.channel.send(embed);

};

module.exports.config = {
  name: "cases",
	description: "See the total amount of cases & deaths for COVID-19",
	usage() {
		return this.name;
	},
	aliases: ["total", "all", "totalcases"],
	OwnerCommand: false,
};
