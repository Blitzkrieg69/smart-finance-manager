import { useState } from 'react';
import { X, TrendingUp, PieChart, Target, BarChart2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const tabs = [
  {
    id: 'savings',
    label: 'Savings',
    icon: <TrendingUp size={16} />,
    darkColor: {
      tab: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      inactive: 'text-gray-400 hover:text-emerald-400 border-transparent',
      badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    description: 'Measures how much of your monthly income you are saving.',
    formula: 'Savings Rate = (Income - Expenses) / Income × 100',
    target: 'You need a 30%+ savings rate to score full 25 points.',
    table: [
      { condition: 'Savings rate ≥ 30%', points: '25 / 25' },
      { condition: 'Savings rate = 20%', points: '~17 / 25' },
      { condition: 'Savings rate = 10%', points: '~8 / 25' },
      { condition: 'Savings rate = 0%', points: '0 / 25' },
      { condition: 'Spending more than income', points: '0 / 25' },
    ],
    tip: '💡 Tip: Reduce discretionary expenses or add an income source to boost this score.'
  },
  {
    id: 'budget',
    label: 'Budget',
    icon: <PieChart size={16} />,
    darkColor: {
      // ✅ CHANGED — Yellow
      tab: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      inactive: 'text-gray-400 hover:text-yellow-400 border-transparent',
      badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    },
    description: 'Measures whether you are spending at the right pace through the month — not just total spend.',
    formula: 'Expected Spend = (Budget Limit / Total Days) × Days Elapsed',
    target: 'Stay under or exactly at expected spending pace to score high.',
    table: [
      { condition: '50%+ under expected pace', points: '25 / 25' },
      { condition: '30% under expected pace', points: '~24 / 25' },
      { condition: '10% under expected pace', points: '~21 / 25' },
      { condition: 'Exactly on pace', points: '~19 / 25' },
      { condition: '10% over expected pace', points: '~16 / 25' },
      { condition: '20% over expected pace', points: '~13 / 25' },
      { condition: '40% over expected pace', points: '~8 / 25' },
      { condition: 'No budgets set', points: '25 / 25 (default)' },
    ],
    tip: '💡 Tip: Create budgets for your top spending categories to get an accurate budget score.'
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: <Target size={16} />,
    darkColor: {
      // ✅ CHANGED — Pink
      tab: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
      inactive: 'text-gray-400 hover:text-pink-400 border-transparent',
      badge: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    },
    description: 'Measures whether your savings goal progress is on pace with your deadline.',
    formula: 'Expected Saved = (Target Amount / Total Days) × Days Elapsed since goal creation',
    target: 'Save at the required daily pace to hit your deadline.',
    table: [
      { condition: 'Goal fully achieved', points: '25 / 25' },
      { condition: '50%+ ahead of pace', points: '25 / 25' },
      { condition: '10–30% ahead of pace', points: '~21–24 / 25' },
      { condition: 'Exactly on pace', points: '~19 / 25' },
      { condition: '10% behind pace', points: '~16 / 25' },
      { condition: '20% behind pace', points: '~13 / 25' },
      { condition: '40%+ behind pace', points: '~8 / 25' },
      { condition: 'No goals set', points: '25 / 25 (default)' },
    ],
    tip: '💡 Tip: Break large goals into smaller milestones and contribute regularly to stay on pace.'
  },
  {
    id: 'investments',
    label: 'Investments',
    icon: <BarChart2 size={16} />,
    darkColor: {
      // ✅ CHANGED — Purple
      tab: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      inactive: 'text-gray-400 hover:text-purple-400 border-transparent',
      badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
    description: 'Measures your portfolio ROI (15 pts) + diversification across asset types (10 pts).',
    formula: 'ROI = (Current Value - Invested Amount) / Invested Amount × 100',
    target: 'Aim for 20%+ ROI and invest across 3 asset types for full score.',
    table: [
      { condition: 'ROI ≥ 30%', points: '15 / 15 (ROI)' },
      { condition: 'ROI 20–29%', points: '13 / 15 (ROI)' },
      { condition: 'ROI 10–19%', points: '11 / 15 (ROI)' },
      { condition: 'ROI 5–9%', points: '9 / 15 (ROI)' },
      { condition: 'ROI 0–4%', points: '7 / 15 (ROI)' },
      { condition: 'ROI negative', points: '0–5 / 15 (ROI)' },
      { condition: '3 asset types', points: '10 / 10 (Diversification)' },
      { condition: '2 asset types', points: '7 / 10 (Diversification)' },
      { condition: '1 asset type', points: '3 / 10 (Diversification)' },
      { condition: 'No investments', points: '0 / 25' },
    ],
    tip: '💡 Tip: Diversify across Indian Stocks, US Stocks, and Cryptocurrency to maximize your diversification score.'
  }
];

const ScoreInfoModal = ({ isOpen, onClose }) => {
  const { theme, styles } = useTheme();
  const [activeTab, setActiveTab] = useState('savings');

  if (!isOpen) return null;

  const current = tabs.find(t => t.id === activeTab);
  const isDark = theme === 'dark';

  const getTabActiveStyle = (tab) =>
    isDark
      ? tab.darkColor.tab
      : 'bg-[#F5F5DC] text-[#4B3621] border-[#654321]/50';

  const getTabInactiveStyle = (tab) =>
    isDark
      ? tab.darkColor.inactive
      : 'text-[#654321]/50 hover:text-[#4B3621] border-transparent';

  const getBadgeStyle = () =>
    isDark
      ? current.darkColor.badge
      : 'bg-[#F5F5DC] text-[#4B3621] border border-[#654321]/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl z-10 ${
        isDark
          ? 'bg-[#12131e] border-gray-800'
          : 'bg-[#FFF8F0] border-[#C9A87C]/50'
      }`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          isDark ? 'border-gray-800' : 'border-[#D2B48C]/30'
        }`}>
          <h2 className={`text-lg font-black ${styles.text}`}>
            How is your Score Calculated?
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              isDark
                ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                : 'hover:bg-[#F5F5DC] text-[#654321]/50 hover:text-[#4B3621]'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 p-4 border-b ${
          isDark ? 'border-gray-800' : 'border-[#D2B48C]/30'
        }`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? getTabActiveStyle(tab)
                  : getTabInactiveStyle(tab)
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[55vh] overflow-y-auto custom-scrollbar">

          {/* Description */}
          <p className={`text-sm mb-4 leading-relaxed ${styles.textSecondary}`}>
            {current.description}
          </p>

          {/* Formula */}
          <div className={`p-3 rounded-xl mb-4 font-mono text-xs ${
            isDark ? 'bg-white/5 text-gray-300' : 'bg-[#F5F5DC] text-[#4B3621]'
          }`}>
            📐 {current.formula}
          </div>

          {/* Target */}
          <div className={`p-3 rounded-xl mb-4 text-xs font-medium ${getBadgeStyle()}`}>
            🎯 {current.target}
          </div>

          {/* Scoring Table Label */}
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${styles.textSecondary}`}>
            Scoring Breakdown
          </p>

          {/* Scoring Table */}
          <div className={`rounded-xl overflow-hidden border mb-4 ${
            isDark ? 'border-white/10' : 'border-[#D2B48C]/30'
          }`}>
            {current.table.map((row, i) => (
              <div
                key={i}
                className={`flex justify-between items-center px-4 py-2.5 text-sm ${
                  i % 2 === 0
                    ? isDark ? 'bg-white/5' : 'bg-[#F5F5DC]'
                    : isDark ? 'bg-transparent' : 'bg-[#FFF8F0]'
                }`}
              >
                <span className={styles.textSecondary}>
                  {row.condition}
                </span>
                <span className={`font-black text-xs px-2 py-1 rounded-lg ${getBadgeStyle()}`}>
                  {row.points}
                </span>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className={`p-3 rounded-xl text-xs leading-relaxed ${
            isDark ? 'bg-white/5 text-gray-400' : 'bg-[#F5F5DC] text-[#654321]/80'
          }`}>
            {current.tip}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t text-center ${
          isDark ? 'border-gray-800' : 'border-[#D2B48C]/30'
        }`}>
          <p className={`text-xs ${styles.textSecondary}`}>
            Each category is worth <span className="font-bold">25 points</span> — Total score is out of <span className="font-bold">100</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScoreInfoModal;
