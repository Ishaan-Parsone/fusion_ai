import streamlit as st
import json
from groq import Groq
import os
from dotenv import load_dotenv
from pathlib import Path
from json_repair import repair_json

load_dotenv(f"{Path.cwd()}/config.env")

client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

st.set_page_config(page_title="Grammar Chatbot", page_icon="📚")

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

st.title("Grammar ChatBot 📝")

if st.button("Clear Chat"):
    st.session_state.messages = []
    st.rerun()

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Enter your text or ask a grammar-related question"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

if prompt:
    with st.chat_message("assistant"):
        with open("prompt.txt", "r") as file:
            system_prompt = file.read()

        message_placeholder = st.empty()

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                *[{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.6,
            top_p=1,
            stream=False,
            max_tokens=8000,
            response_format={"type": "json_object"},
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
                # This is a grammar correction
                st.subheader("Grammar Corrections")
                corrections = []
                for original, corrected in response_json.items():
                    corrections.append({"Original": original, "Corrected": corrected})
                
                st.table(corrections)

                st.subheader("Corrected Paragraph")
                corrected_text = " ".join(correction["Corrected"] for correction in corrections)
                st.text_area("Copy the corrected text:", value=corrected_text, height=200)
                full_response = json.dumps(response_json, indent=2)

            message_placeholder.empty()

        except json.JSONDecodeError:
            st.error("An error occurred while processing the response.")
            full_response = "Error: Unable to parse the response."

    st.session_state.messages.append({"role": "assistant", "content": full_response})
