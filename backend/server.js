const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/frequency', async (req, res) => {
  const { url, topN = 10 } = req.body; // Default to top 10 if not specified

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Fetch the webpage content
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Remove unwanted elements like scripts and styles
    $('script, style, noscript, iframe, link, meta').remove();

    // Extract visible text with spaces between sibling elements
    let text = $('body')
      .find('*')
      .contents()
      .toArray()
      .map((node) => (node.type === 'text' ? node.data.trim() : ''))
      .filter(Boolean)
      .join(' '); // Join with a space to ensure separation between sibling elements

    // Split text into words
    const words = text.toLowerCase().match(/\b\w+\b/g); // Match all word characters

    if (!words) {
      return res.status(400).json({ error: 'No words found on the page.' });
    }

    // Calculate word frequency
    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    // Sort by frequency and take the top N
    const frequencyArray = Object.entries(frequency)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);

    // Send only frequency data
    res.json({ frequencyArray });
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).json({ error: 'Failed to fetch URL or analyze content' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
