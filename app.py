"""
Frontend Web Interface for AI-Generated Image Detection System
Multi-branch architecture with Frequency Domain, Noise Residual, and Diffusion-Aware detection
Modern Flask-based UI with HTML5, CSS3, and JavaScript
"""
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from PIL import Image
import sys
import os
import webbrowser
from threading import Thread
import time

# Add src path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from predict import HybridAIDetector
from advanced_features import MultibranchFeatureExtractor
import numpy as np

# Branch feature keys — must match advanced_features.py
FREQ_KEYS  = sorted(['fft_mean','fft_std','fft_median','fft_log_mean','fft_log_std','fft_energy',
                     'dct_mean','dct_std','dct_max','dct_min',
                     'wavelet_mean','wavelet_std','wavelet_max'])
NOISE_KEYS = sorted(['residual_mean','residual_std','residual_energy',
                     'laplacian_mean','laplacian_std','laplacian_max',
                     'gradient_mean','gradient_std'])
DIFF_KEYS  = sorted(['smoothness_std','smoothness_var','color_diff',
                     'noise_pattern','freq_artifact'])


def compute_branch_intensities(feature_dict):
    """
    Compute independent 0-100 intensity scores per branch.
    Each branch is scored independently (NOT normalized against each other).
    Uses log-scaling per feature so vastly different magnitudes
    (e.g. fft_energy=1e9 vs residual_mean=0.003) all contribute equally.
    """
    def log_scale(v):
        """Map any positive float to a comparable scale via log1p."""
        try:
            return float(np.log1p(abs(float(v))))
        except:
            return 0.0

    def branch_score(keys):
        vals = [log_scale(feature_dict[k]) for k in keys if k in feature_dict and feature_dict[k] is not None]
        return float(np.mean(vals)) if vals else 0.0

    freq_raw  = branch_score(FREQ_KEYS)
    noise_raw = branch_score(NOISE_KEYS)
    diff_raw  = branch_score(DIFF_KEYS)

    # Compute individual scores on 0-100 scale using sigmoid-like mapping
    # This allows each branch to independently express its confidence
    def normalize_score(raw_val):
        """Map log-scaled value to 0-100 range."""
        # Sigmoid-like curve: maps log-scaled values to percentages
        # Values around 2.0 map to ~50%, values > 4.0 map to >85%
        return float(100.0 / (1.0 + np.exp(-0.5 * (raw_val - 2.5))))

    return {
        'frequency':       round(normalize_score(freq_raw), 1),
        'noise_residual':  round(normalize_score(noise_raw), 1),
        'diffusion_aware': round(normalize_score(diff_raw), 1),
    }

# Flask app setup
app = Flask(__name__,
            template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
            static_folder=os.path.join(os.path.dirname(__file__), 'static'))

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# Global detector instance
detector = None


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({'status': 'ready' if detector else 'loading'})


@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, bmp, gif'}), 400

        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Validate image
        try:
            img = Image.open(file_path)
            img.load()
            if img.size[0] < 256 or img.size[1] < 256:
                return jsonify({'error': 'Image too small. Minimum: 256x256 pixels'}), 400
        except Exception as e:
            return jsonify({'error': f'Invalid image file: {str(e)}'}), 400

        # Run prediction
        if not detector:
            return jsonify({'error': 'Model not loaded yet'}), 503

        results = detector.predict(file_path)
        if results is None or not isinstance(results, dict):
            return jsonify({'error': 'Model returned no results'}), 500

        # Re-extract feature dict for branch intensity scores
        try:
            _, feature_dict = detector.feature_extractor.extract_all_features(file_path)
            branch_intensities = compute_branch_intensities(feature_dict)
        except:
            branch_intensities = {'frequency': 0.0, 'noise_residual': 0.0, 'diffusion_aware': 0.0}

        # Build clean response — only what the frontend needs
        response_data = {
            'is_fake':            int(results.get('is_fake', 0)),
            'confidence':         float(results.get('confidence', 0)),
            'nn_prediction':      int(results['nn_prediction']) if results.get('nn_prediction') is not None else None,
            'nn_confidence':      float(results['nn_confidence']) if results.get('nn_confidence') is not None else None,
            'ml_prediction':      int(results['ml_prediction']) if results.get('ml_prediction') is not None else None,
            'ml_confidence':      float(results['ml_confidence']) if results.get('ml_confidence') is not None else None,
            'branch_weights':     {k: float(v) for k, v in (results.get('branch_weights') or {}).items()},
            'branch_intensities': branch_intensities,
        }

        # Clean up uploaded file
        try:
            os.remove(file_path)
        except:
            pass

        return jsonify(response_data)

    except Exception as e:
        print(f"Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


def load_model_background():
    global detector
    time.sleep(1)
    try:
        print("Loading AI detector model...")
        detector = HybridAIDetector()
        print("✓ Model loaded successfully")
    except Exception as e:
        print(f"✗ Failed to load model: {e}")
        detector = None


def open_browser():
    time.sleep(2)
    webbrowser.open('http://localhost:5000')


def main():
    model_thread = Thread(target=load_model_background, daemon=True)
    model_thread.start()

    browser_thread = Thread(target=open_browser, daemon=True)
    browser_thread.start()

    print("Starting Reality Check AI Server...")
    print("Open http://localhost:5000 in your browser")

    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)


if __name__ == "__main__":
    main()