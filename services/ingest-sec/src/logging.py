from __future__ import annotations

import json
import logging
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

_REQUEST_ID_CTX: ContextVar[str | None] = ContextVar("request_id", default=None)
_JOB_ID_CTX: ContextVar[str | None] = ContextVar("job_id", default=None)


class JSONLogFormatter(logging.Formatter):
    """Structured JSON formatter for machine-parsable logs."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any]
        if isinstance(record.msg, dict):
            payload = dict(record.msg)
        else:
            payload = {"message": record.getMessage()}

        request_id = getattr(record, "request_id", None) or _REQUEST_ID_CTX.get()
        job_id = getattr(record, "job_id", None) or _JOB_ID_CTX.get()

        payload.setdefault("event", record.__dict__.get("event", "log"))
        payload["timestamp"] = datetime.now(timezone.utc).isoformat()
        payload["logger"] = record.name
        payload["level"] = record.levelname
        if request_id:
            payload["request_id"] = request_id
        if job_id:
            payload["job_id"] = job_id
        return json.dumps(payload, separators=(",", ":"), sort_keys=True)


class StructuredLoggerAdapter(logging.LoggerAdapter):

    def process(self, msg: Any, kwargs: dict[str, Any]) -> tuple[Any, dict[str, Any]]:
        extra = dict(kwargs.get("extra", {}))
        if "request_id" not in extra:
            request_id = _REQUEST_ID_CTX.get()
            if request_id:
                extra["request_id"] = request_id
        if "job_id" not in extra:
            job_id = _JOB_ID_CTX.get()
            if job_id:
                extra["job_id"] = job_id
        kwargs["extra"] = extra
        return msg, kwargs


def bind_log_context(*, request_id: str | None = None, job_id: str | None = None) -> None:
    if request_id is not None:
        _REQUEST_ID_CTX.set(request_id.strip() or None)
    if job_id is not None:
        _JOB_ID_CTX.set(job_id.strip() or None)


def clear_log_context() -> None:
    _REQUEST_ID_CTX.set(None)
    _JOB_ID_CTX.set(None)


def get_structured_logger(name: str) -> StructuredLoggerAdapter:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(JSONLogFormatter())
        logger.addHandler(handler)
        logger.propagate = False

    return StructuredLoggerAdapter(logger, extra={})
