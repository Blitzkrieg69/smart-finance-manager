const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// --- HELPER: Calculate the next due date ---
const getNextDate = (date, recurrence) => {
  const newDate = new Date(date);
  if (recurrence === 'Daily') newDate.setDate(newDate.getDate() + 1);
  if (recurrence === 'Weekly') newDate.setDate(newDate.getDate() + 7);
  if (recurrence === 'Monthly') newDate.setMonth(newDate.getMonth() + 1);
  if (recurrence === 'Yearly') newDate.setFullYear(newDate.getFullYear() + 1);
  return newDate;
};

// 1. GET ALL TRANSACTIONS (With Auto-Create Logic)
router.get('/', async (req, res) => {
  try {
    // A. CHECK FOR OVERDUE RECURRING ITEMS
    // Find items where 'recurrence' is active AND 'nextDate' has passed (or is today)
    const overdueTransactions = await Transaction.find({
      recurrence: { $ne: 'None' },
      nextDate: { $lte: new Date() } 
    });

    // B. PROCESS LOOP: Create new copies
    for (const txn of overdueTransactions) {
      // 1. Determine the date for the NEW transaction
      const newTxnDate = txn.nextDate || new Date();

      // 2. Create the new transaction (The "Child")
      // It inherits the recurrence settings so it can spawn the NEXT one later
      const newTransaction = new Transaction({
        userId: txn.userId,
        title: txn.title,
        amount: txn.amount,
        type: txn.type,
        category: txn.category,
        description: txn.description,
        recurrence: txn.recurrence, // Pass the recurrence setting to the new one
        date: newTxnDate,
        nextDate: getNextDate(newTxnDate, txn.recurrence) // Calculate the Grandchild date
      });

      await newTransaction.save();

      // 3. Update the OLD transaction (The "Parent")
      // It is now just history, so we stop it from spawning more copies
      txn.recurrence = 'None';
      txn.nextDate = null; 
      await txn.save();
    }

    // C. FETCH EVERYTHING (Now includes the newly created ones)
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. ADD NEW TRANSACTION
router.post('/', async (req, res) => {
  try {
    const { date, recurrence } = req.body;
    
    // If user selected a recurrence, calculate when the NEXT one should happen
    let nextDate = null;
    if (recurrence && recurrence !== 'None') {
      nextDate = getNextDate(new Date(date), recurrence);
    }

    const newTransaction = new Transaction({
      ...req.body,
      nextDate: nextDate // Save the trigger date
    });
    
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error("Error Saving Transaction:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// 3. UPDATE TRANSACTION
router.put('/:id', async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } 
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(updatedTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. DELETE TRANSACTION
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    await transaction.deleteOne();
    res.json({ message: 'Transaction Deleted Successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;