var gulp = require('gulp');
var utils = require('../js/utils.js');
var zip = require('gulp-zip');
var plumber = require('gulp-plumber');

gulp.task('publish', ['build'], function () {
	utils.sendMessage("Command Received: Publish Project.", null, 1);
	var cascade = utils.get('cascadeSettings');
	var project = utils.get('projectSettings');
	var success = true;
	return gulp.src([project.path + '/**/*', '!' + project.path + '/*.scc'], {dot: true})
		.pipe(plumber({
    		errorHandler: function(error) {
    			utils.sendMessage("There was an error publishing your project.", error.message, 3);
    			success = false;
    		}
    	}))
		.pipe(zip(project.name + '.scc'))
		.pipe(gulp.dest(project.path))
		.on('end', function(details) {
			if (success === true) {
				utils.sendMessage("Project published successfully.", null, 2);
			}
			utils.sendMessage("Command Completed: Publish Project.", null, 1);
			success = true;
		});
});