var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var settings = require('./settings.js');
var nano = require('nano')('http://localhost:5984');
var test_db = nano.db.use('bach-bot-db');
var d = new Date();

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
                    enterVoiceChannel(bot, channelID, targetChannelName, function () {
                    console.log('Joined ' + targetChannelName);
                    });
                    break;
                case 'hi':
                    bot.sendMessage({
                        to : channelID,
                        message: "Hello :pizza:",
                        typing: true
                    })
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
        targetBot.joinVoiceChannel(destinationChannelID, callback);
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
        // console.log(channelEntry.name);
        // console.log(targetChannelName);
        // console.log(channelEntry.guild_id);
        // console.log(serverID);
        if (channelEntry.name == targetChannelName && channelEntry.guild_id == serverID) {
            return channelEntry.id;
        }
    }
    return null;
};
