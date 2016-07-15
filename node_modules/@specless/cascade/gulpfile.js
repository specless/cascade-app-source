var gulp = require('gulp');
var utils = require('./js/utils.js');
var runSequence = require('run-sequence');
var prompt = require('gulp-prompt');
var Q = require('q');

var thisPath = __dirname;

'use strict';

utils.updateCascadePath(thisPath);

require('./tasks/set-project');
require('./tasks/clean');
require('./tasks/listen');
require('./tasks/html');
require('./tasks/css');
require('./tasks/js');
require('./tasks/publish');
require('./tasks/new');

gulp.task('open', ['clean'], function () {
	utils.openProject(utils.currentProject());
	return true
});

gulp.task('build', function() {
	var deferred = Q.defer();
	runSequence('open', 'html', 'css', 'js', function(err) {
		if (err) {
			deferred.reject(new Error(err));
		} else {
			deferred.resolve();
		}
	});
	return deferred.promise;
});

gulp.task('start', ['listen'], function() {
	var cascade = utils.get('cascadeSettings');
    return true
});
