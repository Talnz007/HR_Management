import logging
import json
from datetime import datetime
from typing import Dict, Any

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        # Add extra fields if they exist
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "employee_id"):
            log_entry["employee_id"] = record.employee_id
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        return json.dumps(log_entry)

def setup_logging():
    """Setup application logging configuration."""
    logger = logging.getLogger("hr_system")
    logger.setLevel(logging.INFO)
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JSONFormatter())
    # File handler
    file_handler = logging.FileHandler("hr_system.log")
    file_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    return logger