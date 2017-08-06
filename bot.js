var auth = require('./auth.json');
var Discord = require('discord.io');
var logger = require('winston');
var nano = require('nano')('http://localhost:5984');
var settings = require('./settings.js');
var ytaStream = require('youtube-audio-stream');

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
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {

    // Only listen on specified channels
    if (settings.listenOnChannels.length == 0 ||
        settings.listenOnChannels.indexOf(channelID) > -1) {
        if (message.length >= settings.triggerPhrase.length &&
            message.substring(0, settings.triggerPhrase.length) == settings.triggerPhrase) {

            var args = message.split(' ');
            var cmd = args[1];

            args = args.splice(1);
            switch(cmd) {
                case 'goto':
                    var targetChannelName = args[1];
                    enterVoiceChannel(bot, channelID, targetChannelName, function (error, events) {
                        if (!error) {
                            logger.info('Joined ' + targetChannelName);
                        } else {
                            logger.info('Failed to join ' + targetChannelName);
                        }
                    });
                    break;
                case 'play':
                    var targetChannelName = args[1];
                    var targetUrl = args[2];
                    enterVoiceChannel(bot, channelID, targetChannelName, function(channelID) {
                        // Get the audio context
                        bot.getAudioContext(channelID, function(error, s) {
                            //Once again, check to see if any errors exist
                            if (error) return console.error(error);

                            logger.info('Starting to play audio for ' + targetUrl + ' at ' + channelID);
                            ytaStream(targetUrl).pipe(s, {end: false});

                            //The stream fires `done` when it's got nothing else to send to Discord.
                            s.on('done', function() {
                               logger.info('Done playing audio for ' + targetUrl);
                            });
                        });
                    });
                    break;
                case 'hi':
                    bot.sendMessage({
                        to : channelID,
                        message: "Hello :pizza:",
                        typing: true
                    })
                    break;
            // Just add any case commands if you want to..
            }
        }
    }
});

var enterVoiceChannel = function (targetBot,
    sourceChannelID,
    targetChannelName,
    callback) {

    var serverID = findServerGivenChannelID(targetBot, sourceChannelID);
    if (serverID != null) {
        var destinationChannelID = findChannelIDGivenName(targetBot, serverID, targetChannelName);
    }

    if (destinationChannelID != null) {
        targetBot.joinVoiceChannel(destinationChannelID, function (error, events) {

            //Check to see if any errors happen while joining.
            if (error) return console.error(error);

            callback(destinationChannelID);
        });
    }
}

var findServerGivenChannelID = function (targetBot, channelID) {
    var channelsDictionary = targetBot.channels;
    var channelEntry = channelsDictionary[channelID];
    if (channelEntry != undefined) {
        return channelEntry.guild_id;
    }
    return null;
};

var findChannelIDGivenName = function (targetBot, serverID, targetChannelName) {
    var channelsDictionary = targetBot.channels;
    for (var channelKey in channelsDictionary) {
        var channelEntry = channelsDictionary[channelKey];
        if (channelEntry.name == targetChannelName && channelEntry.guild_id == serverID) {
            return channelEntry.id;
        }
    }
    return null;
};
