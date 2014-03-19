var bundler    = require('./bundler')
  , twitter    = require('ntwitter')
  , twitterapi = require('./api/twitterapi');

var t = new twitter(twitterapi.keys);

// Compares entities to Twitter stream, counts every match
exports.aggregator = function(callback) {
  bundler.initialize().then(function(masterlist) {

    t.stream('statuses/filter', { track: masterlist.keywords }, function(stream) {

      // read twitter firehose for incoming tweets.
      stream.on('data', function(tweet) {
        var tweetText = tweet.text.toLowerCase()
          , hashtags  = [];

        masterlist.children.forEach(function(entity) {
            if (tweetText.indexOf(entity.name.toLowerCase()) !== -1) {
              hashtags = tweetText.match(/#\S+/g);

              if (hashtags) {
                // if there are no hashtags, add them all
                if (entity.children.length === 0 ) {

                  entity.children.push({"name": hashtags[0], "size": 1});

                } else {
                  entity.children.forEach(function(child, i) {
                    hashtags.forEach(function(hashtag, j) {

                      if (hashtag === child.name) {
                        child.size += 1;
                        hashtags[j] = false;

                        callback(masterlist);
                      }
                    });
                  });

                  // check if any values were never added
                  hashtags.forEach(function(hashtag) {
                    if (hashtag) {
                      var newHashtag = {"name": hashtag, "size": 1};
                      entity.children.push(newHashtag);

                      callback(masterlist);
                    }
                  });

                };

              } else {
                callback(masterlist);
              }
            }
          });
      });
    });
  });
};
