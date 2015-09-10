# beaker

[![npm version](https://badge.fury.io/js/beaker.svg)](http://badge.fury.io/js/beaker)
[![build status](https://travis-ci.org/cyaninc/beaker.svg?branch=master)](https://travis-ci.org/cyaninc/beaker)
[![Coverage Status](https://coveralls.io/repos/cyaninc/beaker/badge.svg)](https://coveralls.io/r/cyaninc/beaker)

If you want to create a new web interface or web interface component, and you don't want to have to
manually install all the dependencies to get the project going (`grunt`, `karma`, `webpack`, etc.), this is for you.

## Table of Contents

 * [Getting Started](#getting-started)
 * [Development](#development)
 * [Contributing](#contributing)
 * [Packages Installed](#packages-installed)
 * [Additional References](#additional-references)

## Getting Started
These steps work best on an empty repository (a new project) but are safe to do in an existing project, you just
may not get the best of everything because we won't overwrite or extend files that already exist.

### Node
Make sure you have [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) installed in your
development environment. Use [nvm](https://github.com/creationix/nvm) it will make your life *much* easier.

### `lib-curl`
Make sure lib-curl is installed. On Ubuntu, you can do the following:

    sudo apt-get install libcurl4-openssl-dev

### End to End test dependencies
If you want to be able to run the `e2e-test` target that uses `webdriverio` and `webdrivercss`, you need to install
the following dependencies as well: `graphicsmagick` and `cairo`

#### OSX

    brew install Caskroom/cask/xquartz # <- if you don't have X11
    brew install graphicsmagick cairo

#### Ubuntu

    sudo apt-get install graphicsmagick cairo

### Install `beaker`
Before installing Beaker, make sure you have a `node_modules` directory in your project folder:

    mkdir node_modules

Run the following command in your project directory to install this package and all of its dependencies:

    npm install beaker

You should now have all of the beaker dependencies added to your project in the directory `node_modules`.


### Init a new project
Now that we have the npm dependencies installed lets setup our initial project environment. Run the following
command at the root of your project.

    ./node_modules/.bin/beaker init --type webpack

The `--type` flag specifies what
kind of project you are creating. Possible values are currently

 * `node` - an npm module intended for consumption in a nodejs environment
 * `webpack` - a webpack bundle project
 * `app` - a webpack app project

This will populate your project root with a few initial files/folders.
For a listing of what will be created you can use:

    ./node_modules/.bin/beaker help init

If you are unfamiliar with Grunt you may want to head over to
[Grunt's getting started page](http://gruntjs.com/getting-started) and learn more about it.


### Verify
After installing beaker, make sure to `npm install` in order to get the packages in the `package.json` placed by Beaker.

We should now have our basic project setup. Try running the following command to see if everything works:

    source env.sh
    grunt

If the command works and you see a message along the lines of:

    Running "webpack-dev-server:start" (webpack-dev-server) task


### Vim
If you're a `vim` (with `syntastic`) user (and you *should* be :wink:), you may also want to configure
your `.vimrc` to be able to properly reference the extra `eslint-rules` directory we have in the `beaker`
directory. An example of what to add to your `.vimrc` can be found
[here](https://github.com/adammeadows/dotfiles/blob/master/vim/.vimrc#L101-L104)


## Development

The following `grunt` tasks and `make` targets have been provided to allow for rapid development. By default no
source-maps are generated, since it affects build-time quite a bit, especially for large projects. However, if you
would like to generate source-maps, simply set the `MAPS` environment variable to `on`. You can do so per command
by simply adding `MAPS=on` before the command.

    MAPS=on grunt
    MAPS=on make karma-watch

This can be useful if you're not sure where a test is failing, or where an exception is being raised.

### `grunt`
The default `grunt` task will launch the `webpack-dev-server` in
[hot mode](http://webpack.github.io/docs/webpack-dev-server.html#hot-mode) this allows you to point your browser at
the following URLs:

 * http://localhost:8080/  - view demo (refresh after changing files)
 * http://localhost:8080/webpack-dev-server/ - same as above, but with status banner and hot-reloading

### `grunt dev`
The `dev` task will build your app and then watch files and re-build whenever you change something. This is not quite
as fast as using the `webpack-dev-server`, since it has to write everything to disk and doesn't cache anything.
However, it has the added beneifit of being able to be served by any static file web server.

### `grunt build`
The `build` task will build your component demo (or your app for production). It will optimize your bundle by using
UglifyJS to minify your code, and the dedupe plugin to remove duplicate modules.

### `grunt lint`
Checks your code for lint.

### `make karma-test`
A CI-friendly test that executes tests once and exits

### `make karma-watch`
This is a simple make target that does a `grunt karma:unit watch:karma`. This will cause the `karma` server to
start and a watcher to be placed on all the files in `src/`. So, when any file is changed, all your karma tests
will be run. It's still a little slow because of the source-maps being generated.

## Contributing

If you are going to be adding functionality to `beaker` keep in mind the following regarding dependencies.
The `package.json` for `beaker` has three different dependency sections, each with their own specific purpose.

### `peerDependencies`
These are dependencies that are required *outside* of `beaker` things like `karma`, `grunt`, `eslint` etc.
All packages defined in `peerDependencies` get installed *alongside* `beaker`

    my-project/
        node_moudles/
            beaker/
            karma/
            grunt/
            eslint/

> **NOTE** Since, they're installed alongside the package in question `peerDependencies` are not installed when
running `npm install` from within the project that contains them. If you need access to the package within the
project as well, see `devDependencies` below.

### `dependencies`
These are dependencies that `beaker` requires to function, but are *not* needed outside of `beaker`.
Some examples would be internal libraries needed for `beaker` to function, like `http-sync`, which is used
to make synchronous http requests to GitHub.
All packages defined in `dependencies` get installed *within* `beaker`

    my-project/
        node_modules/
            beaker/
                node_modules/
                    http-sync/

> **NOTE** Since, they're installed *within* the package in question `dependencies` are installed both when someone
else installs the package, and when `npm install` is called from within the project. Because they are both installed
when someone else installs `beaker` you never want the same package in both `dependencies` and `peerDependencies`.
Otherwise you can end up with something like:

>       my-project/
            node_modules/
                beaker/
                    node_modules/
                        http-sync/
                http-sync/

### `devDependencies`
If `beaker` needs something that it defines in it's `peerDependencies` like, for example, `eslint`
(I mean, we want to lint the code in `beaker` too, right?) then, we need to include that dep in *both*
`peerDependencies` and `devDependencies`.

All packages defined in `devDependencies` get installed *within* `beaker` but *only* when `npm install` is run
from *within* the `beaker` project, not when another project installs `beaker`. So, it also doesn't make any
sense to have the same package in both `dependencies` and `devDependencies`, since they're both installed with a local
`npm install`.


## Components
`beaker` works with (or depends on) the following tools/packages.

### Webpack
`beaker` primarily helps you set up [`webpack`](http://webpack.github.io) projects.

### Loaders
`beaker` automatically configures the following `webpack` loaders:

#### Styles

 * [less-loader](https://github.com/webpack/less-loader) so you can use [LESS](http://lesscss.org)
 * [autoprefixer-loader](https://github.com/passy/autoprefixer-loader) so you never have to use browser prefixes.
 * [css-loader](https://github.com/webpack/css-loader) how else are you gonna deliver your styles?
 * [style-loader](https://github.com/webpack/style-loader) so you never have to add another `<link>` tag
 * [file-loader](https://github.com/webpack/file-loader) so you can bundle images and get reference to their URLs.

#### Data
 * [json-loader](https://github.com/webpack/json-loade://github.com/webpack/json-loader) so you can keep your `.js`
   files cleaner and keep data where it belongs.
 * [raw-loader](https://github.com/webpack/raw-loader)
 * [yaml-loader](https://github.com/okonet/yaml-loader) in case you're lazy and don't wanna write full JSON.

#### Code
 * [jade-loader](https://github.com/webpack/jade-loader) so you can use client-side
   [`jade` templates](http://jade-lang.com)
 * [babel-loader](https://github.com/babel/babel-loade://github.com/babel/babel-loader) so you can write the code of
   tomorrow, today with [`babel`](https://github.com/babel/babel)
 * [imports-loader](https://github.com/webpack/imports-loader) so you can include code that was intended to be
   included directly in a `<script>` tag. 

### Task Management
* [grunt](https://github.com/gruntjs/grunt)
* [grunt-cli](https://github.com/gruntjs/grunt-cli)
* [grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch)

### Testing
* [coveralls](https://github.com/cainus/node-coveralls) so you can report your code coverage to
  [coveralls.io](https://coveralls.io)
* [grunt-karma](https://github.com/karma-runner/grunt-karma)
* [grunt-eslint](https://github.com/sindresorhus/grunt-eslint) so you can, you guessed it,
  use [`eslint`](http://eslint.org)
* [grunt-filenames](https://github.com/bahmutov/grunt-filenames)
* [jasmine-npm](https://github.com/jasmine/jasmine-npm)
* [karma](https://github.com/karma-runner/karma)
* [karma-chrome-launcher](https://github.com/karma-runner/karma-chrome-launcher)
* [karma-cli](https://github.com/karma-runner/karma-cli)
* [karma-firefox-launcher](https://github.com/karma-runner/karma-firefox-launcher)
* [karma-js-coverage](https://github.com/danielflower/karma-js-coverage)
* [karma-jasmine](https://github.com/karma-runner/karma-jasmine)
* [karma-spec-reporter](https://github.com/mlex/karma-spec-reporter)

## Additional References
We also include code from the following sources.

* [nodeca](https://github.com/nodeca/nodeca/)
(some [eslint rules](https://github.com/nodeca/eslint-plugin-nodeca/tree/master/lib))`

