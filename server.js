const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_API_BASE = 'https://api.github.com/repos/' + GITHUB_REPO;

console.log('GitHub Config:', {
  repo: GITHUB_REPO,
  tokenExists: !!GITHUB_TOKEN
});

if (!GITHUB_TOKEN || !GITHUB_REPO) {
  console.error('Missing GitHub configuration! Please set GITHUB_TOKEN and GITHUB_REPO environment variables.');
}

app.use(express.json({ limit: '10mb' }));

// GitHub API helper function
async function githubAPI(endpoint, method = 'GET', data = null) {
  const fetch = (await import('node-fetch')).default;
  const options = {
    method,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'OCR-Annotation-Tool'
    }
  };
  
  if (data && method !== 'GET') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, options);
  const result = await response.json();
  
  if (!response.ok) {
    console.error(`GitHub API Error (${response.status}):`, result);
    throw new Error(`GitHub API Error: ${result.message || 'Unknown error'}`);
  }
  
  return result;
}

// List all images in the images folder
app.get('/api/images', async (req, res) => {
  try {
    const response = await githubAPI('/contents/images');
    if (Array.isArray(response)) {
      const imageFiles = response
        .filter(file => file.name.match(/\.(jpg|jpeg|png)$/i))
        .map(file => file.name)
        .sort();
      res.json(imageFiles);
    } else {
      res.status(500).json({ error: 'Failed to list images from GitHub' });
    }
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// List all annotated files in New_ocr
app.get('/api/annotated', async (req, res) => {
  try {
    const response = await githubAPI('/contents/New_ocr');
    if (Array.isArray(response)) {
      const jsonFiles = response
        .filter(file => file.name.match(/_annotated\.json$/i))
        .map(file => file.name);
      console.log(`Found ${jsonFiles.length} annotated files`);
      res.json(jsonFiles);
    } else {
      console.log('New_ocr folder not found, returning empty array');
      res.json([]);
    }
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('New_ocr folder does not exist yet, returning empty array');
      res.json([]);
    } else {
      console.error('Error fetching annotated files:', error.message);
      res.json([]);
    }
  }
});

// Serve JSON from Old_ocr
app.get('/api/old_ocr/:jsonFile', async (req, res) => {
  try {
    console.log(`Fetching OCR file: ${req.params.jsonFile}`);
    const response = await githubAPI(`/contents/Old_ocr/${req.params.jsonFile}`);
    if (response.content) {
      const content = Buffer.from(response.content, 'base64').toString('utf8');
      res.type('json').send(content);
    } else {
      console.log(`OCR file not found: ${req.params.jsonFile}`);
      res.status(404).json({ error: 'JSON not found' });
    }
  } catch (error) {
    console.error(`Error fetching OCR file ${req.params.jsonFile}:`, error.message);
    res.status(404).json({ error: `JSON not found: ${error.message}` });
  }
});

// Save JSON to New_ocr via GitHub API
app.post('/api/save-json', async (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ error: 'Missing filename or data' });
    }

    console.log(`Saving annotation: ${filename}`);
    
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const filePath = `New_ocr/${filename}`;
    
    // Check if file already exists to get SHA
    let sha = null;
    try {
      const existingFile = await githubAPI(`/contents/${filePath}`);
      if (existingFile.sha) {
        sha = existingFile.sha;
        console.log(`File exists, updating with SHA: ${sha}`);
      }
    } catch (error) {
      console.log(`File doesn't exist, creating new: ${filename}`);
    }

    const commitData = {
      message: `Add annotation: ${filename}`,
      content: content,
      ...(sha && { sha }) // Include SHA if file exists (for updates)
    };

    const result = await githubAPI(`/contents/${filePath}`, 'PUT', commitData);
    
    if (result.content || result.commit) {
      console.log(`Successfully saved: ${filename}`);
      res.json({ success: true });
    } else {
      console.error('Unexpected GitHub response:', result);
      res.status(500).json({ error: 'Failed to save file to GitHub' });
    }
  } catch (error) {
    console.error('Error saving to GitHub:', error);
    res.status(500).json({ error: `Failed to save file: ${error.message}` });
  }
});

// Serve all other static files (frontend)
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});