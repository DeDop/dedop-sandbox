import threading
import time
import random


class Observer:
    def started(self, observable, total_work_units):
        pass

    def progress(self, observable, work_units):
        pass

    def stopped(self, observable, error):
        pass

    @staticmethod
    def broadcast_started(observers, observable, total_work_units):
        for observer in observers:
            observer.started(observable, total_work_units)

    @staticmethod
    def broadcast_progress(observers, observable, work_units):
        for observer in observers:
            observer.progress(observable, work_units)

    @staticmethod
    def broadcast_stopped(observers, observable, error):
        for observer in observers:
            observer.stopped(observable, error)


# https://docs.python.org/3/library/threading.html
class Job(threading.Thread, Observer):
    ID = 0

    STATE_SCHEDULED = 1
    STATE_RUNNING = 2
    STATE_COMPLETE = 3
    STATE_CANCELLED = 4
    STATE_ERROR = 5

    def __init__(self, job_config):
        Job.ID += 1
        self._id = Job.ID
        super().__init__(name=self._id)
        self._config = job_config
        self._state = Job.STATE_SCHEDULED
        self._observers = []
        self._processor = None

    @property
    def id(self):
        return self._id

    @property
    def state(self):
        return self._state

    @property
    def config(self):
        return self._config

    def add_observer(self, observer):
        self._observers.append(observer)

    def started(self, processor, total_work_units):
        self._state = Job.STATE_RUNNING
        Observer.broadcast_started(self._observers, self, total_work_units)

    def progress(self, processor, work_units):
        Observer.broadcast_progress(self._observers, self, work_units)

    def stopped(self, processor, error):
        if processor.is_cancelled():
            self._state = Job.STATE_CANCELLED
        elif error:
            self._state = Job.STATE_ERROR
        else:
            self._state = Job.STATE_COMPLETE
        Observer.broadcast_stopped(self._observers, self, error)

    def run(self):
        self._processor = Processor(self.config.get('parameters'))
        self._processor.add_observer(self)
        self._processor.run()

    def cancel(self):
        if self._processor:
            self._processor.cancel()

    def is_cancelled(self):
        return self._processor.is_cancelled() if self._processor else False


class Processor:
    def __init__(self, parameters):
        self.file_name = parameters['file_name']
        self.first_rec = parameters.get('first_record', 0)
        self.last_rec = parameters.get('last_record', 1000)
        self.total_work_units = 1 + self.last_rec - self.first_rec
        self.cancellation_requested = False
        self.cancelled = False
        self.observers = []
        pass

    def add_observer(self, observer):
        self.observers.append(observer)

    def run(self):

        Observer.broadcast_started(self.observers, self, self.total_work_units)

        # Introduce a random error every 4th invocation
        error = None
        if random.randint(1, 4) == 1:
            i_err = random.randint(0, self.total_work_units - 1)
        else:
            i_err = -1

        for i in range(self.total_work_units):
            if i == i_err:
                error = 'divison by zero'
                break
            if self.cancellation_requested:
                self.cancelled = True
                break
            time.sleep(1)
            work_units = i + 1
            Observer.broadcast_progress(self.observers, self, work_units)
            print('Done %.2f%%' % ((100.0 * work_units) / self.total_work_units))

        Observer.broadcast_stopped(self.observers, self, error)

    def cancel(self):
        self.cancellation_requested = True

    def is_cancelled(self):
        return self.cancelled
