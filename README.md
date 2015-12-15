# dedop-sandbox

Contains DeDop Experiments and Prototypes:

* ``backend`` -  Hosts the DeDop RESTful API and WebService ``dedopws``, which is implemented as a **Falcon** web app 
  run in a CherryPy web server.
* ``frontend`` -  Hosts DeDop GUI ``dedopgui`` which is implemented as an **electron** Desktop application and depends on 
  a running WebService ``dedopws`` on localhost.

## Setup Development

### backend

The backend hosts the DeDeop  implemented 
Install Python 3.4. Then

	> cd backend
    > pip install falcon
    > pip install CherryPy
	> python setup.py develop
	> dedopws

### frontend

Install ``node.js`` to get the node package manager ``npm``. Then

	> cd frontend
	> npm install electron-prebuilt -g
	> electron .

## Read more

* WSGI, PEP 3333  
* Falcon is a ridiculously fast, minimalist Python WSGI web framework for building cloud APIs and app backends.
  See http://falconframework.org/
* CherryPy, a reliable, HTTP/1.1-compliant, WSGI thread-pooled webserver. It's 100% Python, and can even be used by Jython.
  See http://www.cherrypy.org/
* Gunicorn, another popular Python Web Framework. Heavily relies on Unix, no Windows support as of version 19.
  See http://gunicorn.org/
