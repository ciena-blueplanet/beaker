/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @copyright 2014-2015 Cyan, Inc. All rights reserved.
*/

/* eslint max-nested-callbacks: 0 */

'use strict';

var _ = require('lodash');
var httpSync = require('http-sync');
var nock = require('nock');
var sh = require('execSync');
var versiony = require('versiony');

var _config = require('../src/config');
var config = require('./sample-config.json');

var t = require('../src/transplant')(__dirname);
var github = t.require('./github');

var GITHUB_HOST = 'https://' + config.github.host;

describe('github', function () {
    beforeEach(function () {
        spyOn(_config, 'load').and.returnValue(config);
    });

    describe('.bumpFiles()', function () {
        beforeEach(function () {
            spyOn(versiony, 'minor').and.callFake(function () {
                return this;
            });
            spyOn(versiony, 'newMajor');
            spyOn(versiony, 'patch');
        });

        it('handle major bumps', function () {
            expect(github.bumpFiles('major')).toBeTruthy();
            expect(versiony.newMajor).toHaveBeenCalled();
        });

        it('handle minor bumps', function () {
            expect(github.bumpFiles('minor')).toBeTruthy();
            expect(versiony.minor).toHaveBeenCalled();
            expect(versiony.patch).toHaveBeenCalledWith(0);
        });

        it('handle patch bumps', function () {
            expect(github.bumpFiles('patch')).toBeTruthy();
            expect(versiony.patch).toHaveBeenCalled();
        });

        it('returns false for unknown bump type', function () {
            expect(github.bumpFiles('non-existent-bump-type')).toBeFalsy();
        });
    });

    describe('.bumpVersion()', function () {
        var argv,
            commits,
            prs,
            version;

        beforeEach(function () {
            argv = {
                _: ['github', 'bump-version'],
                repo: 'cyaninc/my-repo-name',
                sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
            };

            spyOn(github, 'commitBumpedFiles');

            spyOn(github, 'getCommits').and.callFake(function () {
                return commits;
            });

            spyOn(github, 'getPullRequest').and.callFake(function (repo, number) {
                return prs[number];
            });

            // Do not actual read version from file
            spyOn(versiony, 'from').and.callFake(function () {
                this.version(version);
                return this;
            });

            // Do not actual write to files
            spyOn(versiony, 'to').and.callFake(function () {
                return this;
            });

            spyOn(versiony, 'end').and.callFake(function () {
                version = this.get();
            });
        });

        it('returns 1 if missing repo argument', function () {
            delete argv.repo;
            expect(github.bumpVersion(argv)).toBe(1);
        });

        describe('when multiple PRs merged', function () {
            beforeEach(function () {
                version = '1.0.0';

                commits = [{
                    commit: {
                        author: {email: 'not-' + config.github.email},
                        message: 'Merge pull request #2',
                    },
                }, {
                    commit: {
                        author: {email: 'not-' + config.github.email},
                        message: 'Merge pull request #1',
                    },
                }];

                prs = {
                    1: {body: '#MINOR#'},
                    2: {body: '#MAJOR#'},
                };

                github.bumpVersion(argv);
            });

            it('bumps version from oldest PR to newest PR', function () {
                // Note: if it fails to bump from oldest to newest then the version will be 2.1.0 instead of 2.0.0
                expect(version).toEqual('2.0.0');
            });

            it('calls commitBumpedFiles', function () {
                expect(github.commitBumpedFiles).toHaveBeenCalled();
            });
        });
    });

    describe('.command()', function () {
        var argv;

        beforeEach(function () {
            argv = {
                _: ['github'],
            };

            spyOn(console, 'error');
        });

        it('errors when wrong number of positional arguments', function () {
            var ret = github.command(argv);
            expect(console.error).toHaveBeenCalledWith('Invalid command: ["github"]');
            expect(ret).not.toBe(0);
        });

        it('errors when invalid command', function () {
            argv._.push('foo');
            var ret = github.command(argv);
            expect(console.error).toHaveBeenCalledWith('Unknown command: foo');
            expect(ret).not.toBe(0);
        });

        describe('create release', function () {
            var ret;

            beforeEach(function () {
                argv = {
                    _: ['github', 'release'],
                    repo: 'cyaninc/my-repo-name',
                    version: '0.1.2',
                };

                spyOn(github, 'createRelease');

                ret = github.command(argv);
            });

            it('makes the call to createRelease', function () {
                expect(github.createRelease).toHaveBeenCalledWith(argv);
            });

            it('returns 0', function () {
                expect(ret).toBe(0);
            });
        });

        describe('version bump specified', function () {
            var ret;

            beforeEach(function () {
                argv = {
                    _: ['github', 'version-bumped'],
                    repo: 'cyaninc/my-repo-name',
                    sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
                };

                spyOn(github, 'versionBumped').and.returnValue(0);

                ret = github.command(argv);
            });

            it('makes the call to verisonBumped', function () {
                expect(github.versionBumped).toHaveBeenCalledWith(argv);
            });

            it('returns 0', function () {
                expect(ret).toBe(0);
            });
        });

        describe('bumps version', function () {
            var ret;

            beforeEach(function () {
                argv = {
                    _: ['github', 'bump-version'],
                    repo: 'cyaninc/my-repo-name',
                    sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
                };

                spyOn(github, 'bumpVersion').and.returnValue(0);

                ret = github.command(argv);
            });

            it('makes the call to bumpVersion', function () {
                expect(github.bumpVersion).toHaveBeenCalledWith(argv);
            });

            it('returns 0', function () {
                expect(ret).toBe(0);
            });
        });
    });

    describe('.createRelease()', function () {
        var argv, scope, opts, releaseData;

        beforeEach(function (done) {
            argv = {
                repo: 'cyaninc/my-repo-name',
                version: '0.1.2',
            };

            releaseData = {
                'tag_name': '0.1.2',
                'target_commitish': 'master',
                name: '0.1.2',
                body: '',
                draft: false,
                prerelease: false,
            };

            opts = {
                reqheaders: {
                    authorization: 'Basic ' + github.token + ':x-oauth-basic',
                },
            };

            scope = nock(GITHUB_HOST, opts)
                .post('/api/v3/repos/cyaninc/my-repo-name/releases', releaseData)
                .reply(201, releaseData);

            spyOn(github, 'onResponse').and.callFake(function () {
                done();
            });

            github.createRelease(argv);
        });

        afterEach(function () {
            nock.cleanAll();
        });

        it('makes the POST to create the release', function () {
            scope.done();
        });

        it('calls onResponse', function () {
            expect(github.onResponse).toHaveBeenCalled();
        });
    });

    describe('.getCommits()', function () {
        it('returns commits if API request was successful', function () {
            var req = {
                end: function () {
                    return {
                        body: '[]',
                        statusCode: 200,
                    };
                },
                setTimeout: function () {},
            };

            spyOn(httpSync, 'request').and.returnValue(req);
            expect(github.getCommits('cyaninc/my-repo-name')).toEqual([]);
        });
    });

    describe('.getPullRequest()', function () {
        it('returns pull request if API request was successful', function () {
            var req = {
                end: function () {
                    return {
                        body: '{}',
                        statusCode: 200,
                    };
                },
                setTimeout: function () {},
            };

            spyOn(httpSync, 'request').and.returnValue(req);
            expect(github.getPullRequest('cyaninc/my-repo-name', '22')).toEqual({});
        });
    });

    describe('.getPullRequests()', function () {
        it('returns pull requests if API request was successful', function () {
            var req = {
                end: function () {
                    return {
                        body: '[]',
                        statusCode: 200,
                    };
                },
                setTimeout: function () {},
            };

            spyOn(httpSync, 'request').and.returnValue(req);
            expect(github.getPullRequests('cyaninc/my-repo-name')).toEqual([]);
        });

        it('appends query string "?state=all" if search all argument set', function (done) {
            spyOn(github, 'getRequest').and.callFake(function (apiPath) {
                var expected = '?state=all';
                expect(apiPath.indexOf(expected, apiPath.length - expected.length)).not.toEqual(-1);
                done();
            });
            github.getPullRequests('cyaninc/my-repo-name', true);
        });

        it('appends query string "?state=all" if search all argument set', function (done) {
            spyOn(github, 'getRequest').and.callFake(function (apiPath) {
                var expected = '?state=all';
                expect(apiPath.indexOf(expected, apiPath.length - expected.length)).not.toEqual(-1);
                done();
            });
            github.getPullRequests('UI/my-repo-name', true);
        });
    });

    describe('.getPullRequestForSHA()', function () {
        var pullRequests = [{
            head: {
                sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
            },
        }, {
            head: {
                sha: '6541f8f8bdea1c5e4a180d6fccfde4809e38da76',
            },
        }];

        it('returns pull request with commit hash', function () {
            spyOn(github, 'getPullRequests').and.returnValue(pullRequests);

            expect(
                github.getPullRequestForSHA('cyaninc/my-repo-name', 'aabea989b5ebfa181f55f6593c5b814cc8da45e2')
            ).toBe(pullRequests[0]);

            expect(
                github.getPullRequestForSHA('cyaninc/my-repo-name', '6541f8f8bdea1c5e4a180d6fccfde4809e38da76')
            ).toBe(pullRequests[1]);
        });

        it('returns null if pull request not found for commit', function () {
            spyOn(github, 'getPullRequests').and.returnValue(pullRequests);

            expect(
                github.getPullRequestForSHA('cyaninc/my-repo-name', 'a3b76828283df43097407281c348ba802bfcb5bd')
            ).toBe(null);
        });

        it('returns null if no pull requests found', function () {
            spyOn(github, 'getPullRequests').and.returnValue([]);

            expect(
                github.getPullRequestForSHA('cyaninc/my-repo-name', 'a3b76828283df43097407281c348ba802bfcb5bd')
            ).toBe(null);
        });
    });

    describe('.getRequest()', function () {
        it('throws error if HTTP response status code is not 200', function () {
            var req = {
                end: function () {
                    return {
                        body: '',
                        statusCode: 404,
                    };
                },
                setTimeout: function () {},
            };

            spyOn(httpSync, 'request').and.returnValue(req);

            expect(function () {
                github.getRequest('some/api/path');
            }).toThrow();
        });
    });

    describe('.getVersionBumpLevel()', function () {
        it('finds major bump comment', function () {
            var pr = {body: '#MAJOR#'};
            expect(github.getVersionBumpLevel(pr)).toEqual('major');
        });

        it('finds minor bump comment', function () {
            var pr = {body: '#MINOR#'};
            expect(github.getVersionBumpLevel(pr)).toEqual('minor');
        });

        it('finds patch bump comment', function () {
            var pr = {body: '#PATCH#'};
            expect(github.getVersionBumpLevel(pr)).toEqual('patch');
        });

        it('returns null if no bump comment found', function () {
            var pr = {body: '#FAKE#'};
            expect(github.getVersionBumpLevel(pr)).toEqual(null);
        });

        it('finds bump comment sourrounded by other text', function () {
            var pr = {body: 'Blah blah blah\n#MAJOR#blah blah blah'};
            expect(github.getVersionBumpLevel(pr)).toEqual('major');
        });
    });

    describe('.missingArgs()', function () {
        var argv;

        beforeEach(function () {
            argv = {
                repo: 'cyaninc/my-repo-name',
                sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
            };
        });

        it('returns true if missing required repo argument', function () {
            delete argv.repo;
            expect(github.missingArgs(argv, ['repo', 'sha'])).toBeTruthy();
        });

        it('returns true if missing required sha argument', function () {
            delete argv.sha;
            expect(github.missingArgs(argv, ['repo', 'sha'])).toBeTruthy();
        });
    });

    describe('.onResponse()', function () {
        var res;

        beforeEach(function () {
            spyOn(console, 'log');
        });

        describe('on success', function () {
            beforeEach(function () {
                res = {
                    ok: true,
                    status: 201,
                    body: {
                        msg: 'some success',
                    },
                };

                github.onResponse(res);
            });

            it('logs the response', function () {
                var msg = 'Status Code: 201\nResponse Body:\n' + JSON.stringify(res.body, null, 2);
                expect(console.log).toHaveBeenCalledWith(msg);
            });
        });

        describe('on error', function () {
            beforeEach(function () {
                res = {
                    ok: false,
                    status: 400,
                    body: {
                        msg: 'some error',
                    },
                };
            });

            it('should throw error', function () {
                var msg = 'Status Code: 400\nResponse Body:\n' + JSON.stringify(res.body, null, 2);
                expect(function () {
                    github.onResponse(res);
                }).toThrowError(msg);
            });
        });
    });

    describe('.pushChanges()', function () {
        it('returns false if failed to get branch', function () {
            spyOn(sh, 'exec').and.returnValue({
                code: 1,
                stdout: 'blah blah blah',
            });

            expect(github.pushChanges()).toBeFalsy();
        });

        it('returns false if failed to push to remote', function () {
            spyOn(sh, 'exec').and.callFake(function (cmd) {
                if (cmd === 'git rev-parse --abbrev-ref HEAD') {
                    return {
                        code: 0,
                        stdout: 'master',
                    };
                }

                expect(cmd).toBe('git push origin master');

                return {
                    code: 1,
                    stdout: 'blah blah blah',
                };
            });

            expect(github.pushChanges()).toBeFalsy();
        });

        it('returns true if push succeeded', function () {
            spyOn(sh, 'exec').and.returnValue({
                code: 0,
                stdout: '',
            });

            expect(github.pushChanges()).toBeTruthy();
        });
    });

    describe('.specifiesVersionBumpLevel()', function () {
        _.forEach(['MAJOR', 'MINOR', 'PATCH'], function (level) {
            it('returns true if ' + level + ' bump comment', function () {
                var pr = {body: '#' + level + '#'};
                expect(github.specifiesVersionBumpLevel(pr)).toBeTruthy();
            });
        });

        it('returns false if bump comment missing', function () {
            var pr = {body: '#FAKE#'};
            expect(github.specifiesVersionBumpLevel(pr)).toBeFalsy();
        });
    });

    describe('.versionBumped()', function () {
        var argv;

        beforeEach(function () {
            argv = {
                _: ['github', 'bump-version'],
                repo: 'cyaninc/my-repo-name',
                sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
            };
        });

        it('returns 1 if missing repo argument', function () {
            delete argv.repo;
            expect(github.versionBumped(argv)).toBe(1);
        });

        it('returns 1 if missing sha argument', function () {
            delete argv.sha;
            expect(github.versionBumped(argv)).toBe(1);
        });

        it('returns 0 if version bump comment found', function () {
            spyOn(github, 'getPullRequestForSHA').and.returnValue({body: '#MAJOR#'});
            expect(github.versionBumped(argv)).toBe(0);
        });

        it('returns 1 if version bump comment not found', function () {
            spyOn(github, 'getPullRequestForSHA').and.returnValue({body: '#FAKE#'});
            expect(github.versionBumped(argv)).toBe(1);
        });

        it('returns 1 if pull request not found', function () {
            spyOn(github, 'getPullRequestForSHA').and.returnValue(null);
            expect(github.versionBumped(argv)).toBe(1);
        });
    });
});
