from __future__ import annotations

from src.client import SECClient, SECResponse
from src.config import SECClientConfig


class _Clock:
    def __init__(self) -> None:
        self.now_value = 0.0
        self.sleep_calls: list[float] = []

    def now(self) -> float:
        return self.now_value

    def sleep(self, duration: float) -> None:
        self.sleep_calls.append(duration)
        self.now_value += duration


def test_transient_http_failure_retries_then_succeeds() -> None:
    attempts = {'count': 0}
    clock = _Clock()

    def transport(url: str, headers: dict[str, str], timeout: float) -> SECResponse:
        attempts['count'] += 1
        if attempts['count'] == 1:
            return SECResponse(url=url, status_code=503, headers={}, content=b'temporarily unavailable')
        return SECResponse(url=url, status_code=200, headers={}, content=b'{}')

    client = SECClient(
        SECClientConfig(
            user_agent='ResearchLab/1.0 (ops@example.com)',
            requests_per_second=10.0,
            max_retries=2,
            backoff_base_seconds=0.25,
            max_backoff_seconds=4.0,
        ),
        transport=transport,
        now_fn=clock.now,
        sleep_fn=clock.sleep,
    )

    response = client.get('https://data.sec.gov/submissions/retry-day13.json')

    assert response.status_code == 200
    assert attempts['count'] == 2
    assert clock.sleep_calls == [0.25]
