const delay = ms => new Promise(res => setTimeout(res, ms));

function getChatId(message) {
    return message.fromMe ? message.to : message.from;
}

function getAuthorId(message, client) {
    if (message.fromMe) {
        return client.info.wid._serialized;
    }
    return message.author || message.from;
}

module.exports = { delay, getChatId, getAuthorId };
