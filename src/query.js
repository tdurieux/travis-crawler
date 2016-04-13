db.repos.aggregate([{"$project": {
    item: 1,
    name: "$name",
    countBuild: {
        $size: { "$ifNull": [ "$builds", [] ] }
    }
}}])

db.repos.aggregate(
    [
        {
            $group:
            {
                _id: 1,
                count: { $sum: {$size: { "$ifNull": [ "$builds", [] ] }} }
            }
        }
    ]
)

db.repos.aggregate(
    [
        {
            $group:
            {
                _id: {owner:"$owner", name: "$name"},
                count: { $sum: {$size: { "$ifNull": [ "$builds", [] ] }} }
            }
        }
    ]
)

db.repos.aggregate(
    [
        {
            $group:
            {
                _id: {owner:"$owner", name: "$name"},
                count: { $sum: {$size: { "$ifNull": [ {
                    items: {
                        $filter: {
                            input: "$builds",
                            as: "build",
                            cond: { $eq: [ "$$build.state", "failed" ] }
                        }
                    }
                }, [] ] }} }
            }
        }
    ]
)

db.repos.aggregate([
    {
        $project: {
            builds: {
                $filter: {
                    input: "$builds",
                    as: "build",
                    cond: { $eq: [ "$$build.state", "failed" ] }
                }
            }
        }
    }
])

db.repos.find({
    "builds.state": "failed"
})

db.repos.count({
    "builds.state": "failed"
})

db.repos.count({"builds.0": {"$exists": true}})