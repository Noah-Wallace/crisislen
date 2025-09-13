import { useState, useEffect } from 'react'
import { DataAggregator } from './services/dataAggregator'
import Dashboard from './components/Dashboard.jsx'
import './App.css'

function App() {
  const [crisisData, setCrisisData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dataAggregator = new DataAggregator()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data, metadata } = await dataAggregator.aggregateAllCrisisData()
        
        // Get AI analysis for the crisis data
        const analyzedData = await dataAggregator.analyzeWithAI(data)
        const insights = await dataAggregator.generateInsights(analyzedData)
        
        setCrisisData({
          events: analyzedData,
          insights,
          metadata
        })
      } catch (err) {
        console.error('Error fetching crisis data:', err)
        setError('Failed to fetch crisis data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Set up polling every 5 minutes
    const pollInterval = setInterval(fetchData, 5 * 60 * 1000)
    
    return () => clearInterval(pollInterval)
  }, [])

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Dashboard 
        crisisData={crisisData} 
        loading={loading} 
      />
    </div>
  )
}

export default App;
