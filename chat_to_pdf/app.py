import streamlit as st
import json
from groq import Groq
import os
from dotenv import load_dotenv
from pathlib import Path
from json_repair import repair_json
import fitz 
import io

load_dotenv(f"{Path.cwd()}/config.env")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

st.set_page_config(page_title="Chat with PDF", page_icon="📄")

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
</style>
""", unsafe_allow_html=True)

st.title("Chat with PDF 📄")

if st.button("Clear Chat"):
    st.session_state.messages = []
    st.rerun()

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

uploaded_file = st.file_uploader("Upload a PDF document", type=["pdf"])

if uploaded_file is not None:
    pdf_bytes = uploaded_file.read()  # Read file content as bytes
    
    if not pdf_bytes:
        st.error("Uploaded PDF is empty!")
    else:
        pdf_stream = io.BytesIO(pdf_bytes)  # Wrap bytes in a stream
        pdf_document = fitz.open(stream=pdf_stream, filetype="pdf")  
        
        pdf_content = ""
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            pdf_content += page.get_text()

        if len(pdf_content) > 4500:
            pdf_content = pdf_content[:4500]

        pdf_document.close()
        
        st.success("PDF uploaded successfully! Content extracted.")


    if prompt := st.chat_input("Ask a question about the PDF:"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        system_prompt = '''You are a helpful assistant providing answers based on the uploaded PDF content. Answer should strictly be in the format of JSON. For example:

        {"message": <any string of the response, doesn't need to be a json>}
        ''' 

        if prompt:
            with st.chat_message("assistant"):
                message_placeholder = st.empty()

                chat_completion = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": pdf_content},  
                        {"role": "user", "content": prompt}  
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
                    print(response_json)

                    if "message" in response_json:
                        st.markdown(response_json["message"], unsafe_allow_html=True)
                        full_response = response_json["message"]
                    else:
                        st.subheader("Response")
                        st.write(full_response)

                    message_placeholder.empty()

                except json.JSONDecodeError:
                    st.error("An error occurred while processing the response.")
                    full_response = "Error: Unable to parse the response."

        st.session_state.messages.append({"role": "assistant", "content": full_response})

