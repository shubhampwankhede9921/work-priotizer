import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { CohereClient } from 'cohere-ai'

const app = express()
app.use(cors())
app.use(express.json())

const cohereApiKey = 
if (!cohereApiKey) {
  console.warn('COHERE_API_KEY is not set. Set it in a .env file in the project root.')
}

const cohere = cohereApiKey ? new CohereClient({ token: cohereApiKey }) : null

app.post('/api/prioritize', async (req, res) => {
  try {
    if (!cohere) return res.status(500).json({ error: 'Cohere not configured (missing COHERE_API_KEY)' })

    const { tasks } = req.body || {}
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'tasks array is required' })
    }

    const taskCount = tasks.length
    const numberedList = tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')

    const schemaHint = `Strict JSON schema:
{
  "items": [
    { "index": 1, "priority": "urgent" | "important" | "low" },
    { "index": 2, "priority": "urgent" | "important" | "low" },
    ... one object per task index ...
  ]
}`

    const example = `Example for 3 tasks:
Input tasks:
1. Research new project ideas
2. Plan team meeting for next week
3. Fix critical bug in production
Output JSON (no extra text):
{"items":[{"index":3,"priority":"urgent"},{"index":2,"priority":"important"},{"index":1,"priority":"low"}]}`

    const prompt = `You are an expert productivity consultant using the Eisenhower Matrix to prioritize daily tasks.

Guidelines (strict):
- ALWAYS put production incidents, critical bugs, outages, and emergencies as priority "urgent".
- Then time-sensitive items with deadlines as "urgent" or "important" depending on immediacy.
- Meetings/planning are typically "important" unless truly urgent.
- Research/ideas are typically "low" unless a deadline is stated.

Return ONLY valid JSON, no prose, matching this schema and including ALL ${taskCount} tasks exactly once.
${schemaHint}

${example}

Now prioritize the following ${taskCount} tasks:
${numberedList}

Return STRICT JSON only:`

    const response = await cohere.generate({
      model: 'command-light',
      prompt,
      max_tokens: 200,
      temperature: 0.0,
    })

    const raw = response?.generations?.[0]?.text ?? ''

    // Extract the first JSON object/array block
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : ''

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      parsed = { items: [] }
    }

    // Normalize to ensure exactly one entry per index 1..N and valid priority strings
    const allowed = new Set(['urgent', 'important', 'low'])
    const seen = new Set()
    const items = Array.isArray(parsed?.items) ? parsed.items : []
    const normalized = []

    for (const it of items) {
      const idx = Number(it?.index)
      let pr = String(it?.priority || '').toLowerCase()
      if (!Number.isInteger(idx) || idx < 1 || idx > taskCount) continue
      if (!allowed.has(pr)) pr = 'low'
      if (seen.has(idx)) continue
      seen.add(idx)
      normalized.push({ index: idx, priority: pr })
    }

    // Fill any missing indices with conservative defaults (low)
    for (let i = 1; i <= taskCount; i++) {
      if (!seen.has(i)) normalized.push({ index: i, priority: 'low' })
    }

    // Optional: stable order by priority (urgent -> important -> low), preserving original index order within groups
    const priorityOrder = { urgent: 1, important: 2, low: 3 }
    normalized.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 3
      const pb = priorityOrder[b.priority] ?? 3
      if (pa !== pb) return pa - pb
      return a.index - b.index
    })

    return res.json({ items: normalized })
  } catch (err) {
    console.error('Cohere error:', err)
    res.status(500).json({ error: err?.message || 'AI service error' })
  }
})

const PORT = process.env.PORT || 8787
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
