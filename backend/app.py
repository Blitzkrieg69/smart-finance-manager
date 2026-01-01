from flask import Flask, jsonify, request, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import pandas as pd
import io
import requests
import yfinance as yf
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LinearRegression
import numpy as np
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# --- CONFIG ---
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'finance.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- MODELS ---
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    type = db.Column(db.String(10), nullable=False)
    date = db.Column(db.String(20))
    recurrence = db.Column(db.String(20), default='None')

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), unique=True, nullable=False)
    limit = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), default='Monthly')

class Investment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    ticker = db.Column(db.String(20), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    buy_price = db.Column(db.Float, nullable=False)
    current_price = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(20))
    currency = db.Column(db.String(10), default='USD')
    exchange = db.Column(db.String(20), default='Unknown')

# --- NEW: GOAL MODEL (This was missing!) ---
class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    saved_amount = db.Column(db.Float, default=0.0)
    deadline = db.Column(db.String(20), nullable=False) # Format: YYYY-MM-DD
    color = db.Column(db.String(20), default='#6366f1') # Hex Color

with app.app_context():
    db.create_all()

# --- HELPER: CURRENCY ---
def get_usd_to_inr():
    try:
        ticker = yf.Ticker("INR=X")
        data = ticker.history(period="1d")
        if not data.empty: return float(data['Close'].iloc[-1])
    except: pass
    return 84.0

# --- ROUTES ---

# 1. GOALS (This was missing!)
@app.route('/api/goals', methods=['GET'])
def get_goals():
    goals = Goal.query.all()
    return jsonify([{
        'id': g.id, 'name': g.name, 'target_amount': g.target_amount,
        'saved_amount': g.saved_amount, 'deadline': g.deadline, 'color': g.color
    } for g in goals])

@app.route('/api/goals', methods=['POST'])
def add_goal():
    data = request.json
    new_goal = Goal(
        name=data['name'], 
        target_amount=float(data['target_amount']),
        saved_amount=float(data.get('saved_amount', 0)),
        deadline=data['deadline'],
        color=data.get('color', '#6366f1')
    )
    db.session.add(new_goal)
    db.session.commit()
    return jsonify({'message': 'Goal Added'}), 201

@app.route('/api/goals/<int:id>', methods=['PUT'])
def update_goal(id):
    data = request.json
    goal = Goal.query.get(id)
    if not goal: return jsonify({'error': 'Not found'}), 404
    
    if 'saved_amount' in data: goal.saved_amount = float(data['saved_amount'])
    if 'name' in data: goal.name = data['name']
    if 'target_amount' in data: goal.target_amount = float(data['target_amount'])
    if 'deadline' in data: goal.deadline = data['deadline']
    
    db.session.commit()
    return jsonify({'message': 'Goal Updated'})

@app.route('/api/goals/<int:id>', methods=['DELETE'])
def delete_goal(id):
    goal = Goal.query.get(id)
    if goal: db.session.delete(goal); db.session.commit(); return jsonify({'message': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

# 2. INVESTMENTS
@app.route('/api/investments', methods=['GET'])
def get_investments():
    invs = Investment.query.all()
    rate = get_usd_to_inr()
    return jsonify({
        'rate': rate,
        'investments': [{
            'id': i.id, 'name': i.name, 'ticker': i.ticker, 'category': i.category,
            'quantity': i.quantity, 'buy_price': i.buy_price, 
            'current_price': i.current_price, 'date': i.date,
            'currency': i.currency, 'exchange': i.exchange
        } for i in invs]
    })

@app.route('/api/investments', methods=['POST'])
def add_investment():
    data = request.json
    live_price = float(data.get('buy_price'))
    asset_currency = 'USD'

    try:
        if data.get('ticker'):
            stock = yf.Ticker(data['ticker'])
            history = stock.history(period="1d")
            if not history.empty: live_price = history['Close'].iloc[-1]
            
            ticker_name = data['ticker'].upper()
            if ticker_name.endswith('.NS') or ticker_name.endswith('.BO'): asset_currency = 'INR'
            elif data['category'] in ['Crypto', 'Gold']: asset_currency = 'USD'
            else:
                meta = stock.history_metadata
                if meta and 'currency' in meta: asset_currency = meta['currency']
    except: pass

    new_inv = Investment(
        name=data['name'], ticker=data['ticker'], category=data['category'],
        quantity=float(data['quantity']), buy_price=float(data['buy_price']),
        current_price=live_price, date=data.get('date', datetime.now().strftime('%Y-%m-%d')),
        currency=asset_currency, exchange=data.get('exchange', 'Unknown')
    )
    db.session.add(new_inv); db.session.commit()
    return jsonify({'message': 'Investment Added'}), 201

@app.route('/api/investments/<int:id>', methods=['PUT'])
def update_investment(id):
    data = request.json; inv = Investment.query.get(id)
    if not inv: return jsonify({'error': 'Not found'}), 404
    inv.name = data['name']; inv.ticker = data['ticker']; inv.category = data['category']
    inv.quantity = float(data['quantity']); inv.buy_price = float(data['buy_price'])
    inv.current_price = float(data['current_price']); inv.date = data.get('date', inv.date)
    db.session.commit(); return jsonify({'message': 'Updated'})

@app.route('/api/investments/<int:id>', methods=['DELETE'])
def delete_investment(id):
    inv = Investment.query.get(id); 
    if inv: db.session.delete(inv); db.session.commit(); return jsonify({'message': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/investments/refresh', methods=['POST'])
def refresh_prices():
    investments = Investment.query.all(); updated_count = 0
    for inv in investments:
        try:
            if inv.ticker:
                stock = yf.Ticker(inv.ticker); data = stock.history(period="1d")
                if not data.empty: inv.current_price = float(data['Close'].iloc[-1]); updated_count += 1
        except: continue
    db.session.commit(); return jsonify({'message': f'Updated {updated_count} assets'}), 200

# 3. SEARCH
@app.route('/api/search', methods=['GET'])
def search_assets():
    query = request.args.get('q', '')
    if not query: return jsonify([])
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers); data = response.json(); clean_results = []
        if 'quotes' in data:
            for item in data['quotes']:
                quote_type = item.get('quoteType', '').upper(); category = None
                if quote_type == "EQUITY": category = "Stock"
                elif quote_type == "CRYPTOCURRENCY": category = "Crypto"
                elif quote_type in ["FUTURE", "COMMODITY"]: category = "Gold"
                if category:
                    clean_results.append({'symbol': item.get('symbol'), 'name': item.get('shortname', item.get('longname', item.get('symbol'))), 'category': category, 'exchange': item.get('exchDisp')})
        return jsonify(clean_results)
    except: return jsonify([])

# 4. TRANSACTIONS & BUDGETS
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    txns = Transaction.query.all()
    return jsonify([{ 'id': t.id, 'amount': t.amount, 'category': t.category, 'description': t.description, 'type': t.type, 'date': t.date, 'recurrence': t.recurrence } for t in txns])
@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json; new_txn = Transaction(amount=data['amount'], category=data['category'], description=data.get('description', ''), type=data['type'], date=data.get('date', '2025-01-01'), recurrence=data.get('recurrence', 'None'))
    db.session.add(new_txn); db.session.commit(); return jsonify({'message': 'Added!'}), 201
@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    data = request.json; txn = Transaction.query.get(id); 
    if not txn: return jsonify({'error': 'Not found'}), 404
    txn.amount = data['amount']; txn.category = data['category']; txn.description = data.get('description', ''); txn.date = data.get('date', txn.date); db.session.commit(); return jsonify({'message': 'Updated'})
@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    txn = Transaction.query.get(id); 
    if txn: db.session.delete(txn); db.session.commit(); return jsonify({'message': 'Deleted'}); 
    return jsonify({'error': 'Not found'}), 404
@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    budgets = Budget.query.all(); return jsonify([{'id': b.id, 'category': b.category, 'limit': b.limit, 'period': b.period} for b in budgets])
@app.route('/api/budgets', methods=['POST'])
def set_budget():
    data = request.json; budget = Budget.query.filter_by(category=data['category']).first()
    if budget: budget.limit = data['limit']; budget.period = data.get('period', 'Monthly')
    else: db.session.add(Budget(category=data['category'], limit=data['limit'], period=data.get('period', 'Monthly')))
    db.session.commit(); return jsonify({'message': 'Saved!'}), 201
@app.route('/api/budgets/<int:id>', methods=['DELETE'])
def delete_budget(id):
    budget = Budget.query.get(id); 
    if budget: db.session.delete(budget); db.session.commit(); return jsonify({'message': 'Deleted'}); 
    return jsonify({'error': 'Not found'}), 404
@app.route('/api/export', methods=['POST'])
def export_data():
    try:
        data = request.json; start_date = data.get('start_date', '2000-01-01'); end_date = data.get('end_date', '2099-12-31'); txn_type = data.get('type', 'all'); query = Transaction.query.filter(Transaction.date >= start_date, Transaction.date <= end_date)
        if txn_type != 'all': query = query.filter(Transaction.type == txn_type)
        txns = query.all(); 
        if not txns: return jsonify({'error': 'No data found'}), 404
        txn_list = [{'Date': t.date, 'Type': t.type, 'Category': t.category, 'Amount': t.amount, 'Description': t.description} for t in txns]
        df = pd.DataFrame(txn_list); output = io.BytesIO(); df.to_csv(output, index=False); output.seek(0)
        return send_file(output, mimetype='text/csv', as_attachment=True, download_name='report.csv')
    except Exception as e: return jsonify({'error': str(e)}), 500
@app.route('/api/predict', methods=['POST'])
def predict(): return jsonify({'category': 'Other'}) 

if __name__ == '__main__':
    app.run(debug=True, port=5000)