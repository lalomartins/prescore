# PreScore

Compile [underscore](http://underscorejs.org/) templates into joined amd files.

For now there's only one mode of operation: look for all `.html` file under the input paths, and write a single `.js` file with all the joined amd `define()s`. The last positional argument is assumed to be the output file; the path is assumed to exist.

Options:

`--prefix`: use this prefix for the module names. E.g. if your input path is `foo/bar/templates` and you have a file `entry.html`, by default that will define a module `define('entry', function()…)`, which is probably not what you want. You can pass a prefix argument `--prefix=templates/`, which then gets `define('templates/entry', function()…)`.

`--require`: require the named module. It will be stored in a variable of the same name, with any non-alphanumeric characters replaced by `__`. You can use those in your template (via closure), or in conjunction with `--store`. Can be specified multiple times.

`--store`: in addition to returning the template function from each module definition, also store them in the namespace provided in this argument. The top-level global needs to preexist; any additional sub-objects will be created if undefined. We use this in Backbone views to detect whether or not a template was precompiled, by builing with `--store=_.template.precompiled`, so the view can then do `this.template = _.template.precompiled[this.$el.selector.substr(3)] || _.template($(this.$el.selector + '_template').html());`. It's not pretty, but it's a viable migration strategy.

This script does no optimization or minification. You'll probably want to join it with other scripts in your app anyway, so we figured that would be redundant.
