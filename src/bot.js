require('dotenv').config();

const { Client, MessageEmbed } = require('discord.js');

const client = new Client();
let channelID = '';
let intervalCall;

client.on('ready', () => {
	console.log(`${client.user.tag} has logged in.`);
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
		console.log('ping');
		// send back "Pong." to the channel the message was sent in
		message.channel.send('Pong.');
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
						sendChannelById.send('hELLO').catch((err) => {
							console.log(err);
						});
						intervalCall = setInterval(() => {
							sendChannelById.send('hELLO').catch((err) => {
								//Error handling on send, will clear the id and stop intervalCall
								clearInterval(intervalCall);
								channelID = '';
								const setChannelErrorEmbed = new MessageEmbed();
								setChannelErrorEmbed
									.setColor('#FF0000')
									.setTitle('$set-channel error')
									.setDescription(
										`Error occured.\n <$stop> run. News update stop!`,
									);
								message.channel.send(setChannelErrorEmbed);
								console.log(err);
							});
						}, 5000);
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
			setChannelEmbed
				.setColor('#FF0000')
				.setTitle('$set-channel error')
				.setDescription(`Sorry you don't have the permission!`);
		}
	} else if (command === 'stop') {
		//Clear intervalCall and channelID
		clearInterval(intervalCall);
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
