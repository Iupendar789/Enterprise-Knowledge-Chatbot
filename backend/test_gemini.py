from dotenv import load_dotenv
from google import genai

# Load the API key from the .env file
load_dotenv()

# Create the Gemini client
client = genai.Client()

# Send a test prompt
response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents="Say hello in one short sentence."
)

print("Gemini response:")
print(response.text)