# dedop-sandbox

Contains DeDop Experiments and Prototypes:

* ``backend`` -  Hosts the DeDop RESTful API and WebService ``dedopws``, which is implemented as a **Falcon** web app 
  run in a CherryPy web server.
* ``frontend`` -  Hosts DeDop GUI ``dedopgui`` which is implemented as an **electron** Desktop application and depends on 
  a running WebService ``dedopws`` on localhost.

## backend

Build and run

1. Install Python 3.4.
2. Install required libs
```
    $ pip install falcon
    $ pip install CherryPy
```
3. Run
```
    $ cd backend
    $ python setup.py develop
    $ dedopws
```
Read more:

* WSGI, PEP 3333
* Falcon is a ridiculously fast, minimalist Python WSGI web framework for building cloud APIs and app backends.
  See http://falconframework.org/
* CherryPy, a reliable, HTTP/1.1-compliant, WSGI thread-pooled webserver. It's 100% Python, and can even be used by Jython.
  See http://www.cherrypy.org/
* Gunicorn, another popular Python Web Framework. Heavily relies on Unix, no Windows support as of version 19.
  See http://gunicorn.org/

### frontend

Build and run

1. Install Node.js to get node's package manager ``npm``.
2. Globally install electron
```
    $ npm install request-promise -g
    $ npm install electron-prebuilt -g
```
3. Run
```
    $ cd frontend
    $ electron .
```
Read more:

* electron, build cross platform desktop apps with web technologies.
  See http://electron.atom.io/
* Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.
  See https://nodejs.org/en/
* https://www.chromium.org/, https://en.wikipedia.org/wiki/Chromium_%28web_browser%29




### Run with Visual Studio Code

File .vscode/launch.json:

```
/*
 * All debug configs with type "chrome" are based on the "chrome" extension,
 * see https://marketplace.visualstudio.com/items/msjsdiag.debugger-for-chrome
 */
{
    "version": "0.1.0",
    "configurations": [
        {
            "name": "Launch",
            "type": "chrome",
            "request": "launch",
            "runtimeExecutable": "./node_modules/electron-prebuilt/dist/electron.exe",
            "runtimeArgs": ["C:\\Users\\Norman\\CloudStation\\Projects\\electron-app"]
        },
        /*
         * The following configs dont work yet, 
         * see https://github.com/atom/electron/blob/master/docs/tutorial/debugging-main-process.md
         */
        {
            /* Does not work :( */
            "name": "Debug",
            "type": "chrome",
            "request": "launch",
            "runtimeExecutable": "C:\\Users\\Norman\\AppData\\Roaming\\npm\\node_modules\\electron-prebuilt\\dist\\electron.exe",
            "runtimeArgs": ["--debug=9222", "C:\\Users\\Norman\\Desktop\\electron-app"]
        },
        {
            /* Does not work :( */
            "name": "Attach",
            "type": "chrome",
            "request": "attach",
            "port": 9222
        }

    ]
}
```


