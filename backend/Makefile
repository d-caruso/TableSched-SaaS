# SaaS backend dev shortcuts.
# Uses the shared core virtualenv so the interpreter need not be typed by hand.

PY = ../../TableSched/.venv/bin/python

.PHONY: run migrate test shell lint typecheck

run:
	$(PY) manage.py runserver

migrate:
	$(PY) manage.py migrate_schemas

test:
	$(PY) -m pytest

shell:
	$(PY) manage.py shell

lint:
	$(PY) -m ruff check .

typecheck:
	$(PY) -m mypy .
