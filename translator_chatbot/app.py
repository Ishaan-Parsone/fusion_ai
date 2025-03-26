import streamlit as st
import json
from groq import Groq
import os
from dotenv import load_dotenv
from pathlib import Path
from json_repair import repair_json
from prompts import get_prompt  # Import the function to get the system prompt

load_dotenv(f"{Path.cwd()}/config.env")

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

st.set_page_config(page_title="Translator Chatbot", page_icon="📚")

st.markdown("""
<style>
.stApp {
    max-width: 800px;
    margin: 0 auto;
}
.chat-message {
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
}
.chat-message.user {
    background-color: #e6f3ff;
}
.chat-message.assistant {
    background-color: #f0f0f0;
}
.chat-message .message {
    margin-bottom: 0.5rem;
}
table {
    width: 100%;
    margin-bottom: 1rem;
}
th, td {
    text-align: left;
    padding: 0.5rem;
    border-bottom: 1px solid #ddd;
}
</style>
""", unsafe_allow_html=True)

st.title("Translator ChatBot 📝")

if st.button("Clear Chat"):
    st.session_state.messages = []
    st.session_state.translations = []  # Clear translations as well
    st.rerun()

if "messages" not in st.session_state:
    st.session_state.messages = []

if "translations" not in st.session_state:
    st.session_state.translations = []

# Dropdowns for language selection
from_language = st.selectbox("Select source language", ["English"])
to_language = st.selectbox("Select target language", ["Hindi", "Spanish", "French", "Marathi"])

# Display the selected languages
st.write(f"Translating from **{from_language}** to **{to_language}**")

# Get the correct system prompt based on selected languages
system_prompt = get_prompt(from_language, to_language)

# Display previous messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Display previous translations (if any)
if st.session_state.translations:
    for translation in st.session_state.translations:
        st.subheader("Translator Corrections")
        st.table(translation["corrections"])

        st.subheader("Translated Paragraph")
        st.text_area("Copy the translated text:", value=translation["translated_text"], height=200)

# Handling user's input (prompt)
user_input = st.chat_input("Enter your text or ask a Translation-related question")

if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    # Get assistant's response using the system prompt and user input
    with st.chat_message("assistant"):
        message_placeholder = st.empty()

        # Call the Groq API to generate a response based on the system prompt and user's input
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},  # System prompt based on selected languages
                *[{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]  # Conversation history
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            top_p=1,
            stream=False,
            max_tokens=8000,
        )

        full_response = chat_completion.choices[0].message.content
        message_placeholder.markdown("Processing response...")

        try:
            repaired_json = repair_json(full_response)
            response_json = json.loads(repaired_json)

            if "message" in response_json:
                # This is a chat-type message
                st.markdown(response_json["message"], unsafe_allow_html=True)
                full_response = response_json["message"]
            else:
                # This is a Translator correction
                corrections = []
                for original, translated in response_json.items():
                    corrections.append({"Original": original, "Translated": translated})

                # Store the translation output
                translation = {
                    "corrections": corrections,
                    "translated_text": " ".join(correction["Translated"] for correction in corrections)
                }
                st.session_state.translations.append(translation)

                st.subheader("Translator Corrections")
                st.table(corrections)

                st.subheader("Translated Paragraph")
                corrected_text = " ".join(correction["Translated"] for correction in corrections)
                st.text_area("Copy the translated text:", value=corrected_text, height=200)

                full_response = json.dumps(response_json, indent=2)

            message_placeholder.empty()

        except json.JSONDecodeError:
            st.error("An error occurred while processing the response.")
            full_response = "Error: Unable to parse the response."

    st.session_state.messages.append({"role": "assistant", "content": full_response})
