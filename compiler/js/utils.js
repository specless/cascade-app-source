var _ = require('underscore');
var fs = require('fs');
var jetpack = require('fs-jetpack');
var colors = require('colors');
var directoryTree = require('directory-tree').directoryTree;

var globalSettings = jetpack.read('./package.json', 'json');
var cascadeSettings = globalSettings['specless-cascade'];

module.exports = {
	currentProject : function() {
		var cascade = jetpack.read('./package.json', 'json')['specless-cascade'];
		if (cascade.currentProjectDir === 'default') {
			return cascade.path + cascade.defaultProjectDir
		} else {
			return cascade.currentProjectDir
		}
	},
	setCurrentProject : function(path) {
		var currentSettings = jetpack.read('./package.json', 'json');
		currentSettings['specless-cascade'].currentProjectDir = path;
		jetpack.write('./package.json', currentSettings);
	},
	get : function(type) {
		var projectFolder = this.currentProject();
		var result;
		if (type === 'projectSettings' && projectFolder !== null) {
			result = jetpack.read(projectFolder + '/' + cascadeSettings.settingsFileName, 'json');
			
			// Rebuild the settings object if it doesn't exist
			if (result === null) {
				result = {
					path : projectFolder,
					name : projectFolder.split('/').pop(),
					cascadeVersion : globalSettings.version,
					created : this.timestamp(),
					lastUpdated : this.timestamp(),
					csfVersion : cascadeSettings.csfVersion,
					components : [],
				}
			}
			return result
		} else if (type === 'cascadeSettings') {
			result = jetpack.read('./package.json', 'json');
			result = result['specless-cascade'];
			return result
		}
	},
	save : function(type, object) {
		var projectFolder = this.currentProject();
		if (type === 'projectSettings') {
			object.lastUpdated = this.timestamp();
			object.cascadeVersion = jetpack.read('./package.json', 'json').version;
			jetpack.write(projectFolder + '/' + cascadeSettings.settingsFileName, object);
			this.sendMessage("Project settings updated.", null, 2);
			return object
		}
	},
	logComponentDetails : function(component, sourceType, logAs, value) {
		var settingsObj = this.get('projectSettings');
		
		if (settingsObj.components === undefined) {
			settingsObj.components = [];
		}
		var foundComponent = false;
		_.each(settingsObj.components, function(thisComponent) {
			if (thisComponent.name === component) {
				foundComponent = true;
			}
		});

		if (foundComponent === false) {
			var newComponent = {
				name: component,
				html: {},
				css: {},
				js: {}
			};
			settingsObj.components.push(newComponent);
		}
		_.each(settingsObj.components, function(thisComponent) {
			if (thisComponent.name === component) {
				var category = thisComponent[sourceType];
				category[logAs] = value;
			}
		});
		settingsObj.lastUpdated = this.timestamp();
		this.save('projectSettings', settingsObj);
		return settingsObj;
	},
	timestamp : function() {
	    var date = new Date();
	    var hour = date.getHours();
	    hour = (hour < 10 ? "0" : "") + hour;
	    var min  = date.getMinutes();
	    min = (min < 10 ? "0" : "") + min;
	    var sec  = date.getSeconds();
	    sec = (sec < 10 ? "0" : "") + sec;
	    var year = date.getFullYear();
	    var month = date.getMonth() + 1;
	    month = (month < 10 ? "0" : "") + month;
	    var day  = date.getDate();
	    day = (day < 10 ? "0" : "") + day;
	    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
	},
	updateCascadePath : function(path) {
		var packageJson = jetpack.read('./package.json', 'json');
		packageJson["specless-cascade"].path = path;
		jetpack.write('./package.json', packageJson);
	},
	openProject : function(path, callback) {
		if (this.validateProject(path) === true) {
			var settings = this.get('projectSettings');
			var cascade = this.get('cascadeSettings');
			this.setCurrentProject(path);
			settings.path = this.currentProject();
			settings.name = this.currentProject().split('/').pop();
			this.save('projectSettings', settings);
			if (callback) {
				callback(true);
			}
		} else {
			this.logError('Error opening this project', "The project located at '" + path + "' is not a valid Specless Cascade project. Default project opened instead.");
			this.setCurrentProject(cascade.path + cascade.defaultProjectDir);
			if (callback) {
				callback(false);
			}
		}
	},
	validateProject : function(path) {
		var directory = directoryTree(path);
		var project = this.get('projectSettings');
		var cascade = this.get('cascadeSettings');

		// Check for an assets folder, settings file and at least one component;
		var hasAssets;
		var hasSettings;
		var components = [];

		var assetsDir = cascade.assetsDirName;
		var componentHtml = cascade.html.fileName;
		var componentCss = cascade.css.fileName;
		var componentJs = cascade.js.fileName;
		var settingsPath = cascade.settingsFileName;

		try {
			_.each(directory.children, function(child) {
				if (child.name === assetsDir && child.type === "directory") {
					hasAssets = true;
				} else if ( child.type === "directory") {
					// Check if this is a component
					var hasHtml;
					var hasCss;
					var hasJs;
					_.each(child.children, function(file){
						if (file.name === componentHtml) {
							hasHtml = true;
						} else if (file.name === componentCss) {
							hasCss = true;
						} else if (file.name === componentJs) {
							hasJs = true;
						} else if (file.name === "index.scss") {
							var oldPath = path + '/' + file.path;
							var newPath = path + '/' + file.path.replace('.scss', '.css');;
							fs.renameSync(oldPath, newPath);
							hasCss = true;
						}
					});
					if (hasHtml === true && hasCss === true && hasJs === true) {
						var component = {name: child.name, plugins: [], assets: {}};
						components.push(component);
					}
				} else if (child.type === "file" && child.name === settingsPath) {
					hasSettings = true;
				} else if (child.name === "_global.scss") {
					var oldPath = path + '/' + child.path;
					var newPath = path + '/' + child.path.replace('_global.scss', cascade.css.globalFileName);
					fs.renameSync(oldPath, newPath);
				} else if (child.name === "_settings.json") {
					var oldPath = path + '/' + child.path;
					var newPath = path + '/' + child.path.replace('_settings.json', 'OLD_settings.json');
					fs.renameSync(oldPath, newPath);
				}
			})
		} catch (error) {
			return false;
		}

		if (hasAssets === true && components.length > 0) {
			return true;
		} else {
			return false;
		}
	},
	logError : function(title, message) {
		console.log('');
		console.log(colors.red.bold(title));
		console.log(colors.black.bold('ERROR MESSAGE:'));
		console.log(message);
		console.log('');
	},
	copyToPublishFolder : function() {
		var project = this.get('projectSettings');
		var cascade = this.get('cascadeSettings');
		_.each(project.components, function(component) {
			jetpack.copy(project.path, cascade.publishDir, { overwrite: 'yes' });
			var htmlFile = jetpack.read(cascade.buildDir + '/' + component.name + '/' + cascade.html.fileName);
			var cssFile = jetpack.read(cascade.buildDir + '/' + component.name + '/' + cascade.css.fileName);
			var jsFile = jetpack.read(cascade.buildDir + '/' + component.name + '/' + cascade.js.fileName);
			jetpack.write(cascade.publishDir + '/' + cascade.publishCompiledDirName + '/' + component.name + '.html', htmlFile);
			jetpack.write(cascade.publishDir + '/' + cascade.publishCompiledDirName + '/' + component.name + '.css', cssFile);
			jetpack.write(cascade.publishDir + '/' + cascade.publishCompiledDirName + '/' + component.name + '.js', jsFile);
		})
	},
	sendMessage : function(message, details, code) {
		var messageLog = jetpack.read('./message-log.json', 'json');
		var obj = {
			message: message,
			code: code,
			details: details
		}
		messageLog.push(obj);
		jetpack.write('./message-log.json', messageLog);
		console.log('\x1b[36m%s\x1b[0m', '[SPECLESS CASCADE]', message);
		if (details !== null && details !== undefined) {
			console.log(details);
		}
	},
	markComponent : function(type) {
		function transform(file, cb) {
			var prepend;
			var component = file.relative.split('.')[0];
			if (type === 'html') {
				prepend = '<!-- ' + component + ' -->\n';
			} else if (type === 'css' || type === 'js') {
				prepend = '/* ' + component + ' */\n';
			}
		    file.contents = new Buffer(prepend + String(file.contents));
		    cb(null, file);
		}
		return require('event-stream').map(transform);
	},
	getPlugins : function(type) {
		var plugins = this.get('cascadeSettings').plugins;
		var pluginsDir = this.get('cascadeSettings').pluginsFolder + '/';
		var matches = []
		_.each(plugins, function(plugin) {
			var pluginSettings = jetpack.read('.' + pluginsDir + plugin + '/package.json', 'json')['specless-cascade-plugin'];
			_.each(pluginSettings.triggers, function(pluginItem) {
				if (pluginItem.type === type) {
					var trigger = pluginItem;
					trigger.parentPlugin = plugin;
					if (trigger.tag === undefined && trigger.type === 'element') {
						trigger.tag = 'div';
					}
					trigger.path = pluginsDir + trigger.parentPlugin;
					matches.push(trigger);
				}
			});
		});
		matches = _.uniq(matches);
		return matches
	}, 
	addDeps : function(object, newObject, basePath) {
		var cascade = this.get('cascadeSettings');
		var whiteList = cascade.js.whiteListedDeps;
		if (newObject) {
    		if (newObject.css) {
    			_.each(newObject.css, function(dep) {
    				object.css.push(cascade.path + basePath + '/' + dep);
    				object.css = _.uniq(object.css);
    			});
    		}
    		if (newObject.jsPlugins) {
    			_.each(newObject.jsPlugins, function(dep) {
    				object.jsPlugins.push(cascade.path + basePath + '/' + dep);
    				object.jsPlugins = _.uniq(object.jsPlugins);
    			});
    		}
    		if (newObject.js) {
    			_.each(newObject.js, function(dep) {
    				var whiteListed = false;
    				_.each(whiteList, function(script) {
    					if (dep === script.name) {
    						object.jsWhiteList.push(dep);
    						object.jsWhiteList = _.uniq(object.jsWhiteList);
    						whiteListed = true;
    					}
    				});
    				if (whiteListed === false) {
    					var depPath = basePath + '/' + dep;
    					var projectTest = depPath.split("$$$PROJECT$$$");
    					if (projectTest.length > 1) {
    						depPath = cascade.currentProjectDir + projectTest[1];
    					} else {
    						depPath = cascade.path + depPath;
    					}
    					object.js.push(depPath);
    					object.js = _.uniq(object.js);
    				}
    			});
    		}

    		if (newObject.dataSources) {
    			_.each(newObject.dataSources, function(dep) {
    				object.dataSources.push(dep);
    				object.dataSources = _.uniq(object.dataSources);
    			});
    		}

    		if (newObject.jsSnippets) {
    			_.each(newObject.jsSnippets, function(dep) {
    				object.jsSnippets.push(dep);
    				object.jsSnippets = _.uniq(object.jsSnippets);
    			});
    		}
    	}
    	return object;
	},
	snakeToCamel : function(s) {
	    return s.replace(/(\-\w)/g, function(m){return m[1].toUpperCase();});
	},
	camelToSnake : function(str) {
      return str.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
    },
    normalizeAttrValue : function (value) {
    	if (value === '' || value === 'true') {
    		value = true
    	}
    	if (value === 'false') {
    		value = false
    	}
    	return value;
    }
}