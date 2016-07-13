var gulp = require('gulp');
var _ = require('underscore');

gulp.task('new', function () {
	var path, name;
	_.each(process.argv, function(arg) {
	   thisArg = arg.split('=');
	   if (thisArg.length === 2) {
		   	if (thisArg[0] === '--path') {
		   		path = thisArg[1];
		   	} else if (thisArg[0] === '--name') {
		   		name = thisArg[1];
		   	}
	   }
	});
	console.log(path, name);
	if (path === undefined) {
		console.log("You must provide a path for your new project.");
		
	} else if (name === undefined) {
		console.log("You must provide a name for your new project.");
	}
	return true
});