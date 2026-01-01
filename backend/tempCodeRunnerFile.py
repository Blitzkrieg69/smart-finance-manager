from flask import Flask, jsonify, request, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import pandas as pd
import io
import yfinance as yf # <--- NEW LIBRARY
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

app = Flask(__name__)
CORS(app)

# Database Config
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
    ticker = db.Column(db.String(20), nullable=False) # <--- NEW FIELD (e.g. AAPL)
    category = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    buy_price = db.Column(db.Float, nullable=False)
    current_price = db.Column(db.Float, nullable=False)

with app.app_context():
    db.create_all()

# --- AI ENGINE ---
training_data = [
    ("Uber ride", "Transport"), ("Starbucks", "Food"), ("Salary", "Salary"),
    ("Freelance work", "Income"), ("Netflix", "Entertainment"), ("Rent", "Rent"),
    ("Gym", "Health"), ("Groceries", "Food"), ("Electric Bill", "Utilities")
]

def predict_category(text):
    txns = Transaction.query.all()
    db_data = [(t.description, t.category) for t in txns if t.description]
    all_data = training_data + db_data
    texts, labels = zip(*all_data)
    model = make_pipeline(CountVectorizer(), MultinomialNB())
    model.fit(texts, labels)
    return model.predict([text])[0]

# --- ROUTES ---

# 1. TRANSACTIONS & BUDGETS (Standard)
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    txns = Transaction.query.all()
    return jsonify([{
        'id': t.id, 'amount': t.amount, 'category': t.category, 
        'description': t.description, 'type': t.type, 
        'date': t.date, 'recurrence': t.recurrence
    } for t in txns])

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    new_txn = Transaction(
        amount=data['amount'], category=data['category'], 
        description=data.get('description', ''), type=data['type'], 
        date=data.get('date', '2025-01-01'), recurrence=data.get('recurrence', 'None')
    )
    db.session.add(new_txn)
    db.session.commit()
    return jsonify({'message': 'Added!'}), 201

@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    data = request.json
    txn = Transaction.query.get(id)
    if not txn: return jsonify({'error': 'Not found'}), 404
    txn.amount = data['amount']
    txn.category = data['category']
    txn.description = data.get('description', '')
    txn.date = data.get('date', txn.date)
    txn.recurrence = data.get('recurrence', 'None')
    db.session.commit()
    return jsonify({'message': 'Updated'})

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    txn = Transaction.query.get(id)
    if txn: db.session.delete(txn); db.session.commit(); return jsonify({'message': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    budgets = Budget.query.all()
    return jsonify([{'id': b.id, 'category': b.category, 'limit': b.limit, 'period': b.period} for b in budgets])

@app.route('/api/budgets', methods=['POST'])
def set_budget():
    data = request.json
    budget = Budget.query.filter_by(category=data['category']).first()
    if budget:
        budget.limit = data['limit']
        budget.period = data.get('period', 'Monthly')
    else:
        new_budget = Budget(category=data['category'], limit=data['limit'], period=data.get('period', 'Monthly'))
        db.session.add(new_budget)
    db.session.commit()
    return jsonify({'message': 'Saved!'}), 201

@app.route('/api/budgets/<int:id>', methods=['DELETE'])
def delete_budget(id):
    budget = Budget.query.get(id)
    if budget: db.session.delete(budget); db.session.commit(); return jsonify({'message': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

# 2. INVESTMENTS (Updated with Ticker)
@app.route('/api/investments', methods=['GET'])
def get_investments():
    invs = Investment.query.all()
    return jsonify([{
        'id': i.id, 'name': i.name, 'ticker': i.ticker, 'category': i.category,
        'quantity': i.quantity, 'buy_price': i.buy_price, 
        'current_price': i.current_price
    } for i in invs])

@app.route('/api/investments', methods=['POST'])
def add_investment():
    data = request.json
    # Fetch live price initially if possible
    live_price = float(data.get('buy_price'))
    try:
        if data.get('ticker'):
            stock = yf.Ticker(data['ticker'])
            history = stock.history(period="1d")
            if not history.empty:
                live_price = history['Close'].iloc[-1]
    except:
        pass

    new_inv = Investment(
        name=data['name'], ticker=data['ticker'], category=data['category'],
        quantity=float(data['quantity']), 
        buy_price=float(data['buy_price']),
        current_price=live_price
    )
    db.session.add(new_inv)
    db.session.commit()
    return jsonify({'message': 'Investment Added'}), 201

@app.route('/api/investments/<int:id>', methods=['DELETE'])
def delete_investment(id):
    inv = Investment.query.get(id)
    if inv: db.session.delete(inv); db.session.commit(); return jsonify({'message': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

# --- NEW ROUTE: REFRESH PRICES ---
@app.route('/api/investments/refresh', methods=['POST'])
def refresh_prices():
    investments = Investment.query.all()
    updated_count = 0
    
    for inv in investments:
        try:
            if inv.ticker:
                stock = yf.Ticker(inv.ticker)
                # Get the latest closing price
                data = stock.history(period="1d")
                if not data.empty:
                    latest_price = data['Close'].iloc[-1]
                    inv.current_price = float(latest_price)
                    updated_count += 1
        except Exception as e:
            print(f"Error updating {inv.ticker}: {e}")
            continue
            
    db.session.commit()
    return jsonify({'message': f'Updated {updated_count} assets'}), 200

# 3. EXTRAS
@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    desc = data.get('description', '')
    if not desc: return jsonify({'category': ''})
    return jsonify({'category': predict_category(desc)})

@app.route('/api/export', methods=['POST'])
def export_data():
    try:
        data = request.json
        start_date = data.get('start_date', '2000-01-01')
        end_date = data.get('end_date', '2099-12-31')
        txn_type = data.get('type', 'all') 
        query = Transaction.query.filter(Transaction.date >= start_date, Transaction.date <= end_date)
        if txn_type != 'all': query = query.filter(Transaction.type == txn_type)
        txns = query.all()
        if not txns: return jsonify({'error': 'No data found'}), 404
        txn_list = [{'Date': t.date, 'Type': t.type, 'Category': t.category, 'Amount': t.amount, 'Description': t.description} for t in txns]
        df = pd.DataFrame(txn_list)
        output = io.BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return send_file(output, mimetype='text/csv', as_attachment=True, download_name='report.csv')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)