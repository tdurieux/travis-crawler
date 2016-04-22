const getLog = require('./utils').getLog;
const async = require("async");
const request = require('request');

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

var urlDataset = 'mongodb://localhost:27017/travisDataset';
// Use connect method to connect to the Server
MongoClient.connect(urlDataset, function(err, db) {
    if (err) {
        return console.error(err);
    }
    console.log("Connected correctly to server");
    
    const requestRepos = db.collection("repos").aggregate([
        {
            $match: {
                "builds.state": "failed",
                "builds.1000": {"$exists": true},
                "builds.config.language": "java"
            }
        },
        {
            $project: {
                _id: 0,
                builds: {
                    $filter: {
                        input: "$builds",
                        as: "build",
                        cond: { $eq: [ "$$build.state", "failed" ] }
                    }
                },
                owner: 1,
                name: 1
            }
        }
    ]);
    var exceptionTypes = {};
    requestRepos.on('data', function (data) {
        requestRepos.pause();
        var countLog = 0;
        const builds = data.builds;
        delete data.builds;
        async.eachSeries(builds, function (build, callback) {
            db.collection('repos').findOne({
                "id": build.id
            }, function (err, result) {
                if (err) {
                    return callback(err);
                }
                if (result) {
                    return callback();
                }
                var logs = {};
                async.each(build.job_ids, function (job_id, callbackJob) {
                    getLog(job_id).then(function (log) {
                        countLog++;
                        request.post({url: 'http://localhost:7070/', body: log}, function(error, httpResponse) {
                            if (error) {
                                return callbackJob(err);
                            }
                            const jsOutput = JSON.parse(httpResponse.body);
                            if (!jsOutput) {
                                return callbackJob();
                            }
                            logs[job_id] = jsOutput;
                            for (var i = 0; i < jsOutput.length; i++) {
                                if (!exceptionTypes[jsOutput[i].exceptionType]) {
                                    exceptionTypes[jsOutput[i].exceptionType] = 1;
                                } else {
                                    exceptionTypes[jsOutput[i].exceptionType] ++;
                                }
                                console.log(jsOutput[i].exceptionType, exceptionTypes[jsOutput[i].exceptionType]);
                            }
                            callbackJob();
                        });
                    }, function (err) {
                        console.error(err);
                        callbackJob(err);
                    });
                }, function (err) {
                    if (err) {
                        console.error(err);
                        return callback(err);
                    }
                    console.log("# log " + countLog);
                    build.logs = logs;
                    build.repo = data;
                    db.collection("build").insertOne(build, function(err, result) {
                        if (err) {
                            return callback(err);
                        }
                        callback();
                    });
                })
            });
        }, function (err) {
            requestRepos.resume();
            console.error(err);
        });
    });
    requestRepos.once("end", function () {
        db.close();
    })
});