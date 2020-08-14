const dotenv = require('dotenv');
const twitter = require('twitter');

dotenv.config();

var client = new twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

client.post('statuses/update', { status: '[TEST] Tu nu leen baze linga!?' }, (error, tweet, response) => {
});
