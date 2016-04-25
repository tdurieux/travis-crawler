var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

var urlDataset = 'mongodb://localhost:27017/travisDataset';
// Use connect method to connect to the Server
MongoClient.connect(urlDataset, function (err, db) {
    console.log("Connected correctly to server");

    db.collection("repos").aggregate([
        {
            $match: {
                "builds.state": "failed",
                "builds.4000": {"$exists": true}
            }
        },
        {
            $project: {
                _id: 0,
                builds: {
                    $filter: {
                        input: "$builds",
                        as: "build",
                        cond: {$eq: ["$$build.state", "failed"]}
                    }
                },
                owner: 1,
                name: 1
            }
        }
    ], function (err, data) {
        for (var i = 0; i < data.builds.length; i++) {
            var build = data.builds[i];
            console.log(build.state);
        }
        db.close();
    })
});