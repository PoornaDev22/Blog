import React, { useEffect, useState } from 'react';
import ArticleCard from '../components/ArticleCard';

const NEWS_API_KEY = 'df8b6c88c865419a93ca5a8f81e3e23b';
const PEXELS_API_KEY = 'sjOBHQHFtx1czvi82hPpWGP0dpuneZTGmrx8kK7G7adkLxvRZDtqzzVT';
const GEMINI_API_KEY = 'AIzaSyAjyLZntUCRikGurUQVM6ZmSxeyPuZZdl0';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingKeywords, setTrendingKeywords] = useState([]);

  useEffect(() => {
    fetchArticles();
    fetchTrendingKeywords();
  }, []);

  useEffect(() => {
    if (trendingKeywords.length === 0) return;

    const targetHour = 8;
    const targetMinute = 15;

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
  }, [trendingKeywords]);

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

  async function fetchTrendingKeywords() {
    try {
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&category=technology&pageSize=10&apiKey=${NEWS_API_KEY}`
      );
      const data = await res.json();

      if (!data.articles) throw new Error('No articles returned');

      const trends = data.articles.map(article =>
        article.title.split(' ').slice(0, 3).join(' ')
      );

      const uniqueTrends = [...new Set(trends)];
      setTrendingKeywords(uniqueTrends);
    } catch (err) {
      console.error('Failed to fetch tech trends:', err);
      alert('⚠ Could not fetch tech trending keywords. Using fallback.');
      setTrendingKeywords(['AI', 'Cybersecurity', 'Quantum Computing']);
    }
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
        return data.photos[0].src.medium; // Using medium size image
      }
      return null;
    } catch (error) {
      console.error('Error fetching image from Pexels:', error);
      return null;
    }
  };

  const generateArticle = async () => {
    if (trendingKeywords.length === 0) {
      alert('No trending keywords available');
      return;
    }

    setLoading(true);
    try {
      const keyword = trendingKeywords[Math.floor(Math.random() * trendingKeywords.length)];
      console.log('Selected keyword:', keyword);

      // Fetch image from Pexels
      const imageUrl = await fetchPexelsImage(keyword) || 
        'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg'; // Fallback image

      // Generate article content with Gemini
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
                    text: `Write a detailed tech blog article about ${keyword} in markdown format with headings, paragraphs, and lists.`,
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
          keyword,
          pubstatus: 'draft',
          slug,
          imageUrl
        },
      };

      const strapiResponse = await fetch('https://effortless-connection-2f75f4ee80.strapiapp.com/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle),
      });

      if (!strapiResponse.ok) {
        const errorText = await strapiResponse.text();
        throw new Error('Strapi API error: ' + errorText);
      }

      alert(`✅ Article about "${keyword}" generated and saved as draft.`);

      await fetchArticles();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <h1>📰 Tech Blog</h1>

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
        {loading ? 'Generating...' : 'Generate Article'}
      </button>

      {articles.length === 0 && <p>No published articles yet.</p>}

      {articles.map(article => (
        <ArticleCard key={article.id} article={article.attributes || article} />
      ))}
    </div>
  );
};

export default Home;