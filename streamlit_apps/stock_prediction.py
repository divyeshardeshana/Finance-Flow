import streamlit as st
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import plotly.graph_objects as go
import plotly.express as px

st.set_page_config(
    page_title="Stock Price Prediction",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("📈 Stock Price Prediction Tool")
st.markdown("""
This application uses machine learning to predict stock prices based on historical data.
Enter a stock symbol and select your prediction parameters to get started.
""")

with st.sidebar:
    st.header("Configuration")

    stock_symbol = st.text_input(
        "Stock Symbol",
        value="AAPL",
        help="Enter a valid stock ticker symbol (e.g., AAPL, GOOGL, MSFT)"
    ).upper()

    prediction_days = st.slider(
        "Prediction Days",
        min_value=1,
        max_value=30,
        value=7,
        help="Number of days to predict into the future"
    )

    historical_days = st.slider(
        "Historical Data (Days)",
        min_value=30,
        max_value=365,
        value=90,
        help="Number of historical days to use for training"
    )

    model_type = st.selectbox(
        "Prediction Model",
        ["Linear Regression", "Random Forest"],
        help="Choose the machine learning model to use"
    )

    predict_button = st.button("🔮 Generate Prediction", type="primary", use_container_width=True)

@st.cache_data(ttl=3600)
def fetch_stock_data(symbol, days):
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        stock = yf.Ticker(symbol)
        df = stock.history(start=start_date, end=end_date)

        if df.empty:
            return None, None

        info = stock.info
        return df, info
    except Exception as e:
        st.error(f"Error fetching data: {str(e)}")
        return None, None

def prepare_data(df):
    df = df.copy()
    df['Day'] = range(len(df))
    df['MA_7'] = df['Close'].rolling(window=7, min_periods=1).mean()
    df['MA_21'] = df['Close'].rolling(window=21, min_periods=1).mean()
    df['Volatility'] = df['Close'].rolling(window=7, min_periods=1).std()
    df['Price_Change'] = df['Close'].pct_change()
    df = df.fillna(method='bfill')
    return df

def train_model(df, model_type):
    prepared_df = prepare_data(df)

    features = ['Day', 'MA_7', 'MA_21', 'Volatility', 'Volume']
    X = prepared_df[features].values
    y = prepared_df['Close'].values

    scaler_X = MinMaxScaler()
    scaler_y = MinMaxScaler()

    X_scaled = scaler_X.fit_transform(X)
    y_scaled = scaler_y.fit_transform(y.reshape(-1, 1))

    if model_type == "Linear Regression":
        model = LinearRegression()
    else:
        model = RandomForestRegressor(n_estimators=100, random_state=42)

    model.fit(X_scaled, y_scaled.ravel())

    return model, scaler_X, scaler_y, features

def predict_future(model, df, scaler_X, scaler_y, features, days):
    prepared_df = prepare_data(df)
    last_day = prepared_df['Day'].iloc[-1]

    predictions = []
    current_df = prepared_df.copy()

    for i in range(days):
        next_day = last_day + i + 1

        last_ma7 = current_df['MA_7'].iloc[-7:].mean()
        last_ma21 = current_df['MA_21'].iloc[-21:].mean()
        last_volatility = current_df['Volatility'].iloc[-7:].mean()
        last_volume = current_df['Volume'].iloc[-1]

        next_features = np.array([[next_day, last_ma7, last_ma21, last_volatility, last_volume]])
        next_features_scaled = scaler_X.transform(next_features)

        predicted_scaled = model.predict(next_features_scaled)
        predicted_price = scaler_y.inverse_transform(predicted_scaled.reshape(-1, 1))[0][0]

        predictions.append(predicted_price)

        new_row = pd.DataFrame({
            'Close': [predicted_price],
            'Day': [next_day],
            'Volume': [last_volume],
            'MA_7': [last_ma7],
            'MA_21': [last_ma21],
            'Volatility': [last_volatility]
        })
        current_df = pd.concat([current_df, new_row], ignore_index=True)
        current_df = prepare_data(current_df[['Close', 'Day', 'Volume']])

    return predictions

if predict_button and stock_symbol:
    with st.spinner(f"Fetching data for {stock_symbol}..."):
        df, info = fetch_stock_data(stock_symbol, historical_days)

    if df is not None and not df.empty:
        col1, col2, col3, col4 = st.columns(4)

        current_price = df['Close'].iloc[-1]
        price_change = df['Close'].iloc[-1] - df['Close'].iloc[-2]
        price_change_pct = (price_change / df['Close'].iloc[-2]) * 100

        with col1:
            st.metric(
                "Current Price",
                f"${current_price:.2f}",
                f"{price_change:.2f} ({price_change_pct:.2f}%)"
            )

        with col2:
            st.metric("52 Week High", f"${df['Close'].max():.2f}")

        with col3:
            st.metric("52 Week Low", f"${df['Close'].min():.2f}")

        with col4:
            avg_volume = df['Volume'].mean()
            st.metric("Avg Volume", f"{avg_volume:,.0f}")

        if info:
            st.subheader(f"📊 {info.get('longName', stock_symbol)}")
            with st.expander("Company Information"):
                col1, col2 = st.columns(2)
                with col1:
                    st.write(f"**Sector:** {info.get('sector', 'N/A')}")
                    st.write(f"**Industry:** {info.get('industry', 'N/A')}")
                    st.write(f"**Market Cap:** ${info.get('marketCap', 0):,}")
                with col2:
                    st.write(f"**P/E Ratio:** {info.get('trailingPE', 'N/A')}")
                    st.write(f"**EPS:** {info.get('trailingEps', 'N/A')}")
                    st.write(f"**Dividend Yield:** {info.get('dividendYield', 'N/A')}")

        with st.spinner("Training model and generating predictions..."):
            model, scaler_X, scaler_y, features = train_model(df, model_type)
            predictions = predict_future(model, df, scaler_X, scaler_y, features, prediction_days)

        st.success("✅ Predictions generated successfully!")

        future_dates = pd.date_range(
            start=df.index[-1] + timedelta(days=1),
            periods=prediction_days,
            freq='D'
        )

        prediction_df = pd.DataFrame({
            'Date': future_dates,
            'Predicted Price': predictions
        })

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=df.index,
            y=df['Close'],
            mode='lines',
            name='Historical Price',
            line=dict(color='blue', width=2)
        ))

        fig.add_trace(go.Scatter(
            x=prediction_df['Date'],
            y=prediction_df['Predicted Price'],
            mode='lines+markers',
            name='Predicted Price',
            line=dict(color='red', width=2, dash='dash'),
            marker=dict(size=8)
        ))

        fig.update_layout(
            title=f"{stock_symbol} - Historical and Predicted Prices",
            xaxis_title="Date",
            yaxis_title="Price ($)",
            hovermode='x unified',
            height=500,
            showlegend=True,
            legend=dict(
                yanchor="top",
                y=0.99,
                xanchor="left",
                x=0.01
            )
        )

        st.plotly_chart(fig, use_container_width=True)

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("📅 Prediction Results")
            prediction_df['Date'] = prediction_df['Date'].dt.strftime('%Y-%m-%d')
            prediction_df['Change from Current'] = prediction_df['Predicted Price'] - current_price
            prediction_df['Change %'] = ((prediction_df['Predicted Price'] - current_price) / current_price * 100)

            st.dataframe(
                prediction_df.style.format({
                    'Predicted Price': '${:.2f}',
                    'Change from Current': '${:.2f}',
                    'Change %': '{:.2f}%'
                }),
                use_container_width=True,
                hide_index=True
            )

        with col2:
            st.subheader("📈 Price Statistics")

            predicted_high = max(predictions)
            predicted_low = min(predictions)
            predicted_avg = np.mean(predictions)
            final_prediction = predictions[-1]

            stats_df = pd.DataFrame({
                'Metric': [
                    'Final Predicted Price',
                    'Predicted High',
                    'Predicted Low',
                    'Predicted Average',
                    'Expected Change',
                    'Expected Change %'
                ],
                'Value': [
                    f"${final_prediction:.2f}",
                    f"${predicted_high:.2f}",
                    f"${predicted_low:.2f}",
                    f"${predicted_avg:.2f}",
                    f"${final_prediction - current_price:.2f}",
                    f"{((final_prediction - current_price) / current_price * 100):.2f}%"
                ]
            })

            st.dataframe(stats_df, use_container_width=True, hide_index=True)

        st.info("""
        **⚠️ Disclaimer:** This prediction tool is for educational purposes only.
        Stock predictions are based on historical data and machine learning models,
        which cannot account for unforeseen events, market sentiment, or breaking news.
        Always do your own research and consult with financial advisors before making investment decisions.
        """)

        with st.expander("📊 Technical Indicators"):
            prepared_df = prepare_data(df)

            fig2 = go.Figure()

            fig2.add_trace(go.Scatter(
                x=prepared_df.index,
                y=prepared_df['Close'],
                name='Close Price',
                line=dict(color='blue')
            ))

            fig2.add_trace(go.Scatter(
                x=prepared_df.index,
                y=prepared_df['MA_7'],
                name='7-Day MA',
                line=dict(color='orange', dash='dash')
            ))

            fig2.add_trace(go.Scatter(
                x=prepared_df.index,
                y=prepared_df['MA_21'],
                name='21-Day MA',
                line=dict(color='green', dash='dash')
            ))

            fig2.update_layout(
                title="Price with Moving Averages",
                xaxis_title="Date",
                yaxis_title="Price ($)",
                height=400
            )

            st.plotly_chart(fig2, use_container_width=True)
    else:
        st.error(f"❌ Could not fetch data for {stock_symbol}. Please check the symbol and try again.")

else:
    st.info("👈 Enter a stock symbol in the sidebar and click 'Generate Prediction' to get started!")

    st.markdown("""
    ### How to Use This Tool

    1. **Enter a Stock Symbol**: Type any valid stock ticker (e.g., AAPL, TSLA, GOOGL)
    2. **Configure Parameters**: Adjust prediction days and historical data range
    3. **Select Model**: Choose between Linear Regression or Random Forest
    4. **Generate Prediction**: Click the button to see predictions

    ### Features

    - 📊 Real-time stock data from Yahoo Finance
    - 🤖 Machine Learning predictions using scikit-learn
    - 📈 Interactive charts with Plotly
    - 📉 Technical indicators (Moving Averages, Volatility)
    - 💼 Company information and key metrics

    ### Popular Stock Symbols

    - **Tech**: AAPL (Apple), GOOGL (Google), MSFT (Microsoft), TSLA (Tesla)
    - **Finance**: JPM (JPMorgan), BAC (Bank of America), GS (Goldman Sachs)
    - **Retail**: AMZN (Amazon), WMT (Walmart), TGT (Target)
    - **Energy**: XOM (ExxonMobil), CVX (Chevron)
    """)

st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray; font-size: 0.8em;'>
    Built with Streamlit • Data from Yahoo Finance • Powered by Machine Learning
</div>
""", unsafe_allow_html=True)
