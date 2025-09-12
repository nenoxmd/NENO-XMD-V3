const fs = require('fs');
const path = require('path');
const config = require('../settings')
const {lite , commands} = require('../neno')


// Composing (Auto Typing)
lite({
    on: "body"
},    
async (conn, mek, m, { from, body, isOwner }) => {
    if (config.AUTO_TYPING === 'true') {
        await conn.sendPresenceUpdate('composing', from); // send typing 
    }
});
