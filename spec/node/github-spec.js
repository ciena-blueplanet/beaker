/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2014-2015 Cyan, Inc. All rights reserved.
*/

/* eslint max-nested-callbacks: 0 */

/* eslint-disable new-cap */ // <-- for Q.Promise

'use strict';

var _ = require('lodash');
var Q = require('q');

var http = require('q-io/http');
var fs = require('q-io/fs');
var versiony = require('versiony');

var t = require('../../src/transplant')(__dirname);
var _config = t.require('./config');
var githubFactory = t.require('./github');
var utils = t.require('./cli/utils');
var makePromise = t.require('./test-utils').makePromise;

var config = require('./sample-config.json');


describe('github', function () {
    var github;
    beforeEach(function () {
        spyOn(console, 'info');
        spyOn(console, 'error');
        spyOn(process, 'cwd').and.returnValue('/current/working/directory');
        spyOn(_config, 'load').and.returnValue(config);
        github = githubFactory();

    });

    it('loads the config', function () {
        expect(_config.load).toHaveBeenCalledWith('/current/working/directory');
    });

    it('sets the urlBase', function () {
        expect(github.config.urlBase).toBe('https://our.github-enterprise.com/api/v3');
    });

    describe('.createRelease()', function () {
        beforeEach(function () {
            spyOn(utils, 'throwCliError');
            github.createRelease({_: ['github', 'create-release']});
        });

        it('throws an error', function () {
            var msg = 'create-release currently unavailable, hopefully coming back soon';
            expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
        });
    });

    // TODO: re-enable/fix this once we support createRelease again
    /*
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
    */

    describe('.getRequest()', function () {
        var requestResolver, resp;
        beforeEach(function () {
            requestResolver = {};

            spyOn(http, 'request').and.returnValue(makePromise(requestResolver));
            github.getRequest('/repos').then(function (response) {
                resp = response;
            }).done();
        });

        it('calls the http.request() method', function () {
            expect(http.request).toHaveBeenCalledWith('https://our.github-enterprise.com/api/v3/repos');
        });

        describe('when request comes back', function () {
            var body;
            beforeEach(function (done) {
                body = ['foo', 'bar', 'baz'];
                var response = {
                    status: 200,
                    body: jasmine.createSpyObj('resp.body', ['read']),
                };
                response.body.read.and.returnValue(Q(JSON.stringify(body)));

                requestResolver.resolve(response);

                setTimeout(done, 1);
            });

            it('resolves the original promise with proper response', function () {
                expect(resp).toEqual({
                    status: 200,
                    data: body,
                });
            });
        });
    });

    describe('.getCommits()', function () {
        var ret;
        beforeEach(function () {
            spyOn(github, 'getRequest').and.returnValue('a-promise');
            ret = github.getCommits('cyaninc/beaker', 'r_3.x');
        });

        it('calls getRequest with proper URL', function () {
            expect(github.getRequest).toHaveBeenCalledWith('/repos/cyaninc/beaker/commits?sha=r_3.x');
        });

        it('returns the result of getRequest()', function () {
            expect(ret).toBe('a-promise');
        });
    });

    describe('.getPullRequest()', function () {
        var ret;
        beforeEach(function () {
            spyOn(github, 'getRequest').and.returnValue('a-promise');
            ret = github.getPullRequest('cyaninc/beaker', '12345');
        });

        it('calls getRequest with proper URL', function () {
            expect(github.getRequest).toHaveBeenCalledWith('/repos/cyaninc/beaker/pulls/12345');
        });

        it('returns the result of getRequest()', function () {
            expect(ret).toBe('a-promise');
        });
    });

    describe('.getPullRequests()', function () {
        var ret;
        beforeEach(function () {
            spyOn(github, 'getRequest').and.returnValue('a-promise');
            ret = github.getPullRequests('cyaninc/beaker');
        });

        it('calls getRequest with proper URL', function () {
            expect(github.getRequest).toHaveBeenCalledWith('/repos/cyaninc/beaker/pulls');
        });

        it('returns the result of getRequest()', function () {
            expect(ret).toBe('a-promise');
        });
    });

    describe('.getPullRequestForSha()', function () {
        var pr, prsResolver, prs;
        beforeEach(function () {
            prsResolver = {};
            spyOn(github, 'getPullRequests').and.returnValue(makePromise(prsResolver));
            github.getPullRequestForSha('cyaninc/beaker', 'abcde').then(function (resp) {
                pr = resp;
            });
        });

        it('says what it is doing', function () {
            var msg = 'Looking for PR on repository cyaninc/beaker with HEAD at commit abcde';
            expect(console.info).toHaveBeenCalledWith(msg);
        });

        it('fetches the pull requests', function () {
            expect(github.getPullRequests).toHaveBeenCalledWith('cyaninc/beaker');
        });

        describe('when the sha is present on head', function () {
            beforeEach(function (done) {
                prs = [
                    {id: 1, head: {sha: 'sha-1'}, 'merge_commit_sha': 'sha-2'},
                    {id: 2, head: {sha: 'abcde'}, 'merge_commit_sha': 'sha-3'},
                    {id: 3, head: {sha: 'sha-3'}, 'merge_commit_sha': 'sha-4'},
                ];

                prsResolver.resolve({
                    status: 200,
                    data: prs,
                });

                setTimeout(done, 1);
            });

            it('says "I found it"', function () {
                expect(console.info).toHaveBeenCalledWith('Found PR at commit: 2');
            });

            it('resolves with the pr', function () {
                expect(pr).toBe(prs[1]);
            });
        });

        describe('when the sha is present on merge commit', function () {
            beforeEach(function (done) {
                prs = [
                    {id: 1, head: {sha: 'sha-1'}, 'merge_commit_sha': 'abcde'},
                    {id: 2, head: {sha: 'sha-2'}, 'merge_commit_sha': 'sha-3'},
                    {id: 3, head: {sha: 'sha-3'}, 'merge_commit_sha': 'sha-4'},
                ];

                prsResolver.resolve({
                    status: 200,
                    data: prs,
                });

                setTimeout(done, 1);
            });

            it('says "I found it"', function () {
                expect(console.info).toHaveBeenCalledWith('Found PR at commit: 1');
            });

            it('resolves with the pr', function () {
                expect(pr).toBe(prs[0]);
            });
        });

        describe('when the sha is not present', function () {
            beforeEach(function (done) {
                prs = [
                    {id: 1, head: {sha: 'sha-1'}, 'merge_commit_sha': 'sha-2'},
                    {id: 2, head: {sha: 'sha-3'}, 'merge_commit_sha': 'sha-4'},
                    {id: 3, head: {sha: 'sha-5'}, 'merge_commit_sha': 'sha-6'},
                ];

                prsResolver.resolve({
                    status: 200,
                    data: prs,
                });

                setTimeout(done, 1);
            });

            it('resolves with null', function () {
                expect(pr).toBe(null);
            });
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

    describe('.hasVersionBumpComment()', function () {
        var level, ret;
        beforeEach(function () {
            level = 'minor';
            spyOn(github, 'getVersionBumpLevel').and.callFake(function () {
                return level;
            });

            ret = github.hasVersionBumpComment('foo');
        });

        it('looks up the version bump level', function () {
            expect(github.getVersionBumpLevel).toHaveBeenCalledWith('foo');
        });

        it('returns true', function () {
            expect(ret).toBe(true);
        });

        describe('when no bump level found', function () {
            beforeEach(function () {
                level = null;
                ret = github.hasVersionBumpComment('foo');
            });

            it('returns false', function () {
                expect(ret).toBe(false);
            });
        });
    });

    describe('.verifyRequiredArgs()', function () {
        var argv;

        beforeEach(function () {
            spyOn(utils, 'throwCliError');
            argv = {
                repo: 'cyaninc/my-repo-name',
                sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
            };
        });

        describe('when everything is fine', function () {
            beforeEach(function () {
                github.verifyRequiredArgs(argv, ['repo', 'sha']);
            });

            it('does not throw a CLI error', function () {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });
        });

        describe('when missing required arguments', function () {
            beforeEach(function () {
                delete argv.repo;
                delete argv.sha;
                github.verifyRequiredArgs(argv, ['repo', 'sha']);
            });

            it('throws a CLI error', function () {
                var msg = 'repo argument is required\nsha argument is required';
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });
    });

    describe('.versionBumped()', function () {
        var argv, pr;

        beforeEach(function (done) {
            spyOn(utils, 'throwCliError');

            pr = {
                hasVersionBumpComment: true,
            };

            spyOn(github, 'verifyRequiredArgs');
            spyOn(github, 'hasVersionBumpComment').and.callFake(function (prToCheck) {
                return prToCheck.hasVersionBumpComment;
            });

            spyOn(github, 'getPullRequestForSha').and.returnValue(Q(pr));

            argv = {
                _: ['github', 'bump-version'],
                repo: 'cyaninc/my-repo-name',
                sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
            };

            github.versionBumped(argv);
            setTimeout(done, 1);
        });

        it('verifies required arguments', function () {
            expect(github.verifyRequiredArgs).toHaveBeenCalledWith(argv, ['repo', 'sha']);
        });

        it('fetches the pr', function () {
            expect(github.getPullRequestForSha).toHaveBeenCalledWith(argv.repo, argv.sha);
        });

        it('does not throw', function () {
            expect(utils.throwCliError).not.toHaveBeenCalled();
        });

        describe('when no version bump found', function () {
            beforeEach(function (done) {
                pr.hasVersionBumpComment = false;
                github.versionBumped(argv);
                setTimeout(done, 1);
            });

            it('throws an error', function () {
                expect(utils.throwCliError).toHaveBeenCalledWith('Missing version bump comment', 1);
            });

            // TODO: find a way to make sure that the .done() was called and the error is re-raised after thrown
            // you can't use expect().toThrow() becuase Q is catching the error and re-throwing it later.
        });
    });

    describe('.bumpFiles()', function () {
        var versionySpy, ret, jsonTabs, jsonIndent;
        beforeEach(function () {
            var methods = ['to', 'end', 'indent', 'patch', 'minor', 'newMajor'];
            versionySpy = jasmine.createSpyObj('versiony', methods);

            _.forEach(methods, function (method) {
                versionySpy[method].and.returnValue(versionySpy);
            });

            spyOn(versiony, 'from').and.returnValue(versionySpy);

            jsonTabs = process.env.JSON_TABS;
            process.env.JSON_TABS = '6';
            jsonIndent = '      ';
        });

        afterEach(function () {
            process.env.JSON_TABS = jsonTabs;
        });

        describe('major bumps', function () {
            beforeEach(function () {
                ret = github.bumpFiles('major');
            });

            it('sets indentation', function () {
                expect(versionySpy.indent).toHaveBeenCalledWith(jsonIndent);
            });

            it('bumps the major', function () {
                expect(versionySpy.newMajor).toHaveBeenCalled();
            });

            it('returns truthy', function () {
                expect(ret).toBeTruthy();
            });
        });

        describe('minor bumps', function () {
            beforeEach(function () {
                ret = github.bumpFiles('minor');
            });

            it('sets indentation', function () {
                expect(versionySpy.indent).toHaveBeenCalledWith(jsonIndent);
            });

            it('bumps the minor', function () {
                expect(versionySpy.minor).toHaveBeenCalled();
            });

            it('resets the patch', function () {
                expect(versionySpy.patch).toHaveBeenCalledWith(0);
            });

            it('returns truthy', function () {
                expect(ret).toBeTruthy();
            });
        });

        describe('patch bumps', function () {
            beforeEach(function () {
                ret = github.bumpFiles('patch');
            });

            it('sets indentation', function () {
                expect(versionySpy.indent).toHaveBeenCalledWith(jsonIndent);
            });

            it('bumps the patch', function () {
                expect(versionySpy.patch).toHaveBeenCalled();
            });

            it('returns truthy', function () {
                expect(ret).toBeTruthy();
            });
        });

        it('returns false for unknown bump type', function () {
            expect(github.bumpFiles('non-existent-bump-type')).toBeFalsy();
        });
    });

    describe('.getBranch()', function () {
        var cmdResolver, branch;
        beforeEach(function () {
            cmdResolver = {};
            spyOn(github, 'exec').and.returnValue(makePromise(cmdResolver));
            github.getBranch().then(function (result) {
                branch = result;
            });
        });

        it('executes the git command', function () {
            expect(github.exec).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD');
        });

        describe('when command works', function () {
            beforeEach(function (done) {
                cmdResolver.resolve({
                    code: 0,
                    stdout: 'my-branch',
                });

                setTimeout(done, 1);
            });

            it('resolves with the branch`', function () {
                expect(branch).toBe('my-branch');
            });
        });

        describe('when command fails', function () {
            beforeEach(function (done) {
                spyOn(utils, 'throwCliError');
                cmdResolver.resolve({
                    code: 1,
                    stdout: 'my-error',
                });

                setTimeout(done, 1);
            });

            it('throws a cli error`', function () {
                var msg = 'Failed to get branch name with error: my-error';
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });
    });

    describe('.pushChanges()', function () {
        var ret;
        beforeEach(function () {
            spyOn(github, 'exec').and.returnValue('result');
            ret = github.pushChanges('my-branch');
        });

        it('executes the command to push the branch', function () {
            expect(github.exec).toHaveBeenCalledWith('git push origin my-branch');
        });

        it('returns the result of exec', function () {
            expect(ret).toBe('result');
        });
    });

    describe('.commitBumpedFiles()', function () {
        var existingFiles, resolvers;
        beforeEach(function () {
            resolvers = {
                pkg: {},
                bower: {},
                commit: {},
            };

            existingFiles = {
                'package.json': true,
                'bower.json': true,
            };

            spyOn(fs, 'exists').and.callFake(function (filename) {
                return Q(_.has(existingFiles, filename));
            });

            spyOn(github, 'exec').and.callFake(function (cmd) {
                if (cmd === 'git add package.json') {
                    return makePromise(resolvers.pkg);
                } else if (cmd === 'git add bower.json') {
                    return makePromise(resolvers.bower);
                } else {
                    return makePromise(resolvers.commit);
                }
            });
        });

        describe('when both files exist', function () {
            var result;
            beforeEach(function (done) {
                github.commitBumpedFiles().then(function (resp) {
                    result = resp;
                });;
                setTimeout(done, 1);
            });

            it('checks if package.json exists', function () {
                expect(fs.exists).toHaveBeenCalledWith('package.json');
            });

            it('checks if bower.json exists', function () {
                expect(fs.exists).toHaveBeenCalledWith('bower.json');
            });

            it('adds package.json', function () {
                expect(github.exec).toHaveBeenCalledWith('git add package.json');
            });

            it('adds bower.json', function () {
                expect(github.exec).toHaveBeenCalledWith('git add bower.json');
            });

            it('does not yet commit the files', function () {
                expect(github.exec).not.toHaveBeenCalledWith('git commit -m "bump version"');
            });

            describe('when both files have been added', function () {
                beforeEach(function (done) {
                    resolvers.pkg.resolve();
                    resolvers.bower.resolve();
                    setTimeout(done, 1);
                });

                it('commits the files', function () {
                    expect(github.exec).toHaveBeenCalledWith('git commit -m "bump version"');
                });

                describe('when commit finishes', function () {
                    beforeEach(function (done) {
                        resolvers.commit.resolve('commit-result');
                        setTimeout(done, 1);
                    });

                    it('resolves with the result of the commit', function () {
                        expect(result).toBe('commit-result');
                    });
                });
            });
        });
    });

    // ARM IS HERE

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

                commits = [
                    {
                        commit: {
                            author: {email: 'not-' + config.github.email},
                            message: 'Merge pull request #2',
                        },
                    },
                    {
                        commit: {
                            author: {email: 'not-' + config.github.email},
                            message: 'Merge pull request #1',
                        },
                    },
                ];

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

    describe('.onResponse()', function () {
        var res;

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
                expect(console.info).toHaveBeenCalledWith(msg);
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

});
