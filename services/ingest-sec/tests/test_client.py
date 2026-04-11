from __future__ import annotations

import socket
import urllib.error

import pytest

from src.client import SECClient, SECClientTimeoutError, SECResponse
from src.config import SECClientConfig


class FakeClock:

    def __init__(self) -> None:
        self.now_value = 0.0
        self.sleep_calls: list[float] = []

    def now(self) -> float:
        return self.now_value

    def sleep(self, duration: float) -> None:
        self.sleep_calls.append(duration)
        self.now_value += duration


def test_throttle_behavior_enforces_min_interval() -> None:
    clock = FakeClock()
    attempts: list[float] = []

    def transport(url: str, headers: dict[str, str], timeout: float) -> SECResponse:
        attempts.append(clock.now())
        return SECResponse(url=url, status_code=200, headers={}, content=b"{}")

    cfg = SECClientConfig(user_agent="ResearchLab/1.0 (ops@example.com)", requests_per_second=2.0, max_retries=0)
    client = SECClient(cfg, transport=transport, now_fn=clock.now, sleep_fn=clock.sleep)

    client.get("https://data.sec.gov/submissions/test1.json")
    client.get("https://data.sec.gov/submissions/test2.json")

    assert len(attempts) == 2
    assert clock.sleep_calls == pytest.approx([0.5], abs=1e-9)


def test_retry_behavior_uses_exponential_backoff() -> None:
    clock = FakeClock()
    call_counter = {"count": 0}

    def transport(url: str, headers: dict[str, str], timeout: float) -> SECResponse:
        call_counter["count"] += 1
        if call_counter["count"] < 3:
            return SECResponse(url=url, status_code=503, headers={}, content=b"busy")
        return SECResponse(url=url, status_code=200, headers={}, content=b"{}")

    cfg = SECClientConfig(
        user_agent="ResearchLab/1.0 (ops@example.com)",
        requests_per_second=5.0,
        max_retries=3,
        backoff_base_seconds=0.5,
        max_backoff_seconds=8.0,
    )
    client = SECClient(cfg, transport=transport, now_fn=clock.now, sleep_fn=clock.sleep)

    response = client.get("https://data.sec.gov/submissions/retry.json")

    assert response.status_code == 200
    assert call_counter["count"] == 3
    assert clock.sleep_calls[:2] == pytest.approx([0.5, 1.0], abs=1e-9)


def test_timeout_handling_raises_specific_error() -> None:
    clock = FakeClock()

    def transport(url: str, headers: dict[str, str], timeout: float) -> SECResponse:
        raise TimeoutError("socket timed out")

    cfg = SECClientConfig(user_agent="ResearchLab/1.0 (ops@example.com)", requests_per_second=10.0, max_retries=0)
    client = SECClient(cfg, transport=transport, now_fn=clock.now, sleep_fn=clock.sleep)

    with pytest.raises(SECClientTimeoutError):
        client.get("https://data.sec.gov/submissions/timeout.json")


def test_timeout_handling_from_urlerror_raises_specific_error() -> None:
    clock = FakeClock()

    def transport(url: str, headers: dict[str, str], timeout: float) -> SECResponse:
        raise urllib.error.URLError(socket.timeout("timed out"))

    cfg = SECClientConfig(user_agent="ResearchLab/1.0 (ops@example.com)", requests_per_second=10.0, max_retries=0)
    client = SECClient(cfg, transport=transport, now_fn=clock.now, sleep_fn=clock.sleep)

    with pytest.raises(SECClientTimeoutError):
        client.get("https://data.sec.gov/submissions/timeout-urlerror.json")
