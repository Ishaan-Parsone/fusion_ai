# Grammar ChatBot 📝

## Description

Grammar ChatBot is a Streamlit-based web application that helps users improve their English grammar. It uses the Groq API to power an AI assistant that can correct grammatical errors and answer grammar-related questions.

## Features

- Grammar correction for user-input text
- Answers to grammar-related questions
- User-friendly chat interface
- Displays corrections in an easy-to-read table format

## Installation

1. Clone this repository
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```
3. Create a `config.env` file in the project root and add your Groq API key:
   ```
   GROQ_API_KEY=your_api_key_here
   ```

## Usage

Run the Streamlit app:

```
streamlit run app.py
```

Then open your web browser and navigate to the URL provided by Streamlit (usually `http://localhost:8501`).

## How it works

The app uses the Groq API with the "llama-3.1-70b-versatile" model to process user input. It can:

1. Correct grammatical errors in text
2. Answer questions about grammar

The app's behavior is guided by a system prompt stored in `prompt.txt`.

## Code Structure

- `app.py`: Main application file
- `prompt.txt`: Contains the system prompt for the AI assistant
- `config.env`: Stores the Groq API key (not included in the repository)

## Technologies Used

- Streamlit
- Groq API
- Python
- dotenv

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check issues page if you want to contribute.

## License

[MIT](https://choosealicense.com/licenses/mit/)