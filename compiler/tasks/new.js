var gulp = require('gulp');
var _ = require('underscore');
var copy = require('gulp-contrib-copy');
var utils = require('../js/utils.js');
var fs = require('fs');
var jetpack = require('fs-jetpack');
var plumber = require('gulp-plumber');

gulp.task('new', function () {
	var cascade = utils.get('cascadeSettings');
	utils.sendMessage("Command Received: Create New Project", null, 1);

	var argv = require('yargs')
      .demand(['path'])
      .argv;
    var path = argv.path;
    var name = argv.name;

	if (path === undefined) {
		utils.sendMessage("You must provide a path for your new project.", null, 0);
		console.error("You must provide a path for your new project.");
		
	} else if (name === undefined) {
		utils.sendMessage("You must provide a name for your new project.", null, 0);
		console.error("You must provide a name for your new project.");
	}

	var rename = function(name) {
		function transform(file, cb) {
			if (file.relative === cascade.settingsFileName) {
				var settings = JSON.parse(String(file.contents));
				settings.name = name;
				settings.path = path + '/' + name;
				settings = JSON.stringify(settings);
				file.contents = new Buffer(settings);
			}
		    cb(null, file);
		}
		return require('event-stream').map(transform);
	}

	var destination = path + '/' + name;
	fs.access(destination, fs.F_OK, function(err) {
	    if (!err) {
	    	utils.sendMessage("The project '" + name + "' already exists here.", null, 3);
	        console.error("The project '" + name + "' already exists here.");
	    } else {
	    	utils.sendMessage("Creating new project '" + name + "'.", null, 2);
	    	fs.mkdirSync(destination);
	        var success = true;
	        return gulp.src(cascade.path + cascade.newProjectDir + '/**/*')
	        	.pipe(plumber({
		    		errorHandler: function(error) {
		    			utils.sendMessage("There was an error creating your project.", error.message, 3);
		    			success = false;
		    		}
		    	}))
				.pipe(copy())
				.pipe(rename(name))
			    .pipe(gulp.dest(destination))
			    .on('end', function(err) {
		        	if (success === true) {
		        		utils.sendMessage("New Project successfully created at '" + path + "'.", null, 2);
		        	}
		        	utils.sendMessage("Command Completed: Create New Project", null, 1);
		        	success = true;
		        });
	    }
	});
});