define(['exports'], function (exports) {
	'use strict';

	Object.defineProperty(exports, '__esModule', {
		value: true
	});
	var jetpack = require('fs-jetpack');
	var fs = require('fs');
	var gui = require('nw.gui');

	/**
  * Creates various helper utilities.
  * @class
  */
	var utils = {
		downloadFile: function downloadFile(fileUrl, callback) {
			var app = global.app;
			var fs = require('fs');
			var fileName = fileUrl.split('/').pop();
			var path = gui.App.dataPath + '/Downloads';
			var file = path + '/' + fileName;
			var download = app.request({ url: fileUrl, encoding: null }, function (err, resp, body) {
				if (err) {
					app.emit("download:end");
					callback(false, err);
				} else {
					fs.access(path, fs.F_OK, function (err) {
						if (err) {
							fs.mkdirSync(path);
						}
						fs.writeFile(file, body, function (err) {
							if (!err) {
								app.emit("download:end", path + '/' + fileName, err);
								callback(path, fileName);
							} else {
								app.emit("download:end");
								callback(false, err);
							}
						});
					});
				}
			});
			download.on('response', function (res) {
				var size = res.headers['content-length'];
				var currentSize = 0;
				var percent;
				var milestone = 0;
				app.emit("download:start");
				download.on('data', function (data) {
					currentSize = currentSize + data.length;
					percent = currentSize / size;
					if (percent > milestone + 0.02) {
						app.ui.downloadProgress(percent);
						milestone = percent;
					}
				});
			});
		},
		checkGithub: function checkGithub(user, repo, callback) {
			var app = global.app;
			var githubRequest = app.request({ url: 'https://api.github.com/repos/' + user + '/' + repo + '/releases/latest', headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)' }, encoding: null }, function (err, resp, body) {
				if (err) {
					callback(false, err);
				} else {
					var data = JSON.parse(body);
					var archive = 'http://github.com/' + user + '/' + repo + '/archive/' + data.tag_name + '.zip';
					var remoteVersion = data.tag_name.replace('v', '').split('.');
					// Need to replace the below with a way that won't get cached
					var currentVersion = require('./package.json').version.split('.');
					var newVersion = false;
					if (+remoteVersion[0] > +currentVersion[0]) {
						newVersion = true;
					} else if (+remoteVersion[1] > +currentVersion[1]) {
						newVersion = true;
					} else if (+remoteVersion[2] > +currentVersion[2]) {
						newVersion = true;
					}
					if (newVersion === true) {
						callback(archive);
					} else {
						callback(false);
					}
				}
			});
		},
		copyNewAppFiles: function copyNewAppFiles(from, to, callback) {
			var child_process = require("child_process");
			var spawn = require('child_process').spawn;
			var isError = false;

			var copyProcess = spawn('rsync', ['-avh', from + '/', to + '/']);

			var totalFiles = 10000;
			var totalMessages = 0;
			var percent = 0;

			copyProcess.stdout.on('data', function (data) {
				totalMessages = totalMessages + 1;
				percent = totalMessages / totalFiles;
				app.emit("copy:progress", percent);
			});

			copyProcess.stderr.on('data', function (data) {});

			copyProcess.on('exit', function (code) {
				if (code === 0) {
					callback();
				} else {
					callback("There was an error copying the updated version of Cascade. Process exited with code '" + code + "'.");
				}
			});
		},
		nwPath: function nwPath() {
			var nwPath = global.app.path.split('/');
			nwPath.pop();
			nwPath = nwPath.join('/') + '/node_modules/nw/nwjs/nwjs.app/Contents/MacOS/nwjs';
			return nwPath;
		},
		setProjectIcon: function setProjectIcon(path, file) {
			var spawn = require('child_process').spawn;
			var app = global.app;
			var scriptPath = app.path + "/node_modules/fileicon/bin/fileicon";
			var folder = path;
			var icon = app.path + app.get('settings').folderIcon;
			if (file) {
				icon = app.path + app.get('settings').fileIcon;
			}
			var script = scriptPath + " set " + folder + " " + icon;
			var args = ['set', folder, icon];
			var runScript = spawn(scriptPath, args);
		},
		uniq: function uniq(a) {
			var seen = {};
			return a.filter(function (item) {
				return seen.hasOwnProperty(item) ? false : seen[item] = true;
			});
		},
		addToRecentProjects: function addToRecentProjects(path) {
			var app = global.app;
			var recentProjects = app.get('settings').recentProjects;
			recentProjects.unshift(path);
			if (recentProjects.length === 21) {
				recentProjects.pop();
			}
			recentProjects = app.utils.uniq(recentProjects);
			app.set('recentProjects', recentProjects);
		},
		replace: function replace(str, patterns) {
			Object.keys(patterns).forEach(function (pattern) {
				var matcher = new RegExp('{{' + pattern + '}}', 'g');
				str = str.replace(matcher, patterns[pattern]);
			});
			return str;
		}
	};
	exports.utils = utils;
});
//# sourceMappingURL=utils.js.map
