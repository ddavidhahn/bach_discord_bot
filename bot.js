const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const streamOptions = { seek: 0, volume: 1 };

var auth = require('./auth.json');
var logger = require('winston');
var nano = require('nano')('http://localhost:5984');
var settings = require('./settings.js');

// Configure couchdb
nano.db.get('bach-bot-db', function(error, body) {
    if (!error) {
        logger.info('bach-bot-db already exists. Continuing execution...');
    } else {
        logger.info('bach-bot-db does not exist. Creating it...');
        nano.db.create('bach-bot-db', function(error, body) {
            if (!error) {
                logger.info('Database bach-bot-db created!');
            }
        });
    }
});
var bachBotDB = nano.db.use('bach-bot-db');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client();
bot.login(auth.token);

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.user.username + ' - (' + bot.user.id + ')');
});

bot.on('message', message => {
    // Only listen on specified channels
    if (settings.listenOnChannels.length == 0 ||
        settings.listenOnChannels.indexOf(channelID) > -1) {

        // Check for trigger phrase for bot commands
        var messageContent = message.content;
        if (messageContent.length >= settings.triggerPhrase.length &&
            messageContent.substring(0, settings.triggerPhrase.length) == settings.triggerPhrase) {

            var args = messageContent.split(' ');
            var cmd = args[1];

            args = args.splice(1);
            switch(cmd) {
                case 'goto':
                    if (!message.guild) return;

                    break;
                case 'come':
                    if (!message.guild) return;
                    if (message.member.voiceChannel) {
                        message.member.voiceChannel.join()
                            .then(connection => { // Connection is an instance of VoiceConnection
                                message.reply('I have successfully connected to the channel!');
                            })
                    }
                    break;
                case 'leave':
                    if (!message.guild) return;
                    if (message.member.voiceChannel) {
                        message.member.voiceChannel.leave();
                    }
                    break;
                case 'leave-all':
                    bot.voiceConnections.forEach(function (connection, connectionID) {
                        connection.channel.leave();
                    })
                    break;
                case 'play':
                    var memberVoiceConnection = bot.voiceConnections.find(vc => vc.channel.equals(message.member.voiceChannel));
                    if (memberVoiceConnection != undefined)
                        var stream = ytdl('https://www.youtube.com/watch?v=U1ei5rwO7ZI', { filter : 'audioonly' });
                        var dispatcher = memberVoiceConnection.playStream(stream, streamOptions);
                    break;
                case 'hi':
                    message.reply("Hi, here's  a pizza -> :pizza:")
                        .then(msg => console.log(`Sent a reply to ${msg.author}`))
                        .catch(console.error);
                    break;
            // Just add any case commands if you want to..®
            }
        }
    }
});
