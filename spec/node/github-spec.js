/**
 * @author Matthew Dahl [@sandersky](https://github.com/sandersky)
 * @author Adam Meadows [@job13er](https://github.com/job13er)
 * @copyright 2014-2015 Ciena Corporation. All rights reserved.
*/

/* eslint max-nested-callbacks: 0 */
/* eslint-disable new-cap */ // <-- for Q()

// For some reason, eslint thinks that specs are modules and don't need 'use strict' but node disagrees
/* eslint-disable strict */
'use strict';
/* eslint-enable strict */

const _ = require('lodash');
const Q = require('q');

const http = require('q-io/http');
const fs = require('q-io/fs');
const versiony = require('versiony');

const t = require('../../src/transplant')(__dirname);
const _config = t.require('./config');
const githubFactory = t.require('./github');
const utils = t.require('./cli/utils');
const makePromise = t.require('./test-utils').makePromise;

const config = require('./sample-config.json');

describe('github', () => {
    let github;
    beforeEach(() => {
        spyOn(console, 'info');
        spyOn(console, 'error');
        spyOn(process, 'cwd').and.returnValue('/current/working/directory');
        spyOn(_config, 'load').and.returnValue(config);
        github = githubFactory();

    });

    it('loads the config', () => {
        expect(_config.load).toHaveBeenCalledWith('/current/working/directory');
    });

    it('sets the urlBase', () => {
        expect(github.config.urlBase).toBe('https://our.github-enterprise.com/api/v3');
    });

    describe('.createRelease()', () => {
        beforeEach(() => {
            spyOn(utils, 'throwCliError');
            github.createRelease({_: ['github', 'create-release']});
        });

        it('throws an error', () => {
            const msg = 'create-release currently unavailable, hopefully coming back soon';
            expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
        });
    });

    describe('.getRequest()', () => {
        let requestResolver, resp;
        beforeEach(() => {
            requestResolver = {};

            spyOn(http, 'request').and.returnValue(makePromise(requestResolver));
            github.getRequest('/repos').then(function (response) {
                resp = response;
            }).done();
        });

        it('calls the http.request() method', () => {
            expect(http.request).toHaveBeenCalledWith('https://our.github-enterprise.com/api/v3/repos');
        });

        describe('when request comes back', () => {
            let body;
            beforeEach(function (done) {
                body = ['foo', 'bar', 'baz'];
                const response = {
                    status: 200,
                    body: jasmine.createSpyObj('resp.body', ['read']),
                };
                response.body.read.and.returnValue(Q(JSON.stringify(body)));

                requestResolver.resolve(response);

                setTimeout(done, 1);
            });

            it('resolves the original promise with proper response', () => {
                expect(resp).toEqual({
                    status: 200,
                    data: body,
                });
            });
        });
    });

    describe('.getCommits()', () => {
        let ret;
        beforeEach(() => {
            spyOn(github, 'getRequest').and.returnValue('a-promise');
            ret = github.getCommits('cyaninc/beaker', '3.x');
        });

        it('calls getRequest with proper URL', () => {
            expect(github.getRequest).toHaveBeenCalledWith('/repos/cyaninc/beaker/commits?sha=3.x');
        });

        it('returns the result of getRequest()', () => {
            expect(ret).toBe('a-promise');
        });
    });

    describe('.getPullRequest()', () => {
        let ret;
        beforeEach(() => {
            spyOn(github, 'getRequest').and.returnValue('a-promise');
            ret = github.getPullRequest('cyaninc/beaker', '12345');
        });

        it('calls getRequest with proper URL', () => {
            expect(github.getRequest).toHaveBeenCalledWith('/repos/cyaninc/beaker/pulls/12345');
        });

        it('returns the result of getRequest()', () => {
            expect(ret).toBe('a-promise');
        });
    });

    describe('.getPullRequests()', () => {
        let ret;
        beforeEach(() => {
            spyOn(github, 'getRequest').and.returnValue('a-promise');
            ret = github.getPullRequests('cyaninc/beaker');
        });

        it('calls getRequest with proper URL', () => {
            expect(github.getRequest).toHaveBeenCalledWith('/repos/cyaninc/beaker/pulls');
        });

        it('returns the result of getRequest()', () => {
            expect(ret).toBe('a-promise');
        });
    });

    describe('.getPullRequestForSha()', () => {
        let pr, prsResolver, prs;
        beforeEach(() => {
            prsResolver = {};
            spyOn(github, 'getPullRequests').and.returnValue(makePromise(prsResolver));
            github.getPullRequestForSha('cyaninc/beaker', 'abcde').then(function (resp) {
                pr = resp;
            });
        });

        it('says what it is doing', () => {
            const msg = 'Looking for PR on repository cyaninc/beaker with HEAD at commit abcde';
            expect(console.info).toHaveBeenCalledWith(msg);
        });

        it('fetches the pull requests', () => {
            expect(github.getPullRequests).toHaveBeenCalledWith('cyaninc/beaker');
        });

        describe('when the sha is present on head', () => {
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

            it('says "I found it"', () => {
                expect(console.info).toHaveBeenCalledWith('Found PR at commit: 2');
            });

            it('resolves with the pr', () => {
                expect(pr).toBe(prs[1]);
            });
        });

        describe('when the sha is present on merge commit', () => {
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

            it('says "I found it"', () => {
                expect(console.info).toHaveBeenCalledWith('Found PR at commit: 1');
            });

            it('resolves with the pr', () => {
                expect(pr).toBe(prs[0]);
            });
        });

        describe('when the sha is not present', () => {
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

            it('resolves with null', () => {
                expect(pr).toBe(null);
            });
        });

    });

    describe('.getVersionBumpLevel()', () => {
        it('finds major bump comment', () => {
            var pr = {body: '#MAJOR#'};
            expect(github.getVersionBumpLevel(pr)).toEqual('major');
        });

        it('finds minor bump comment', () => {
            var pr = {body: '#MINOR#'};
            expect(github.getVersionBumpLevel(pr)).toEqual('minor');
        });

        it('finds patch bump comment', () => {
            var pr = {body: '#PATCH#'};
            expect(github.getVersionBumpLevel(pr)).toEqual('patch');
        });

        it('returns null if no bump comment found', () => {
            var pr = {body: '#FAKE#'};
            expect(github.getVersionBumpLevel(pr)).toEqual(null);
        });

        it('finds bump comment sourrounded by other text', () => {
            var pr = {body: 'Blah blah blah\n#MAJOR#blah blah blah'};
            expect(github.getVersionBumpLevel(pr)).toEqual('major');
        });
    });

    describe('.hasVersionBumpComment()', () => {
        var level, ret;
        beforeEach(() => {
            level = 'minor';
            spyOn(github, 'getVersionBumpLevel').and.callFake(() => {
                return level;
            });

            ret = github.hasVersionBumpComment('foo');
        });

        it('looks up the version bump level', () => {
            expect(github.getVersionBumpLevel).toHaveBeenCalledWith('foo');
        });

        it('returns true', () => {
            expect(ret).toBe(true);
        });

        describe('when no bump level found', () => {
            beforeEach(() => {
                level = null;
                ret = github.hasVersionBumpComment('foo');
            });

            it('returns false', () => {
                expect(ret).toBe(false);
            });
        });
    });

    describe('.verifyRequiredArgs()', () => {
        var argv;

        beforeEach(() => {
            spyOn(utils, 'throwCliError');
            argv = {
                repo: 'cyaninc/my-repo-name',
                sha: 'aabea989b5ebfa181f55f6593c5b814cc8da45e2',
            };
        });

        describe('when everything is fine', () => {
            beforeEach(() => {
                github.verifyRequiredArgs(argv, ['repo', 'sha']);
            });

            it('does not throw a CLI error', () => {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });
        });

        describe('when missing required arguments', () => {
            beforeEach(() => {
                delete argv.repo;
                delete argv.sha;
                github.verifyRequiredArgs(argv, ['repo', 'sha']);
            });

            it('throws a CLI error', () => {
                var msg = 'repo argument is required\nsha argument is required';
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });
    });

    describe('.versionBumped()', () => {
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

        it('verifies required arguments', () => {
            expect(github.verifyRequiredArgs).toHaveBeenCalledWith(argv, ['repo', 'sha']);
        });

        it('fetches the pr', () => {
            expect(github.getPullRequestForSha).toHaveBeenCalledWith(argv.repo, argv.sha);
        });

        it('does not throw', () => {
            expect(utils.throwCliError).not.toHaveBeenCalled();
        });

        describe('when no version bump found', () => {
            beforeEach(function (done) {
                pr.hasVersionBumpComment = false;
                github.versionBumped(argv);
                setTimeout(done, 1);
            });

            it('throws an error', () => {
                expect(utils.throwCliError).toHaveBeenCalledWith('Missing version bump comment', 1);
            });

            // TODO: find a way to make sure that the .done() was called and the error is re-raised after thrown
            // you can't use expect().toThrow() becuase Q is catching the error and re-throwing it later.
        });
    });

    describe('.bumpFiles()', () => {
        var versionySpy, jsonTabs, jsonIndent;
        beforeEach(() => {
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

        afterEach(() => {
            process.env.JSON_TABS = jsonTabs;
        });

        describe('major bumps', () => {
            beforeEach(() => {
                github.bumpFiles('major');
            });

            it('sets indentation', () => {
                expect(versionySpy.indent).toHaveBeenCalledWith(jsonIndent);
            });

            it('bumps the major', () => {
                expect(versionySpy.newMajor).toHaveBeenCalled();
            });

            it('does not throw', () => {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });
        });

        describe('minor bumps', () => {
            beforeEach(() => {
                github.bumpFiles('minor');
            });

            it('sets indentation', () => {
                expect(versionySpy.indent).toHaveBeenCalledWith(jsonIndent);
            });

            it('bumps the minor', () => {
                expect(versionySpy.minor).toHaveBeenCalled();
            });

            it('resets the patch', () => {
                expect(versionySpy.patch).toHaveBeenCalledWith(0);
            });

            it('does not throw', () => {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });
        });

        describe('patch bumps', () => {
            beforeEach(() => {
                github.bumpFiles('patch');
            });

            it('sets indentation', () => {
                expect(versionySpy.indent).toHaveBeenCalledWith(jsonIndent);
            });

            it('bumps the patch', () => {
                expect(versionySpy.patch).toHaveBeenCalled();
            });

            it('does not throw', () => {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });
        });

        describe('unknown bumps', () => {
            beforeEach(() => {
                github.bumpFiles('non-existent-bump-type');
            });

            it('throws an error', () => {
                expect(utils.throwCliError).toHaveBeenCalledWith('Missing version bump comment', 1);
            });
        });
    });

    describe('.getBranch()', () => {
        var cmdResolver, branch;
        beforeEach(() => {
            cmdResolver = {};
            spyOn(github, 'exec').and.returnValue(makePromise(cmdResolver));
            github.getBranch().then(function (result) {
                branch = result;
            });
        });

        it('executes the git command', () => {
            expect(github.exec).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD');
        });

        describe('when command works', () => {
            beforeEach(function (done) {
                cmdResolver.resolve([
                    'my-branch\n',
                    '',
                ]);

                setTimeout(done, 1);
            });

            it('resolves with the branch`', () => {
                expect(branch).toBe('my-branch');
            });
        });
    });

    describe('.pushChanges()', () => {
        var ret;
        beforeEach(() => {
            spyOn(github, 'exec').and.returnValue('result');
            ret = github.pushChanges('my-branch');
        });

        it('executes the command to push the branch', () => {
            expect(github.exec).toHaveBeenCalledWith('git push origin my-branch');
        });

        it('returns the result of exec', () => {
            expect(ret).toBe('result');
        });
    });

    describe('.commitBumpedFiles()', () => {
        var existingFiles, resolvers;
        beforeEach(() => {
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

    describe('.getVersionBumps()', () => {
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

        it('fetches all the appropriate PRs', () => {
            expect(github.getPullRequest).toHaveBeenCalledWith('cyaninc/beaker', '6');
            expect(github.getPullRequest).toHaveBeenCalledWith('cyaninc/beaker', '5');
            expect(github.getPullRequest).toHaveBeenCalledWith('cyaninc/beaker', '4');
        });

        it('resolves with the bumps', () => {
            // NOTE: inverted order because we want to bump from oldest to newest
            expect(bumps).toEqual([
                'major',
                'minor',
                'patch',
            ]);
        });

        describe('when a bump commit exists in the middle', () => {
            beforeEach(function (done) {
                bumps = null;
                commits[3].commit.author.email = github.config.github.email;
                github.getVersionBumps('cyaninc/beaker', commits).then(function (resp) {
                    bumps = resp;
                });

                setTimeout(done, 1);
            });

            it('resolves with the bumps', () => {
                // NOTE: inverted order because we want to bump from oldest to newest
                expect(bumps).toEqual([
                    'minor',
                    'patch',
                ]);
            });
        });
    });

    describe('.bumpVersionForBranch()', () => {
        var commitsResolver, bumpFinished;
        beforeEach(() => {
            commitsResolver = {};
            bumpFinished = false;
            spyOn(github, 'getCommits').and.returnValue(makePromise(commitsResolver));
            github.bumpVersionForBranch('cyaninc/beaker', '3.x').then(() => {
                bumpFinished = true;
            });

        });

        it('looks up the commits', () => {
            expect(github.getCommits).toHaveBeenCalledWith('cyaninc/beaker', '3.x');
        });

        it('does not resolve original promise yet', () => {
            expect(bumpFinished).toBe(false);
        });

        describe('when commits are fetched', () => {
            var bumpsResolver, commits;
            beforeEach(function (done) {
                bumpsResolver = {};
                commits = ['commit-1', 'commit-2'];
                spyOn(github, 'getVersionBumps').and.returnValue(makePromise(bumpsResolver));
                commitsResolver.resolve({data: commits});
                setTimeout(done, 1);
            });

            it('looks up version bumps', () => {
                expect(github.getVersionBumps).toHaveBeenCalledWith('cyaninc/beaker', commits);
            });

            it('does not resolve original promise yet', () => {
                expect(bumpFinished).toBe(false);
            });

            describe('when bumps are returned', () => {
                var commitBumpsResolver, bumps;
                beforeEach(function (done) {
                    bumps = ['bump-1', 'bump-2', 'bump-3'];
                    commitBumpsResolver = {};
                    spyOn(github, 'commitBumpedFiles').and.returnValue(makePromise(commitBumpsResolver));
                    spyOn(github, 'bumpFiles');
                    bumpsResolver.resolve(bumps);
                    setTimeout(done, 1);
                });

                it('performs the bumps', () => {
                    expect(github.bumpFiles.calls.allArgs()).toEqual([
                        ['bump-1'],
                        ['bump-2'],
                        ['bump-3'],
                    ]);
                });

                it('commits the files', () => {
                    expect(github.commitBumpedFiles).toHaveBeenCalledWith('3.x');
                });

                it('does not resolve original promise yet', () => {
                    expect(bumpFinished).toBe(false);
                });

                describe('when commit bumps finishes', () => {
                    var pushChangesResolver;
                    beforeEach(function (done) {
                        pushChangesResolver = {};
                        spyOn(github, 'pushChanges').and.returnValue(makePromise(pushChangesResolver));
                        commitBumpsResolver.resolve();
                        setTimeout(done, 1);
                    });

                    it('pushes the changes', () => {
                        expect(github.pushChanges).toHaveBeenCalledWith('3.x');
                    });

                    it('does not resolve original promise yet', () => {
                        expect(bumpFinished).toBe(false);
                    });

                    describe('when pushing changes finishes', () => {
                        beforeEach(function (done) {
                            spyOn(utils, 'throwCliError');
                            pushChangesResolver.resolve({
                                code: 0,
                            });
                            setTimeout(done, 1);
                        });

                        it('does not throw an error', () => {
                            expect(utils.throwCliError).not.toHaveBeenCalled();
                        });

                        it('resolves the original promise', () => {
                            expect(bumpFinished).toBe(true);
                        });
                    });

                    describe('when pushing changes fails', () => {
                        beforeEach(function (done) {
                            spyOn(utils, 'throwCliError');
                            pushChangesResolver.resolve({
                                code: 1,
                                stdout: 'error-message',
                            });
                            setTimeout(done, 1);
                        });

                        it('throws an error', () => {
                            var msg = 'Failed to push changes to 3.x: error-message';
                            expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
                        });

                        it('resolves the original promise', () => {
                            expect(bumpFinished).toBe(true);
                        });
                    });
                });
            });
        });
    });

    describe('.bumpVersion()', () => {
        var argv, branchResolver;
        beforeEach(() => {
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

        it('verifies required arguments', () => {
            expect(github.verifyRequiredArgs).toHaveBeenCalledWith(argv, ['repo']);
        });

        describe('when branch is resolved', () => {
            beforeEach(function (done) {
                branchResolver.resolve('3.x');
                setTimeout(done, 1);
            });

            it('does not throw', () => {
                expect(utils.throwCliError).not.toHaveBeenCalled();
            });

            it('bumps the version for the branch', () => {
                expect(github.bumpVersionForBranch).toHaveBeenCalledWith(argv.repo, '3.x');
            });
        });

        describe('when branch is null', () => {
            beforeEach(function (done) {
                branchResolver.resolve(null);
                setTimeout(done, 1);
            });

            it('throws an error', () => {
                var msg = 'Unable to lookup branch';
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });
    });

    describe('.command()', () => {
        var argv;

        beforeEach(() => {
            argv = {
                _: ['github'],
            };
            spyOn(github, 'bumpVersion');
            spyOn(github, 'versionBumped');
            spyOn(github, 'createRelease');
            spyOn(utils, 'throwCliError');
        });

        describe('when bad argument count', () => {
            beforeEach(() => {
                github.command(argv);
            });

            it('throws an error', () => {
                var msg = 'Invalid command: ' + JSON.stringify(argv._);
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });

        describe('when invalid command', () => {
            beforeEach(() => {
                argv._.push('foo-bar');
                github.command(argv);
            });

            it('throws an error', () => {
                var msg = 'Unknown command: foo-bar';
                expect(utils.throwCliError).toHaveBeenCalledWith(msg, 1);
            });
        });

        describe('release', () => {
            beforeEach(() => {
                argv._.push('release');
                github.command(argv);
            });

            it('makes the call to createRelease', () => {
                expect(github.createRelease).toHaveBeenCalledWith(argv);
            });
        });

        describe('version-bumped', () => {
            beforeEach(() => {
                argv._.push('version-bumped');
                github.command(argv);
            });

            it('makes the call to versionBumped', () => {
                expect(github.versionBumped).toHaveBeenCalledWith(argv);
            });
        });

        describe('bump-version', () => {
            beforeEach(() => {
                argv._.push('bump-version');
                github.command(argv);
            });

            it('makes the call to bumpVersion', () => {
                expect(github.bumpVersion).toHaveBeenCalledWith(argv);
            });
        });
    });
});
