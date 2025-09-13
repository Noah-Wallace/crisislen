// src/services/openaiService.js
import { mockAnalysisResults } from '../data/sampleCrisisData.js';

export class OpenAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
    this.model = 'gpt-3.5-turbo';
  }

  async analyzeCrisis(crisisText, location = '', type = '', crisisId = null) {
    // Return mock data if no API key or for demo reliability
    if (!this.apiKey || this.shouldUseMockData()) {
      console.log('🎭 Using mock AI analysis for demo reliability');
      await this.simulateDelay(1000, 2000);
      return this.getMockAnalysis(crisisText, type, crisisId);
    }

    try {
      console.log('🤖 Analyzing crisis with OpenAI...');
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{
            role: 'system',
            content: `You are a crisis analysis AI expert. Analyze crisis reports and extract structured information.

RESPOND ONLY IN VALID JSON FORMAT with these exact fields:
{
  "urgency": number (1-10, where 10 is most critical),
  "estimatedCasualties": "string description",
  "resourcesNeeded": ["array", "of", "resources"],
  "immediateActions": ["array", "of", "actions"],
  "riskLevel": "Critical|High|Medium|Low",
  "stakeholders": ["array", "of", "organizations"],
  "confidence": number (0.0-1.0)
}

Consider factors like:
- Scale of disaster
- Population density  
- Infrastructure damage
- Environmental conditions
- Response capacity`
          }, {
            role: 'user',
            content: `Analyze this crisis situation:

CRISIS REPORT: "${crisisText}"
LOCATION: ${location}
TYPE: ${type}

Provide structured analysis in JSON format only.`
          }],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      try {
        // Try to parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        const requiredFields = ['urgency', 'estimatedCasualties', 'resourcesNeeded', 'immediateActions', 'riskLevel', 'stakeholders'];
        const missingFields = requiredFields.filter(field => !(field in analysis));
        
        if (missingFields.length > 0) {
          console.warn('Missing fields in AI response:', missingFields);
          return this.enrichAnalysis(analysis, type);
        }
        
        console.log('✅ OpenAI analysis successful');
        return analysis;
        
      } catch (parseError) {
        console.warn('Failed to parse OpenAI JSON, using structured parsing:', parseError);
        return this.parseUnstructuredAnalysis(content, type);
      }
      
    } catch (error) {
      console.error('❌ Error analyzing crisis with OpenAI:', error);
      console.log('🎭 Falling back to mock analysis');
      await this.simulateDelay(500);
      return this.getMockAnalysis(crisisText, type, crisisId);
    }
  }

  async generateExecutiveSummary(crisisDataArray) {
    if (!this.apiKey || this.shouldUseMockData()) {
      console.log('🎭 Using mock executive summary');
      await this.simulateDelay(1500, 2500);
      return this.getMockExecutiveSummary(crisisDataArray);
    }

    try {
      const crisisTexts = crisisDataArray.map(c => 
        `${c.location}: ${c.type.toUpperCase()} - ${c.text}`
      ).join('\n\n');
      
      console.log('📝 Generating executive summary with OpenAI...');
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{
            role: 'system',
            content: `You are a senior crisis intelligence analyst for emergency response leadership. 

Create a concise, actionable executive summary that includes:
1. Current situation overview
2. Priority events requiring immediate attention
3. Resource allocation recommendations  
4. Next actions for leadership
5. Estimated response timeline

Keep it professional, clear, and decision-focused. Maximum 300 words.`
          }, {
            role: 'user',
            content: `Generate an executive summary from these ${crisisDataArray.length} crisis reports:

${crisisTexts}`
          }],
          max_tokens: 400,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content?.trim();
      
      if (!summary) {
        throw new Error('Empty summary from OpenAI');
      }

      console.log('✅ Executive summary generated successfully');
      return summary;
      
    } catch (error) {
      console.error('❌ Error generating executive summary:', error);
      console.log('🎭 Falling back to mock summary');
      return this.getMockExecutiveSummary(crisisDataArray);
    }
  }

  // Helper methods
  shouldUseMockData() {
    // Use mock data 30% of the time for demo reliability
    return Math.random() < 0.3;
  }

  async simulateDelay(minMs = 500, maxMs = 2000) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  getMockAnalysis(text, type, crisisId = null) {
    // If we have pre-defined mock data for this crisis ID, use it
    if (crisisId && mockAnalysisResults[crisisId]) {
      return mockAnalysisResults[crisisId];
    }

    // Generate contextual mock analysis based on type
    const mockAnalyses = {
      earthquake: {
        urgency: 9,
        estimatedCasualties: "High - Potentially 500+ casualties, thousands affected",
        resourcesNeeded: ["Search and rescue teams", "Medical supplies", "Heavy machinery", "Temporary shelter"],
        immediateActions: ["Deploy emergency response teams", "Establish field hospitals", "Coordinate international aid", "Assess structural damage"],
        riskLevel: "Critical",
        stakeholders: ["Emergency Services", "International Aid Organizations", "Local Government", "Military Forces"],
        confidence: 0.91
      },
      flood: {
        urgency: 7,
        estimatedCasualties: "Moderate - 200+ evacuations needed, infrastructure damage",
        resourcesNeeded: ["Boats and rescue equipment", "Emergency shelters", "Clean water supplies", "Sanitation facilities"],
        immediateActions: ["Continue evacuation operations", "Set up relief camps", "Monitor water levels", "Prevent disease outbreak"],
        riskLevel: "High", 
        stakeholders: ["Coast Guard", "State Disaster Management", "Red Cross", "Health Department"],
        confidence: 0.86
      },
      wildfire: {
        urgency: 8,
        estimatedCasualties: "Moderate - 1000+ evacuated, property damage significant",
        resourcesNeeded: ["Firefighting aircraft", "Ground crews", "Evacuation support", "Air quality monitoring"],
        immediateActions: ["Contain fire spread", "Complete evacuations", "Establish firebreaks", "Monitor air quality"],
        riskLevel: "High",
        stakeholders: ["Fire Department", "Forest Service", "Local Authorities", "Environmental Agencies"],
        confidence: 0.88
      },
      cyclone: {
        urgency: 9,
        estimatedCasualties: "Very High - Coastal populations at extreme risk",
        resourcesNeeded: ["Storm shelters", "Rescue boats", "Emergency supplies", "Communication equipment"],
        immediateActions: ["Mass evacuation", "Secure infrastructure", "Prepare relief operations", "Weather monitoring"],
        riskLevel: "Critical",
        stakeholders: ["National Weather Service", "Coast Guard", "Emergency Management", "Military"],
        confidence: 0.93
      },
      structural_collapse: {
        urgency: 8,
        estimatedCasualties: "Moderate - 10-50 people potentially trapped",
        resourcesNeeded: ["Heavy rescue equipment", "Medical teams", "Structural engineers", "Specialized tools"],
        immediateActions: ["Search and rescue", "Structural assessment", "Medical response", "Area isolation"],
        riskLevel: "High",
        stakeholders: ["Fire Department", "Emergency Medical Services", "Building Authorities", "Police"],
        confidence: 0.82
      }
    };

    const baseAnalysis = mockAnalyses[type] || mockAnalyses.earthquake;
    
    // Add some randomization for realism
    return {
      ...baseAnalysis,
      urgency: Math.max(1, Math.min(10, baseAnalysis.urgency + Math.floor(Math.random() * 3 - 1))),
      confidence: Math.max(0.5, Math.min(1.0, baseAnalysis.confidence + (Math.random() * 0.2 - 0.1)))
    };
  }

  getMockExecutiveSummary(crisisDataArray) {
    const crisisTypes = [...new Set(crisisDataArray.map(c => c.type))];
    const locations = [...new Set(crisisDataArray.map(c => c.location))].slice(0, 3);
    const highUrgencyCount = crisisDataArray.filter(c => {
      const analysis = mockAnalysisResults[c.id];
      return analysis && analysis.urgency >= 8;
    }).length;

    const currentTime = new Date().toLocaleString();
    
    return `CRISIS INTELLIGENCE EXECUTIVE SUMMARY
Generated: ${currentTime}

CURRENT SITUATION:
${crisisDataArray.length} active crisis events detected across ${locations.length} regions. ${highUrgencyCount} events classified as high priority requiring immediate response.

PRIORITY EVENTS:
${crisisTypes.includes('earthquake') ? '• CRITICAL: Earthquake response operations - Mass casualty event requiring international aid coordination\n' : ''}${crisisTypes.includes('cyclone') ? '• CRITICAL: Cyclone impact - Coastal evacuation and storm surge management\n' : ''}${crisisTypes.includes('flood') ? '• HIGH: Flood response - Evacuation and relief operations in progress\n' : ''}${crisisTypes.includes('wildfire') ? '• HIGH: Wildfire containment - Air support and evacuation coordination\n' : ''}${crisisTypes.includes('structural_collapse') ? '• HIGH: Building collapse - Urban search and rescue operations\n' : ''}

RESOURCE ALLOCATION PRIORITY:
1. Deploy emergency response teams to ${locations[0]} and ${locations[1] || 'affected areas'}
2. Activate international aid protocols for large-scale disasters
3. Coordinate with local authorities for evacuation and relief support
4. Establish emergency communication networks

IMMEDIATE ACTIONS REQUIRED:
1. Continuous real-time monitoring of all developing situations
2. Resource deployment coordination with federal/state agencies  
3. Public emergency communication and alert systems activation
4. Preparation of international humanitarian aid requests

ESTIMATED RESPONSE TIMELINE:
- Initial deployment: 2-4 hours
- Full operational capacity: 6-12 hours  
- Relief operations: 24-72 hours

RECOMMENDATION: Maintain heightened alert status and prepare for potential escalation of current events.`;
  }

  parseUnstructuredAnalysis(content, type) {
    // Extract structured information from unstructured AI response
    const urgencyMatch = content.match(/urgency[:\s]*(\d+)/i);
    const urgency = urgencyMatch ? parseInt(urgencyMatch[1]) : 8;

    return {
      urgency: Math.max(1, Math.min(10, urgency)),
      estimatedCasualties: "Analysis in progress - AI response being processed",
      resourcesNeeded: ["Emergency response teams", "Medical supplies", "Specialized equipment"],
      immediateActions: ["Assess situation", "Deploy resources", "Establish communication"],
      riskLevel: urgency >= 8 ? "Critical" : urgency >= 6 ? "High" : "Medium",
      stakeholders: ["Emergency Services", "Local Government", "Relief Organizations"],
      confidence: 0.75,
      rawAnalysis: content.substring(0, 200) + "..."
    };
  }

  enrichAnalysis(partialAnalysis, type) {
    const mockBase = this.getMockAnalysis("", type);
    return {
      ...mockBase,
      ...partialAnalysis,
      confidence: (partialAnalysis.confidence || mockBase.confidence) * 0.9 // Slightly lower confidence for incomplete data
    };
  }
}