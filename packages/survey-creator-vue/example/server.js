import express from 'express';
import bodyParser from 'body-parser';
import Database from '@replit/database';
import cors from 'cors';

const app = express();
const db = new Database();

app.use(cors());
app.use(bodyParser.json());

// API endpoint to save survey responses
app.post('/api/survey', async (req, res) => {
  try {
    const { uuid, display_text, all_responses } = req.body;

    // Validate required fields
    if (!uuid || !display_text || !all_responses) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields: uuid, display_text, or all_responses' 
      });
    }

    // Generate unique submission key: csvUuid-timestamp-random
    const submissionId = `${uuid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const responseData = {
      csv_uuid: uuid,
      display_text,
      all_responses,
      timestamp: new Date().toISOString(),
      submission_id: submissionId
    };

    await db.set(submissionId, responseData);

    console.log('✅ Saved survey response:', submissionId, display_text);
    res.json({ status: 'saved', submission_id: submissionId });
  } catch (error) {
    console.error('Error saving survey response:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API endpoint to retrieve all survey responses
app.get('/api/survey', async (req, res) => {
  try {
    // db.list() returns array of keys, not the full data
    const keys = await db.list();
    const responses = [];
    
    // Fetch each stored response by key
    if (Array.isArray(keys)) {
      for (const key of keys) {
        const data = await db.get(key);
        if (data) {
          responses.push({ 
            submission_id: key,
            ...data
          });
        }
      }
    }
    
    console.log(`✅ Retrieved ${responses.length} survey responses`);
    res.json({ responses });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Survey API server running on port ${PORT}`);
});
