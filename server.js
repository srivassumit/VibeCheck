import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = 3001;
const MONGO_URI = 'mongodb://localhost:27017/vibecheck';

// Middleware
app.use(cors());
app.use(express.json()); // Built-in body parser

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB: vibecheck'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    console.log('⚠️  Ensure MongoDB is running on localhost:27017');
  });

// Mongoose Schema
const AnalysisRunSchema = new mongoose.Schema({
  title: String,
  description: String,
  prLink: String,
  requirements: String, // Added field for Jira Requirements
  status: { type: String, enum: ['passed', 'failed'] },
  score: Number,
  durationMs: Number,
  issues: [String],
  issueCount: Number,
  summary: String,
  createdAt: { type: Date, default: Date.now }
});

// Explicitly use the 'PRChecks' collection as requested
const AnalysisRun = mongoose.model('AnalysisRun', AnalysisRunSchema, 'PRChecks');

// Routes

/**
 * GET /api/dashboard
 * Aggregates stats and returns recent history
 */
app.get('/api/dashboard', async (req, res) => {
  try {
    // 1. Get History (Limit 50)
    const history = await AnalysisRun.find()
      .sort({ createdAt: -1 })
      .limit(50);

    // 2. Aggregate Stats
    const totalRuns = await AnalysisRun.countDocuments();
    const passed = await AnalysisRun.countDocuments({ status: 'passed' });

    // Aggregation for Average Time and Total Issues
    const aggResults = await AnalysisRun.aggregate([
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$durationMs" },
          totalIssues: { $sum: "$issueCount" }
        }
      }
    ]);

    const result = aggResults[0] || { avgDuration: 0, totalIssues: 0 };

    const avgMs = result.avgDuration || 0;
    const avgMins = avgMs / 60000;

    // Format string "Xm Ys"
    const mins = Math.floor(avgMins);
    const secs = Math.round((avgMins - mins) * 60);
    const avgTimeStr = `${mins}m ${secs}s`;

    const stats = {
      passed,
      issues: result.totalIssues, // Sum of all issues detected
      avgTime: avgTimeStr,
      avgTimeMinutes: parseFloat(avgMins.toFixed(2)),
      totalRuns
    };

    // Transform _id to id for frontend
    const formattedHistory = history.map(doc => ({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      status: doc.status,
      score: doc.score,
      date: doc.createdAt.toISOString(),
      timestamp: doc.createdAt.getTime()
    }));

    res.json({ stats, history: formattedHistory });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/history
 * Save a new analysis session
 */
app.post('/api/history', async (req, res) => {
  try {
    const data = req.body;

    const newRun = new AnalysisRun({
      title: data.title,
      description: data.description,
      prLink: data.prLink,
      requirements: data.requirements, // Save requirements
      status: data.status,
      score: data.score,
      durationMs: data.durationMs,
      issues: data.issues || [],
      issueCount: data.issueCount || (data.issues ? data.issues.length : 0),
      summary: data.summary,
      createdAt: new Date()
    });

    const saved = await newRun.save();
    console.log(`💾 Saved session to PRChecks: ${saved._id}`);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 VibeCheck Server running on http://localhost:${PORT}`);
});