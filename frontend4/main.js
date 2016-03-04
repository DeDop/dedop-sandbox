// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: 'lib',
    paths: {
        app: '../app',
        datamgr: '../app/datamgr',
        confmgr: '../app/confmgr',
        procmgr: '../app/procmgr',
        analysis: '../app/analysis',
        code: '../app/code',
        jquery: 'jquery-2.2.1',
        w2ui: 'w2ui/w2ui-1.4.3'
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs([
        'app/app',
        'datamgr/datamgr',
        'confmgr/confmgr',
        'procmgr/procmgr',
        'analysis/analysis',
        'code/code'
    ],
    function (app) {
        app.initialize();
    }
);