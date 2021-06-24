const Discord = require('discord.js'); // Discord API interaction
const fetch = require('node-fetch');

module.exports.run = async (bot, message, args, config, cooldown, db) => {

	let country = args.join(' ');
	if(!country) return message.channel.send(':x: You need to provide a valid country.');
	
	if(country.toLowerCase() == 'clear') {
		let findTracker = await db.trackers.findOne({where:{id:message.author.id}});
		if(!findTracker) {
			return message.channel.send(':x: You do not have a tracker setup.');
		} else {
			await db.trackers.destroy({where:{id:message.author.id}}).catch(err => {
				console.log(err);
				return message.channel.send(':x: There was an error deleting your tracker, please try again later.');
			});
			return message.channel.send(':white_check_mark: Successfully deleted your tracker for \`'+findTracker.country.toLowerCase()+'\`');
		};
	};

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
        countryData = countryDataByISO3[0].country.toLowerCase();
      };
    } else {
      countryData = countryDataByISO2[0].country.toLowerCase();
    };
  } else {
    countryData = countryDataByName[0].country.toLowerCase();
	};
	
	// db.trackers = db.define('trackers', {
	// 	id: {
	// 		type: Sequelize.STRING,
	// 		unique: false,
	// 		primaryKey: true
	// 	},
	// 	country: Sequelize.STRING
	// });
	let findTracker = await db.trackers.findOne({where:{id:message.author.id}});
	if(!findTracker || findTracker == null) {
		await db.trackers.create({id:message.author.id, country:countryData.toLowerCase()}).catch(err => {
			console.log(err);
			return message.channel.send(':x: There was an error creating your tracker, please try again later.');
		});
	} else {
		await db.trackers.update({id:message.author.id, country:countryData.toLowerCase()},{where:{id:message.author.id}}).catch(err => {
			console.log(err);
			return message.channel.send(':x: There was an error updating your tracker, please try again later.');
		});
	};
	
	message.channel.send(':white_check_mark: Successfully created a tracker for country `'+countryData.toLowerCase()+'`');
};

module.exports.config = {
	name: "track",
	description: "Track a country to get the summary of it sent to your DMs every 3 hours",
	usage() {
		return this.name + ' [Clear|Country]';
	},
	aliases: [
		"tracker",
		"trackcountry",
		"createtracker"
	],
	OwnerCommand: false,
	PremiumCommand : false
};
