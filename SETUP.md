# 🚀 AI Daily Task Prioritizer - Setup Guide

## 🔑 **Step 1: Get Cohere API Key (FREE)**

1. **Visit**: [cohere.ai](https://cohere.ai)
2. **Sign up** for a free account
3. **Get API key** from your dashboard
4. **Free tier includes**: 100 requests/month (perfect for testing!)

## ⚙️ **Step 2: Add API Key**

Create a `.env` file in your project root:

```bash
# .env
VITE_COHERE_API_KEY=your_actual_api_key_here
```

**Replace** `your_actual_api_key_here` with your real Cohere API key.

## 🎯 **Step 3: Test the AI**

1. **Start the app**: `npm run dev`
2. **Add some tasks**:
   - "Fix critical bug in production"
   - "Pay electricity bill today"
   - "Plan team meeting for next week"
   - "Research new project ideas"
3. **Click "🚀 Prioritize"** - Watch AI work its magic!

## 🤖 **AI Model Details**

- **Model**: Cohere Command (state-of-the-art)
- **Purpose**: Task prioritization using Eisenhower Matrix
- **Intelligence**: Understands urgency, importance, business context
- **Output**: Smart task ordering with priority levels

## 🆓 **Free Tier Limits**

- **100 requests/month** (more than enough for daily use)
- **No credit card required**
- **High-quality AI responses**

## 🔧 **If You Get Errors**

1. **Check API key** is correct in `.env`
2. **Restart dev server** after adding `.env`
3. **Check console** for detailed error messages
4. **Fallback system** will use smart local logic if AI fails

## 🎉 **You're Ready!**

Your AI Daily Task Prioritizer now uses **real AI intelligence** to sort your tasks by priority!
