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
    var count = 0;
    requestRepos.on('data', function (data) {
        requestRepos.pause();
        var countLog = 0;
        const builds = data.builds;
        delete data.builds;
        async.eachLimit(builds, 8, function (build, callback) {
            count ++;
	    if (build.id == 106229838 || build.id == 106220353) {
		return callback();
	    }
            db.collection('build').findOne({
                "id": build.id
            }, function (err, result) {
                if (err) {
                    return callback(err);
                }
                if (result) {
                    return callback();
                }
                var logs = {};
		console.log("Begin " + data.owner + "/" + data.name + " "  + build.id)
                async.eachSeries(build.job_ids, function (job_id, callbackJob) {
                    getLog(job_id).then(function (log) {
			if (typeof log === 'string' || log instanceof String) {
			} else {
                            return callbackJob();
                        }
			if (!log) {
                            return callbackJob();
                        }
			if (!log.length) {
			    console.log('Error log', log);
                            return callbackJob();
			}
			console.log(log.length);
                        countLog++;
                        request.post({url: 'http://localhost:7070/', body: log}, function(error, httpResponse) {
                            if (error) {
                                return callbackJob();
                            }
                            try {
                                const jsOutput = JSON.parse(httpResponse.body);
                                if (!jsOutput) {
                                    return callbackJob();
                                }
                                logs[job_id] = jsOutput;
                            } catch (e) {
                                console.error(e);
                            }
                            callbackJob();
                        });
                    }, function (err) {
                        console.error(err);
                        callbackJob();
                    });
                }, function (err) {
                    if (err) {
                        console.error(err);
                        return callback();
                    }
                    build.logs = logs;
                    build.repo = data;
                    db.collection("build").insertOne(build, function(err, result) {
                        if (err) {
			    console.error(err);
                            return callback(err);
                        }
                        console.log("End " + data.owner + "/" + data.name + " "  + build.id + " " + err)
                        callback();
                    });
                })
            });
        }, function (err) {
            if (err) {
                console.error(err);
            }
            console.log(count);
            requestRepos.resume();
        });
    });
    requestRepos.once("end", function () {
console.log("close");
db.close();
    })
});
