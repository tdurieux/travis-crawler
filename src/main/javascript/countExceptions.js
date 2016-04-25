const async = require("async");

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

var urlDataset = 'mongodb://localhost:27017/travisDataset';
// Use connect method to connect to the Server
MongoClient.connect(urlDataset, function (err, db) {
    if (err) {
        return console.error(err);
    }

    const requestRepos = db.collection("build").find();
    var exceptionTypes = {};
    var jobCount = 0;
    var buildCount = 0;
    var totalCount = 0;
    requestRepos.on('data', function (build) {
        buildCount++;
        //requestRepos.pause();
        for (var j in  build.logs) {
            jobCount++;
            const log = build.logs[j];
            for (var i = 0; i < log.length; i++) {
                totalCount++;
                if (!exceptionTypes[log[i].exceptionType]) {
                    exceptionTypes[log[i].exceptionType] = 1;
                } else {
                    exceptionTypes[log[i].exceptionType]++;
                }
            }
        }
        requestRepos.resume();
    });
    requestRepos.once("end", function () {
        db.close()
        var sorted = [];
        for (var key in exceptionTypes) {
            sorted[sorted.length] = key;
        }
        sorted.sort(function (a, b) {
            return exceptionTypes[b] - exceptionTypes[a];
        });
        for (var i = 0; i < sorted.length; i++) {
            console.log(sorted[i], exceptionTypes[sorted[i]] + "/" + totalCount, parseInt(exceptionTypes[sorted[i]] / totalCount * 100) + "%")
        }
        console.log("# build", buildCount, "# job", jobCount, "# diff exception", sorted.length);
    })
});
