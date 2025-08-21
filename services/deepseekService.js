import fetch from 'node-fetch';

class DeepSeekService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.deepseek.com/v1';
  }

  async generateResponse(prompt, maxTokens = 500) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Generate habit recommendations based on user goals
  async generateHabitRecommendations(userGoals, currentHabits = []) {
    const prompt = `
      As a habit-building expert, suggest 3-5 personalized habits for someone with these goals: "${userGoals}".
      They currently have these habits: ${currentHabits.length > 0 ? currentHabits.join(', ') : 'none'}.
      
      Provide the response as a JSON array with this structure for each habit:
      {
        "name": "Habit name",
        "description": "Brief explanation",
        "type": "positive",
        "reason": "Why this habit would help achieve their goals"
      }
    `;

    const response = await this.generateResponse(prompt);
    
    try {
      // Extract JSON from the response (AI might add some text around it)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', response);
      // Fallback to a default set of recommendations
      return [
        {
          name: "Morning Meditation",
          description: "Start your day with 5 minutes of meditation",
          type: "positive",
          reason: "Helps with focus and reduces stress, supporting your goals"
        }
      ];
    }
  }

  // Analyze habit patterns and provide insights
  async analyzeHabitPatterns(habits, completions) {
    const prompt = `
      Analyze these habit patterns and provide insights:
      Habits: ${habits.map(h => `${h.name} (${h.type})`).join(', ')}
      Completion history: ${JSON.stringify(completions)}
      
      Provide specific, actionable insights about patterns, potential obstacles, and suggestions for improvement.
      Keep the response under 200 words.
    `;

    return await this.generateResponse(prompt, 300);
  }

  // Generate motivational message based on progress
  async generateMotivationalMessage(progress, goals) {
    const prompt = `
      Create a motivational message for someone working on habit formation.
      Their progress: ${progress}
      Their goals: ${goals}
      
      Make it encouraging, specific to their situation, and keep it under 100 words.
    `;

    return await this.generateResponse(prompt, 150);
  }
}

export default DeepSeekService;