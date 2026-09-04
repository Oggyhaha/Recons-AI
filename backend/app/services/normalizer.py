import re
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

class Normalizer:
    @staticmethod
    def parse_amount_to_minor(val: Any) -> int:
        """
        Converts any amount representation (e.g. '₹2,499.50', '2499.50', 2499.50, 249950)
        to integer minor units (paise). Prevents floating-point issues.
        """
        if val is None:
            return 0
        if isinstance(val, int):
            # If already large integer, check context
            return val
        if isinstance(val, float):
            return int(round(val * 100))
        
        # String cleanup
        clean_str = re.sub(r"[^\d.-]", "", str(val))
        if not clean_str:
            return 0
        
        try:
            float_val = float(clean_str)
            return int(round(float_val * 100))
        except ValueError:
            return 0

    @staticmethod
    def parse_iso_datetime(val: Any) -> datetime:
        """
        Normalizes diverse date string formats to timezone-aware UTC datetime.
        """
        if isinstance(val, datetime):
            if val.tzinfo is None:
                return val.replace(tzinfo=timezone.utc)
            return val
        
        val_str = str(val).strip()
        formats = [
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%d-%m-%Y"
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(val_str, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue
        return datetime.now(timezone.utc)

    @staticmethod
    def normalize_reference(ref: Any) -> str:
        """
        Normalizes reference strings by stripping whitespace, uppercase, and removing common symbols.
        """
        if not ref:
            return ""
        return re.sub(r"\s+", "", str(ref)).upper()
