"""Run with Python 3: python3 waiters.py. All HTTP traffic stays on loopback."""
from concurrent.futures import Future, ThreadPoolExecutor, TimeoutError
from contextlib import ExitStack, contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from queue import Queue
from threading import Event, Lock, Thread
from urllib.error import HTTPError
from urllib.request import urlopen


@contextmanager
def serve(get):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            status, text = get(self.path)
            body = text.encode()
            self.send_response(status)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *args):
            pass

    with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
        thread = Thread(target=server.serve_forever, kwargs={"poll_interval": 0.05})
        thread.start()
        try:
            yield "http://127.0.0.1:" + str(server.server_port)
        finally:
            server.shutdown()
            thread.join()


def request(url):
    try:
        with urlopen(url, timeout=8) as response:
            return response.status, response.read().decode()
    except HTTPError as error:
        with error:
            return error.code, error.read().decode()


class MapService:
    def __init__(self, origin, workers, joined):
        self.origin = origin
        self.workers = workers
        self.joined = joined
        self.lock = Lock()
        self.pending = {}

    def fill(self, lot, result):
        try:
            response = request(self.origin + "/" + lot)
        except Exception as error:
            with self.lock:
                del self.pending[lot]
                result.set_exception(error)
        else:
            with self.lock:
                del self.pending[lot]
                result.set_result(response)

    def get(self, path):
        lot, budget = path.strip("/").split("/")
        with self.lock:
            result = self.pending.get(lot)
            if result is None:
                result = Future()
                self.pending[lot] = result
                self.workers.submit(self.fill, lot, result)
        self.joined.put(lot)
        try:
            return result.result(timeout=0.4 if budget == "short" else 6)
        except TimeoutError:
            return 504, "caller deadline"


def experiment(split):
    release_origin = Event()
    origin_calls = Queue()
    joined = Queue()

    def origin(path):
        origin_calls.put(path)
        if not release_origin.wait(6):
            return 503, "fixture deadline"
        return 200, path.strip("/") + " map"

    with ExitStack() as stack:
        storage = stack.enter_context(serve(origin))
        workers = stack.enter_context(ThreadPoolExecutor(max_workers=4))
        first = stack.enter_context(serve(MapService(storage, workers, joined).get))
        second = (stack.enter_context(serve(MapService(storage, workers, joined).get))
                  if split else first)
        callers = stack.enter_context(ThreadPoolExecutor(max_workers=2))
        try:
            short = callers.submit(request, first + "/west/short")
            assert joined.get(timeout=4) == "west"
            long = callers.submit(request, second + "/west/long")
            assert joined.get(timeout=4) == "west"
            expected = 2 if split else 1
            for _ in range(expected):
                assert origin_calls.get(timeout=4) == "/west"
            assert short.result(timeout=4) == (504, "caller deadline")
            assert not long.done()
        finally:
            release_origin.set()
        assert long.result(timeout=4) == (200, "west map")
        assert origin_calls.empty()

        # There is no completed-answer cache. Another request starts another read.
        assert request(second + "/west/long") == (200, "west map")
        assert origin_calls.get(timeout=4) == "/west"
        assert origin_calls.empty()
        return expected


if __name__ == "__main__":
    for split in (False, True):
        calls = experiment(split)
        scope = "two instances" if split else "one instance"
        print(f"{scope}: short=504, long=200, origin reads during overlap={calls}, later read=200")
