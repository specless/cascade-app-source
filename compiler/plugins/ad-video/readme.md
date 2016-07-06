# Cascade Plugin Template

## package.json
- `name`: Give your plugin a name.
- `version`: Give your plugin a version. 
- `specless-cascade-plugin`: This is where you configure your plugin

### `specless-cascade-plugin` Configuration Object
- `triggers`: An array of objects containing the various triggers that cause a transformation script to run. 

### Trigger Configuration Object

####`type`

Can be `element` or `attribute`. This defines if it will be the use of a specific HTML element or a specific HTML attribute that will trigger the transformation script to run.

####`name`
Can be any string consisting of just `a-z` and `-`. No special characters, no numbers. This defines the name of the html element or attribute that will trigger the transformation script to run. For example, a trigger with `"type" : "attribute"` and `"name" : "foo-bar"` will trigger when the HTML attribute `ad-foo-bar` is used in your HTML. Along the same lines, if `type` was set to `element` use of the `<ad-foo-bar>` element would trigger.

####`transformScript`
This is a string that defines the node module that will run and transform the HTML. 

####`dependencies`
An object that defines the javascript and css dependencies that will be required by the ad when the element or attribute is present. Example:
```
{
	"css" : ["styles/main.css", "styles/theme.css"],
	"js" : ["jquery", "scripts/main.js"]
}
```
Each item in the above arrays should be a path relative to the `package.json` file. In addition, javascript dependencies can include white listed dependencies and Specless hosted dependencies.

####`psuedoElements`
An array of objects containing the `name` that will be used in the user's CSS and the `selector` string that use of that name in the user CSS will compile to. Example:
```
"psuedoElements": [
	{
		"name": "close-button",
        "selector": "[data-element='close-button']"
	}
]
```
The above would basically says if the attribute or element defined by the trigger is used in the ad's HTML, then when the CSS compiles, use of the selector `::--ad-close-button` would compile into the selector `[data-element='close-button']`.

####`psuedoStates`
Same as `psuedoElements` but uses the syntax for states. For example, a similar example from above, would compile `:--ad-close-state` to `"[data-current-state='the-state']"`.

####`properties`
Similar to `psuedoStates` and `psuedoElements`, but instead of representing a selector, the property serves as an alias for a SCSS-style mixin. 
```
"properties": [
	{
		"name": "close-button-color",
		"mixinName": "ad-component-close-button-color"
	}
]
```
The above example would compile from this:
```
.element {
	--ad-close-button-color: #ffffff;
}
```
to this:
```
.element {
	@include ad-component-close-button-color(#ffffff);
}
```
...which would then compile into whatever css the mixin defined.
NOTE: The mixin must be declared in the css listed in the dependencies of the trigger.

####`tag`
Only used if the `type` is set to `element`. This is the type of tag that the custom HTML element will compile into. Default is `div`. 

####`newName`
Only used by attributes. Defines the attribute name that will appear in the compiled HTML. For example. an attribute trigger with a `name` of `foo` and a `newName` of `bar`, would compile the `ad-foo` attribute into `data-bar`.

## Transform Script
```
module.exports = function (element, utils, _) {
	// Do stuff to transform the element object here, then return the element object below. 
	return element
}
```

### `element`
```
{
	options: attr.options, // 
	jsSnippets : [], //  List of valid javascript (as a string) that will get appended to the user.js
	jsDependencies : [], // List of js files to include/require when compiling the ad.
	cssDependencies : [], // List of css files to include when compiling the ad.
	node: node   // A node representing the html element.
}
```
Modify the `element` argument that is passed in as the above object.

### `utils`
Simple API to get information about an ad. 

- `utils.currentProject()`: Returns the path to the current project. 
- `utils.get(type)`: Returns either the project settings object or the cascade settings object. `type` can be either `'projectSettings'` or `'cascadeSettings'`.
- `utils.sendMessage(message, details, code)`: Sends a message to the cascade desktop app. Can be used for error handling. 

###`_`
Underscore to help with stuff.

