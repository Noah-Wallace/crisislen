// src/services/newsService.js
export class NewsService {
  constructor() {
    this.NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
    this.BASE_URL = 'https://newsapi.org/v2';
    this.crisisKeywords = [
      'earthquake', 'flood', 'hurricane', 'wildfire', 'tsunami',
      'cyclone', 'disaster', 'emergency', 'evacuation', 'rescue',
      'landslide', 'tornado', 'storm', 'crisis', 'calamity'
    ];
    this.sources = [
      'bbc-news', 'reuters', 'associated-press', 'cnn', 'al-jazeera-english',
      'the-times-of-india', 'abc-news', 'nbc-news'
    ];
  }

  async fetchCrisisNews() {
    if (!this.NEWS_API_KEY) {
      console.warn('⚠️ News API key not found, using sample data');
      return this.getMockNewsData();
    }

    try {
      console.log('📰 Fetching crisis news from News API...');
      
      // Primary search with crisis keywords
      const keywords = this.crisisKeywords.slice(0, 5).join(' OR '); // Limit for URL length
      const url = `${this.BASE_URL}/everything?q=${encodeURIComponent(keywords)}&sortBy=publishedAt&pageSize=15&language=en&apiKey=${this.NEWS_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Invalid News API key');
        } else if (response.status === 429) {
          console.error('❌ News API rate limit exceeded');
        }
        throw new Error(`News API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`News API error: ${data.message}`);
      }

      const articles = data.articles || [];
      console.log(`📰 Fetched ${articles.length} news articles`);
      
      // Process and filter articles
      const processedArticles = this.processNewsArticles(articles);
      const crisisArticles = this.filterCrisisArticles(processedArticles);
      
      console.log(`✅ Processed ${crisisArticles.length} crisis-related articles`);
      return crisisArticles;
      
    } catch (error) {
      console.error('❌ Error fetching news:', error);
      console.log('🎭 Falling back to mock news data');
      return this.getMockNewsData();
    }
  }

  processNewsArticles(articles) {
    return articles
      .filter(article => article && article.title && article.description)
      .map((article, index) => ({
        id: `news_${Date.now()}_${index}`,
        text: this.combineArticleText(article),
        source: article.source?.name || 'Unknown Source',
        timestamp: article.publishedAt || new Date().toISOString(),
        location: this.extractLocation(article.title + ' ' + (article.description || '')),
        type: this.detectCrisisType(article.title + ' ' + (article.description || '')),
        verified: true,
        url: article.url,
        imageUrl: article.urlToImage,
        author: article.author,
        originalTitle: article.title,
        originalDescription: article.description
      }))
      .filter(article => article.type !== 'unknown'); // Remove non-crisis articles
  }

  combineArticleText(article) {
    let text = article.title || '';
    if (article.description) {
      text += '. ' + article.description;
    }
    // Clean up the text
    text = text.replace(/\[.*?\]/g, ''); // Remove source citations
    text = text.replace(/\s+/g, ' ').trim(); // Normalize whitespace
    return text;
  }

  filterCrisisArticles(articles) {
    return articles.filter(article => {
      // Additional filtering for crisis relevance
      const text = (article.text || '').toLowerCase();
      const crisisScore = this.calculateCrisisScore(text);
      return crisisScore > 0.3; // Only include articles with decent crisis relevance
    });
  }

  calculateCrisisScore(text) {
    let score = 0;
    const highValueKeywords = ['emergency', 'disaster', 'rescue', 'evacuation', 'casualties', 'damage'];
    const mediumValueKeywords = ['storm', 'flood', 'fire', 'earthquake', 'hurricane', 'warning'];
    const lowValueKeywords = ['weather', 'rain', 'wind', 'affected', 'impact'];

    highValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.3;
    });
    
    mediumValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.2;
    });
    
    lowValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.1;
    });

    return Math.min(1.0, score);
  }

  extractLocation(text) {
    const locationPatterns = [
      // City, Country patterns
      /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)/gi,
      // State/Province patterns  
      /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:state|province)/gi,
      // Country patterns
      /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      // City hit/struck patterns
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:hit|struck|affected|damaged)/g
    ];
    
    for (const pattern of locationPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        // Return the most specific location found
        const match = matches[0];
        return match[2] ? `${match[1]}, ${match[2]}` : match[1];
      }
    }

    // Fallback: look for common country/city names
    const commonLocations = [
      'India', 'China', 'United States', 'Japan', 'Indonesia', 'Philippines',
      'Turkey', 'Iran', 'Pakistan', 'Bangladesh', 'Myanmar', 'Thailand',
      'California', 'Florida', 'Texas', 'New York', 'Kerala', 'Mumbai',
      'Delhi', 'Chennai', 'Kolkata', 'Bangalore', 'Hyderabad'
    ];

    for (const location of commonLocations) {
      if (text.toLowerCase().includes(location.toLowerCase())) {
        return location;
      }
    }

    return 'Location Unknown';
  }

  detectCrisisType(text) {
    const typeMap = {
      earthquake: ['earthquake', 'seismic', 'tremor', 'quake', 'tectonic'],
      flood: ['flood', 'flooding', 'deluge', 'inundation', 'waterlog', 'overflow'],
      wildfire: ['wildfire', 'forest fire', 'bushfire', 'fire', 'blaze', 'burning'],
      hurricane: ['hurricane', 'typhoon', 'tropical storm', 'cyclonic storm'],
      cyclone: ['cyclone', 'tropical cyclone', 'super cyclone'],
      tornado: ['tornado', 'twister', 'whirlwind'],
      tsunami: ['tsunami', 'tidal wave', 'seismic sea wave'],
      landslide: ['landslide', 'mudslide', 'rockslide', 'slope failure'],
      volcano: ['volcano', 'volcanic', 'eruption', 'lava', 'ash cloud'],
      storm: ['storm', 'thunderstorm', 'hailstorm', 'severe weather'],
      drought: ['drought', 'water crisis', 'dry spell', 'water shortage'],
      structural_collapse: ['building collapse', 'structure collapse', 'collapsed', 'building fall']
    };

    const lowerText = text.toLowerCase();
    
    // Check for specific crisis types first
    for (const [type, keywords] of Object.entries(typeMap)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return type;
      }
    }
    
    // Check for general emergency terms
    const emergencyTerms = ['emergency', 'disaster', 'crisis', 'calamity', 'catastrophe'];
    if (emergencyTerms.some(term => lowerText.includes(term))) {
      return 'general_emergency';
    }

    return 'unknown';
  }