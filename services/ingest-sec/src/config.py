from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class SECClientConfig:
    """Configuration for SEC client runtime controls."""

    user_agent: str
    requests_per_second: float = 5.0
    request_timeout_seconds: float = 10.0
    max_retries: int = 3
    backoff_base_seconds: float = 0.5
    max_backoff_seconds: float = 8.0

    @classmethod
    def from_env(cls) -> "SECClientConfig":
        user_agent = os.getenv("SEC_USER_AGENT", "").strip()
        if not user_agent:
            raise ValueError("SEC_USER_AGENT must be configured with a declared contact User-Agent")

        return cls(
            user_agent=user_agent,
            requests_per_second=float(os.getenv("SEC_REQUESTS_PER_SECOND", "5")),
            request_timeout_seconds=float(os.getenv("SEC_REQUEST_TIMEOUT_SECONDS", "10")),
            max_retries=int(os.getenv("SEC_MAX_RETRIES", "3")),
            backoff_base_seconds=float(os.getenv("SEC_BACKOFF_BASE_SECONDS", "0.5")),
            max_backoff_seconds=float(os.getenv("SEC_MAX_BACKOFF_SECONDS", "8")),
        )

    def validate(self) -> None:
        if not self.user_agent.strip():
            raise ValueError("user_agent must be a non-empty declared contact string")
        if self.requests_per_second <= 0:
            raise ValueError("requests_per_second must be > 0")
        if self.request_timeout_seconds <= 0:
            raise ValueError("request_timeout_seconds must be > 0")
        if self.max_retries < 0:
            raise ValueError("max_retries must be >= 0")
        if self.backoff_base_seconds < 0:
            raise ValueError("backoff_base_seconds must be >= 0")
        if self.max_backoff_seconds < 0:
            raise ValueError("max_backoff_seconds must be >= 0")
