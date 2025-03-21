import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

function UploadJson() {
    const [file, setFile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ positive: 0, negative: 0, neutral: 0 });

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];

        if (!selectedFile) {
            setError("❌ No file selected. Please choose a JSON file.");
            return;
        }

        if (selectedFile.type !== "application/json") {
            setError("❌ Invalid file type. Please upload a JSON file.");
            return;
        }

        if (selectedFile.size > 2 * 1024 * 1024) {
            setError("❌ File size exceeds 2MB. Please upload a smaller file.");
            return;
        }

        setFile(selectedFile);
        setError("");
    };

    

    const handleUpload = useCallback(() => {
        if (!file) {
            setError("❌ Please select a JSON file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);

                if (!Array.isArray(jsonData)) {
                    throw new Error("Invalid file format. Expected an array of objects.");
                }

                setReviews(jsonData);
                analyzeReviews(jsonData);
            } catch (err) {
                setError("❌ Invalid JSON format. Please upload a valid JSON file.");
            }
        };

        reader.readAsText(file);
    }, [file]);

    // const analyzeReviews = async (reviews) => {
    //     setLoading(true);
    //     setError("");
    
    //     try {
    //         const sentimentResults = await Promise.all(
    //             reviews.map(async (review) => {
    //                 const response = await fetch("http://127.0.0.1:5000/analyze", {
    //                     method: "POST",
    //                     headers: { "Content-Type": "application/json" },
    //                     body: JSON.stringify({ text: review.text }),
    //                 });
    
    //                 if (!response.ok) {
    //                     throw new Error(`Server Error: ${response.status}`);
    //                 }
    
    //                 const data = await response.json();
    //                 return { text: review.text, sentiment: data };
    //             })
    //         );
    
    //         console.log("🛠 Raw Sentiment Results:", sentimentResults); // Debugging Output
    //         setResults(sentimentResults);
    //     } catch (err) {
    //         setError(err.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // };
   
    const analyzeReviews = async (reviews) => {
        setLoading(true);
        setError("");
        
        // Initialize counts
        const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    
        try {
            const sentimentResults = await Promise.all(
                reviews.map(async (review) => {
                    const response = await fetch("http://127.0.0.1:5000/analyze", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: review.text }),
                    });
    
                    if (!response.ok) {
                        throw new Error(`Server Error: ${response.status}`);
                    }
    
                    const data = await response.json();
                    // Count the sentiment labels
                    const label = data.huggingface.label.toLowerCase();
                    if (label === "positive") {
                        sentimentCounts.positive += 1;
                    } else if (label === "negative") {
                        sentimentCounts.negative += 1;
                    } else {
                        sentimentCounts.neutral += 1;
                    }
    
                    return { text: review.text, sentiment: data };
                })
            );
    
            console.log("🛠 Raw Sentiment Results:", sentimentResults); // Debugging Output
            setResults(sentimentResults);
            
            // Update the summary state
            setSummary(sentimentCounts);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

        return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">📂 Upload JSON File</h2>

                <div className="flex items-center space-x-3">
                    <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleFileChange} 
                        className="border rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button 
                        onClick={handleUpload} 
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                    >
                        🔄 Upload & Analyze
                    </button>
                </div>

                {error && <p className="text-red-500 mt-3">{error}</p>}
                {loading && <p className="text-blue-500 mt-3">⏳ Analyzing reviews...</p>}

                <Link to="/" className="block text-center mt-4">
                    <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
                        🔙 Back
                    </button>
                </Link>

                {results.length > 0 && (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">📊 Sentiment Summary:</h3>
        <div className="flex justify-around text-center">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg">
                ✅ Positive: {summary.positive}
            </div>
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg">
                ❌ Negative: {summary.negative}
            </div>
            <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg">
                ⚖️ Neutral: {summary.neutral}
            </div>
        </div>
    </div>
)}


                {results.length > 0 && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-md overflow-x-auto">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">📊 Sentiment Analysis Results:</h3>
                        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg text-sm">
                            <thead>
                                <tr className="bg-gray-200 text-gray-700 text-center">
                                    <th className="border p-3">📝 Review</th>
                                    <th className="border p-3">🤖 Hugging Face</th>
                                    <th className="border p-3">📝 VADER</th>
                                    <th className="border p-3">📡 RoBERTa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result, index) => (
                                    <tr key={index} className="border text-gray-700 text-center">
                                        <td className="border p-3">{result.text}</td>
                                        <td className="border p-3">
                                            <span className={`px-2 py-1 rounded-full text-white text-xs font-bold ${
                                                result.sentiment.huggingface.label === "positive" ? "bg-green-500" :
                                                result.sentiment.huggingface.label === "negative" ? "bg-red-500" : "bg-yellow-500"
                                            }`}>
                                                {result.sentiment.huggingface.label.toUpperCase()}
                                            </span>
                                            <br />
                                            <span className="text-gray-600 text-xs">
                                                ({(result.sentiment.huggingface.score * 100).toFixed(2)}%)
                                            </span>
                                        </td>
                                        <td className="border p-3">
                                            <div className="flex flex-col items-center space-y-1">
                                                <span className="text-green-500">✅ {result.sentiment.vader.pos.toFixed(2)}%</span>
                                                <span className="text-yellow-500">⚖️ {result.sentiment.vader.neu.toFixed(2)}%</span>
                                                <span className="text-red-500">❌ {result.sentiment.vader.neg.toFixed(2)}%</span>
                                            </div>
                                        </td>
                                        <td className="border p-3">
                                            <div className="flex flex-col items-center space-y-1">
                                                <span className="text-green-500">✅ {result.sentiment.roberta.roberta_pos.toFixed(2)}%</span>
                                                <span className="text-yellow-500">⚖️ {result.sentiment.roberta.roberta_neu.toFixed(2)}%</span>
                                                <span className="text-red-500">❌ {result.sentiment.roberta.roberta_neg.toFixed(2)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UploadJson;
