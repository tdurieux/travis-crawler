var Travis = require('travis-ci');
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var csv = require("fast-csv");

csv.fromPath("data/top_projects.csv")
    .on("data", function(data){
        console.log(data);
    })
    .on("end", function(){
        console.log("done");
    });
return;

var urlDataset = 'mongodb://localhost:27017/travisDataset';
// Use connect method to connect to the Server
MongoClient.connect(urlDataset, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    var collection = githubDb.collection('repos');
    const reposStream = collection.find({"language": "Java", "fork": false, "private": false});
    reposStream.on('data', function (repo) {
        getBuilds(repo.owner.login, repo.name).then(function (data) {
            if (data.builds.length == 0) {
                return;
            }
            console.log(repo.owner.login, repo.name, data.builds.length);
        });
        //getAllBuilds("tdurieux", "leboncoin-api").then(console.log);
    });
    reposStream.once('end', function() {
        console.log("END");
        githubDb.close();
        db.close();
    });
});

var travis = new Travis({
    version: '2.0.0'
});

function getBuilds(organisation, project, after_number) {
    const options = {};
    if (after_number) {
        options.after_number = after_number;
    }
    return new Promise(function(resolve, reject) {
        travis.repos(organisation, project).builds().get(options, function (err, builds) {
            if (err) {
                return reject(err);
            }
            return resolve(builds);
        });
    });
}

function getAllBuilds(organisation, project, after_number) {
    return new Promise(function(resolve, reject) {
        getBuilds(organisation, project, after_number).then(function (builds) {
            const length = builds.builds.length;
            if (length < 25) {
                return resolve(builds);
            }
            after_number = builds.builds[length - 1].number;
            _getAllBuilds(organisation, project, after_number).then(function (b) {
                builds.builds = builds.builds.concat(b.builds);
                builds.commits = builds.commits.concat(b.commits);
                return resolve(builds);
            }, function () {
                return resolve(builds);
            });
        }, reject)
    });
}