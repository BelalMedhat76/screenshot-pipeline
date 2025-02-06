import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
const screenshotsFile = path.join(dataDir, 'screenshots.json');

async function initializeDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      await fs.access(screenshotsFile);
    } catch {
      await fs.writeFile(screenshotsFile, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing data directory:', error);
  }
}

initializeDataDir();

// Routes
app.get('/api/screenshots', async (req, res) => {
  try {
    const data = await fs.readFile(screenshotsFile, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Error reading screenshots' });
  }
});

app.post('/api/screenshots', async (req, res) => {
  try {
    const { imageData, title } = req.body;
    const data = await fs.readFile(screenshotsFile, 'utf8');
    const screenshots = JSON.parse(data);
    
    screenshots.push({
      id: Date.now(),
      title,
      imageData,
      createdAt: new Date().toISOString()
    });
    
    await fs.writeFile(screenshotsFile, JSON.stringify(screenshots, null, 2));
    res.status(201).json({ message: 'Screenshot saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error saving screenshot' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});