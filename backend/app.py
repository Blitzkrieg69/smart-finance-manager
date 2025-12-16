from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import pandas as pd
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
    period = db.Column(db.String(20), default='Monthly') # <--- NEW FIELD

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

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    txn = Transaction.query.get(id)
    if txn:
        db.session.delete(txn)
        db.session.commit()
        return jsonify({'message': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    budgets = Budget.query.all()
    return jsonify([{
        'id': b.id, 'category': b.category, 
        'limit': b.limit, 'period': b.period # <--- Send to frontend
    } for b in budgets])

@app.route('/api/budgets', methods=['POST'])
def set_budget():
    data = request.json
    budget = Budget.query.filter_by(category=data['category']).first()
    if budget:
        budget.limit = data['limit']
        budget.period = data.get('period', 'Monthly') # <--- Update period
    else:
        new_budget = Budget(
            category=data['category'], 
            limit=data['limit'],
            period=data.get('period', 'Monthly') # <--- Save period
        )
        db.session.add(new_budget)
    db.session.commit()
    return jsonify({'message': 'Budget Saved!'}), 201

@app.route('/api/budgets/<int:id>', methods=['DELETE'])
def delete_budget(id):
    budget = Budget.query.get(id)
    if budget:
        db.session.delete(budget)
        db.session.commit()
        return jsonify({'message': 'Budget Deleted'})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    desc = data.get('description', '')
    if not desc: return jsonify({'category': ''})
    return jsonify({'category': predict_category(desc)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)