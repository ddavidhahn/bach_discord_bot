// Include packages
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const streamOptions = { seek: 0, volume: 1 };

var bodyParser = require('body-parser');
var express = require('express');
var logger = require('winston');
var nano = require('nano')('http://localhost:5984');
var path = require('path');

var youtubedl = require('youtube-dl');
var youtubedlOptions = ['--username=user', '--password=hunter2'];

// Include file information
var auth = require('./auth.json');
var settings = require('./settings.js');

// Stream globals
var stream;
var dispatcher;
var queue = [{
    'url' : "https://www.youtube.com/watch?v=sz2mmM-kN1I",
    'title' : 'Nickelstats'
}, {
    'url' : "https://www.youtube.com/watch?v=1Bix44C1EzY",
    'title' : 'Congratulations!!!'
}, {
    'url' : "https://www.youtube.com/watch?v=sz2mmM-kN1I",
    'title' : 'Nickelstats'
}, {
    'url' : "https://www.youtube.com/watch?v=1Bix44C1EzY",
    'title' : 'Congratulations!!!'
}, {
    'url' : "https://www.youtube.com/watch?v=sz2mmM-kN1I",
    'title' : 'Nickelstats'
}, {
    'url' : "https://www.youtube.com/watch?v=1Bix44C1EzY",
    'title' : 'Congratulations!!!'
}, {
    'url' : "https://www.youtube.com/watch?v=sz2mmM-kN1I",
    'title' : 'Nickelstats'
}, {
    'url' : "https://www.youtube.com/watch?v=1Bix44C1EzY",
    'title' : 'Congratulations!!!'
}, {
    'url' : "https://www.youtube.com/watch?v=sz2mmM-kN1I",
    'title' : 'Nickelstats'
}];

// Configure express setup
var app = express();
var arr  = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'ui')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/ui/index.html'));
});

app.post('/endpoint', function(req, res){
	var obj = {};
	console.log('body: ' + JSON.stringify(req.body));
	res.send(req.body);
});

app.listen(settings.listenOnPort);

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
            logger.info(error);
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
        settings.listenOnChannels.indexOf(message.channel.id) > -1) {

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
                    var channelName = args[1];
                    var channel = message.guild.channels.find('name', channelName);
                    channel.join()
                        .then(connection => {
                            message.reply('I have successfully connected to the channel!');
                        })
                    break;
                case 'come':
                    if (!message.guild) return;
                    if (message.member.voiceChannel) {
                        message.member.voiceChannel.join()
                            .then(connection => {
                                message.reply('I have successfully connected to the channel!');
                            })
                    }
                    break;
                case 'leave':
                    if (!message.guild) return;
                    if (message.member.voiceChannel) {
                        // TODO: Need to add error checking here for ending while dispatcher is playing
                        message.member.voiceChannel.leave();
                    }
                    break;
                case 'leave-all':
                    bot.voiceConnections.forEach(function (connection, connectionID) {
                        connection.channel.leave();
                    })
                    break;
                case 'list':
                    var playlistString = 'Currently queued songs:\n';
                    if (queue.length > 0) {
                        var counter = 1;
                        queue.forEach(function (entry) {
                            playlistString += counter.toString() + '. ' + entry['title'] + '\n';
                            counter += 1;
                        });
                        message.reply(playlistString);
                    } else {
                        message.reply(playlistString + 'Empty!\nAdd songs with \'' + settings.triggerPhrase + ' queue __youtube_url__\'');
                    }
                    break;
                case 'play':
                    var memberVoiceConnection = bot.voiceConnections.find(vc => vc.channel.equals(message.member.voiceChannel));
                    if (memberVoiceConnection != undefined)
                        playNextSong(memberVoiceConnection, message);
                    break;
                case 'pause':
                    dispatcher.pause();
                    break;
                case 'queue':
                    var url = args[1];
                    if (url != null && url != '') {
                        youtubedl.getInfo(url, function(err, info) {
                            if (err) {
                                message.reply("I couldn't access that youtube link :'('");
                            } else {
                                queue.push({
                                    'url': url,
                                    'title': info.title
                                });
                            }
                        });
                    } else {
                        message.reply('You should include a url after \'' + settings.triggerPhrase + '\'');
                    }
                    break;
                case 'next':
                    var memberVoiceConnection = bot.voiceConnections.find(vc => vc.channel.equals(message.member.voiceChannel));
                    playNextSong(memberVoiceConnection, message);
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

var playNextSong = function (memberVoiceConnection, message) {
    if (dispatcher != null && dispatcher.paused) {
        dispatcher.resume();
    } else {
        if (dispatcher != null && !dispatcher.destroyed) {
            dispatcher.end();
        } else {
            initiateStream(memberVoiceConnection, message);
        }
    }
};

// TODO: fix problems with replying (queue is off by 1)
var initiateStream = function (memberVoiceConnection, message) {
    if (queue.length == 0) {
        message.reply('The queue is empty! Add songs with \'' + settings.triggerPhrase + ' queue __youtube_url__\'');
    } else {
        var song = queue.shift();
        var url = song['url'];
        var title = song['title'];

        stream = ytdl(url, { filter : 'audioonly' });
        dispatcher = memberVoiceConnection.playStream(stream, streamOptions);
        dispatcher.on('end', (reason) => {
            // NOTE: Very hacky way to get around issue at https://github.com/hydrabolt/discord.js/issues/1387
            setTimeout(function () {
                initiateStream(memberVoiceConnection, message);
            }, 1000);
        });
    }
};
