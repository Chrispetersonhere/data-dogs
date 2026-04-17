from __future__ import annotations

import json
import logging

from src.logging import JSONLogFormatter, bind_log_context, clear_log_context


def test_json_formatter_includes_context_ids() -> None:
    formatter = JSONLogFormatter()
    bind_log_context(request_id="req-123", job_id="job-456")
    try:
        record = logging.LogRecord(
            name="ingest",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg={"event": "ingest.step", "message": "ok"},
            args=(),
            exc_info=None,
        )
        payload = json.loads(formatter.format(record))
        assert payload["request_id"] == "req-123"
        assert payload["job_id"] == "job-456"
    finally:
        clear_log_context()


def test_json_formatter_uses_explicit_extra_ids_over_context() -> None:
    formatter = JSONLogFormatter()
    bind_log_context(request_id="req-context", job_id="job-context")
    try:
        record = logging.LogRecord(
            name="ingest",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg={"event": "ingest.step", "message": "ok"},
            args=(),
            exc_info=None,
        )
        record.request_id = "req-explicit"
        record.job_id = "job-explicit"
        payload = json.loads(formatter.format(record))
        assert payload["request_id"] == "req-explicit"
        assert payload["job_id"] == "job-explicit"
    finally:
        clear_log_context()
