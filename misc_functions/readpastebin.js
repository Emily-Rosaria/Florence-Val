const fetch = require('node-fetch');

module.exports = async function(link) {
    const regex = /dog/gi;
    const pastelink = 'https://pastebin/raw/' + link.replace(/https:\/\//i,'').replace(/www\./i,'').replace(/pastebin\.com/,'').replace(/\/raw/,'').split('/W')[0];
    const text = await fetch(pasteLink).then((t) => t.text()).catch(()=> return '');
    return text;
};
