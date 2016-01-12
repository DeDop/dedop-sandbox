'use strict';

const electron = require('electron');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
// see https://www.npmjs.com/package/request-promise
const rp = require('request-promise');

const app = electron.app;  // Module to control application life.
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const Tray = electron.Tray;
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.

// Report crashes to our server.
electron.crashReporter.start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var appWindow = null;
var appTray = null;


var userDataDir = app.getPath('userData');
console.log(`userDataDir: ${userDataDir}`);

var appPath = app.getAppPath();
console.log(`appPath: ${appPath}`);

var appConfigPath = path.join(appPath, 'dedop-config.json');
if (!fs.existsSync(appConfigPath)) {
    console.error(`missing file: ${appConfigPath}`);
    app.quit();
}

const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
console.log(`serverAddress: ${appConfig.serverAddress}`);
console.log(`serverScript: ${appConfig.serverScript}`);
console.log(`serverArgs: ${appConfig.serverArgs}`);

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {

    function startServer() {
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
        appTray = new Tray('images/dedop.png');
        appTray.setToolTip('This is my application.');
        appTray.setContextMenu(Menu.buildFromTemplate([
            {label: 'Item1', type: 'radio'},
            {label: 'Item2', type: 'radio'},
            {label: 'Item3', type: 'radio', checked: true},
            {label: 'Item4', type: 'radio'}
        ]));

        // Create the browser window.
        appWindow = new BrowserWindow({
            title: 'DeDop',
            icon: 'images/dedop.png',
            width: 800, height: 600
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

        // Emitted when the window is closed.
        appWindow.on('closed', function () {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            appWindow = null;
            appTray = null;
        });
    }

     function openWindowAfterServerStarted() {
        rp(appConfig.serverAddress + "info")
            .then(function (response) {
                console.log('server started: ' + response);
                openWindow();
            })
            .catch(function (error) {
                console.log('waiting for the server to start... (error: ' + error + ')');
                openWindowAfterServerStarted();
            });
    }

    console.log('startUp...');
    startServer();
    openWindowAfterServerStarted();
});