define(['require', 'jquery'], 
function(require, $) {

    var app = {};

    //app.currentScreenId = null;
    //app.loadedScreens = {};

    app.selectScreen = function (screenId) {
        var selectorElement = $('.left-selection').detach();
        selectorElement.appendTo($('#' + screenId));
        $('#editor-panel').load('app/' + screenId + '/' + screenId + '.html');
        /*
        var newScreenElement;
        var oldScreenElement = $('#editor-panel');
        if (screenId in loadedScreens) {
            newScreenElement = loadedScreens[screenId];
            $('#editor-panel').prepend();
        } else {
            $('#editor-panel').load('app/' + screenId + '/' + screenId + '.html');
            var newScreenElement = $('#editor-panel');
        }
        if (this.currentScreenId != null) {
            this.loadedScreens[this.currentScreenId] = oldContent;
        }
        */
    };

    app.addScreen = function (screenId) {
        $('#' + screenId).click(function() {
            app.selectScreen(screenId);
        });
    };

    app.initialize = function () {
        console.log('App initialized.');
    };

    $(function () {
        document.body.onresize = function () {
            var elem = document.getElementById("resize-label");
            elem.innerHTML = "(" + elem.clientWidth + "," + elem.clientHeight + ")";
        };

        app.addScreen('datamgr');
        app.addScreen('confmgr');
        app.addScreen('procmgr');
        app.addScreen('analysis');
        app.addScreen('code');
        $('#datamgr').click();
    });
        
    return app;
});
