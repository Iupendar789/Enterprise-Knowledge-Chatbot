import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent / "employees.db"

with sqlite3.connect(db_path) as connection:
    rows = connection.execute("PRAGMA table_info(employees)").fetchall()

print("Database:", db_path)
print("Employees table columns:")
for row in rows:
    print(row)