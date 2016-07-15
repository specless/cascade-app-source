{{{license}}}
{{#if cdnscripts}}
ad.requires([{{{cdnscripts}}}], function() {
{{/if}}
	{{{dependencies}}}
	{{{plugins}}}
	window.Specless.userJS(window, function (specless, _, extendFrom, factories, ad, $, plugins) {
		{{{pluginfragments}}}
		//================ Begin User Created JS ==================
		{{{userjs}}}
		//================  End User Created JS  ==================
	});
{{#if cdnscripts}}
});
{{/if}}