import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import UploadJson from "./UploadJson";

function App() {
    const [review, setReview] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const analyzeSentiment = async () => {
        if (!review.trim()) {
            setError("❌ Please enter a review.");
            return;
        }
        setError("");

        try {
            const response = await fetch("http://127.0.0.1:5000/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: review }),
            });

            if (!response.ok) {
                throw new Error(`Server Error: ${response.status}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRefresh = () => {
        setReview("");
        setResult(null);
        setError("");
    };

    return (
        <Router>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
                <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
                    <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
                        🧠 Sentiment Analysis
                    </h2>
                    <textarea
                        rows="4"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="💬 Enter your review here..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                    ></textarea>

                    <div className="flex justify-between mt-4">
                        <button
                            onClick={analyzeSentiment}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                            🔍 Analyze Sentiment
                        </button>
                        <Link to="/upload">
                            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                                📂 Upload JSON
                            </button>
                        </Link>
                        <button
                            onClick={handleRefresh}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {error && <p className="text-red-500 mt-3">{error}</p>}

                    {result && (
                        <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">📊 Analysis Results:</h3>
                            <p><strong>🤖 Hugging Face:</strong> {result.huggingface.label} ({(result.huggingface.score * 100).toFixed(2)}%)</p>
                            <p><strong>📝 VADER:</strong> 
                                ✅ Positive: {(result.vader.pos * 100).toFixed(2)}%, 
                                ⚖️ Neutral: {(result.vader.neu * 100).toFixed(2)}%, 
                                ❌ Negative: {(result.vader.neg * 100).toFixed(2)}%</p>
                            <p><strong>📡 RoBERTa:</strong> 
                                ✅ Positive: {(result.roberta.roberta_pos * 100).toFixed(2)}%, 
                                ⚖️ Neutral: {(result.roberta.roberta_neu * 100).toFixed(2)}%, 
                                ❌ Negative: {(result.roberta.roberta_neg * 100).toFixed(2)}%</p>
                        </div>
                    )}
                </div>

                <Routes>
                    <Route path="/upload" element={<UploadJson />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;