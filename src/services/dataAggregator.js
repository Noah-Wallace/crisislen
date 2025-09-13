// src/services/dataAggregator.js
import { NewsService } from './newsService.js';
import { RedditService } from './redditService.js';
import { OpenAIService } from './openaiService.js';
import { sampleCrisisData } from '../data/sampleCrisisData.js';

export class DataAggregator {
  constructor() {
    this.newsService = new NewsService();
    this.redditService = new RedditService();
    this.openaiService = new OpenAIService();
    this.isProcessing = false;
    this.lastUpdate = null;
  }

  async aggregateAllCrisisData() {
    if (this.isProcessing) {
      console.log('⏳ Data aggregation already in progress');
      return { data: [], fromCache: true };
    }

    this.isProcessing = true;
    
    try {
      console.log('🚀 Starting comprehensive crisis data aggregation...');
      
      // Always start with sample data for instant display
      let allData = [...sampleCrisisData];
      const startTime = Date.now();
      
      // Fetch live data in parallel with timeout
      const dataPromises = [
        this.timeoutPromise(this.newsService.fetchCrisisNews(), 8000, 'News API'),
        this.timeoutPromise(this.redditService.fetchCrisisDiscussions(), 6000, 'Reddit API')
      ];
      
      const results = await Promise.allSettled(dataPromises);
      
      // Process News API results
      if (results[0].status === 'fulfilled' && results[0].value.length > 0) {
        const newsData = this.deduplicateData(results[0].value);
        allData = [...allData, ...newsData];
        console.log(`📰 Added ${newsData.length} unique news articles`);
      } else {
        console.warn('📰 News API failed or returned no data:', results[0].reason?.message);
      }
      
      // Process Reddit results
      if (results[1].status === 'fulfilled' && results[1].value.length > 0) {
        const redditData = this.deduplicateData(results[1].value);
        allData = [...allData, ...redditData];
        console.log(`🔍 Added ${redditData.length} unique Reddit posts`);
      } else {
        console.warn('🔍 Reddit API failed or returned no data:', results[1].reason?.message);
      }
      
      // Remove duplicates across all sources
      allData = this.removeCrossSourceDuplicates(allData);
      
      // Sort by timestamp (most recent first) and relevance
      allData = this.prioritizeAndSortData(allData);
      
      // Limit to reasonable number for demo performance
      const limitedData = allData.slice(0, 20);
      
      const processingTime = Date.now() - startTime;
      this.lastUpdate = new Date();
      
      console.log(`✅ Crisis data aggregation complete:`);
      console.log(`   • Total sources processed: ${results.length}`);
      console.log(`   • Total data points: ${limitedData.length}`);
      console.log(`   • Processing time: ${processingTime}ms`);
      
      return {
        data: limitedData,
        metadata: {
          totalSources: results.length,
          successfulSources: results.filter(r => r.status === 'fulfilled').length,
          processingTimeMs: processingTime,
          lastUpdate: this.lastUpdate.toISOString(),
          newsArticles: results[0].status === 'fulfilled' ? results[0].value.length : 0,
          redditPosts: results[1].status === 'fulfilled' ? results[1].value.length : 0
        }
      };
      
    } catch (error) {
      console.error('❌ Critical error in data aggregation:', error);
      return {
        data: sampleCrisisData,
        metadata: {
          error: error.message,
          fallbackUsed: true,
          lastUpdate: new Date().toISOString()
        }
      };
    } finally {
      this.isProcessing = false;
    }
  }

  async analyzeWithAI(crisisDataArray, options = {}) {
    const { batchSize = 5, includeConfidence = true } = options;
    
    if (!crisisDataArray || crisisDataArray.length === 0) {
      console.warn('⚠️ No crisis data provided for AI analysis');
      return [];
    }

    console.log(`🤖 Starting AI analysis for ${crisisDataArray.length} crisis events...`);
    
    try {
      // Process in batches to avoid overwhelming the API
      const batches = this.createBatches(crisisDataArray, batchSize);
      const analyzedResults = [];
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);
        
        const batchPromises = batch.map(async (crisis) => {
          try {
            const startTime = Date.now();
            const analysis = await this.openaiService.analyzeCrisis(
              crisis.text, 
              crisis.location, 
              crisis.type,
              crisis.id
            );
            
            const analysisTime = Date.now() - startTime;
            
            return {
              ...crisis,
              analysis: {
                ...analysis,
                ...(includeConfidence && { 
                  analysisTimeMs: analysisTime,
                  timestamp: new Date().toISOString()
                })
              }
            };
          } catch (error) {
            console.error(`❌ Analysis failed for crisis ${crisis.id}:`, error);
            return {
              ...crisis,
              analysis: this.getErrorAnalysis(crisis.type, error.message)
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        analyzedResults.push(...batchResults);
        
        // Small delay between batches to be respectful to APIs
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`✅ AI analysis complete for ${analyzedResults.length} events`);
      return analyzedResults;
      
    } catch (error) {
      console.error('❌ Critical error in AI analysis:', error);
      // Return data with basic analysis
      return crisisDataArray.map(crisis => ({
        ...crisis,
        analysis: this.getErrorAnalysis(crisis.type, error.message)
      }));
    }
  }

  async generateInsights(analyzedData) {
    if (!analyzedData || analyzedData.length === 0) {
      return this.getDefaultInsights();
    }

    try {
      console.log(`📊 Generating executive insights from ${analyzedData.length} analyzed events...`);
      
      const [executiveSummary, metrics] = await Promise.all([
        this.openaiService.generateExecutiveSummary(analyzedData),
        Promise.resolve(this.calculateMetrics(analyzedData))
      ]);
      
      const insights = {
        executiveSummary,
        metrics,
        recommendations: this.generateRecommendations(analyzedData),
        trends: this.analyzeTrends(analyzedData),
        lastUpdated: new Date().toISOString(),
        totalEvents: analyzedData.length
      };
      
      console.log('✅ Executive insights generated successfully');
      return insights;
      
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      return {
        executiveSummary: "Unable to generate executive summary due to processing error.",
        metrics: this.calculateMetrics(analyzedData),
        recommendations: ["Monitor situation closely", "Prepare emergency resources"],
        trends: { overall: "stable" },
        lastUpdated: new Date().toISOString(),
        totalEvents: analyzedData.length,
        error: error.message
      };
    }
  }

  // Utility methods
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async timeoutPromise(promise, timeoutMs, sourceName) {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${sourceName} timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    return Promise.race([promise, timeout]);
  }

  deduplicateData(dataArray) {
    const seen = new Set();
    return dataArray.filter(item => {
      // Create a simple hash of the text content
      const textHash = this.simpleHash(item.text.toLowerCase().substring(0, 100));
      if (seen.has(textHash)) {
        return false;
      }
      seen.add(textHash);
      return true;
    });
  }

  removeCrossSourceDuplicates(allData) {
    const uniqueData = [];
    const textHashes = new Set();
    
    for (const item of allData) {
      const hash = this.simpleHash(item.text.toLowerCase().substring(0, 150));
      if (!textHashes.has(hash)) {
        textHashes.add(hash);
        uniqueData.push(item);
      }
    }
    
    return uniqueData;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  prioritizeAndSortData(dataArray) {
    return dataArray.sort((a, b) => {
      // Priority factors
      const aScore = this.calculatePriorityScore(a);
      const bScore = this.calculatePriorityScore(b);
      
      if (aScore !== bScore) {
        return bScore - aScore; // Higher score first
      }
      
      // If same priority, sort by timestamp (newest first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  calculatePriorityScore(item) {
    let score = 0;
    
    // Verified sources get higher priority
    if (item.verified) score += 2;
    
    // Critical crisis types get higher priority
    const criticalTypes = ['earthquake', 'tsunami', 'cyclone', 'nuclear'];
    if (criticalTypes.includes(item.type)) score += 3;
    
    // High-impact types get medium priority
    const highImpactTypes = ['flood', 'wildfire', 'hurricane', 'structural_collapse'];
    if (highImpactTypes.includes(item.type)) score += 2;
    
    // Recent events get priority boost
    const hoursOld = (Date.now() - new Date(item.timestamp)) / (1000 * 60 * 60);
    if (hoursOld < 6) score += 2;
    else if (hoursOld < 24) score += 1;
    
    // Reliable sources get priority
    const reliableSources = ['Reuters', 'BBC News', 'Associated Press', 'Emergency Alert System'];
    if (reliableSources.includes(item.source)) score += 1;
    
    return score;
  }

  calculateMetrics(analyzedData) {
    const urgencyValues = analyzedData
      .filter(d => d.analysis?.urgency && typeof d.analysis.urgency === 'number')
      .map(d => d.analysis.urgency);
      
    const averageUrgency = urgencyValues.length > 0 
      ? (urgencyValues.reduce((a, b) => a + b, 0) / urgencyValues.length).toFixed(1)
      : 0;

    // Count by crisis type
    const typeCounts = analyzedData.reduce((acc, crisis) => {
      const type = crisis.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Count by location
    const locationCounts = analyzedData.reduce((acc, crisis) => {
      const location = crisis.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    // Count by source
    const sourceCounts = analyzedData.reduce((acc, crisis) => {
      const source = crisis.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    return {
      averageUrgency: parseFloat(averageUrgency),
      totalEvents: analyzedData.length,
      typeCounts,
      locationCounts,
      sourceCounts
    };
  }
}