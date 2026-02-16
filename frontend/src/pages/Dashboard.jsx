import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  TrendingDown as TrendingDownIcon
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { formatIndianNumber } from '../utils/formatNumber'
import { LineChart, Line, BarChart, Bar, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts'


const Dashboard = ({ transactions, budgets, openModal, currency }) => {
  const { theme, styles } = useTheme()

  // State for API data
  const [healthScore, setHealthScore] = useState(null)
  const [insights, setInsights] = useState([])
  const [cashflow, setCashflow] = useState(null)
  const [budgetIntelligence, setBudgetIntelligence] = useState(null)
  const [patterns, setPatterns] = useState(null)
  const [loading, setLoading] = useState(true)

  // Calculate basic stats
  const income = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')
  const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  const balance = totalIncome - totalExpense

  // Fetch all analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)

        const [healthRes, insightsRes, cashflowRes, budgetRes, patternsRes] = await Promise.all([
          fetch('http://localhost:5000/api/analytics/health-score', { credentials: 'include' }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/analytics/insights', { credentials: 'include' }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/predictions/cashflow', { credentials: 'include' }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/predictions/budget-burnrate', { credentials: 'include' }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/analytics/patterns', { credentials: 'include' }).catch(() => ({ ok: false }))
        ])

        if (healthRes.ok) setHealthScore(await healthRes.json())
        if (insightsRes.ok) {
          const data = await insightsRes.json()
          setInsights(data.insights || [])
        }
        if (cashflowRes.ok) setCashflow(await cashflowRes.json())
        if (budgetRes.ok) setBudgetIntelligence(await budgetRes.json())
        if (patternsRes.ok) setPatterns(await patternsRes.json())

        setLoading(false)
      } catch (err) {
        console.error('Analytics error:', err)
        setLoading(false)
      }
    }

    if (transactions && transactions.length > 0) {
      fetchAnalytics()
    } else {
      setLoading(false)
    }
  }, [transactions?.length])

  // Card style helper
  const getCardStyle = (colorType) => {
    const base = `p-6 rounded-2xl border transition-all duration-300 ${styles.card}`
    if (theme !== 'dark') return `${base} shadow-lg`

    switch (colorType) {
      case 'blue': return `${base} border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:shadow-[0_0_40px_rgba(59,130,246,0.25)]`
      case 'green': return `${base} border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.25)]`
      case 'red': return `${base} border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:shadow-[0_0_40px_rgba(239,68,68,0.25)]`
      case 'purple': return `${base} border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.25)]`
      default: return base
    }
  }

  // Get health score color
  const getHealthColor = (score) => {
    if (score >= 70) return theme === 'dark' ? '#10b981' : '#4B3621'
    if (score >= 40) return theme === 'dark' ? '#f59e0b' : '#654321'
    return theme === 'dark' ? '#ef4444' : '#4B3621'
  }

  // Get insight icon
  const getInsightIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
      case 'warning': return <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
      case 'danger': return <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
      default: return <Info size={18} className="text-blue-500 flex-shrink-0" />
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${styles.bg}`}>
        <div className="text-center">
          <Zap className={`w-12 h-12 mx-auto mb-4 animate-pulse ${theme === 'dark' ? 'text-blue-500' : 'text-[#4B3621]'}`} />
          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]'}`}>Loading Analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-6 h-full w-full p-6 overflow-y-auto custom-scrollbar ${styles.bg}`}>

      {/* 1. BALANCE, INCOME, EXPENSE (NOW AT TOP!) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={getCardStyle('blue')}>
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-[#654321]/70'}`}>
                Balance
              </p>
              <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {currency}{formatIndianNumber(balance)}
              </h3>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-[#F5F5DC]'
              }`}>
              <Wallet className={theme === 'dark' ? 'text-blue-500' : 'text-[#4B3621]'} size={32} />
            </div>
          </div>
        </div>

        <div className={getCardStyle('green')}>
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-[#654321]/70'}`}>
                Income
              </p>
              <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-[#4B3621]'}`}>
                +{currency}{formatIndianNumber(totalIncome)}
              </h3>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-[#F5F5DC]'
              }`}>
              <TrendingUp className={theme === 'dark' ? 'text-emerald-500' : 'text-[#4B3621]'} size={32} />
            </div>
          </div>
        </div>

        <div className={getCardStyle('red')}>
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-[#654321]/70'}`}>
                Expenses
              </p>
              <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-red-500' : 'text-[#4B3621]'}`}>
                -{currency}{formatIndianNumber(totalExpense)}
              </h3>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-red-500/20' : 'bg-[#F5F5DC]'
              }`}>
              <TrendingDown className={theme === 'dark' ? 'text-red-500' : 'text-[#4B3621]'} size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. FINANCIAL HEALTH SCORE */}
      {healthScore ? (
        <div className={getCardStyle('purple')}>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative flex-shrink-0">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={theme === 'dark' ? '#1e293b' : '#D2B48C'}
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={getHealthColor(healthScore.score)}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(healthScore.score / 100) * 439.82} 439.82`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  style={{ filter: theme === 'dark' ? `drop-shadow(0 0 8px ${getHealthColor(healthScore.score)})` : 'none' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black`} style={{ color: getHealthColor(healthScore.score) }}>
                  {healthScore.score}
                </span>
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>
                  / 100
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 w-full">
              <h2 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                Financial Health Score
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(healthScore.breakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-[#F5F5DC] border border-[#654321]/20'}`}
                  >
                    <p className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                      {key}
                    </p>
                    <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                      {value}<span className="text-sm">/25</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Metrics Summary */}
              <div className={`mt-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-[#F5F5DC]'}`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>Savings Rate</p>
                    <p className={`text-lg font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-[#4B3621]'}`}>
                      {healthScore.metrics.savingsRate}%
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>Monthly Income</p>
                    <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                      {currency}{formatIndianNumber(parseFloat(healthScore.metrics.monthlyIncome))}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>Savings</p>
                    <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                      {currency}{formatIndianNumber(parseFloat(healthScore.metrics.monthlySavings))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${getCardStyle('purple')} text-center py-8`}>
          <Info className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-purple-500' : 'text-[#4B3621]'}`} />
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
            Add More Transactions
          </h3>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
            We need at least a few transactions to calculate your financial health score
          </p>
        </div>
      )}

      {/* 3. SMART INSIGHTS */}
      {insights.length > 0 ? (
        <div className={getCardStyle('blue')}>
          <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
            <Zap size={20} />
            SMART INSIGHTS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${theme === 'dark'
                    ? 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10'
                    : 'bg-[#F5F5DC] border-[#654321]/20 hover:border-[#654321]/40'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-[#4B3621]'}`}>
                    {insight.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 4. CASH FLOW FORECAST */}
      {cashflow && cashflow.timeline && cashflow.timeline.length > 0 ? (
        <div className={getCardStyle('purple')}>
          <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
            <Activity size={20} />
            CASH FLOW FORECAST
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-[#F5F5DC] border border-[#654321]/20'}`}>
              <p className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                Month-End Prediction
              </p>
              <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {currency}{formatIndianNumber(cashflow.predictions.predictedEndBalance)}
              </p>
            </div>

            <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-[#F5F5DC] border border-[#654321]/20'}`}>
              <p className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                Daily Avg Spending
              </p>
              <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {currency}{formatIndianNumber(cashflow.predictions.dailyAvgSpending)}
              </p>
            </div>

            <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-[#F5F5DC] border border-[#654321]/20'}`}>
              <p className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                Days Remaining
              </p>
              <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                {cashflow.predictions.daysRemaining}
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashflow.timeline}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === 'dark' ? '#1e3a8a' : '#D2B48C'}
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="label"
                  stroke={theme === 'dark' ? '#6b7280' : '#654321'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke={theme === 'dark' ? '#6b7280' : '#654321'}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#000' : '#FFF8F0',
                    border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#654321'}`,
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={theme === 'dark' ? '#8b5cf6' : '#4B3621'}
                  strokeWidth={3}
                  dot={{ fill: theme === 'dark' ? '#8b5cf6' : '#4B3621', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* 5. BUDGET INTELLIGENCE & SPENDING PATTERNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Budget Intelligence */}
        {budgetIntelligence && budgetIntelligence.budgets && budgetIntelligence.budgets.length > 0 ? (
          <div className={getCardStyle('blue')}>
            <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
              BUDGET INTELLIGENCE
            </h3>
            <div className="space-y-4">
              {budgetIntelligence.budgets.slice(0, 5).map((budget, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-[#F5F5DC] border border-[#654321]/20'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                      {budget.category}
                    </p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${budget.status === 'exceeded' || budget.status === 'danger'
                        ? 'bg-red-500/20 text-red-500'
                        : budget.status === 'warning'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                      {budget.percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-sm mb-2">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}>
                      {currency}{formatIndianNumber(budget.spent)} / {currency}{formatIndianNumber(budget.limit)}
                    </span>
                    <span className={`font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-[#4B3621]'}`}>
                      {currency}{formatIndianNumber(budget.dailyBurnRate)}/day
                    </span>
                  </div>

                  <div className={`w-full h-3 rounded-full overflow-hidden mb-3 ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                    <div
                      className={`h-full transition-all duration-1000 ${budget.status === 'exceeded' || budget.status === 'danger' ? 'bg-red-500' :
                          budget.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>

                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
                    {budget.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`${getCardStyle('blue')} text-center py-8`}>
            <Info className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-blue-500' : 'text-[#4B3621]'}`} />
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
              Create Budgets
            </h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
              Set up budgets to get intelligent spending insights
            </p>
          </div>
        )}

        {/* Spending Patterns */}
        {patterns && patterns.categoryComparison && patterns.categoryComparison.length > 0 ? (
          <div className={getCardStyle('blue')}>
            <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
              SPENDING TRENDS
            </h3>
            <div className="space-y-3">
              {patterns.categoryComparison.slice(0, 6).map((cat, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-[#F5F5DC] border border-[#654321]/20'}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                      {cat.category}
                    </p>
                    <div className="flex items-center gap-1">
                      {cat.changeVsLast > 0 ? (
                        <ArrowUpRight size={16} className="text-red-500" />
                      ) : (
                        <ArrowDownRight size={16} className="text-emerald-500" />
                      )}
                      <span className={`text-sm font-bold ${cat.changeVsLast > 10 ? 'text-red-500' :
                          cat.changeVsLast < -10 ? 'text-emerald-500' :
                            theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'
                        }`}>
                        {cat.changeVsLast > 0 ? '+' : ''}{cat.changeVsLast.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className={theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}>Current</p>
                      <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                        {currency}{formatIndianNumber(cat.currentMonth)}
                      </p>
                    </div>
                    <div>
                      <p className={theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}>Last</p>
                      <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                        {currency}{formatIndianNumber(cat.lastMonth)}
                      </p>
                    </div>
                    <div>
                      <p className={theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}>Avg</p>
                      <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                        {currency}{formatIndianNumber(cat.threeMonthAvg)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`${getCardStyle('blue')} text-center py-8`}>
            <Info className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-blue-500' : 'text-[#4B3621]'}`} />
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
              Track Spending
            </h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[#654321]/70'}`}>
              Add more transactions to see spending trends
            </p>
          </div>
        )}
      </div>

      {/* 6. RECENT TRANSACTIONS */}
      <div className={getCardStyle('blue')}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
            RECENT TRANSACTIONS
          </h3>
          <button
            onClick={() => openModal('expense')}
            className={`text-sm font-bold px-5 py-2.5 rounded-xl transition ${theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 text-[#4B3621] border-2 border-[#654321]/30'
              }`}
          >
            + ADD
          </button>
        </div>
        <div className="space-y-2">
          {transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map((t, i) => (
              <div
                key={i}
                className={`flex justify-between items-center p-4 rounded-xl transition ${theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 border border-[#654321]/20'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income'
                      ? (theme === 'dark' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-100 text-emerald-700')
                      : (theme === 'dark' ? 'bg-red-500/20 text-red-500' : 'bg-red-100 text-red-700')
                    }`}>
                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4B3621]'}`}>
                      {t.category}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-[#654321]/60'}`}>
                      {t.description || 'No description'} • {new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-base font-black ${t.type === 'income'
                    ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700')
                    : (theme === 'dark' ? 'text-red-500' : 'text-red-700')  // ✅ NOW RED!
                  }`}>
                  {t.type === 'income' ? '+' : '-'}{currency}{formatIndianNumber(parseFloat(t.amount))}
                </span>
              </div>
            ))}
        </div>
      </div>


    </div>
  )
}

export default Dashboard
