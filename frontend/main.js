'use strict';

const electron = require('electron');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
// see https://www.npmjs.com/package/request-promise
const rp = require('request-promise');
const menuTempl = require('./menu-templ.js');

const app = electron.app;  // Module to control application life.
const dialog = electron.dialog;
const Menu = electron.Menu;
const Tray = electron.Tray;
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.


// Report crashes to our server.
electron.crashReporter.start({companyName: 'Brockmann Consult GmbH'});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var appWindow = null;
var appTray = null;
var appServerStarted = false;

app.openDirectory = function (window) {
    var dirPaths = dialog.showOpenDialog(window, {
        title: 'Open L1A Directory',
        defaultPath: app.preferences.lastDir | null,
        properties: ['openFile', 'openDirectory']
    });
    if (dirPaths && dirPaths.length > 0) {
        var dirPath = dirPaths[0];
        // todo - use dirPath here...
        app.preferences.lastDir = dirPath;
        console.log('Selected directory: ' + app.preferences.lastDir);
    }
};

app.openPreferencesWindow = (function () {
    var preferencesWindow = null;
    return function () {
        if (!preferencesWindow) {
            preferencesWindow = new BrowserWindow({
                title: app.getName() + " User Preferences",
                icon: getAppIconPath(),
                width: 400,
                height: 300,
                alwaysOnTop: true,
                autoHideMenuBar: true
            });
            preferencesWindow.loadURL(`file://${__dirname}/preferences.html`);
            preferencesWindow.on('close', function (event) {
                // Use event.preventDefault() to prevent closing the window
            });
            preferencesWindow.on('closed', function () {
                preferencesWindow = null;
            });
            console.log(`preferencesWindow.id: ${preferencesWindow.id}`);
        }

        preferencesWindow.center();
        preferencesWindow.show();
    }
}());

var appConfigPath = path.join(app.getAppPath(), 'dedop-config.json');
if (!fs.existsSync(appConfigPath)) {
    console.error(`missing file: ${appConfigPath}`);
    app.quit();
}
console.log(`Loading configuration from ${appConfigPath}`);
const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
console.log(`serverAddress: ${appConfig.serverAddress}`);
console.log(`serverScript: ${appConfig.serverScript}`);
console.log(`serverArgs: ${appConfig.serverArgs}`);

app.preferencesFile = path.join(app.getPath('userData'), 'preferences.json');
app.preferences = {};
if (fs.existsSync(app.preferencesFile)) {
    console.log(`Loading preferences from ${app.preferencesFile}`);
    app.preferences = JSON.parse(fs.readFileSync(app.preferencesFile, 'utf8'));
}

var appMenu = Menu.buildFromTemplate(menuTempl.create());
Menu.setApplicationMenu(appMenu);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('will-quit', function (event) {
    console.log("Event: will-quit: " + event);
    rp(appConfig.serverAddress + 'exit/0')
        .then(function (response) {
            console.log('server stopped: ' + response);
        })
        .catch(function (error) {
            console.log('failed to stop server (error: ' + error + ')');
        });
});

function getAppIconPath() {
    return `${__dirname}/images/dedop.png`;
}

var splashScreen = null;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
    splashScreen = new BrowserWindow({
        icon: getAppIconPath(),
        type: 'splash',
        center: true,
        width: 530,
        height: 530,
        useContentSize: false,
        transparent: true,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        frame: false,
        alwaysOnTop: true,
    });
    splashScreen.loadURL(`file://${__dirname}/splash.html`);
    //splashScreen.webContents.openDevTools();

    var config = {};
    config.expectServer = false;
    config.arguments = [];
    for (var i in process.argv) {
        var arg = process.argv[i];
        console.log("process.argv[" + i + "] = " + arg);
        if (i >= 2) {
            if (arg.startsWith('-')) {
                if (arg === '--expect-server') {
                    config.expectServer = true;
                } else {
                    console.error('Unexpected command-line option: ' + arg);
                }
            } else {
                config.arguments.push(arg);
            }
        }
    }

    appServerStarted = config.expectServer;

    function startAppServer() {
        // see https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
        var server = child_process.spawn(appConfig.serverScript, appConfig.serverArgs, [0, 1, 2]);

        server.stdout.on('data', function (data) {
            console.log(`server: ${data}`);
        });

        server.stderr.on('data', function (data) {
            console.log(`server: ${data}`);
        });

        server.on('close', function (code) {
            console.log(`server exited with code ${code}`);
        });

        server.on('error', function (err) {
            console.log('failed to start server: ' + err);
        });
    }

    function openWindow() {
        appTray = new Tray(getAppIconPath());
        appTray.setToolTip(app.getName());
        appTray.setContextMenu(Menu.buildFromTemplate([
            {
                label: 'Preferences...',
                click: function (item, window) {
                    app.openPreferencesWindow(window);
                }
            }
        ]));

        var windowX, windowY, windowWidth, windowHeight;
        if (app.preferences.windowBounds) {
            windowX = app.preferences.windowBounds.x;
            windowY = app.preferences.windowBounds.y;
            windowWidth = app.preferences.windowBounds.width;
            windowHeight = app.preferences.windowBounds.height;
        }

        // Create the browser window.
        appWindow = new BrowserWindow({
            title: app.getName() + ' ' + app.getVersion(),
            icon: getAppIconPath(),
            x: windowX | undefined,
            y: windowY | undefined,
            width: windowWidth | 1000,
            height: windowHeight | 800,
            show: false
        });

        // and load the index.html of the app.
        appWindow.loadURL(`file://${__dirname}/index.html`);

        if (appConfig.openDevTools) {
            // Open the DevTools.
            appWindow.webContents.openDevTools();
        }

        // Emitted when the window leaves full screen state.
        appWindow.on('leave-full-screen', function () {
            appTray.displayBalloon({title: 'Hey, hey!', content: 'You\'ve left the cool full-screen mode.'});
        });

        appWindow.on('close', function (event) {
            // Use event.preventDefault() to prevent actually closing the window
            if (!appWindow.isFullScreen()) {
                app.preferences.windowBounds = appWindow.getBounds();
            }
            console.log(`Storing preferences in ${app.preferencesFile}`);
            var appPrefsText = JSON.stringify(app.preferences, null, 4);
            console.log(`Preferences: ${appPrefsText}`);
            fs.writeFileSync(app.preferencesFile, appPrefsText);
        });

        // Emitted when the window is closed.
        appWindow.on('closed', function () {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            appWindow = null;
            appTray = null;
        });

        appWindow.on('show', function () {
            console.log('Jetzt ist show time!');
            if (splashScreen != null) {
                // Close splash only after main window is shown.
                splashScreen.destroy();
                splashScreen = null;
            }
        });

        appWindow.show();
    }

    function openWindowAfterAppServerStarted() {
        rp(appConfig.serverAddress + 'info')
            .then(function (response) {
                openWindow();
                console.log('server running: ' + response);
            })
            .catch(function (error) {
                if (!appServerStarted) {
                    console.log('starting server...');
                    startAppServer();
                    appServerStarted = true;
                } else {
                    console.log('waiting for server... (got error: ' + error + ')');
                    console.log(error.stack.split('\n'))
                }
                setTimeout(openWindowAfterAppServerStarted, 500);
            });
    }

    console.log('startUp...');
    openWindowAfterAppServerStarted();
    //setTimeout(openWindowAfterAppServerStarted, 1500);
});