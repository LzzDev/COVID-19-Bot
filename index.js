/*
--------------------
	MODULES
--------------------
*/

const fs = require('fs'); // File System -- Used for commands/Ticket transcripts
const Discord = require('discord.js'); // Discord API interaction
const Sequelize = require('sequelize'); // Node.js SQLite database
const fetch = require('node-fetch');


/*
--------------------
	UTILITIES
--------------------
*/
const config = require('./config.json');


/*
--------------------
	SQLite
--------------------
*/
// Username: 
// Database name: 
// Password: 
// Server: remotemysql.com
// Port: 3306
const db = new Sequelize('covid-19', 'root', '', {
	host: 'localhost',
	dialect: 'mysql',
	port: '3306',
	dialectOptions: {
		multipleStatements: true
	},
	logging: false,
	define: {
		freezeTableName: true
  }
});
db.trackers = db.define('trackers', {
	id: {
		type: Sequelize.STRING,
		unique: false,
		primaryKey: true
	},
	country: Sequelize.STRING
});



/*
--------------------
	DISCORD CLIENT
--------------------
*/
const bot = new Discord.Client();
	  bot.commands = new Map();
	  bot.aliases  = new Map();

let cooldown = new Set();
setInterval(function() {
	cooldown.clear();
}, 3000);



/*
--------------------
	COMMAND HANDLER
--------------------
*/
fs.readdir('./commands', function(error, files) {
	if(error) throw new Error(error);
	files.forEach(file => {
		if(!file.endsWith('.js')) return;
		let CommandFile = require(`./commands/${file}`);
		let FileName = file.split('.')[0];

		bot.commands.set(FileName, CommandFile);
		CommandFile['config'].aliases.forEach(alias => {
			bot.aliases.set(alias, CommandFile['config'].name)
		});
	});
});

//Commands
bot.on('message', async function(message) {
	if(message.author.bot || message.channel.type == 'dm') return;

	let prefix = config['DEFAULT_PREFIX'];
	if(!message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).split(' ');
	const command = args.shift().toLowerCase();

	let CommandFile;
	if (bot.commands.has(command)) {
    	CommandFile = bot.commands.get(command);
	} else if (bot.aliases.has(command)) {
		CommandFile = bot.commands.get(bot.aliases.get(command));
	};

	if(!CommandFile) return;
	if(CommandFile['config'].OwnerCommand && !config['SYSTEM_ADMIN_IDS'].includes(message.author.id)) return; // Return if not authed

	CommandFile.run(bot, message, args, config, cooldown, db); // Run command
});


/*
--------------------
	BOT EVENTS
--------------------
*/
bot.on('ready', async function() {
	db.sync();
	console.log(`${bot.user.username} is ready with ${bot.guilds.size} servers + ${bot.users.size} users`);
	bot.channels.get('691009685746352138').send(`${bot.user.username} is ready with ${bot.guilds.size} servers + ${bot.users.size} users`);

	/*
	ACTIVITY TYPES:
		PLAYING
		STREAMING
		LISTENING
		WATCHING
	*/
	let i = 0;
	setInterval(async () => {
		let data = await fetch('https://corona.lmao.ninja/v2/all').then(res => res.json());
		if(!data) return bot.user.setActivity(config['DEFAULT_PREFIX']+'help | '+bot.guilds.size+' servers');
		let activities = [`${new Intl.NumberFormat().format(data.deaths)} deaths`, `${new Intl.NumberFormat().format(data.cases)} cases`, `${new Intl.NumberFormat().format(data.recovered)} recovered`];
		if(i > 2) i = 0;		

		bot.user.setActivity(config['DEFAULT_PREFIX']+'help | '+activities[i]);
		i++;
	}, 5000);
});

function percentage(y, x) {
  let num = Math.round((y / x) * 100);
  if (num == 0) {
		return 'less than 0'
  } else {
		return num;
  };
};
setInterval(async () => {
	let trackers = await db.trackers.findAll();
	trackers.forEach( async tracker => {
		let id = tracker.id;
		let user = bot.users.get(id);
		if(!user) return;

    let data = await fetch('https://corona.lmao.ninja/v2/countries').then(res => res.json());
		if(!data) return console.log('Error fetching data from API, please try again later.');
		
		let countryData;
  	let countryDataByName = data.filter(c => c.country.toLowerCase() == tracker.country.toLowerCase());
  	if(countryDataByName.length == 0) {
			let countryDataByISO2 = data.filter(c => c.countryInfo.iso2 != null && c.countryInfo.iso2.toLowerCase() == country.toLowerCase());
			if(countryDataByISO2.length == 0) {
				let countryDataByISO3 = data.filter(c => c.countryInfo.iso3 != null && c.countryInfo.iso3.toLowerCase() == country.toLowerCase());
				if(countryDataByISO3.length == 0) {
					return console.log('Invalid country \''+tracker.country+'\', ID: '+tracker.id);
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
		.setFooter('You are getting this message as you have setup a tracker using this bot, to stop receiving messages from '+bot.user.username+' bot then run \'.tracker clear\' on your server.')
  	.setThumbnail(countryData.countryInfo.flag)
  	.setColor(config['COLOR']);
		
    user.send(embed).catch(err => {
			console.log('Failed sending message to ' + user.user.tag);
			return console.log(err);
		});
	});

}, 10800000);

function format(number) {
	let num = number;
	if(isNaN(num)) return 0;

	let formattedNumber = new Intl.NumberFormat().format(num);
	return formattedNumber;
}


const DBLClient = require('dblapi.js');
const dbl = new DBLClient('', bot);
dbl.on('posted', () => {
  console.log('[DBL] Server count posed');
});
dbl.on('error', e => {
 console.log('[DBL] Error: '+e);
});



/*
--------------------
	CONNECT BOT
--------------------
*/
bot.login(config.TOKEN);
