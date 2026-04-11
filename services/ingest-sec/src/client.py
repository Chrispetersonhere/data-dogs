from __future__ import annotations

import json
import math
import socket
import threading
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from time import monotonic, sleep
from typing import Callable, Mapping

from .config import SECClientConfig
from .logging import get_structured_logger


@dataclass(frozen=True)
class SECResponse:
    url: str
    status_code: int
    headers: Mapping[str, str]
    content: bytes


class SECClientError(RuntimeError):
    pass


class SECClientTimeoutError(SECClientError):
    pass


class SECClientHTTPError(SECClientError):
    def __init__(self, status_code: int, url: str, body: bytes = b"") -> None:
        self.status_code = status_code
        self.url = url
        self.body = body
        super().__init__(f"SEC request failed with status {status_code} for {url}")


Transport = Callable[[str, Mapping[str, str], float], SECResponse]


class SECClient:
    def __init__(
        self,
        config: SECClientConfig,
        transport: Transport | None = None,
        now_fn: Callable[[], float] = monotonic,
        sleep_fn: Callable[[float], None] = sleep,
    ) -> None:
        config.validate()
        self._config = config
        self._transport = transport or self._default_transport
        self._now_fn = now_fn
        self._sleep_fn = sleep_fn
        self._logger = get_structured_logger("ingest_sec.client")

        self._min_interval_seconds = 1.0 / config.requests_per_second
        self._rate_lock = threading.Lock()
        self._next_allowed_time = 0.0

    def get(self, url: str, params: Mapping[str, str] | None = None) -> SECResponse:
        if not url.strip():
            raise ValueError("url must be non-empty")
        request_url = self._build_url(url, params)
        attempt = 0

        while attempt <= self._config.max_retries:
            attempt += 1
            self._throttle()
            self._log("request_attempt", url=request_url, attempt=attempt)

            try:
                response = self._transport(
                    request_url,
                    headers={"User-Agent": self._config.user_agent},
                    timeout=self._config.request_timeout_seconds,
                )
                if response.status_code in {429, 500, 502, 503, 504}:
                    raise SECClientHTTPError(response.status_code, request_url, response.content)
                return response
            except SECClientHTTPError as exc:
                if attempt > self._config.max_retries or exc.status_code not in {429, 500, 502, 503, 504}:
                    self._log("request_failed", url=request_url, attempt=attempt, status_code=exc.status_code)
                    raise
                self._sleep_backoff(attempt, request_url, f"http_{exc.status_code}")
            except TimeoutError as exc:
                if attempt > self._config.max_retries:
                    self._log("request_timeout", url=request_url, attempt=attempt)
                    raise SECClientTimeoutError(f"Timeout for {request_url}") from exc
                self._sleep_backoff(attempt, request_url, "timeout")
            except urllib.error.URLError as exc:
                is_timeout = isinstance(exc.reason, (TimeoutError, socket.timeout))
                if is_timeout and attempt > self._config.max_retries:
                    raise SECClientTimeoutError(f"Timeout for {request_url}") from exc
                if attempt > self._config.max_retries:
                    self._log("request_failed", url=request_url, attempt=attempt, reason=str(exc.reason))
                    raise SECClientError(f"Network failure for {request_url}: {exc.reason}") from exc
                self._sleep_backoff(attempt, request_url, "network_error")

        raise SECClientError(f"Failed to request {request_url}")

    def get_json(self, url: str, params: Mapping[str, str] | None = None) -> dict:
        response = self.get(url, params=params)
        return json.loads(response.content.decode("utf-8"))

    def download_file(self, url: str, destination: str | Path) -> Path:
        response = self.get(url)
        target = Path(destination)
        target.parent.mkdir(parents=True, exist_ok=True)
        temp_target = target.with_suffix(target.suffix + ".tmp")
        temp_target.write_bytes(response.content)
        temp_target.replace(target)
        self._log("file_downloaded", url=url, destination=str(target), bytes=len(response.content))
        return target

    def _build_url(self, url: str, params: Mapping[str, str] | None) -> str:
        if not params:
            return url
        encoded = urllib.parse.urlencode(params)
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}{encoded}"

    def _throttle(self) -> None:
        with self._rate_lock:
            now = self._now_fn()
            while now < self._next_allowed_time:
                delay = self._next_allowed_time - now
                self._sleep_fn(delay)
                now = self._now_fn()
            self._next_allowed_time = now + self._min_interval_seconds

    def _sleep_backoff(self, attempt: int, url: str, reason: str) -> None:
        delay = min(
            self._config.max_backoff_seconds,
            self._config.backoff_base_seconds * math.pow(2, max(0, attempt - 1)),
        )
        self._log("request_retrying", url=url, attempt=attempt, reason=reason, backoff_seconds=delay)
        self._sleep_fn(delay)

    def _default_transport(self, url: str, headers: Mapping[str, str], timeout: float) -> SECResponse:
        request = urllib.request.Request(url=url, method="GET", headers=dict(headers))
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                content = response.read()
                status = response.getcode()
                response_headers = {k: v for k, v in response.headers.items()}
                return SECResponse(url=url, status_code=status, headers=response_headers, content=content)
        except urllib.error.HTTPError as exc:
            body = exc.read() if hasattr(exc, "read") else b""
            raise SECClientHTTPError(exc.code, url, body) from exc

    def _log(self, event: str, **fields: object) -> None:
        self._logger.info({"event": event, **fields})
