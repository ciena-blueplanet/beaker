/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2014-2015 Ciena Corporation. All rights reserved.
*/

/* eslint max-nested-callbacks: 0 */

/* eslint-disable new-cap */ // <-- for Q()

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
            ret = github.getCommits('cyaninc/beaker', '3.x');
        });

        it('calls getRequest with proper URL', function () {
            expect(github.getRequest).toHaveBeenCalledWith('/repos/cyaninc/beaker/commits?sha=3.x');
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
        var versionySpy, jsonTabs, jsonIndent;
        beforeEach(function () {
            var methods = ['to', 'end', 'indent', 'patch', 'minor', 'newMajor'];
            versionySpy = jasmine.createSpyObj('versiony', methods);

            _.forEach(methods, function (method) {
                versionySpy[method].and.returnValue(versionySpy);
            });

            spyOn(utils, 'throwCliError');
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
                github.bumpFiles('major');
            });

            it('sets indentation', function () {
                expect(versionySpy.indent).toHaveBeenCalledWith(jsonIndent);
            });

            it('bumps the major', function () {
                expect(versionySpy.newMajor).toHaveBeenCalled();
            });

            it('does not throw', function () {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });
        });

        describe('minor bumps', function () {
            beforeEach(function () {
                github.bumpFiles('minor');
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

            it('does not throw', function () {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });
        });

        describe('patch bumps', function () {
            beforeEach(function () {
                github.bumpFiles('patch');
            });

            it('sets indentation', function () {
                expect(versionySpy.indent).toHaveBeenCalledWith(jsonIndent);
            });

            it('bumps the patch', function () {
                expect(versionySpy.patch).toHaveBeenCalled();
            });

            it('does not throw', function () {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });
        });

        describe('unknown bumps', function () {
            beforeEach(function () {
                github.bumpFiles('non-existent-bump-type');
            });

            it('throws an error', function () {
                expect(utils.throwCliError).toHaveBeenCalledWith('Missing version bump comment', 1);
            });
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
                cmdResolver.resolve([
                    'my-branch\n',
                    '',
                ]);

                setTimeout(done, 1);
            });

            it('resolves with the branch`', function () {
                expect(branch).toBe('my-branch');
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
                commit: {},
            };

            existingFiles = {
                'package.json': true,
            };

            spyOn(fs, 'exists').and.callFake(function (filename) {
                return Q(_.has(existingFiles, filename));
            });

            spyOn(github, 'exec').and.callFake(function (cmd) {
                if (cmd === 'git add package.json') {
                    return makePromise(resolvers.pkg);
                } else {
                    return makePromise(resolvers.commit);
                }
            });
        });
    });

    describe('.getVersionBumps()', function () {
        var commits, prs, bumps;
        beforeEach(function (done) {
            commits = [
                {
                    commit: {
                        author: {email: ''},
                        message: 'Merge pull request #6',
                    },
                },
                {
                    commit: {
                        author: {email: ''},
                        message: 'Fixed some bugs',
                    },
                },
                {
                    commit: {
                        author: {email: ''},
                        message: 'Merge pull request #5',
                    },
                },
                {
                    commit: {
                        author: {email: ''},
                        message: 'Added some awesome new features',
                    },
                },
                {
                    commit: {
                        author: {email: ''},
                        message: 'Merge pull request #4',
                    },
                },
            ];

            prs = {
                '4': {body: '#MAJOR#'},
                '5': {body: '#MINOR#'},
                '6': {body: '#PATCH#'},
            };

            spyOn(github, 'getPullRequest').and.callFake(function (repo, number) {
                return Q({
                    status: 200,
                    data: prs[number],
                });
            });

            github.getVersionBumps('cyaninc/beaker', commits).then(function (resp) {
                bumps = resp;
            });

            setTimeout(done, 1);
        });

        it('fetches all the appropriate PRs', function () {
            expect(github.getPullRequest).toHaveBeenCalledWith('cyaninc/beaker', '6');
            expect(github.getPullRequest).toHaveBeenCalledWith('cyaninc/beaker', '5');
            expect(github.getPullRequest).toHaveBeenCalledWith('cyaninc/beaker', '4');
        });

        it('resolves with the bumps', function () {
            // NOTE: inverted order because we want to bump from oldest to newest
            expect(bumps).toEqual([
                'major',
                'minor',
                'patch',
            ]);
        });

        describe('when a bump commit exists in the middle', function () {
            beforeEach(function (done) {
                bumps = null;
                commits[3].commit.author.email = github.config.github.email;
                github.getVersionBumps('cyaninc/beaker', commits).then(function (resp) {
                    bumps = resp;
                });

                setTimeout(done, 1);
            });

            it('resolves with the bumps', function () {
                // NOTE: inverted order because we want to bump from oldest to newest
                expect(bumps).toEqual([
                    'minor',
                    'patch',
                ]);
            });
        });
    });

    describe('.bumpVersionForBranch()', function () {
        var commitsResolver, bumpFinished;
        beforeEach(function () {
            commitsResolver = {};
            bumpFinished = false;
            spyOn(github, 'getCommits').and.returnValue(makePromise(commitsResolver));
            github.bumpVersionForBranch('cyaninc/beaker', '3.x').then(function () {
                bumpFinished = true;
            });

        });

        it('looks up the commits', function () {
            expect(github.getCommits).toHaveBeenCalledWith('cyaninc/beaker', '3.x');
        });

        it('does not resolve original promise yet', function () {
            expect(bumpFinished).toBe(false);
        });

        describe('when commits are fetched', function () {
            var bumpsResolver, commits;
            beforeEach(function (done) {
                bumpsResolver = {};
                commits = ['commit-1', 'commit-2'];
                spyOn(github, 'getVersionBumps').and.returnValue(makePromise(bumpsResolver));
                commitsResolver.resolve({data: commits});
                setTimeout(done, 1);
            });

            it('looks up version bumps', function () {
                expect(github.getVersionBumps).toHaveBeenCalledWith('cyaninc/beaker', commits);
            });

            it('does not resolve original promise yet', function () {
                expect(bumpFinished).toBe(false);
            });

            describe('when bumps are returned', function () {
                var commitBumpsResolver, bumps;
                beforeEach(function (done) {
                    bumps = ['bump-1', 'bump-2', 'bump-3'];
                    commitBumpsResolver = {};
                    spyOn(github, 'commitBumpedFiles').and.returnValue(makePromise(commitBumpsResolver));
                    spyOn(github, 'bumpFiles');
                    bumpsResolver.resolve(bumps);
                    setTimeout(done, 1);
                });

                it('performs the bumps', function () {
                    expect(github.bumpFiles.calls.allArgs()).toEqual([
                        ['bump-1'],
                        ['bump-2'],
                        ['bump-3'],
                    ]);
                });

                it('commits the files', function () {
                    expect(github.commitBumpedFiles).toHaveBeenCalledWith('3.x');
                });

                it('does not resolve original promise yet', function () {
                    expect(bumpFinished).toBe(false);
                });

                describe('when commit bumps finishes', function () {
                    var pushChangesResolver;
                    beforeEach(function (done) {
                        pushChangesResolver = {};
                        spyOn(github, 'pushChanges').and.returnValue(makePromise(pushChangesResolver));
                        commitBumpsResolver.resolve();
                        setTimeout(done, 1);
                    });

                    it('pushes the changes', function () {
                        expect(github.pushChanges).toHaveBeenCalledWith('3.x');
                    });

                    it('does not resolve original promise yet', function () {
                        expect(bumpFinished).toBe(false);
                    });

                    describe('when pushing changes finishes', function () {
                        beforeEach(function (done) {
                            spyOn(utils, 'throwCliError');
                            pushChangesResolver.resolve({
                                code: 0,
                            });
                            setTimeout(done, 1);
                        });

                        it('does not throw an error', function () {
                            expect(utils.throwCliError).not.toHaveBeenCalled();
                        });

                        it('resolves the original promise', function () {
                            expect(bumpFinished).toBe(true);
                        });
                    });

                    describe('when pushing changes fails', function () {
                        beforeEach(function (done) {
                            spyOn(utils, 'throwCliError');
                            pushChangesResolver.resolve({
                                code: 1,
                                stdout: 'error-message',
                            });
                            setTimeout(done, 1);
                        });

                        it('throws an error', function () {
                            var msg = 'Failed to push changes to 3.x: error-message';
                            expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
                        });

                        it('resolves the original promise', function () {
                            expect(bumpFinished).toBe(true);
                        });
                    });
                });
            });
        });
    });

    describe('.bumpVersion()', function () {
        var argv, branchResolver;
        beforeEach(function () {
            branchResolver = {};
            argv = {
                _: ['github', 'bump-version'],
                repo: 'cyaninc/my-repo-name',
            };

            spyOn(github, 'verifyRequiredArgs');
            spyOn(github, 'getBranch').and.returnValue(makePromise(branchResolver));
            spyOn(github, 'bumpVersionForBranch');
            spyOn(utils, 'throwCliError');

            github.bumpVersion(argv);
        });

        it('verifies required arguments', function () {
            expect(github.verifyRequiredArgs).toHaveBeenCalledWith(argv, ['repo']);
        });

        describe('when branch is resolved', function () {
            beforeEach(function (done) {
                branchResolver.resolve('3.x');
                setTimeout(done, 1);
            });

            it('does not throw', function () {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });

            it('bumps the version for the branch', function () {
                expect(github.bumpVersionForBranch).toHaveBeenCalledWith(argv.repo, '3.x');
            });
        });

        describe('when branch is null', function () {
            beforeEach(function (done) {
                branchResolver.resolve(null);
                setTimeout(done, 1);
            });

            it('throws an error', function () {
                var msg = 'Unable to lookup branch';
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });
    });

    describe('.command()', function () {
        var argv;

        beforeEach(function () {
            argv = {
                _: ['github'],
            };
            spyOn(github, 'bumpVersion');
            spyOn(github, 'versionBumped');
            spyOn(github, 'createRelease');
            spyOn(utils, 'throwCliError');
        });

        describe('when bad argument count', function () {
            beforeEach(function () {
                github.command(argv);
            });

            it('throws an error', function () {
                var msg = 'Invalid command: ' + JSON.stringify(argv._);
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });

        describe('when invalid command', function () {
            beforeEach(function () {
                argv._.push('foo-bar');
                github.command(argv);
            });

            it('throws an error', function () {
                var msg = 'Unknown command: foo-bar';
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });

        describe('release', function () {
            beforeEach(function () {
                argv._.push('release');
                github.command(argv);
            });

            it('makes the call to createRelease', function () {
                expect(github.createRelease).toHaveBeenCalledWith(argv);
            });
        });

        describe('version-bumped', function () {
            beforeEach(function () {
                argv._.push('version-bumped');
                github.command(argv);
            });

            it('makes the call to versionBumped', function () {
                expect(github.versionBumped).toHaveBeenCalledWith(argv);
            });
        });

        describe('bump-version', function () {
            beforeEach(function () {
                argv._.push('bump-version');
                github.command(argv);
            });

            it('makes the call to bumpVersion', function () {
                expect(github.bumpVersion).toHaveBeenCalledWith(argv);
            });
        });
    });
});
