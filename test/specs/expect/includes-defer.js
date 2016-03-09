riot.tag2('includes-defer', '<p onclick="{click}"></p> <script src="riotjs.object.js"></script> <script src="../expect/riotjs.method.js"></script>', '', '', function(opts) {

    this.click = function (e)
    {foo ({})}.bind(this)
});
