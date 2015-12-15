import json
import sys

import cherrypy
import falcon

from dedopws.processor import Job

JOBS = {}


def get_job_key(file_name, num_recs):
    return file_name + '_' + str(num_recs)


class JobResource:
    def on_get(self, req, resp, file_name, num_recs):
        num_recs = int(num_recs)
        key = get_job_key(file_name, num_recs)
        job = JOBS.get(key)
        if not job:
            job_config = {
                "parameters": {
                    "file_name": file_name,
                    "first_record": 0,
                    "last_record": num_recs - 1,
                }
            }
            job = Job(job_config)
            JOBS[key] = job
            job.start()

        resp_data = {
            'name': job.name,
            'state': job.state,
            'config': job.config
        }

        resp.body = json.dumps(resp_data)


class JobCancellation:
    def on_get(self, req, resp, file_name, num_recs):
        num_recs = int(num_recs)
        key = get_job_key(file_name, num_recs)
        job = JOBS.get(key)
        cancelled = False
        if job:
            job.cancel()
            cancelled = job.is_cancelled()

        resp_data = {
            'cancelled': cancelled,
        }

        resp.body = json.dumps(resp_data)


def main(args):
    # Create instance of our DeDop RESTful API called 'api', which is a WSGI application instance.
    api = falcon.API()
    api.add_route('/job/{file_name}/{num_recs}', JobResource())
    api.add_route('/job/{file_name}/{num_recs}/cancel', JobCancellation())

    # Start a web server with our WSGI application. We use CherryPy here.
    # See docs.cherrypy.org/en/latest/advanced.html?host-a-foreign-wsgi-application-in-cherrypy#host-a-foreign-wsgi-application-in-cherrypy
    cherrypy.tree.graft(api, '/')
    cherrypy.engine.start()
    cherrypy.engine.block()


if __name__ == '__main__':
    main(sys.argv)
