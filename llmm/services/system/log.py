"""Logging service for the LLM Manager application."""

import os
import logging
import logging.handlers


class Log:
    """Application logger with console and rotating file output."""

    def __init__(self):
        """Initialize the logger instance."""
        self.log = logging.getLogger("llmm_log")
        self.log.setLevel(logging.DEBUG)

    def init_llmm(self, instance_path: str):
        """Initialize logging handlers with file and console output.

        Args:
            instance_path: Directory path for the log file.

        Returns:
            The configured logger instance.
        """
        logfile = os.path.join(instance_path, "llmm.log")

        if not self.log.hasHandlers():
            formatter = logging.Formatter(
                "[%(asctime)s] %(levelname)s in %(module)s.%(funcName)s: %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
            )

            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)

            rotation_handler = logging.handlers.RotatingFileHandler(logfile, maxBytes=5 * 1014 * 1014, backupCount=2)
            rotation_handler.setFormatter(formatter)

            self.log.addHandler(console_handler)
            self.log.addHandler(rotation_handler)

        return self.log

    def info(self, message):
        """Log an info message."""
        self.log.info(message)

    def debug(self, message):
        """Log a debug message."""
        self.log.debug(message)

    def error(self, message):
        """Log an error message."""
        self.log.error(message)

    def warning(self, message):
        """Log a warning message."""
        self.log.warning(message)
