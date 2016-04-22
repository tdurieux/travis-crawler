var Travis = require('travis-ci');

var travis = new Travis({
    version: '2.0.0'
});

var countRequestPerMinutes = 0;
setTimeout(function () {
    setInterval(function () {
        console.error("# request 20 sec: " + countRequestPerMinutes);
        countRequestPerMinutes = 0;
    }, 20000);
}, 60 - new Date().getSeconds() * 1000);


function getJob(jobId) {
    return new Promise(function (resolve, reject) {
        if (countRequestPerMinutes < 500) {
            countRequestPerMinutes++;
            return travis.jobs(jobId, function (err, res) {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        } else {
            return setTimeout(function () {
                return getJob(jobId).then(resolve, reject);
            }, 2000);
        }
    });
}

function getLog(jobId) {
    return new Promise(function (resolve, reject) {
        if (countRequestPerMinutes < 500) {
            countRequestPerMinutes++;
            return travis.jobs(jobId).log.get(function (err, res) {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        } else {
            return setTimeout(function () {
                return getLog(jobId).then(resolve, reject);
            }, 2000);
        }
    });
}

function getBuilds(organisation, project, after_number) {
    const options = {};
    if (after_number) {
        options.after_number = after_number;
    }
    return new Promise(function(resolve, reject) {
        if (countRequestPerMinutes < 500) {
            countRequestPerMinutes++;
            return travis.repos(organisation, project).builds().get(options, function (err, builds) {
                if (err) {
                    return reject(err);
                }
                return resolve(builds);
            });
        } else {
            return setTimeout(function () {
                return getBuilds(organisation, project, after_number).then(resolve, reject);
            }, 2000);
        }
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
            getAllBuilds(organisation, project, after_number).then(function (b) {
                builds.builds = builds.builds.concat(b.builds);
                builds.commits = builds.commits.concat(b.commits);
                return resolve(builds);
            }, function () {
                return resolve(builds);
            });
        }, reject)
    });
}

function parseGithubURL(url) {
    if (!url) {
        return null;
    }
    var match = url.match("https://github.com/([^/]+)/([^/]+)");
    return {
        owner: match[1],
        name: match[2]
    };
}

module.exports.getLog = getLog;
module.exports.getJob = getJob;
module.exports.getBuilds = getBuilds;
module.exports.getAllBuilds = getAllBuilds;
module.exports.parseGithubURL = parseGithubURL;