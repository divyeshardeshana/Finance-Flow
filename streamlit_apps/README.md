# Stock Price Prediction Streamlit App

A machine learning-powered stock price prediction tool built with Streamlit.

## Features

- Real-time stock data fetching from Yahoo Finance
- Machine learning predictions using Linear Regression and Random Forest models
- Interactive charts and visualizations
- Technical indicators (Moving Averages, Volatility)
- Company information and key financial metrics
- Customizable prediction parameters

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Run the Streamlit app:

```bash
streamlit run stock_prediction.py
```

The app will open in your default web browser at `http://localhost:8501`

## How It Works

1. **Data Collection**: Fetches historical stock data from Yahoo Finance using the `yfinance` library
2. **Feature Engineering**: Creates technical indicators like Moving Averages and Volatility
3. **Model Training**: Trains a machine learning model on historical data
4. **Prediction**: Generates future price predictions based on the trained model
5. **Visualization**: Displays results with interactive charts using Plotly

## Configuration Options

- **Stock Symbol**: Enter any valid ticker symbol (e.g., AAPL, GOOGL, TSLA)
- **Prediction Days**: Choose how many days to predict (1-30 days)
- **Historical Data**: Select amount of historical data to use for training (30-365 days)
- **Model Type**: Choose between Linear Regression or Random Forest

## Disclaimer

This tool is for educational purposes only. Stock predictions are based on historical data and machine learning models, which cannot account for unforeseen events, market sentiment, or breaking news. Always conduct your own research and consult with financial advisors before making investment decisions.

## Technologies Used

- **Streamlit**: Web application framework
- **yfinance**: Stock data retrieval
- **scikit-learn**: Machine learning models
- **pandas**: Data manipulation
- **numpy**: Numerical computations
- **plotly**: Interactive visualizations
