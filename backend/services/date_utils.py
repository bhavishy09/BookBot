"""
Date parsing utilities.
Converts natural-language date references like "next Friday", "tomorrow",
"March 15", "2025-03-15" into concrete datetime objects.
"""
import re
from datetime import datetime, timedelta, date

from dateutil import parser as dateutil_parser


# Map of weekday names → Python weekday index (Mon=0 … Sun=6)
WEEKDAY_NAMES = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
    "mon": 0, "tue": 1, "tues": 1, "wed": 2, "wednes": 2,
    "thu": 3, "thurs": 3, "fri": 4, "sat": 5, "sun": 6,
}

# Month name → number (1-12)
MONTH_NAMES = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8, "sep": 9, "sept": 9,
    "oct": 10, "nov": 11, "dec": 12,
}


def _today() -> date:
    """Return today's date (easy to patch in tests)."""
    return date.today()


def parse_date(text: str) -> datetime | None:
    """
    Attempt to parse a human-readable date string into a datetime.

    Supports:
      - "today", "tomorrow"
      - "next Friday", "this Monday"
      - "March 15", "15th March", "March 15th 2025"
      - ISO-style: "2025-03-15", "2025/03/15"

    For ambiguous dates near month boundaries, picks the nearest future date.
    Returns None if parsing fails entirely.
    """
    if not text or not text.strip():
        return None

    text = text.strip().lower()
    today = _today()

    # --- "today" ---
    if text == "today":
        return datetime.combine(today, datetime.min.time())

    # --- "tomorrow" ---
    if text == "tomorrow":
        return datetime.combine(today + timedelta(days=1), datetime.min.time())

    # --- "next <weekday>" or "this <weekday>" ---
    m = re.match(r"(?:next|this)\s+(\w+)", text)
    if m:
        day_name = m.group(1)
        if day_name in WEEKDAY_NAMES:
            target_dow = WEEKDAY_NAMES[day_name]
            current_dow = today.weekday()
            # Days ahead until the target weekday
            days_ahead = (target_dow - current_dow) % 7
            # "next" should always go forward (at least 1 day)
            if days_ahead == 0:
                days_ahead = 7
            result = today + timedelta(days=days_ahead)
            return datetime.combine(result, datetime.min.time())

    # --- Just a bare weekday name like "friday" ---
    if text in WEEKDAY_NAMES:
        target_dow = WEEKDAY_NAMES[text]
        current_dow = today.weekday()
        days_ahead = (target_dow - current_dow) % 7
        if days_ahead == 0:
            days_ahead = 7  # next occurrence, not today (unless today IS that day, push to next week)
        result = today + timedelta(days=days_ahead)
        return datetime.combine(result, datetime.min.time())

    # --- "<month> <day>" or "<day><suffix> <month>" (e.g. "March 15", "15th March") ---
    # Try: "15th March 2025" or "15 March 2025"
    m = re.match(r"(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)(?:\s+(\d{4}))?", text)
    if m:
        day_num = int(m.group(1))
        month_str = m.group(2)
        year_str = m.group(3)
        if month_str in MONTH_NAMES:
            month_num = MONTH_NAMES[month_str]
            year = int(year_str) if year_str else today.year
            result = date(year, month_num, day_num)
            # If the date is in the past, try next year
            if result < today:
                result = date(year + 1, month_num, day_num)
            return datetime.combine(result, datetime.min.time())

    # Try: "March 15" or "March 15th 2025"
    m = re.match(r"(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?", text)
    if m:
        month_str = m.group(1)
        day_num = int(m.group(2))
        year_str = m.group(3)
        if month_str in MONTH_NAMES:
            month_num = MONTH_NAMES[month_str]
            year = int(year_str) if year_str else today.year
            try:
                result = date(year, month_num, day_num)
                # If the date is in the past, try next year
                if result < today:
                    result = date(year + 1, month_num, day_num)
                return datetime.combine(result, datetime.min.time())
            except ValueError:
                pass  # Invalid date like Feb 30 — fall through

    # --- ISO date: "2025-03-15" or "2025/03/15" ---
    m = re.match(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", text)
    if m:
        try:
            result = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            return datetime.combine(result, datetime.min.time())
        except ValueError:
            pass

    # --- Fallback: dateutil parser ---
    try:
        # Parse with default to today so partial strings get a year
        parsed = dateutil_parser.parse(text, fuzzy=True, default=datetime(today.year, today.month, today.day))
        # If the parsed result is in the past, try advancing to next year
        if parsed.to_pydatetime().date() < today:
            try:
                parsed = dateutil_parser.parse(
                    text, fuzzy=True,
                    default=datetime(today.year + 1, today.month, today.day),
                )
            except Exception:
                pass
        return parsed
    except (ValueError, OverflowError, TypeError):
        return None
