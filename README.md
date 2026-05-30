# Reality Check AI

## AI-Powered Image Authenticity Detection System

Reality Check AI is a machine learning and digital image forensics platform designed to identify whether an image is authentic or AI-generated/manipulated.

The system combines multiple forensic analysis techniques to detect hidden artifacts that are often invisible to the human eye. By leveraging frequency-domain analysis, noise residual examination, and diffusion artifact detection, Reality Check AI provides an explainable confidence-based prediction through an interactive web dashboard.

---

## Problem Statement

With the rapid growth of generative AI tools, distinguishing between real and AI-generated images has become increasingly challenging.

Misinformation, deepfakes, synthetic media, and manipulated content can easily spread across social media and digital platforms.

Reality Check AI aims to improve trust in digital content by providing a forensic-based image verification system.

---
## 📸 Screenshots

<img src="https://github.com/Yash2005e/Reality-Check-AI/blob/main/Screenshot%202026-04-23%20121612.png" width="100%" />

<img src="screenshots/real-detection.png" width="100%" />

<img src="screenshots/dashboard.png" width="100%" />


## Features

* AI-generated image detection
* Manipulated image analysis
* Real image verification
* Multi-branch forensic pipeline
* Confidence-based prediction
* Explainable AI results
* Interactive web dashboard
* Detection analysis charts
* Image upload and real-time analysis
* Dark and Light mode support

---

## Detection Pipeline

The system combines evidence from multiple forensic branches:

### 1. Frequency Domain Analysis

Analyzes hidden frequency patterns using:

* FFT (Fast Fourier Transform)
* DCT (Discrete Cosine Transform)
* Wavelet Features

### 2. Noise Residual Analysis

Examines image noise characteristics through:

* Laplacian Features
* Gradient Analysis
* Noise Residual Mapping

### 3. Diffusion Artifact Detection

Detects traces commonly found in AI-generated images:

* Over-smoothing
* Texture inconsistencies
* Diffusion artifacts
* Color distribution anomalies

The outputs of all branches are aggregated to generate the final confidence score.

---

## System Architecture

Input Image
↓
Preprocessing
↓
Feature Extraction
├── Frequency Domain Branch
├── Noise Residual Branch
└── Diffusion Artifact Branch
↓
Confidence Aggregation
↓
Final Prediction
↓
Interactive Dashboard

---

## Screenshots

### AI Generated / Manipulated Detection

Upload an image and receive confidence-based authenticity analysis.

### Real Image Detection

The system evaluates multiple forensic indicators before classifying an image as authentic.

### Detection Analytics Dashboard

Visualizes:

* Confidence Scores
* Branch Contributions
* Model Comparison
* Detection Summary

---

## Technology Stack

### Backend

* Python
* Flask

### Machine Learning

* Scikit-learn
* TensorFlow / PyTorch
* NumPy

### Computer Vision

* OpenCV

### Frontend

* HTML
* CSS
* JavaScript
* Bootstrap

### Data Visualization

* Chart.js

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Yash2005e/Reality-Check-AI.git
cd Reality-Check-AI
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the application:

```bash
python app.py
```

Open:

```text
http://localhost:5000
```

---

## Dataset

The training dataset is not included in this repository due to size limitations.

Dataset Sources:

* Public real image datasets
* Public AI-generated image datasets
* Additional curated image samples

---

## Project Goals

* Improve digital media trust
* Detect AI-generated content
* Increase transparency in image verification
* Provide explainable forensic analysis
* Build accessible AI-forensics tools

---

## Future Improvements

* Deepfake detection support
* Video authenticity analysis
* Transformer-based detection models
* API integration
* Batch image processing
* Mobile application support
* Explainable AI heatmaps
* Real-time browser extension

---

## Learning Outcomes

Through this project, I explored:

* Computer Vision
* Machine Learning
* Image Forensics
* Feature Engineering
* Ensemble Decision Systems
* Explainable AI
* Full Stack Development
* Model Evaluation and Validation

---

## Author

Yash Patil

Final Year Information Technology Engineering Student

Passionate about Artificial Intelligence, Computer Vision, Digital Forensics, and Building Real-World Software Solutions.

---

## License

This project is intended for educational, research, and portfolio purposes.
