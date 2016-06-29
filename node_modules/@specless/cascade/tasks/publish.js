var gulp = require('gulp');
var utils = require('../js/utils.js');

gulp.task('publish', ['build'], function () {
	utils.copyToPublishFolder();
	return true
});