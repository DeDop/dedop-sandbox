
## Base Technologies

1.	HTML
2.	CSS
3.	JavaScript

## Frameworks and Libraries

* Electron
* node.js
* npm - Maven
* requireJS
* jQuery
* Bootstrap
* Less & Sass


## Related, not tested

* Bower - Maven
* Grunt - Ant
* underscore

## UI Libraries

* Photon: CSS library, limited functionality, made for electron, very MacOS-ish
* Kendo UI: Professional, jQuery-based JS library, core is open source, important components are commercial
* jQuery UI: Professional JS library, default looks outdated and well known, no tables and tree views

## Earth & Maps

* Cesium
* Web World Wind


## Plotting & Charting

* Plotly: based on D3, also has 3D plots, veeery large lib
* Flot: Simple and easy-to-use line plots, lightweight


## IDEs / Editors

*	Visual Studio Code
*	Atom



## Web servers

Jupyter uses Tornado web server

* http://www.tornadoweb.org/en/stable/index.html

Running WSGI apps on Tornado servers (e.g. Falcon):

* http://www.tornadoweb.org/en/stable/wsgi.html

Benchmarks

* http://nichol.as/benchmark-of-python-web-servers
* http://klen.github.io/py-frameworks-bench/


# IPython / Jupyter

IPython configuration:

* http://ipython.readthedocs.org/en/stable/config/intro.html

IPython kernel options:

* http://ipython.readthedocs.org/en/stable/config/options/kernel.html


Useful commands:

* ipython notebook --config .\jupyter_notebook_config.py
* ipython --ipython-dir=.ipython --init notebook


Start GUI from IPython:

    import dedopws.main
    dedopws.main.launch_gui('../frontend', 'D:/EOData/DeDop/L1A')

