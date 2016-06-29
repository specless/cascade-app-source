var gulp = require('gulp');
var utils = require('../js/utils.js');
var _ = require('underscore');

gulp.task('set-project', function () {
	var path;
	_.each(process.argv, function(arg) {
	   thisArg = arg.split('=');
	   if (thisArg.length === 2) {
		   	if (thisArg[0] === '--path') {
		   		path = thisArg[1];
		   	}
	   }
	});
	if (utils.validateProject(path) === true) {
		utils.setCurrentProject(path);
		utils.sendMessage("success", "The project located at '" + path + "' is a valid Cascade project.", 1);
		return
	} else {
		utils.sendMessage("failure", "The project located at '" + path + "' is a not valid Cascade project.", 1);
		throw (new Error("The project located at '" + path + "' is a not valid Cascade project."));
	}
	return true
});