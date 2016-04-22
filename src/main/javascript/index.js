const getAllBuilds = require('./utils').getAllBuilds;
const parseGithubURL = require('./utils').parseGithubURL;

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var csv = require("fast-csv");

const MAX_PROCESS = 15;
var count = 0;
var inProcess = 0;
var error = false;
var urlDataset = 'mongodb://localhost:27017/travisDataset';
// Use connect method to connect to the Server
MongoClient.connect(urlDataset, function(err, db) {
    console.log("Connected correctly to server");
    const reposStream = csv.fromPath("data/top_projects.csv");
    
    reposStream.on('data', function (repo) {
        if (repo[0] == "repository_url") {
            return;
        }
        const info = parseGithubURL(repo[0]);
        if (!info) {
            return;
        }
        reposStream.pause();
        db.collection('repos').findOne({
            "owner": info.owner,
            "name": info.name
        }, function (err, result) {
            if (err) {
                console.error(err);
                reposStream.resume();
                return;
            }
            if (result != null) {
                if (!error) {
                    reposStream.resume();
                }
                count ++;
                console.log(count, "already cowled", info.owner, info.name, result.builds?result.builds.length: 0);
                return;
            }
            inProcess ++;
            if (inProcess < MAX_PROCESS && !error) {
                reposStream.resume();
            }
            getAllBuilds(info.owner, info.name).then(function (data) {
                for (var i = 0; i < data.builds.length; i++) {
                    var build = data.builds[i];
                    build.commit = data.commits[i];
                    for (var index in build.config) {
                        if (index.indexOf(".") != -1) {
                            build.config[index.replace(".", "")] = build.config[index];
                            delete build.config[index];
                        }
                    }
                }
                const value = {
                    "owner": info.owner,
                    "name": info.name,
                    "builds": data.builds,
                    "size": parseInt(repo[1].replace(",", "")),
                    "forks": parseInt(repo[2]),
                    "watchers": parseInt(repo[3]),
                    "normForks": parseFloat(repo[4]),
                    "normWatchers": parseFloat(repo[5]),
                    "normForks_normWatchers": parseFloat(repo[6])
                };
                db.collection('repos').insertOne(value, function(err, result) {
                    if (err) {
                        console.error(err);
                    }
                    inProcess--;
                    if (!error) {
                        reposStream.resume();
                    }
                    count ++;
                    console.log(count, info.owner, info.name, result.builds?result.builds.length: 0);
                });
            }, function (e) {
                error = true;
                console.error(e);
                setTimeout(function () {
                    inProcess--;
                    error = false;
                    reposStream.resume();
                }, 750);
            });

        });
    });
    reposStream.once('end', function() {
        console.log("END");
        //db.close();
    });
    
});