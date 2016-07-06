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
	utils.sendMessage("Command Received: Open Project", null, 1);
	var deferred = Q.defer();
	utils.openProject(utils.currentProject(), function(success) {
		if (success === true) {
			utils.sendMessage("Project opened successfully.", null, 2);
			utils.sendMessage("Command Completed: Open Project", null, 1);
			deferred.resolve();
		} else if (success === false) {
			utils.sendMessage("There was an error opening this project.", null, 3);
			utils.sendMessage("Command Completed: Open Project", null, 1);
			deferred.reject();
		}
	});
	return deferred.promise;
});

gulp.task('build', function() {
	utils.sendMessage("Command Received: Build Project", null, 1);
	var deferred = Q.defer();
	runSequence('open', 'html', 'css', 'js', function(err) {
		if (err) {
			utils.sendMessage("There was an error building your project.", err.message, 3);
			utils.sendMessage("Command Completed: Build Project", null, 1);
			deferred.reject(new Error(err));
		} else {
			utils.sendMessage("Project built successfully.", null, 2);
			utils.sendMessage("Command Completed: Build Project", null, 1);
			deferred.resolve();
		}
	});
	return deferred.promise;
});

gulp.task('start', ['listen'], function() {
	utils.sendMessage("Command Received: Start Cascade Compiler", null, 1);
});
