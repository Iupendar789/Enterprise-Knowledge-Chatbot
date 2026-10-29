import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent / "employees.db"

with sqlite3.connect(db_path) as connection:

    # Check existing columns
    columns = {
        row[1]
        for row in connection.execute(
            "PRAGMA table_info(employees)"
        )
    }

    # Add full_name column if it does not exist
    if "full_name" not in columns:
        connection.execute(
            """
            ALTER TABLE employees
            ADD COLUMN full_name TEXT NOT NULL DEFAULT ''
            """
        )

        print("Added the full_name column.")

    else:
        print("The full_name column already exists.")

    # Update the existing employee
    email = "uday@gmail.com"
    full_name = "Uday"

    cursor = connection.execute(
        """
        UPDATE employees
        SET full_name = ?
        WHERE email = ?
        """,
        (
            full_name,
            email,
        ),
    )

    if cursor.rowcount > 0:
        print(
            f"Updated employee name: {email} -> {full_name}"
        )
    else:
        print(
            f"No employee found with email: {email}"
        )

    connection.commit()

    # Verify the saved value
    row = connection.execute(
        """
        SELECT email, full_name
        FROM employees
        WHERE email = ?
        """,
        (email,),
    ).fetchone()

    if row:
        print()
        print("Employee record:")
        print("Email:", row[0])
        print("Full name:", row[1])