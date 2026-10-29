from getpass import getpass
from pwdlib import PasswordHash

password = getpass("Enter your new admin password: ")
print("\nNew password hash:\n")
print(PasswordHash.recommended().hash(password))