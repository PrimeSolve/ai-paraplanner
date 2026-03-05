import CashflowModel from './cashflow-model.jsx'

/**
 * Cashflow App — renders CashflowModel with data passed from the parent app.
 * Authentication is handled by the parent ai-paraplanner app.
 */
export default function App({ initialData }) {
  return (
    <div>
      <CashflowModel initialData={initialData} />
    </div>
  )
}
