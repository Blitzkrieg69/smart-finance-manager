import { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate } from 'react-router-dom';

// CONTEXT
import { AuthProvider, useAuth } from './context/AuthContext';

// COMPONENTS
import DashboardLayout from './components/DashboardLayout';
import AddEditModal from './components/modals/AddEditModal';
import ExportModal from './components/modals/ExportModal';

// PAGES
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Budgets from './pages/Budgets';
import Investments from './pages/Investments';
import Goals from './pages/Goals';

const API_URL = 'http://localhost:5000';

function AuthenticatedApp() {
  const { user } = useAuth();
  
  // --- STATE ---
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(91.5); // Default INR to USD rate
  const currency = '₹';

  // --- MODALS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [editingItem, setEditingItem] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    try {
      const [txRes, budRes, invRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/transactions`),
        axios.get(`${API_URL}/api/budgets`),
        axios.get(`${API_URL}/api/investments`)
      ]);

      if (txRes.status === 'fulfilled') setTransactions(txRes.value.data || []);
      if (budRes.status === 'fulfilled') setBudgets(budRes.value.data || []);
      if (invRes.status === 'fulfilled') {
        setInvestments(invRes.value.data.investments || []);
        if (invRes.value.data.rate) setExchangeRate(invRes.value.data.rate);
      }
    } catch (err) {
      console.error("API Error", err);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // --- HANDLERS ---
  const handleDelete = async (id, type = 'transaction') => {
    const endpoints = {
      transaction: `/api/transactions/${id}`,
      budget: `/api/budgets/${id}`,
      investment: `/api/investments/${id}`
    };
    await axios.delete(`${API_URL}${endpoints[type]}`);
    fetchData();
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // --- NOTIFICATIONS LOGIC ---
  const expenses = transactions.filter(t => t.type === 'expense');
  const notifications = budgets.map(b => {
    const spent = expenses
      .filter(e => e.category === b.category)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const percent = (spent / b.limit) * 100;
    if (percent < 80) return null; // Healthy

    return {
      id: b._id || b.id,
      category: b.category,
      type: percent >= 100 ? 'critical' : 'warning',
      message: percent >= 100 
        ? `Exceeded limit by ${currency}${(spent - b.limit).toFixed(0)}` 
        : `${percent.toFixed(0)}% of budget used`
    };
  }).filter(Boolean);

  return (
    <>
      <Routes>
        <Route element={<DashboardLayout notifications={notifications} onExport={() => setIsExportOpen(true)} />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard transactions={transactions} budgets={budgets} openModal={openModal} currency={currency} />} />
          <Route path="/income" element={<Income data={transactions.filter(t => t.type === 'income')} openModal={openModal} handleDelete={handleDelete} handleEdit={(item) => openModal('income', item)} currency={currency} />} />
          <Route path="/expense" element={<Expense data={expenses} openModal={openModal} handleDelete={handleDelete} handleEdit={(item) => openModal('expense', item)} currency={currency} />} />
          <Route path="/budget" element={<Budgets budgets={budgets} expenses={expenses} openModal={openModal} handleDelete={handleDelete} handleEdit={(item) => openModal('budget', item)} currency={currency} />} />
          <Route path="/investment" element={<Investments investments={investments} openModal={openModal} handleDelete={handleDelete} handleEdit={(item) => openModal('investment', item)} currency={currency} exchangeRate={exchangeRate} />} />
          <Route path="/goals" element={<Goals currency={currency} openModal={openModal} />} />
        </Route>
      </Routes>

      <AddEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        initialData={editingItem}
        onSuccess={fetchData}
        currency={currency}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return user ? <AuthenticatedApp /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
