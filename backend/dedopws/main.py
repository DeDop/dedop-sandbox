import base64
import json
import os
import sys

import cherrypy
import falcon
import h5py
import numpy

from dedopws.processor import Job

__version__ = '0.0.1'

DATA_ROOT = None
JOBS = {}
DATASETS = {}


# see http://stackoverflow.com/questions/3488934/simplejson-and-numpy-array/
class Base64NumpyAwareJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        """
        If input object is an ndarray it will be converted into a dict
        holding dtype, shape and the data, base64 encoded.
        """
        if isinstance(obj, numpy.ndarray):
            if obj.flags['C_CONTIGUOUS']:
                obj_data = obj.data
            else:
                cont_obj = numpy.ascontiguousarray(obj)
                assert (cont_obj.flags['C_CONTIGUOUS'])
                obj_data = cont_obj.data
            data_b64 = base64.b64encode(obj_data)
            return dict(data=data_b64.decode('unicode_escape'),
                        dtype=str(obj.dtype),
                        shape=obj.shape)
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)


class SimpleNumpyAwareJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, numpy.ndarray):
            if obj.ndim == 1:
                return obj.tolist()
            else:
                return [self.default(obj[i]) for i in range(obj.shape[0])]
        return json.JSONEncoder.default(self, obj)


def json_numpy_object_hook(dct):
    """
    Decodes a previously encoded numpy ndarray with proper shape and dtype.
    :param dct: (dict) JSON-encoded ndarray
    :return: (ndarray) if input was an encoded ndarray, else the unchanged dct
    """
    if isinstance(dct, dict) and 'data' in dct and 'dtype' in dct and 'shape' in dct:
        data = base64.b64decode(dct['data'])
        return numpy.frombuffer(data, dct['dtype']).reshape(dct['shape'])
    return dct


def _get_dataset(file_name):
    file_path = os.path.join(DATA_ROOT, file_name)
    if file_name in DATASETS:
        dataset = DATASETS[file_name]
    else:
        dataset = h5py.File(file_path, 'r')
        DATASETS[file_name] = dataset
    return dataset


def _to_unicode(data):
    return data.decode('unicode_escape') if data else None


def _to_float(data):
    try:
        return float(data)
    except:
        return None


def get_job_key(file_name, num_recs):
    return file_name + '_' + str(num_recs)


class CrossDomain(object):
    def process_response(self, req, resp, resource):
        resp.set_header('Access-Control-Allow-Origin', '*')


class GeoLoc:
    def on_get(self, req, resp, file_name):
        dataset = _get_dataset(file_name)
        lat = dataset['latitude_ku'][:]
        lon = dataset['longitude_ku'][:]
        scale_factor = 1.0e-7
        lon180 = int(180 / scale_factor)
        lon360 = int(360 / scale_factor)
        lon[lon > lon180] -= lon360
        geo_data = numpy.column_stack((lat * scale_factor, lon * scale_factor))
        resp.data = json.dumps(geo_data, cls=SimpleNumpyAwareJSONEncoder)
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


class MagnitudeAt:
    def on_get(self, req, resp, file_name, rec_index):
        rec_index = int(rec_index)
        dataset = _get_dataset(file_name)
        i_samples_ku = dataset['i_samples_ku'][rec_index, :]
        i_scale_factor_ku = dataset['i_scale_factor_ku'][rec_index, :]
        q_samples_ku = dataset['q_samples_ku'][rec_index, :]
        q_scale_factor_ku = dataset['q_scale_factor_ku'][rec_index, :]
        data = i_samples_ku.astype('float64')
        for i in range(len(i_scale_factor_ku)):
            i_comp = 1e-8 * i_samples_ku[i] / i_scale_factor_ku[i]
            q_comp = 1e-8 * q_samples_ku[i] / q_scale_factor_ku[i]
            data[i] = numpy.sqrt(i_comp * i_comp + q_comp * q_comp)
        resp.data = json.dumps(data, cls=SimpleNumpyAwareJSONEncoder)
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


class ArrayData:
    def on_get(self, req, resp, file_name, variable_name):
        dataset = _get_dataset(file_name)
        variable = dataset[variable_name]
        array = variable[:]
        resp.data = json.dumps(array, cls=SimpleNumpyAwareJSONEncoder)
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


class ArrayDataAt:
    def on_get(self, req, resp, file_name, variable_name, index):
        dataset = _get_dataset(file_name)
        variable = dataset[variable_name]
        array = variable[int(index)]
        resp.data = json.dumps(array, cls=SimpleNumpyAwareJSONEncoder)
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


class ListFiles:
    def on_get(self, req, resp):
        resp.body = json.dumps(os.listdir(DATA_ROOT))
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


def _get_variable_info(variable):
    return {
        'name': variable.name,
        'dtype': str(variable.dtype),
        'ndim': len(variable.dims),
        'shape': variable.shape,
        # 'dimensions': variable.dimensions,
        'fill_value': repr(variable.fillvalue),
        'add_offset': _to_float(variable.attrs.get('add_offset')),
        'scale_factor': _to_float(variable.attrs.get('scale_factor')),
        'long_name': _to_unicode(variable.attrs.get('long_name')),
        'units': _to_unicode(variable.attrs.get('units')),
        'comment': _to_unicode(variable.attrs.get('comment')),
    }


class Variables:
    def on_get(self, req, resp, file_name):
        dataset = _get_dataset(file_name)
        resp_data = {}
        for key in dataset.keys():
            variable = dataset[key]
            resp_data[key] = _get_variable_info(variable)
        resp.body = json.dumps(resp_data)
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


class VariableInfo:
    def on_get(self, req, resp, file_name, variable_name):
        dataset = _get_dataset(file_name)
        variable = dataset[variable_name]
        resp.body = json.dumps(_get_variable_info(variable))
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


class VariableNames:
    def on_get(self, req, resp, file_name):
        dataset = _get_dataset(file_name)
        resp.body = json.dumps([key for key in dataset.keys()])
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


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
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


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
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


class Exit:
    def on_get(self, req, resp, exit_code):
        resp.body = json.dumps(True)
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200
        # cherrypy.engine.exit()
        sys.exit(int(exit_code))


class Info:
    def on_get(self, req, resp):
        resp.body = json.dumps({
            'name': __name__,
            'file': __file__,
            'version': __version__,
        })
        resp.content_type = 'application/json'
        resp.status = falcon.HTTP_200


def serve_forever(data_dir, blocking=True):
    global DATA_ROOT
    DATA_ROOT = data_dir
    print('DATA_ROOT = %s' % DATA_ROOT)

    # Create instance of our DeDop RESTful API called 'api', which is a WSGI application instance.
    api = falcon.API(middleware=[CrossDomain()])
    api.add_route('/job/{file_name}/{num_recs}', JobResource())
    api.add_route('/job/{file_name}/{num_recs}/cancel', JobCancellation())
    api.add_route('/list', ListFiles())
    api.add_route('/varnames/{file_name}', VariableNames())
    api.add_route('/variables/{file_name}', Variables())
    api.add_route('/varinfo/{file_name}/{variable_name}', VariableInfo())
    api.add_route('/data/{file_name}/{variable_name}', ArrayData())
    api.add_route('/data/{file_name}/{variable_name}/{index}', ArrayDataAt())
    api.add_route('/mag/{file_name}/{rec_index}', MagnitudeAt())
    api.add_route('/geoloc/{file_name}', GeoLoc())
    api.add_route('/exit/{exit_code}', Exit())
    api.add_route('/info', Info())

    # Start a web server with our WSGI application. We use CherryPy here.
    # See docs.cherrypy.org/en/latest/advanced.html?host-a-foreign-wsgi-application-in-cherrypy#host-a-foreign-wsgi-application-in-cherrypy
    cherrypy.tree.graft(api, '/')
    cherrypy.engine.start()
    if blocking:
        cherrypy.engine.block()


def launch_gui(app_dir='.', data_dir=None):
    import subprocess
    import os
    serve_forever(data_dir, blocking=False)
    electron_executable = os.path.join(os.path.normpath(app_dir),
                                       'node_modules', 'electron-prebuilt', 'dist', 'electron.exe')
    print('electron_executable = %s' % electron_executable)
    print('app_dir = %s' % app_dir)
    with open('electron.log', 'w') as f:
        subprocess.Popen([electron_executable, app_dir, '--expect-server'], stdout=f, stderr=f)


def main(args=sys.argv):
    serve_forever(args[1])


if __name__ == '__main__':
    main()
