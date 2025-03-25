import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Copy, Check } from 'lucide-react'
import Groq from "groq-sdk";
import { useEffect } from 'react'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});


export default function ReceiptScan() {
  const [imagePreview, setImagePreview] = useState('')
  const [base64String, setBase64String] = useState('')
  const [promptInstruction, setPromptInstruction] = useState('')
  const [copied, setCopied] = useState(false)
  const [outputJSON, setOutputJSON] = useState(false)
  const [mode, setMode] = useState('structured') // 'structured' or 'ocr'

  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('/imgPrompt.txt')
      .then((response) => response.text())
      .then((data) => {
        setPromptInstruction(data)
      })
      .catch((error) => console.error('Error fetching text file:', error))
  }, [])

  useEffect(() => {
    if (!base64String) return

    const analyzeImage = async (retryCount = 0) => {
      try {
        // Adjust promptInstruction based on the selected mode
        const adjustedPrompt = mode === 'structured'
          ? promptInstruction // Existing instruction for structured receipt
          : "Extract text from the image. No explanations, No extra wordings except the text from the image. Just simple normal text, n" // Simple OCR prompt

        const responseFormat = mode === 'structured' ? { type: "json_object" } : undefined;
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: adjustedPrompt, // Use the adjusted prompt based on the mode
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64String}`,
                  },
                },
              ],
            },
          ],
          model: "llama-3.2-11b-vision-preview",
          temperature: 1,
          max_tokens: 6024,
          top_p: 1,
          stream: false,
          response_format: responseFormat,
          stop: null,
        })

        setOutputJSON(chatCompletion.choices[0].message.content)
      } catch (error) {
        console.error("Error analyzing image:", error)

        // Retry logic
        if (retryCount < 3) {
          console.log(`Retrying... (${retryCount + 1})`)
          analyzeImage(retryCount + 1)
        } else {
          console.error("Max retries reached. Analysis failed.")
        }
      }
    }

    analyzeImage()
  }, [base64String, mode]) // Add 'mode' to the dependency array

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setBase64String(reader.result.split(',')[1])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setBase64String(reader.result.split(',')[1])
      }
      reader.readAsDataURL(file)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(base64String).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleJSONChange = (event) => {
    setOutputJSON(event.target.value) // Update state as user edits JSON
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Optical Character Recognition for Images & Receipts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mt-4 
          ">
            <Label htmlFor="mode" className="block text-lg font-semibold text-gray-700 text-center">Choose Mode</Label>

            <div className="mt-2 flex items-center justify-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="structured"
                  checked={mode === 'structured'}
                  onChange={() => setMode('structured')}
                  className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-600">Receipt in Structured Format</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="ocr"
                  checked={mode === 'ocr'}
                  onChange={() => setMode('ocr')}
                  className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-600">Simple OCR (Image to Text)</span>
              </label>
            </div>

          </div>


          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Drag and drop your receipt image here, or click to select a file</p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {imagePreview && (
            <div className="mt-4">
              <Label htmlFor="preview">Image Preview</Label>
              <div className="mt-1 flex justify-center">
                <img src={imagePreview} alt="Receipt preview" className="max-h-64 rounded-lg shadow-md" />
              </div>
            </div>
          )}

          {base64String && (
            <div className="mt-4">
              <Label htmlFor="base64">Base64 String</Label>
              <div className="mt-1 relative">
                <Textarea
                  id="base64"
                  value={base64String}
                  readOnly
                  rows={4}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="mt-4">
                <Label htmlFor="jsonEditor">{mode === 'ocr' ? 'Extracted Text' : 'Editable JSON'}</Label>
                <Textarea
                  id="jsonEditor"
                  value={outputJSON}
                  onChange={handleJSONChange}
                  rows={10}
                  placeholder={mode === 'ocr' ? "Extracted text will appear here" : "Enter or edit JSON here"}
                />
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (mode === 'ocr') {
                      // Handle saving OCR text (you can adjust based on your needs)
                      const textToSave = outputJSON
                      // Trigger your save logic here
                    } else {
                      // Handle saving structured JSON
                      const jsonToSave = outputJSON
                      // Trigger your save logic here
                    }
                  }}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  Save Output
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
