import { getDatabase } from '../src/config/database';

async function seedAIRecommendations() {
  try {
    const db = getDatabase();
    
    // Check if table exists and has data
    const existingCount = await db('ai_recommendations').count('* as count');
    console.log('Existing AI recommendations:', existingCount[0].count);
    
    if (parseInt(existingCount[0].count as string) === 0) {
      // Insert sample data
      const sampleRecommendations = [
        {
          user_id: '6cc890f2-7169-44e1-b0f1-dc13d797d4e0', // Use existing user ID
          product_id: 'ad731db8-b3b9-4228-8dc9-0b82617d8ed6', // Use existing product ID
          recommendation_type: 'collaborative_filtering',
          confidence_score: 0.85,
          ranking_position: 1,
          reasoning: 'Popular among similar users',
          was_clicked: true,
          was_booked: false,
          context: JSON.stringify({ algorithm: 'collaborative', similarUsers: 5 })
        },
        {
          user_id: '6cc890f2-7169-44e1-b0f1-dc13d797d4e0',
          product_id: 'ad731db8-b3b9-4228-8dc9-0b82617d8ed6',
          recommendation_type: 'content_based',
          confidence_score: 0.78,
          ranking_position: 2,
          reasoning: 'Similar to products you viewed',
          was_clicked: false,
          was_booked: false,
          context: JSON.stringify({ algorithm: 'content_based', similarity: 0.78 })
        },
        {
          user_id: '6cc890f2-7169-44e1-b0f1-dc13d797d4e0',
          product_id: '1ef56091-17ff-4abc-99e8-cd62e1eb06a7',
          recommendation_type: 'trending',
          confidence_score: 0.72,
          ranking_position: 3,
          reasoning: 'Currently trending',
          was_clicked: true,
          was_booked: true,
          context: JSON.stringify({ algorithm: 'trending', viewCount: 15 })
        }
      ];
      
      const inserted = await db('ai_recommendations').insert(sampleRecommendations).returning('*');
      console.log('Inserted', inserted.length, 'AI recommendations');
      
      // Verify the data
      const newCount = await db('ai_recommendations').count('* as count');
      console.log('Total AI recommendations after insert:', newCount[0].count);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding AI recommendations:', error);
    process.exit(1);
  }
}

seedAIRecommendations();
