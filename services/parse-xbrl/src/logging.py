from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any


class JSONLogFormatter(logging.Formatter):
    """Structured JSON formatter for parse-xbrl logs."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any]
        if isinstance(record.msg, dict):
            payload = dict(record.msg)
        else:
            payload = {"message": record.getMessage()}

        payload.setdefault("event", record.__dict__.get("event", "log"))
        payload["timestamp"] = datetime.now(timezone.utc).isoformat()
        payload["logger"] = record.name
        payload["level"] = record.levelname

        request_id = record.__dict__.get("request_id")
        job_id = record.__dict__.get("job_id")
        if request_id:
            payload["request_id"] = str(request_id)
        if job_id:
            payload["job_id"] = str(job_id)

        return json.dumps(payload, separators=(",", ":"), sort_keys=True)


def get_structured_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(JSONLogFormatter())
    logger.addHandler(handler)
    logger.propagate = False
    return logger
