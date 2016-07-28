{{{license}}}
window.Specless.userJS(window, function (specless, _, extendFrom, factories, ad, $, plugins) {
    (function (requiresList, prerequisites, userJs) {
        var _ = window.Specless.scope()._,
            counter = 1,
            checkFinished = function () {
                counter--;
                if (counter) {
                    return;
                }
                userJs();
            };
        if (requiresList.length && requiresList[0]) {
            counter++;
            ad.requires(requiresList, checkFinished);
        }
        _.each(prerequisites, function (should, key) {
            if (!should) {
                return;
            }
            counter++;
            ad['activate' + _.upCase(key)](checkFinished);
        });
        checkFinished();
    }(
        // don't touch anything above this line
        [{{{cdnscripts}}}], {
            device: true,
            location: true,
            time: true
        }, function () {
            {{{pluginfragments}}}
			//================ Begin User Created JS ==================
			{{{userjs}}}
			//================  End User Created JS  ==================
        }));
});

