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
  let country = args.join(' ');
  if(!country) return message.channel.send(':x: You need to provide a valid country.');

  let data = await fetch('https://corona.lmao.ninja/v2/countries').then(res => res.json());
  if(!data) return message.channel.send(':x: Error fetching data from API, please try again later.');

  let countryData;
  let countryDataByName = data.filter(c => c.country.toLowerCase() == country.toLowerCase());
  if(countryDataByName.length == 0) {
    let countryDataByISO2 = data.filter(c => c.countryInfo.iso2 != null && c.countryInfo.iso2.toLowerCase() == country.toLowerCase());
    if(countryDataByISO2.length == 0) {
      let countryDataByISO3 = data.filter(c => c.countryInfo.iso3 != null && c.countryInfo.iso3.toLowerCase() == country.toLowerCase());
      if(countryDataByISO3.length == 0) {
        return message.channel.send(':x: You need to provide a valid country.');
      } else {
        countryData = countryDataByISO3[0];
      };
    } else {
      countryData = countryDataByISO2[0];
    };
  } else {
    countryData = countryDataByName[0];
  };

  let embed = new Discord.RichEmbed()
  .setTitle('COVID-19 Summary For ' + countryData.country + ' ('+countryData.countryInfo.iso2+')')
  .addField('Cases', format(countryData.cases), true)
  .addField('Todays Cases', format(countryData.todayCases), true)
  .addField('Deaths', format(countryData.deaths)+' ('+percentage(countryData.deaths, countryData.cases)+'%)', true)
  .addField('Todays Deaths', format(countryData.todayDeaths), true)
  .addField('Recovered', format(countryData.recovered)+' ('+percentage(countryData.recovered, countryData.cases)+'%)', true)
  .addField('Active', format(countryData.active)+' ('+percentage(countryData.active, countryData.cases)+'%)', true)
  .addField('Critical', format(countryData.critical)+' ('+percentage(countryData.critical, countryData.cases)+'%)', true)
  .addField('Cases Per One Million', format(Math.round(countryData.casesPerOneMillion)), true)
  .addField('Deaths Per One Million', format(Math.round(countryData.deathsPerOneMillion)), true)
  .addField('Tests Complete', format(countryData.tests), true)
  .addField('Tests Per One Million', format(Math.round(countryData.testsPerOneMillion)), true)
  .setThumbnail(countryData.countryInfo.flag)
  .setColor(config['COLOR']);  

  message.channel.send(embed);
};

module.exports.config = {
	name: "country",
	description: "See COVID-19 stats on a specific country",
	usage() {
		return this.name + ' [Country]';
	},
	aliases: ["lookup"],
	OwnerCommand: false,
};
