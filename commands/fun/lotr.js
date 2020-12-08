const fetch = require('node-fetch'); // This lets me get stuff from api.

module.exports = {
    name: 'lotr', // The name of the command
    description: 'Get random lotr quotes!', // The description of the command (for help text)
    args: false, // Specified that this command doesn't need any data other than the command
    cooldown: 15, // 15s cooldown so I don't overload the website's API
    allowDM: true,
    perms: 'writer', //restricts to users with the "verifed" role noted at config.json
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {
        const Qurl = "https://the-one-api.dev/v2/quote";
        const Curl = "https://the-one-api.dev/v2/character";
        const bearer = 'Bearer ' + process.env.LOTR;
        const quotes = await fetch(Qurl, {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
              }
            }).then(response => response.json());
        quote = quotes.docs[Math.floor(Math.random() * quotes.docs.length)];
        const character = await fetch((Curl + '/' + quote.character), {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
              }
            }).then(response => response.json());
        cleanQuote = quote.dialog.trim().replace(/\s\s+/g, ' ');
        cleanQuote = cleanQuote.charAt(0).toUpperCase() + cleanQuote.slice(1);
        message.channel.send("*\"" + cleanQuote + "\"*\n - " + character.docs[0].name);
    },
};
