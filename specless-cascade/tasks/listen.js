var gulp = require('gulp');
var utils = require('../js/utils.js');
var _ = require('underscore');
var express = require('express');
var server = express();
var httpService = require('http');
var http = httpService.Server(server);
var io = require('socket.io')(http);

gulp.task('listen', ['build'], function () {
	utils.sendMessage("Command Received: Start Server and Listen for Changes", null, 1);
	var cascade = utils.get('cascadeSettings');
	var settings = utils.get('projectSettings');

	var htmlFiles = [settings.path + '/**/' + cascade.html.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];
	var cssFiles = [settings.path + '/**/' + cascade.css.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];
	var jsFiles = [settings.path + '/**/' + cascade.js.fileName, '!' + settings.path + '/{' + cascade.assetsDirName + ',' + cascade.assetsDirName + '/**}'];
	var allFiles = [settings.path + '/**/*', '!' + settings.path + '/{' + cascade.buildDir + ',' + cascade.buildDir + '/**}'];

	gulp.watch(htmlFiles, ['html']);
	gulp.watch(cssFiles, ['css']);
	gulp.watch(jsFiles, ['js']);

	server.get('/', function (req, res) {
		utils.sendMessage("Server: Opening Preview Interface", null, 2);
		var width = 300;
		var height = 250;
		var previewPrefix = 'http://app.specless.io/preview/' + cascade.csfVersion + '?ad=000000&width=' + width + '&height=' + height + '#';
		var projectSettings = utils.get('projectSettings');
		var previewObj = {
			unfriendlyCreative: true,
			components: []
		}
		var previewUrl;

		_.each(projectSettings.components, function(component) {
			var prefix  = 'http://localhost:' + cascade.serverPort + '/components/' + component.name;
			var obj = {
				src: prefix + '.html',
				jsLocation: prefix + '.js',
			}
			previewObj.components.push(obj);
		});
		previewObj = JSON.stringify(previewObj);
		previewUrl = previewPrefix + previewObj;
		res.location(previewUrl);
	  	res.redirect(302, previewUrl);
	});

	server.get('/killme', function(req, res) {
		utils.sendMessage("Server: Server Killed", null, 2);
		res.send("Success. Cascade Server Killed.");
		process.exit();
	});
	
	io.on('connection', function(socket){
		utils.sendMessage("Server: New Sockets Connection", null, 2);
		gulp.watch(allFiles).on('change', function(file) {
			utils.sendMessage("File Change: '" + file.path + "'", null, 2);
			var filename = file.path.replace(/^.*(\\|\/|\:)/, '');
			var folder = file.path.split('/');
			var getFileType = function() {
				if (filename === cascade.settingsFileName) {
					return 'settings'
				} else if (filename === cascade.html.fileName) {
					return 'html'
				} else if (filename === cascade.js.fileName) {
					return 'js'
				} else if (filename === cascade.css.fileName) {
					return 'css'
				} else {
					return 'asset'
				}
			}
			folder = folder[folder.length - 2];
			file.filename = filename;
			file.folder = folder;
			file.filetype = getFileType();
			io.emit('file change',file);
		});
	});

	server.use('/components', express.static(settings.path + '/' + cascade.buildDir));
	server.use('/assets', express.static(settings.path + '/' + cascade.assetsDirName));
	server.use('/settings', express.static(settings.path + '/' + cascade.settingsFileName));

	http.listen(cascade.serverPort, function (err) {
		utils.sendMessage("Server: Listening On Port: " + cascade.serverPort, null, 2);
	});

});



//http://app.specless.io/preview/623?height=571&width=1378&ad=000000#{"unfriendlyCreative":true,"components":[{"src":"http://localhost:8787/loader","jsLocation":"http://localhost:8787/loader/js"},{"src":"http://localhost:8787/banner","jsLocation":"http://localhost:8787/banner/js"},{"src":"http://localhost:8787/panel","jsLocation":"http://localhost:8787/panel/js","width":1378,"height":571,"dimensionType":"auto"}]}