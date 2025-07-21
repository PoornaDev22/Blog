import React, { useEffect, useState } from 'react';
import ArticleCard from '../components/ArticleCard';

const YOUTUBE_API_KEY = 'AIzaSyB446LgUJAv_8VaFKUIscb2EpBjgEReJJw'; // Replace with your YouTube Data API v3 key
const PEXELS_API_KEY = 'sjOBHQHFtx1czvi82hPpWGP0dpuneZTGmrx8kK7G7adkLxvRZDtqzzVT';
const GEMINI_API_KEY = 'AIzaSyAjyLZntUCRikGurUQVM6ZmSxeyPuZZdl0';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingVideoTitles, setTrendingVideoTitles] = useState([]);

  useEffect(() => {
    fetchArticles();
    fetchTrendingVideoTitles();
  }, []);

  useEffect(() => {
    if (trendingVideoTitles.length === 0) return;

    const targetHour = 10;
    const targetMinute = 10;

    const now = new Date();
    const target = new Date();

    target.setHours(targetHour);
    target.setMinutes(targetMinute);
    target.setSeconds(0);
    target.setMilliseconds(0);

    const timeUntilTarget = target - now;

    if (timeUntilTarget > 0) {
      console.log(`⏳ Scheduled article generation in ${Math.round(timeUntilTarget / 1000)} seconds`);
      const timer = setTimeout(() => {
        console.log('🚀 Generating article at scheduled time...');
        generateArticle();
      }, timeUntilTarget);

      return () => clearTimeout(timer);
    } else {
      console.log('🕓 Target time already passed for today. Skipping auto-generation.');
    }
  }, [trendingVideoTitles]);

  async function fetchArticles() {
    try {
      const res = await fetch(
        'https://effortless-connection-2f75f4ee80.strapiapp.com/api/articles?filters[pubstatus][$eq]=published&populate=*'
      );
      const data = await res.json();
      setArticles(data.data);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  }

  async function fetchTrendingVideoTitles() {
    try {
      // Search for trending tech videos using YouTube Data API v3
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=technology%20tech%20programming%20AI%20software&type=video&order=relevance&publishedAfter=${getYesterdayISO()}&maxResults=15&key=${YOUTUBE_API_KEY}`;
      
      const res = await fetch(searchUrl);
      const data = await res.json();

      if (!data.items) throw new Error('No videos returned from YouTube API');

      // Extract video titles
      const videoTitles = data.items.map(item => item.snippet.title);
      
      // Filter out titles that are too short or generic
      const filteredTitles = videoTitles.filter(title => 
        title.length > 20 && 
        !title.toLowerCase().includes('shorts') &&
        !title.toLowerCase().includes('live stream')
      );

      setTrendingVideoTitles(filteredTitles);
      console.log('Fetched video titles:', filteredTitles);
    } catch (err) {
      console.error('Failed to fetch YouTube trending videos:', err);
      alert('⚠ Could not fetch YouTube trending videos. Using fallback titles.');
      setTrendingVideoTitles([
        'Revolutionary AI Breakthrough Changes Everything',
        'The Future of Quantum Computing Explained',
        'Why Cybersecurity Matters More Than Ever'
      ]);
    }
  }

  // Helper function to get yesterday's date in ISO format for YouTube API
  function getYesterdayISO() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString();
  }

  function generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function parseTitleAndContentBlocks(markdown) {
    const lines = markdown.split('\n');
    let title = 'Untitled Article';
    const blocks = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('# ')) {
        title = trimmed.replace('# ', '');
        blocks.push({
          type: 'heading',
          level: 1,
          children: [{ type: 'text', text: title }],
        });
      } else if (trimmed.startsWith('## ')) {
        blocks.push({
          type: 'heading',
          level: 2,
          children: [{ type: 'text', text: trimmed.replace('## ', '') }],
        });
      } else if (trimmed.startsWith('- ')) {
        blocks.push({
          type: 'list-item',
          children: [{ type: 'text', text: trimmed.replace('- ', '') }],
        });
      } else {
        blocks.push({
          type: 'paragraph',
          children: [{ type: 'text', text: trimmed }],
        });
      }
    }

    return { title, blocks };
  }

  const fetchPexelsImage = async (keyword) => {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1`,
        {
          headers: {
            Authorization: PEXELS_API_KEY
          }
        }
      );
      
      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.medium;
      }
      return null;
    } catch (error) {
      console.error('Error fetching image from Pexels:', error);
      return null;
    }
  };

  const generateArticle = async () => {
    if (trendingVideoTitles.length === 0) {
      alert('No trending video titles available');
      return;
    }

    setLoading(true);
    try {
      const selectedTitle = trendingVideoTitles[Math.floor(Math.random() * trendingVideoTitles.length)];
      console.log('Selected video title:', selectedTitle);

      // Extract key terms from the video title for image search
      const imageKeywords = selectedTitle
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3)
        .join(' ') || 'technology';

      // Fetch image from Pexels using extracted keywords
      const imageUrl = await fetchPexelsImage(imageKeywords) || 
        'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg'; // Fallback image

      console.log('🎯 Sending this video title to Gemini for analysis:', selectedTitle);

      // Generate article content with Gemini based on the full video title
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this video title: "${selectedTitle}". 

Identify what product, technology, or topic this title is about, then write a comprehensive tech blog article about that subject. Do NOT mention the video or that this is based on a video title. Write as if you're an expert explaining the topic directly.

For example:
- If the title is about "iPhone 15 Pro Max Review", write about iPhone 15 Pro Max features, specs, and technology
- If it's about "AI Revolution in 2024", write about artificial intelligence developments and trends
- If it's about "Tesla Model Y Updates", write about Tesla Model Y and electric vehicle technology

Create the article in markdown format with headings, paragraphs, and lists. Make it informative and engaging.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error('Gemini API error: ' + errorText);
      }

      const geminiData = await geminiResponse.json();
      const articleMarkdown = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!articleMarkdown) throw new Error('No content returned from Gemini.');

      const { title, blocks } = parseTitleAndContentBlocks(articleMarkdown);
      const slug = generateSlug(title);

      const newArticle = {
        data: {
          title,
          content: blocks,
          keyword: imageKeywords,
          pubstatus: 'draft',
          slug,
          imageUrl
          // Removed sourceVideoTitle since it doesn't exist in Strapi schema
        },
      };

      console.log('Sending article data to Strapi:', JSON.stringify(newArticle, null, 2));

      const strapiResponse = await fetch('https://effortless-connection-2f75f4ee80.strapiapp.com/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle),
      });

      if (!strapiResponse.ok) {
        const errorText = await strapiResponse.text();
        console.error('Strapi error response:', errorText);
        throw new Error('Strapi API error: ' + errorText);
      }

      alert(`✅ Article about the topic from "${selectedTitle}" generated and saved as draft.`);

      await fetchArticles();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <h1>📰 Tech Blog (YouTube Powered)</h1>

      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          📺 Trending Video Titles Found: {trendingVideoTitles.length}
        </p>
      </div>

      <button 
        onClick={generateArticle} 
        disabled={loading} 
        style={{ 
          marginBottom: '1.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Generating...' : 'Generate Article from YouTube Trend'}
      </button>

      {articles.length === 0 && <p>No published articles yet.</p>}

      {articles.map(article => (
        <ArticleCard key={article.id} article={article.attributes || article} />
      ))}
    </div>
  );
};

export default Home;