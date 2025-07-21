import React, { useEffect, useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import ArticleTile from '../components/ArticleTile';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const YOUTUBE_API_KEY = 'AIzaSyB446LgUJAv_8VaFKUIscb2EpBjgEReJJw'; // Replace with your YouTube Data API v3 key
const PEXELS_API_KEY = 'sjOBHQHFtx1czvi82hPpWGP0dpuneZTGmrx8kK7G7adkLxvRZDtqzzVT';
const GEMINI_API_KEY = 'AIzaSyAjyLZntUCRikGurUQVM6ZmSxeyPuZZdl0';

// Define categories with their search queries
const CATEGORIES = {
  tech: {
    name: 'Technology',
    searchQuery: 'technology programming AI software development coding',
    color: '#007bff'
  },
  sports: {
    name: 'Sports',
    searchQuery: 'sports football basketball soccer tennis olympics',
    color: '#28a745'
  },
  politics: {
    name: 'Politics',
    searchQuery: 'politics government election policy international news',
    color: '#dc3545'
  }
};

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingVideosByCategory, setTrendingVideosByCategory] = useState({});
  const [generatingCategory, setGeneratingCategory] = useState(null);
  const [usedVideoTitles, setUsedVideoTitles] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();

  useEffect(() => {
    fetchArticles();
    fetchAllTrendingVideos();
  }, []);

  // Load used video titles when articles are fetched
  useEffect(() => {
    if (articles.length > 0) {
      const titlesSet = new Set();
      articles.forEach(article => {
        const attrs = article.attributes || article;
        if (attrs.keyword) {
          titlesSet.add(attrs.keyword.toLowerCase().trim());
        }
      });
      setUsedVideoTitles(titlesSet);
      console.log('Loaded used video titles:', Array.from(titlesSet));
    }
  }, [articles]);

  // Filter articles based on selected category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredArticles(articles);
    } else {
      const categoryName = CATEGORIES[selectedCategory]?.name;
      const filtered = articles.filter(article => {
        const attrs = article.attributes || article;
        return attrs.category === categoryName;
      });
      setFilteredArticles(filtered);
    }
  }, [articles, selectedCategory]);

  useEffect(() => {
    if (Object.keys(trendingVideosByCategory).length === 0) return;

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
        console.log('🚀 Generating articles at scheduled time...');
        generateAllCategoryArticles();
      }, timeUntilTarget);

      return () => clearTimeout(timer);
    } else {
      console.log('🕓 Target time already passed for today. Skipping auto-generation.');
    }
  }, [trendingVideosByCategory]);

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

  async function fetchTrendingVideosForCategory(categoryKey, category) {
    try {
      console.log(`Fetching ${category.name} videos...`);
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(category.searchQuery)}&type=video&order=relevance&publishedAfter=${getYesterdayISO()}&maxResults=15&key=${YOUTUBE_API_KEY}`;
      
      const res = await fetch(searchUrl);
      const data = await res.json();

      if (!data.items) throw new Error(`No ${category.name} videos returned from YouTube API`);

      // Extract video titles
      const videoTitles = data.items.map(item => item.snippet.title);
      
      // Filter out titles that are too short or generic
      const filteredTitles = videoTitles.filter(title => 
        title.length > 20 && 
        !title.toLowerCase().includes('shorts') &&
        !title.toLowerCase().includes('live stream') &&
        !title.toLowerCase().includes('livestream')
      );

      console.log(`✅ Fetched ${filteredTitles.length} ${category.name} video titles`);
      return filteredTitles;
    } catch (err) {
      console.error(`Failed to fetch YouTube trending videos for ${category.name}:`, err);
      
      // Fallback titles for each category
      const fallbackTitles = {
        tech: [
          'Revolutionary AI Breakthrough Changes Everything',
          'The Future of Quantum Computing Explained',
          'Why Cybersecurity Matters More Than Ever'
        ],
        sports: [
          'Championship Game Highlights and Analysis',
          'Olympic Records Broken This Season',
          'Sports Technology Revolution in Training'
        ],
        politics: [
          'Government Policy Changes Explained',
          'International Relations Update',
          'Election Analysis and Predictions'
        ]
      };

      return fallbackTitles[categoryKey] || [];
    }
  }

  async function fetchAllTrendingVideos() {
    const videosByCategory = {};
    
    for (const [categoryKey, category] of Object.entries(CATEGORIES)) {
      const videos = await fetchTrendingVideosForCategory(categoryKey, category);
      videosByCategory[categoryKey] = videos;
      
      // Add small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setTrendingVideosByCategory(videosByCategory);
    console.log('All trending videos fetched:', videosByCategory);
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

  // Function to find an unused video title for a category
  const findUnusedVideoTitle = (categoryVideos) => {
    const availableTitles = categoryVideos.filter(title => 
      !usedVideoTitles.has(title.toLowerCase().trim())
    );
    
    if (availableTitles.length === 0) {
      console.log('⚠️ No unused video titles available');
      return null;
    }
    
    return availableTitles[Math.floor(Math.random() * availableTitles.length)];
  };

  const generateArticleForCategory = async (categoryKey) => {
    const categoryVideos = trendingVideosByCategory[categoryKey];
    const categoryInfo = CATEGORIES[categoryKey];
    
    if (!categoryVideos || categoryVideos.length === 0) {
      alert(`No trending video titles available for ${categoryInfo.name}`);
      return false;
    }

    // Find an unused video title
    const selectedTitle = findUnusedVideoTitle(categoryVideos);
    
    if (!selectedTitle) {
      alert(`No unused video titles available for ${categoryInfo.name}. All titles have been used for articles already.`);
      return false;
    }

    setGeneratingCategory(categoryKey);
    
    try {
      console.log(`Selected ${categoryInfo.name} video title:`, selectedTitle);

      // Extract key terms from the video title for image search
      const imageKeywords = selectedTitle
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3)
        .join(' ') || categoryKey;

      // Fetch image from Pexels using extracted keywords
      const imageUrl = await fetchPexelsImage(imageKeywords) || 
        'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg'; // Fallback image

      console.log(`🎯 Sending this ${categoryInfo.name} video title to Gemini for analysis:`, selectedTitle);

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
                    text: `Analyze this ${categoryInfo.name.toLowerCase()} video title: "${selectedTitle}". 

Identify what specific topic within ${categoryInfo.name.toLowerCase()} this title is about, then write a comprehensive blog article about that subject. Do NOT mention the video or that this is based on a video title. Write as if you're an expert explaining the topic directly.

For ${categoryInfo.name.toLowerCase()} category, make sure to:
- Focus on the specific ${categoryInfo.name.toLowerCase()} aspect mentioned in the title
- Provide in-depth analysis and insights
- Use current and relevant examples
- Make it engaging for readers interested in ${categoryInfo.name.toLowerCase()}

Create the article in markdown format with headings, paragraphs, and lists. Make it informative, engaging, and well-structured.`,
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
          keyword: selectedTitle, // Save the full video title as the keyword
          pubstatus: 'draft',
          slug,
          imageUrl,
          category: categoryInfo.name
        },
      };

      console.log(`Sending ${categoryInfo.name} article data to Strapi:`, JSON.stringify(newArticle, null, 2));

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

      // Add the used title to our tracking set
      setUsedVideoTitles(prev => new Set([...prev, selectedTitle.toLowerCase().trim()]));
      
      console.log(`✅ ${categoryInfo.name} article generated successfully`);
      console.log(`📝 Video title saved as keyword: ${selectedTitle}`);
      
      return true;
    } catch (err) {
      console.error(`Error generating ${categoryInfo.name} article:`, err.message);
      throw err;
    } finally {
      setGeneratingCategory(null);
    }
  };

  const generateAllCategoryArticles = async () => {
    setLoading(true);
    let successCount = 0;
    let errors = [];

    for (const categoryKey of Object.keys(CATEGORIES)) {
      try {
        const success = await generateArticleForCategory(categoryKey);
        if (success) successCount++;
        
        // Add delay between generations to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        errors.push(`${CATEGORIES[categoryKey].name}: ${err.message}`);
      }
    }

    setLoading(false);

    if (successCount > 0) {
      alert(`✅ Successfully generated ${successCount} articles!${errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : ''}`);
      await fetchArticles();
    } else {
      alert('❌ Failed to generate any articles:\n' + errors.join('\n'));
    }
  };

  const generateSingleCategoryArticle = async (categoryKey) => {
    setLoading(true);
    try {
      const success = await generateArticleForCategory(categoryKey);
      if (success) {
        alert(`✅ ${CATEGORIES[categoryKey].name} article generated successfully!`);
        await fetchArticles();
      }
    } catch (err) {
      alert(`❌ Error generating ${CATEGORIES[categoryKey].name} article: ${err.message}`);
    }
    setLoading(false);
  };

  // Helper function to get available titles count for each category
  const getAvailableTitlesCount = (categoryKey) => {
    const categoryVideos = trendingVideosByCategory[categoryKey];
    if (!categoryVideos) return 0;
    
    return categoryVideos.filter(title => 
      !usedVideoTitles.has(title.toLowerCase().trim())
    ).length;
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // setSelectedArticle(null); // Clear selected article when changing category
  };

  // When a tile is clicked, navigate to /article/:slug
  const handleTileClick = (article) => {
    if (article.slug) {
      navigate(`/article/${article.slug}`);
    }
  };

  // When back button is clicked, go back to the article list
  const handleBackToTiles = () => {
    navigate('/');
  };

  // Find the selected article by slug if on /article/:slug
  let selectedArticle = null;
  if (slug && articles.length > 0) {
    selectedArticle = articles
      .map(a => a.attributes || a)
      .find(a => a.slug === slug);
  }

  // If an article is selected, show the full article
  if (selectedArticle) {
    return (
      <div>
        <Navbar 
          selectedCategory={selectedCategory} 
          onCategoryChange={handleCategoryChange}
          categories={CATEGORIES}
        />
        <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
          <button 
            onClick={handleBackToTiles}
            style={{
              padding: '0.5rem 1rem',
              marginBottom: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Back to Articles
          </button>
          <ArticleCard article={selectedArticle} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar 
        selectedCategory={selectedCategory} 
        onCategoryChange={handleCategoryChange}
        categories={CATEGORIES}
      />
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: 'auto' }}>
        <h1>📰 Multi-Category Tech Blog (YouTube Powered)</h1>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>📺 Trending Videos by Category:</h3>
          {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
            const totalTitles = trendingVideosByCategory[categoryKey]?.length || 0;
            const availableTitles = getAvailableTitlesCount(categoryKey);
            
            return (
              <div key={categoryKey} style={{ 
                margin: '0.5rem 0', 
                padding: '0.5rem', 
                backgroundColor: 'white', 
                borderRadius: '4px',
                border: `2px solid ${category.color}20`
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  color: category.color, 
                  fontWeight: 'bold' 
                }}>
                  {category.name}: 
                </span>
                <span style={{ fontSize: '14px', color: '#666', marginLeft: '0.5rem' }}>
                  {totalTitles} total titles, {availableTitles} unused
                </span>
                {availableTitles === 0 && totalTitles > 0 && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#ff6b6b', 
                    marginLeft: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    (All titles used)
                  </span>
                )}
              </div>
            );
          })}
          
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#1565c0'
          }}>
            <strong>📊 Usage Statistics:</strong> {usedVideoTitles.size} video titles have been used for articles
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button 
            onClick={generateAllCategoryArticles} 
            disabled={loading} 
            style={{ 
              padding: '0.75rem 1rem',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              flex: '1',
              minWidth: '200px'
            }}
          >
            {loading ? 'Generating All Articles...' : '🚀 Generate All 3 Category Articles'}
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
            const availableTitles = getAvailableTitlesCount(categoryKey);
            const isDisabled = loading || availableTitles === 0;
            
            return (
              <button 
                key={categoryKey}
                onClick={() => generateSingleCategoryArticle(categoryKey)} 
                disabled={isDisabled}
                style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: isDisabled ? '#ccc' : category.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  opacity: generatingCategory === categoryKey ? 0.7 : 1
                }}
              >
                {generatingCategory === categoryKey ? 
                  `Generating ${category.name}...` : 
                  `📝 Generate ${category.name} (${availableTitles} available)`
                }
              </button>
            );
          })}
        </div>

        {/* Category title */}
        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>
          {selectedCategory === 'all' 
            ? 'All Articles' 
            : `${CATEGORIES[selectedCategory]?.name} Articles`}
        </h2>

        {/* Article tiles grid */}
        {filteredArticles.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>
            No articles available in this category yet.
          </p>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {filteredArticles.map(article => (
            <ArticleTile 
              key={article.id} 
              article={article.attributes || article} 
              onClick={() => handleTileClick(article.attributes || article)}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;