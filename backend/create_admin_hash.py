from getpass import getpass
from pwdlib import PasswordHash

password = getpass("Enter a new admin password: ")

if len(password) < 8:
    raise SystemExit("Use a password with at least 8 characters.")

password_hash = PasswordHash.recommended().hash(password)

print("\nCopy this hash into your .env file:")
print(password_hash)