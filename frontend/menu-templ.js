var electron = require('electron');

function ifDarwinOrElse(darwinValue, elseValue) {
    if (process.platform == 'darwin')
        return darwinValue;
    else
        return elseValue;
}

exports.create = function () {
    var template = [
        {
            /* index: 0 */
            label: 'File',
            submenu: [
                {
                    label: 'Open Directory',
                    click: electron.app.openDirectory
                }
            ]
        },
        {
            /* index: 1 */
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    role: 'undo'
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectall'
                },
            ]
        },
        {
            /* index: 2 */
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: function (item, window) {
                        if (window)
                            window.reload();
                    }
                },
                {
                    label: 'Toggle Full Screen',
                    accelerator: ifDarwinOrElse('Ctrl+Command+F', 'F11'),
                    click: function (item, window) {
                        if (window)
                            window.setFullScreen(!window.isFullScreen());
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: ifDarwinOrElse('Alt+Command+I', 'Ctrl+Shift+I'),
                    click: function (item, window) {
                        if (window)
                            window.toggleDevTools();
                    }
                },
            ]
        },
        {
            /* index: 3 */
            label: 'Window',
            role: 'window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+M',
                    role: 'minimize'
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    role: 'close'
                },
            ]
        },
        {
            /* index: 4 */
            label: 'Help',
            role: 'help',
            submenu: [
                {
                    label: 'Home',
                    click: function () {
                        electron.shell.openExternal('http://www.dedop.org')
                    }
                },
                {
                    label: 'Code',
                    click: function () {
                        electron.shell.openExternal('https://github.com/DeDop')
                    }
                },
            ]
        },
    ];

    if (process.platform == 'darwin') {

        // Extend Windows menu
        var windowMenu = template[3];
        windowMenu.submenu.push(
            {
                type: 'separator'
            },
            {
                label: 'Bring All to Front',
                role: 'front'
            }
        );

        // Insert Application menu
        template.unshift({
            label: name,
            submenu: [
                {
                    label: 'About ' + electron.app.getName(),
                    role: 'about'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Preferences...',
                    accelerator: 'Command+,',
                    click: electron.app.openPreferencesWindow
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Services',
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Hide ' + electron.app.getName(),
                    accelerator: 'Command+H',
                    role: 'hide'
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    role: 'hideothers'
                },
                {
                    label: 'Show All',
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit ' + electron.app.getName(),
                    accelerator: 'Command+Q',
                    click: function () {
                        electron.app.quit();
                    }
                },
            ]
        });
    } else {
        // Extend File menu
        var fileMenu = template[0];
        fileMenu.submenu.push(
            {
                type: 'separator'
            },
            {
                label: 'Preferences...',
                click: electron.app.openPreferencesWindow
            },
            {
                type: 'separator'
            },
            {
                label: 'Exit',
                click: function () {
                    electron.app.quit();
                }
            }
        );

        // Extend Help menu
        var helpMenu = template[4];
        helpMenu.submenu.push(
            {
                type: 'separator'
            },
            {
                label: 'About...',
                click: function() {}
            }
        );
    }

    return template;
}