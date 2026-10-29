from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client()

print("Starting Gemini streaming test...")

try:
    response = client.models.generate_content_stream(
        model="gemini-3.6-flash",
        contents="Explain what an operating system is in 3 short sentences."
    )

    print("\nGemini streaming response:\n")

    for chunk in response:
        if chunk.text:
            print(chunk.text, end="", flush=True)

    print("\n\nStreaming test completed successfully.")

except Exception as e:
    print("\n\nStreaming test FAILED:")
    print(type(e).__name__)
    print(str(e))