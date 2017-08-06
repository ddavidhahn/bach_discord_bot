# Bach Discord Bot

Bach is a bot for discord which allows users to customize music playlists and play music in Discord Server voice channels.

## Setup

You should install the required applications and packages before trying to
run the bot.

```
./install_requirements
```

You also need to create an application on the Discord developer portal. There are some handy instructions for this [here](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token).

After this you should have access to your bot's authentication token. You can view it at `APP BOT USER > Token > click to reveal`. Add this to the `auth.json` file:

```
{
   "token": "YOUR TOKEN HERE"
}
```

Finally, you need to set up the database. Run couchdb simply by executing `couchdb` in the command line. Then go to http://localhost:5984/_utils/.

Click `Create new database` and make the name `bach-bot-db`.

## Initialize

You need to start by running couchdb which holds all the relevant playlist and music information.

```
couchdb
```

Then you can start the bot up.

```
node bot.js
```

## Commands
