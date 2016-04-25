// count the number of builds
db.repos.aggregate(
    [
        {
            $group: {
                _id: 1,
                count: {$sum: {$size: {"$ifNull": ["$builds", []]}}}
            }
        }
    ]
)

// count the number of builds per repository
db.repos.aggregate(
    [
        {
            $group: {
                _id: {owner: "$owner", name: "$name"},
                count: {$sum: {$size: {"$ifNull": ["$builds", []]}}}
            }
        }
    ]
)

// count the number of project that have more that 10 failure
db.repos.aggregate([
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
                    cond: {$eq: ["$$build.state", "failed"]}
                }
            },
            owner: 1,
            name: 1
        }
    },
    {$group: {_id: null, count: {$sum: 1}}}
])

// count the number of failed builds
db.repos.aggregate([
    {
        $match: {
            "builds.state": "failed",
            // "builds.1000": {"$exists": true},
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
                    cond: {$eq: ["$$build.state", "failed"]}
                }
            },
            owner: 1,
            name: 1
        }
    },
    {$group: {_id: null, count: {$sum: {$size: "$builds"}}}}
])

// find failed java builds
db.repos.aggregate([
    {
        $match: {
            "builds.state": "failed",
            "builds.config.language": "java"
        }
    },
    {
        $project: {
            builds: {
                $filter: {
                    input: "$builds",
                    as: "build",
                    cond: {$eq: ["$$build.state", "failed"]}
                }
            }
        }
    }
])

// count repositories that have failed build
db.repos.count({
    "builds.state": "failed"
})

// count repositories that have at least one build
db.repos.count({"builds.0": {"$exists": true}})