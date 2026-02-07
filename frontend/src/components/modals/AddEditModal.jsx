import TransactionModal from './TransactionModal'
import BudgetModal from './BudgetModal'
import InvestmentModal from './InvestmentModal'
import GoalModal from './GoalModal'

const AddEditModal = ({ isOpen, onClose, type, initialData, onSuccess }) => {
  if (!isOpen) return null

  // Route to the correct specialized modal
  if (type === 'budget') {
      return <BudgetModal isOpen={isOpen} onClose={onClose} initialData={initialData} onSuccess={onSuccess} />
  }
  
  if (type === 'investment') {
      return <InvestmentModal isOpen={isOpen} onClose={onClose} initialData={initialData} onSuccess={onSuccess} />
  }
  
  if (type === 'goal') { // Just in case you call it from somewhere else
      return <GoalModal isOpen={isOpen} onClose={onClose} initialData={initialData} onSuccess={onSuccess} />
  }

  // Default: Income or Expense
  return <TransactionModal isOpen={isOpen} onClose={onClose} type={type} initialData={initialData} onSuccess={onSuccess} />
}

export default AddEditModal