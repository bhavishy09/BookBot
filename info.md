# BookBot Submission Information

This file serves as a reference for your submission, detailing the feature coverage, evaluator priorities, open questions, and the structure for your demo video.

---

## 1. Assignment Requirements Checklist

| Requirement (from PDF Brief) | Status | Details |
| :--- | :--- | :--- |
| **Chat-based Booking System** | **Done** | Multi-turn booking flow where the bot asks for missing info (date, time, service) and confirms before booking. |
| **Natural Language Rescheduling** | **Done** | Users can say: *"Reschedule my appointment #3 to tomorrow at 11am"*. The bot resolves conflicts and updates the slot. |
| **Natural Language Cancellation** | **Done** | Users can cancel by ID or through conversation. |
| **Availability / Conflict Logic** | **Done** | Overlaps checked across *all* services (single provider constraint), business hours (9 AM - 5 PM) respected, past times blocked. |
| **Admin Dashboard** | **Done** | List and filter bookings by date and status, CRUD operations (create, edit, cancel), clean badges. |
| **Admin Login & Authentication** | **Done** | JWT bearer token authorization protecting dashboard reads/mutations. |
| **README Sections (4 parts)** | **Done** | Abstract, Spec & Plan, Implementation (incl. model & tokens), Edge Cases. |
| **Demo Video (<= 5 min)** | *Pending* | Structure and script options detailed below. |
| **GitHub Repository** | *Pending* | Staged, committed and pushed with clean human-style messages. |
| **Stretch: Simple Calendar View** | **Missing** | A nice-to-have visual calendar. (Table-based listing is currently used). |

---

## 2. Evaluator Stated Priorities

To maximize your score, explicitly address these four aspects in your **README** and **Demo Video**:

1. **How you think about the problem (not just the output)**
   - Emphasize why a strict single-provider conflict model was implemented (since the DB lacks staff IDs, booking overlap represents a double-booking conflict).
   - Talk about the timezone discrepancy problem between cloud servers (which run UTC) and the local operating hours of the shop, and how timezone-aware helpers solved this.
2. **How you use AI tools (prompting, iteration, decision-making)**
   - Detail how you used Antigravity to audit the existing code, identify gaps, plan the fixes, and verify with automated pytest tests.
   - Describe the model selection (e.g. Gemini 2.0 Flash for low-latency function calling, Gemini 3.5 Flash for reasoning/coding).
3. **Independent thinking**
   - Explain how you noticed that the original codebase checked conflicts only for the *same* `service_id` and why you corrected it to check *database-wide* overlaps (independent critical analysis).
   - Explain why you chose to inject the current local date/time dynamically into Gemini's system prompt (otherwise NLU date parsing of "tomorrow" or "next Friday" is impossible).
4. **Execution across a simple full-stack system**
   - Highlight the robust API error handling (400 for bad parameters, 409 for conflicts, 403/401 for unauthorized actions) mapped directly to user-facing frontend notifications (toasts/banners).

---

## 3. Open Questions & Ambiguities to Verify

Before final submission, double-check these requirements:
1. **Business Hours / Closed Days**: Currently, settings default to Monday-Sunday (all days open), 9 AM - 5 PM. Does your school/assignment require specific holidays or closed days (e.g. weekends)? If so, update `BUSINESS_DAYS` in `backend/config.py`.
2. **Demo Video Hosting**: Does your evaluator want the video uploaded directly to GitHub, or should it be a Loom/YouTube link in the README? (A link in the README is usually best).
3. **Admin User Credentials**: The seeded credentials are `admin@bookbot.com` / `BookBot#Admin2026!Secure`. Ensure this is documented clearly in the README.

---

## 4. Demo Video Guide (Under 5 Minutes)

Here is a recommended script/flow to record your Loom video:

- **0:00 - 0:45: Abstract & System Design**
  - Briefly show the stack (React + FastAPI + SQLite/Postgres + Gemini 2.0 Flash function calling).
  - Walk through the high-level system design diagram (in README).
- **0:45 - 1:45: User Chat Flow**
  - Open the chat screen. Say: *"I want to book a haircut for tomorrow at 10 AM"*.
  - Show how the bot requests missing info (name and phone/email).
  - Provide details. Show how it displays a pending action banner and asks for confirmation.
  - Reply *"yes"* and watch the green confirmation toast/success message appear with the booking ID.
- **1:45 - 2:45: Conflict Prevention & Edge Cases**
  - Try to book a *Massage* (or different service) for the *same* slot. Show that the bot rejects the booking due to conflict (single-provider logic).
  - Try to book a slot in the past or outside business hours (e.g. 8 AM). Show that it returns a clean validation error.
- **2:45 - 3:30: Natural Language Rescheduling & Status Checks**
  - In chat, say: *"Can you reschedule my appointment #1 to tomorrow at 1:00 PM?"*
  - Watch it update. Ask the bot: *"What is the status of appointment #1?"*
- **3:30 - 4:30: Admin Dashboard CRUD**
  - Log in to `/admin` using `admin@bookbot.com` / `BookBot#Admin2026!Secure`.
  - Show the list of bookings. Filter by date or status.
  - Create a new booking manually, edit an existing one, and cancel a booking.
- **4:30 - 5:00: Testing & Code Quality**
  - Show the `test_main.py` test suite and run `pytest` in the terminal to demonstrate that all 11 integration tests pass successfully.
