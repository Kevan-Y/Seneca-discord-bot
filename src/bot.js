require('dotenv').config();
const { Client, MessageEmbed } = require('discord.js');
const Twitter = require('twitter-lite');

const client = new Client();
let channelID = '';
let stream;
const parameters = {
	follow: process.env.USER_ID,
};
const twitterClient = new Twitter({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token_key: process.env.ACCESS_TOKEN_KEY,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

const updateCountMenbers = (guild) => {
	client.user.setActivity(`Member: ${guild.memberCount.toLocaleString()}`, {
		type: 'PLAYING',
	});
};

client.on('ready', () => {
	console.log(`${client.user.tag} has logged in.`);
	const guild = client.guilds.cache.get(process.env.GUILD_ID);
	updateCountMenbers(guild);
});

client.on('guildMemberAdd', (member) => {
	updateCountMenbers(member.guild);
});
client.on('guildMemberRemove', (member) => {
	updateCountMenbers(member.guild);
});

client.on('message', (message) => {
	if (!message.content.startsWith(process.env.PREFIX) || message.author.bot)
		return;

	const args = message.content
		.slice(process.env.PREFIX.length)
		.trim()
		.split(' ');
	const command = args.shift().toLowerCase();

	if (command === 'ping') {
		message.channel.send(`🏓API Latency is ${Math.round(client.ws.ping)}ms`);
	} else if (command === 'set-channel') {
		//Check if the user has ADMINISTRATOR permissions
		if (message.member.permissions.has('ADMINISTRATOR')) {
			//Check if only 1 argument
			if (args.length === 1) {
				//Check if channel beeing already set
				if (channelID === '') {
					let sendChannelById = client.channels.cache.find(
						(channel) => channel.id === args[0] && channel.type === 'text',
					);

					//Check if channel found
					if (sendChannelById) {
						channelID = args[0];
						const setChannelEmbed = new MessageEmbed();
						setChannelEmbed
							.setColor('#00FF00')
							.setTitle('Set Channel')
							.setDescription(`News set to <#${args[0]}>`);
						message.channel.send(setChannelEmbed);
						stream = twitterClient
							.stream('statuses/filter', parameters)
							.on('start', () => console.log('start'))
							.on('data', (tweet) => {
								if (!tweet.delete) {
									sendChannelById
										.send(
											`https://twitter.com/{${tweet.user.screen_name}}/status/${tweet.id_str}`,
										)
										.catch((err) => {
											console.log(err);
										});
								}
							})
							.on('ping', () => console.log('ping twitter'))
							.on('error', (error) => {
								console.log('error', error);
								const stopEmbed = new MessageEmbed();
								stopEmbed
									.setColor('#00FF00')
									.setTitle('API Error')
									.setDescription(`Bot stop updating new to <#${channelID}>`);
								channelID = '';
								message.channel.send(stopEmbed);
							})
							.on('end', () => console.log('end'));
					} else {
						//Error channel type and existent
						const setChannelErrorEmbed = new MessageEmbed();
						setChannelErrorEmbed
							.setColor('#FF0000')
							.setTitle('$set-channel error')
							.setDescription(`Channel must be exist and text!`);
						message.channel.send(setChannelErrorEmbed);
					}
				} else {
					//Error channel already set
					console.log('setChannel-error');
					const setChannelErrorEmbed = new MessageEmbed();
					setChannelErrorEmbed
						.setColor('#FF0000')
						.setTitle('$set-channel error')
						.setDescription(
							`Channel already set to <#${args[0]}>. To overwite please <$stop> before re run $set-channel`,
						);
					message.channel.send(setChannelErrorEmbed);
				}
			} else {
				//Error parameter
				const setChannelErrorEmbed = new MessageEmbed();
				setChannelErrorEmbed
					.setColor('#FF0000')
					.setTitle('$set-channel error')
					.setDescription(
						`Error argument, command takes only 1 parameter <$set-channel channelID>`,
					);
				message.channel.send(setChannelErrorEmbed);
			}
		} else {
			//Error user don't have permission
			const setChannelErrorEmbed = new MessageEmbed();
			setChannelErrorEmbed
				.setColor('#FF0000')
				.setTitle('$set-channel error')
				.setDescription(`Sorry you don't have the permission!`);
			message.channel.send(setChannelErrorEmbed);
		}
	} else if (command === 'stop') {
		//Stop stream and channelID
		stream.destroy();
		const stopEmbed = new MessageEmbed();
		stopEmbed
			.setColor('#00FF00')
			.setTitle('Stop news')
			.setDescription(`Bot stop updating new to <#${channelID}>`);
		channelID = '';
		message.channel.send(stopEmbed);
	} else return;
});

client.login(process.env.BOT_TOKEN);
