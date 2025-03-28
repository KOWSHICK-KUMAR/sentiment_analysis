from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from scipy.special import softmax
import torch

# Initialize Flask
app = Flask(__name__)
CORS(app, origins=["https://sentiment-analysis-review.vercel.app"])

# Initialize SentimentIntensityAnalyzer (VADER)
nltk.download('vader_lexicon')
sia = SentimentIntensityAnalyzer()

def analyze_sentiment_vader(text):
    """Analyze sentiment using VADER."""
    return sia.polarity_scores(text)

# Load pre-trained RoBERTa Model
MODEL = "cardiffnlp/twitter-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForSequenceClassification.from_pretrained(MODEL)

def polarity_scores_roberta(text):
    """Analyze sentiment using RoBERTa transformer model."""
    try:
        encoded_text = tokenizer(text, return_tensors='pt')
        with torch.no_grad():
            output = model(**encoded_text)
        scores = output[0][0].detach().numpy()
        scores = softmax(scores)
        return {
            'roberta_neg': float(scores[0]),
            'roberta_neu': float(scores[1]),
            'roberta_pos': float(scores[2])
        }
    except Exception as e:
        return {"error": str(e)}

# Sentiment Pipeline using Hugging Face
sent_pipeline = pipeline("sentiment-analysis")

@app.route('/analyze', methods=['POST'])
def analyze():
    """API endpoint for sentiment analysis."""
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "No text provided"}), 400  # Bad Request

        text = data["text"]
        vader_result = analyze_sentiment_vader(text)
        roberta_result = polarity_scores_roberta(text)
        hf_result = sent_pipeline(text)[0]

        response = {
            "vader": vader_result,
            "roberta": roberta_result,
            "huggingface": {"label": hf_result['label'], "score": hf_result['score']}
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Internal Server Error

if __name__ == "__main__":
    app.run(debug=True)
