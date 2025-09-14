# CrisisLens AI - API Setup Guide

This guide provides detailed instructions for setting up and configuring all external APIs used in the CrisisLens AI platform.

## Table of Contents
1. [OpenAI API Setup](#openai-api-setup)
2. [News API Setup](#news-api-setup)
3. [Reddit API Setup](#reddit-api-setup)

## OpenAI API Setup

### Requirements
- OpenAI API account
- API key with access to GPT-4 and DALL-E models

### Setup Steps
1. Visit [OpenAI's platform](https://platform.openai.com/signup)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new secret key
5. Add to your `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

### Rate Limits & Pricing
- GPT-4: $0.03 per 1K input tokens, $0.06 per 1K output tokens
- Check [OpenAI's pricing page](https://openai.com/pricing) for current rates
- Implement rate limiting in code: 3 requests per minute for free tier

## News API Setup

### Requirements
- News API account (newsapi.org)
- API key with access to all endpoints

### Setup Steps
1. Visit [News API](https://newsapi.org/register)
2. Create an account
3. Obtain your API key
4. Add to your `.env` file:
   ```
   NEWS_API_KEY=your_api_key_here
   ```

### Rate Limits & Pricing
- Developer tier: 100 requests per day
- Basic tier ($449/month): 50,000 requests per day
- Business tier: Custom pricing

## Reddit API Setup

### Requirements
- Reddit account
- Registered application credentials

### Setup Steps
1. Create a Reddit account
2. Visit [Reddit's app preferences](https://www.reddit.com/prefs/apps)
3. Click "Create another app..."
4. Fill in the details:
   - Name: CrisisLens AI
   - App type: Web app
   - Description: Crisis monitoring platform
   - About URL: Your website
   - Redirect URI: http://localhost:3000/auth/callback
5. Add to your `.env` file:
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USERNAME=your_username
   REDDIT_PASSWORD=your_password
   ```

### Rate Limits & Pricing
- 60 requests per minute
- OAuth2 authentication required
- Free tier available

## Environment Setup

Create a `.env` file in the root directory with all required API keys:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_key

# News API Configuration
NEWS_API_KEY=your_newsapi_key

# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

## Security Notes

1. Never commit API keys to version control
2. Use environment variables for all sensitive data
3. Implement rate limiting to avoid API abuse
4. Monitor API usage and costs
5. Rotate API keys periodically
6. Use secure storage for production credentials
