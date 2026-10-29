# Enterprise Knowledge Chatbot

An AI-powered enterprise knowledge chatbot using Retrieval-Augmented Generation (RAG) and document retrieval.

## Overview

The Enterprise Knowledge Chatbot helps users find information from organizational documents by asking questions in natural language. It retrieves relevant document content and uses a language model to generate contextual answers.

The project combines a web-based interface, a backend API, document retrieval, and AI-powered response generation.

## Features

- Natural-language question answering
- Document-based information retrieval
- Retrieval-Augmented Generation (RAG)
- AI-generated answers grounded in retrieved document content
- Source references for supporting information, where available
- User authentication and role-based document access, where configured
- Chat history and conversation management, where implemented
- Document upload and processing, where implemented

## Technology Stack

- **Frontend:** React, Tailwind CSS, JavaScript
- **Backend:** Python, FastAPI
- **AI:** Gemini API
- **Retrieval:** RAG and document embeddings
- **Database:** SQLite
- **Development tools:** Git, GitHub, Visual Studio Code

## How It Works

1. A user asks a question through the frontend.
2. The backend receives the question through an API.
3. The retrieval system searches for relevant content in available documents.
4. Relevant content is provided to the language model as context.
5. The model generates an answer based on the retrieved information.
6. The frontend displays the answer and available source references.

## Project Structure

```text
Enterprise-Knowledge-Chatbot/
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── rbac.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

*Adjust this structure if your actual folders or filenames differ.*

## Prerequisites

- Python 3.12
- Node.js and npm
- A Gemini API key
- Access to your configured database, if required

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Iupendar789/Enterprise-Knowledge-Chatbot.git
cd Enterprise-Knowledge-Chatbot
```

### 2. Set up the backend

Open a terminal in the project root:

```bash
cd backend
python -m venv myuppi
```

On Windows Command Prompt:

```cmd
myuppi\Scripts\activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in a local `.env` file according to the names expected by your backend. Never commit real API keys, passwords, or database credentials.

Start the backend using the command appropriate for your application. For example, if `main.py` exposes a FastAPI object named `app`:

```bash
uvicorn main:app --reload
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## Configuration

Create local environment configuration for the backend and frontend as needed. Refer to the variable names expected by the source code.

Do not publish real secrets. If you provide an `.env.example` file, include only placeholder values.

## Future Improvements

- Improve document ingestion and retrieval quality
- Add more evaluation and testing for RAG responses
- Improve deployment and monitoring
- Enhance the user interface and accessibility

## Author

**Upendar**

GitHub: [Iupendar789](https://github.com/Iupendar789/Enterprise-Knowledge-Chatbot.git)

## License

No license has been specified yet. Add a license if you decide how you want others to use, modify, and distribute this project.