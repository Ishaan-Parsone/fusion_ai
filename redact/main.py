import streamlit as st
from PyPDF2 import PdfReader
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def process_pdf(uploaded_file):
    reader = PdfReader(uploaded_file)
    text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    return text

def redact_text(text):
    prompt = "Redact all private information (e.g., name, phone number, address) and replace it with '[REDACTED]'. Keep the structure and meaning intact."
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": text}
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.6,
        max_tokens=8000,
    )
    return response.choices[0].message.content

def main():
    st.title("Redaction Tool")
    option = st.radio("Choose Input Type:", ("PDF Upload", "Text Input", "CSV"))
    
    if option == "PDF Upload":
        uploaded_file = st.file_uploader("Upload a PDF", type=["pdf"])
        if uploaded_file:
            extracted_text = process_pdf(uploaded_file)
            redacted_text = redact_text(extracted_text)
            st.download_button("Download Redacted PDF", redacted_text.encode("utf-8"), file_name="redacted.txt")
    
    elif option == "Text Input":
        user_text = st.text_area("Enter your text")
        if user_text:
            redacted_text = redact_text(user_text)
            st.write("Redacted Output:")
            st.write(redacted_text)

if __name__ == "__main__":
    main()
