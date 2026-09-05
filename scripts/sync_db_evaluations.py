import json
from collections import Counter
import src.data.audit_db as audit_db
from src.analytics.signal_evaluator import SignalEvaluatorEngine

recs = json.load(open("data/signal_evaluations.json"))
s4_json = [r for r in recs if r.get("signal_date") == "2026-09-04"]
print("JSON 2026-09-04 breakdown:", Counter((r.get("strategy_type"), r.get("outcome_status")) for r in s4_json))

count = 0
for r in recs:
    try:
        audit_db.save_evaluation_record(r)
        count += 1
    except Exception as e:
        pass

print(f"Synced {count} records into SQLite WAL!")

db_recs = audit_db.get_all_evaluation_records(date_str="2026-09-04", limit=200)
print("SQLite 2026-09-04 breakdown:", Counter((r.get("strategy_type"), r.get("outcome_status")) for r in db_recs))
