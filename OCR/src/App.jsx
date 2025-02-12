import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReceiptScan from './scenes/Receipt/ReceiptScan';

function App() {

  return (
    <>
     <BrowserRouter>
          <Routes>
            <Route path="/receipt-scan" element={<ReceiptScan   />} />

          </Routes>
        </BrowserRouter>
    </>
  )
}

export default App
