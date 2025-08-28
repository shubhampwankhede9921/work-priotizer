import { useState } from 'react'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [prioritizedTasks, setPrioritizedTasks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), priority: null }])
      setNewTask('')
    }
  }

  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
    setPrioritizedTasks(prioritizedTasks.filter(task => task.id !== id))
  }

  const parsePriorityResponse = (response, taskCount) => {
    const numbers = (response.match(/\d+/g) || [])
      .map((n) => parseInt(n))
      .filter((n) => n >= 1 && n <= taskCount)

    const seen = new Set()
    const order = []
    for (const n of numbers) {
      if (!seen.has(n)) {
        seen.add(n)
        order.push(n)
      }
      if (order.length === taskCount) break
    }

    if (order.length === taskCount) return order
    return Array.from({ length: taskCount }, (_, i) => i + 1)
  }

  const prioritizeTasks = async () => {
    if (tasks.length === 0) return

    setIsLoading(true)
    setError('')

    try {
      const resp = await fetch('http://localhost:8787/api/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasks.map(t => t.text) })
      })

      if (!resp.ok) {
        const errText = await resp.text()
        throw new Error(`API error: ${resp.status} ${errText}`)
      }

      const data = await resp.json()

      // New structured format: { items: [{ index, priority }] }
      if (Array.isArray(data.items) && data.items.length > 0) {
        const prioritized = data.items.map((it, idx) => {
          const task = tasks[it.index - 1]
          return {
            ...task,
            priority: it.priority,
            priorityOrder: idx + 1,
          }
        })
        setPrioritizedTasks(prioritized)
      } else {
        // Backward-compatible: expect { text: "2, 1, 3" }
        const aiText = data.text || ''
        const order = parsePriorityResponse(aiText, tasks.length)

        const total = tasks.length
        const toPriorityLevel = (rank) => {
          if (rank <= Math.ceil(total / 3)) return 'urgent'
          if (rank <= Math.ceil((total * 2) / 3)) return 'important'
          return 'low'
        }

        const prioritized = order.map((taskNumber, idx) => {
          const task = tasks[taskNumber - 1]
          return {
            ...task,
            priority: toPriorityLevel(idx + 1),
            priorityOrder: idx + 1,
          }
        })
        setPrioritizedTasks(prioritized)
      }
    } catch (err) {
      console.error('Error prioritizing tasks:', err)
      setError('AI service error. Please check the server and API key.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addTask()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🤖 AI Daily Task Prioritizer</h1>
          <p className="text-gray-600 text-lg">Input your tasks and let AI arrange them by priority</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a task (e.g., 'Review quarterly reports')"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={addTask}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Task
            </button>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Tasks ({tasks.length})</h2>
              <button
                onClick={prioritizeTasks}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {isLoading ? '🤖 AI Thinking...' : '🚀 Prioritize'}
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{task.text}</span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {prioritizedTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Prioritized Tasks</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">{error}</div>
            )}

            <div className="space-y-3">
              {prioritizedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border-2 flex items-center justify-between ${task.priority === 'urgent' ? 'priority-urgent' : task.priority === 'important' ? 'priority-important' : 'priority-low'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-600">#{task.priorityOrder}</span>
                    <span className="font-medium">{task.text}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${
                    task.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                    task.priority === 'important' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Priority Legend:</h3>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-red-400 rounded-full"></span><span className="text-red-700">Urgent - Do first</span></span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-400 rounded-full"></span><span className="text-yellow-700">Important - Do today</span></span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-green-400 rounded-full"></span><span className="text-green-700">Low - When possible</span></span>
              </div>
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl">Start by adding your daily tasks above</p>
            <p className="text-sm mt-2">The AI will help you prioritize them for maximum productivity!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
