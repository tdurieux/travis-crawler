const async = require("async");

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

var urlDataset = 'mongodb://localhost:27017/travisDataset';
// Use connect method to connect to the Server
MongoClient.connect(urlDataset, function(err, db) {
    if (err) {
        return console.error(err);
    }
    console.log("Connected correctly to server");
    
    const requestRepos = db.collection("build").find();
    var exceptionTypes = {};
    requestRepos.on('data', function (build) {
        requestRepos.pause();
        async.eachLimit(build.logs, 8, function (log, callback) {
            for (var i = 0; i < log.length; i++) {
                if (!exceptionTypes[log[i].exceptionType]) {
                    exceptionTypes[log[i].exceptionType] = 1;
                } else {
                    exceptionTypes[log[i].exceptionType]++;
                }
            }
            callback();
        }, function () {
            requestRepos.resume();
        });
    });
    requestRepos.once("end", function () {
        db.close();
        var sorted = [];
        for(var key in exceptionTypes) {
            sorted[sorted.length] = key;
        }
        sorted.sort(function (a, b) {
            return exceptionTypes[b] - exceptionTypes[a];
        });
        for (var i = 0; i < sorted.length; i++) {
            console.log(sorted[i], exceptionTypes[sorted[i]])
        }   
    })
});