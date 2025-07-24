import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ArticleCard from '../components/ArticleCard';
import ArticleTile from '../components/ArticleTile';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate, useParams } from 'react-router-dom';

// Configuration - only Strapi URL needed on frontend
const API_CONFIG = {
  STRAPI_BASE_URL: 'https://effortless-connection-2f75f4ee80.strapiapp.com'
};

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

// Custom hook for API calls with caching
const useApiWithCache = () => {
  const cache = useMemo(() => new Map(), []);
  
  const cachedFetch = useCallback(async (url, options = {}) => {
    const cacheKey = `${url}${JSON.stringify(options)}`;

    console.log(`[API] Making request to: ${url}`);
    console.log(`[API] Request options:`, options);
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

      console.log(`[API] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`[API] Response data:`, data);

      cache.set(cacheKey, data);
      
      // Clear cache after 5 minutes
      setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [cache]);
  
  return cachedFetch;
};

// Custom hook for article generation
const useArticleGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState(null);
  const cachedFetch = useApiWithCache();
  
  const generateSlug = useCallback((title, availableTitle) => {
    let baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (!baseSlug || baseSlug === 'untitled-article') {
      baseSlug = availableTitle
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }

    const timestamp = Date.now();
    console.log('[DEBUG] Generated slug:', `${baseSlug}-${timestamp}`);
    return `${baseSlug}-${timestamp}`;
  }, []);
  
  const parseTitleAndContentBlocks = useCallback((markdown, availableTitle) => {
    console.log('[DEBUG] Parsing markdown:', markdown.slice(0, 200) + '...');
    const lines = markdown.split('\n');
    let title = availableTitle || 'Untitled Article';
    const blocks = [];

    let titleFound = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (!titleFound && trimmed.startsWith('# ')) {
        title = trimmed.replace('# ', '');
        titleFound = true;
        blocks.push({
          type: 'heading',
          level: 1,
          children: [{ type: 'text', text: title }],
        });
      } else if (trimmed.startsWith('## ')) {
        if (!titleFound) {
          title = availableTitle || trimmed.replace('## ', '');
          titleFound = true;
        }
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

    console.log('[DEBUG] Parsed title:', title);
    return { title, blocks };
  }, []);
  
  const fetchPexelsImage = useCallback(async (keyword) => {
    console.log(`[Pexels] Fetching image for keyword: ${keyword}`);
    try {
      const data = await cachedFetch(
        `${API_CONFIG.STRAPI_BASE_URL}/api/fetch-pexels-image`,
        {
          method: 'POST',
          body: JSON.stringify({ keyword })
        }
      );

      console.log(`[Pexels] Received image URL: ${data.imageUrl || 'default'}`);
      
      return data.imageUrl || null;
    } catch (error) {
      console.error('Error fetching image from Pexels via Strapi:', error);
      return null;
    }
  }, [cachedFetch]);
  
  const generateArticleContent = useCallback(async (title, categoryInfo) => {
    console.log(`[Gemini] Generating content for title: ${title}`);
    console.log(`[Gemini] Category: ${categoryInfo.name}`);
    try {
      const data = await cachedFetch(
        `${API_CONFIG.STRAPI_BASE_URL}/api/generate-article`,
        {
          method: 'POST',
          body: JSON.stringify({ 
            title, 
            category: categoryInfo.name 
          })
        }
      );

      console.log(`[Gemini] Content length: ${data.content?.length || 0} chars`);

      return data.content;
    } catch (error) {
      console.error('Error generating article content via Strapi:', error);
      throw error;
    }
  }, [cachedFetch]);
  
  const saveArticleToStrapi = useCallback(async (articleData) => {
    try {
      const response = await fetch(`${API_CONFIG.STRAPI_BASE_URL}/api/articles`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: articleData }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Strapi API error: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error saving article to Strapi:', error);
      throw error;
    }
  }, []);
  
  const generateArticleForCategory = useCallback(async (categoryKey, availableKeyword, usedKeywords) => {
    const categoryInfo = CATEGORIES[categoryKey];
    
    if (!availableKeyword) {
      throw new Error(`No unused keywords available for ${categoryInfo.name}`);
    }
    
    setGeneratingCategory(categoryKey);
    
    try {
      const imageKeywords = availableKeyword
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3)
        .join(' ') || categoryKey;

      const [articleMarkdown, imageUrl] = await Promise.all([
        generateArticleContent(availableKeyword, categoryInfo),
        fetchPexelsImage(imageKeywords)
      ]);

      if (!articleMarkdown) {
        throw new Error('No content returned from AI generator');
      }

      const { title, blocks } = parseTitleAndContentBlocks(articleMarkdown, availableKeyword);
      const slug = generateSlug(title, availableKeyword);

      const articleData = {
        title,
        content: blocks,
        keyword: availableKeyword,
        pubstatus: 'draft',
        slug,
        imageUrl: imageUrl || 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
        category: categoryInfo.name
      };

      await saveArticleToStrapi(articleData);
      
      return availableKeyword;
    } finally {
      setGeneratingCategory(null);
    }
  }, [generateArticleContent, fetchPexelsImage, parseTitleAndContentBlocks, generateSlug, saveArticleToStrapi]);
  
  return {
    isGenerating,
    generatingCategory,
    setIsGenerating,
    generateArticleForCategory
  };
};

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [usedKeywords, setUsedKeywords] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFetchingKeywords, setIsFetchingKeywords] = useState(false);
  
  const navigate = useNavigate();
  const { slug } = useParams();
  const cachedFetch = useApiWithCache();
  const {
    isGenerating,
    generatingCategory, 
    setIsGenerating,
    generateArticleForCategory
  } = useArticleGeneration();

  const memoizedFilteredArticles = useMemo(() => {
    if (selectedCategory === 'all') {
      return articles;
    }
    
    const categoryName = CATEGORIES[selectedCategory]?.name;
    return articles.filter(article => {
      const attrs = article.attributes || article;
      return attrs.category === categoryName;
    });
  }, [articles, selectedCategory]);

  useEffect(() => {
    setFilteredArticles(memoizedFilteredArticles);
  }, [memoizedFilteredArticles]);

  useEffect(() => {
    if (articles.length > 0) {
      const keywordsSet = new Set();
      articles.forEach(article => {
        const attrs = article.attributes || article;
        if (attrs.keyword) {
          keywordsSet.add(attrs.keyword.toLowerCase().trim());
        }
      });
      setUsedKeywords(keywordsSet);
    }
  }, [articles]);

  const fetchArticles = useCallback(async () => {
    try {
      const data = await cachedFetch(
        `${API_CONFIG.STRAPI_BASE_URL}/api/articles?filters[pubstatus][$eq]=published&populate=*`
      );
      setArticles(data.data || []);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  }, [cachedFetch]);

  // NEW: Fetch trending keywords from SerpAPI instead of YouTube videos
  const fetchTrendingKeywordsForCategory = useCallback(async (categoryKey, category) => {
    console.log(`[SerpAPI] Fetching trending keywords for ${category.name}`);
    setIsFetchingKeywords(true);
    try {
      const data = await cachedFetch(
        `${API_CONFIG.STRAPI_BASE_URL}/api/fetch-trending-keywords`,
        {
          method: 'POST',
          body: JSON.stringify({
            categoryKey,
            searchQuery: category.searchQuery,
            categoryName: category.name
          })
        }
      );

      console.log(`[SerpAPI] Received ${data.keywords?.length || 0} keywords`);
      return data.keywords || [];
    } catch (err) {
      console.error(`Failed to fetch trending keywords for ${category.name}:`, err);
      
      const fallbackKeywords = {
        tech: [
          'AI breakthrough 2025',
          'Latest smartphone technology',
          'Quantum computing advances',
          'Cybersecurity trends',
          'Cloud computing innovations'
        ],
        sports: [
          'Championship playoffs 2025',
          'Olympic training updates',
          'Professional sports trades',
          'Athletic performance technology',
          'Sports injury prevention'
        ],
        politics: [
          'Government policy changes',
          'International diplomacy news',
          'Election campaign updates',
          'Legislative developments',
          'Political analysis trends'
        ]
      };

      return fallbackKeywords[categoryKey] || [];
    } finally {
      setIsFetchingKeywords(false);
    }
  }, [cachedFetch]);

  // COMMENTED OUT: YouTube video fetching (keeping for potential future use)
  /*
  const fetchTrendingVideosForCategory = useCallback(async (categoryKey, category) => {
    console.log(`[YouTube] Fetching videos for ${category.name}`);
    setIsFetchingVideos(true);
    try {
      const data = await cachedFetch(
        `${API_CONFIG.STRAPI_BASE_URL}/api/fetch-youtube-videos`,
        {
          method: 'POST',
          body: JSON.stringify({
            categoryKey,
            searchQuery: category.searchQuery,
            categoryName: category.name
          })
        }
      );

      console.log(`[YouTube] Received ${data.videoTitles?.length || 0} titles`);
      return data.videoTitles || [];
    } catch (err) {
      console.error(`Failed to fetch YouTube trending videos for ${category.name}:`, err);
      
      const fallbackTitles = {
        tech: ['Revolutionary AI Breakthrough Changes Everything', 'The Future of Quantum Computing Explained'],
        sports: ['Championship Game Highlights and Analysis', 'Olympic Records Broken This Season'],
        politics: ['Government Policy Changes Explained', 'International Relations Update']
      };

      return fallbackTitles[categoryKey] || [];
    } finally {
      setIsFetchingVideos(false);
    }
  }, [cachedFetch]);
  */

  const findUnusedKeyword = useCallback((categoryKeywords, usedKeywords) => {
    const availableKeywords = categoryKeywords.filter(keyword => 
      !usedKeywords.has(keyword.toLowerCase().trim())
    );
    
    return availableKeywords.length > 0 
      ? availableKeywords[Math.floor(Math.random() * availableKeywords.length)]
      : null;
  }, []);

  const generateAllCategoryArticles = useCallback(async () => {
    setIsGenerating(true);
    let successCount = 0;
    let errors = [];

    for (const categoryKey of Object.keys(CATEGORIES)) {
      try {
        // Fetch trending keywords for this category
        const categoryKeywords = await fetchTrendingKeywordsForCategory(
          categoryKey, 
          CATEGORIES[categoryKey]
        );
        
        const availableKeyword = findUnusedKeyword(
          categoryKeywords, 
          usedKeywords
        );
        
        if (availableKeyword) {
          const usedKeyword = await generateArticleForCategory(
            categoryKey, 
            availableKeyword, 
            usedKeywords
          );
          setUsedKeywords(prev => new Set([...prev, usedKeyword.toLowerCase().trim()]));
          successCount++;
        } else {
          errors.push(`${CATEGORIES[categoryKey].name}: No unused keywords available`);
        }
        
        // Add delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        errors.push(`${CATEGORIES[categoryKey].name}: ${err.message}`);
      }
    }

    setIsGenerating(false);

    if (successCount > 0) {
      alert(`✅ Successfully generated ${successCount} articles!${errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : ''}`);
      await fetchArticles();
    } else {
      alert('❌ Failed to generate any articles:\n' + errors.join('\n'));
    }
  }, [fetchTrendingKeywordsForCategory, findUnusedKeyword, generateArticleForCategory, usedKeywords, fetchArticles]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleTileClick = useCallback((article) => {
    if (article.slug) {
      navigate(`/article/${article.slug}`);
    }
  }, [navigate]);

  const handleBackToTiles = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Initial articles fetch only
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Scheduled generation
  useEffect(() => {
    const targetHour = 10;
    const targetMinute = 10;
    const now = new Date();
    const target = new Date();

    target.setHours(targetHour, targetMinute, 0, 0);
    let timeUntilTarget = target - now;
    
    if (timeUntilTarget <= 0) {
      target.setDate(target.getDate() + 1);
      timeUntilTarget = target - now;
    }

    if (timeUntilTarget > 0) {
      const timer = setTimeout(() => {
        console.log('Running scheduled article generation');
        generateAllCategoryArticles();
      }, timeUntilTarget);
      return () => clearTimeout(timer);
    }
  }, [generateAllCategoryArticles]);

  const selectedArticle = useMemo(() => {
    if (!slug || articles.length === 0) return null;
    
    return articles
      .map(a => a.attributes || a)
      .find(a => a.slug === slug);
  }, [slug, articles]);

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
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button 
            onClick={generateAllCategoryArticles} 
            disabled={isGenerating || isFetchingKeywords} 
            style={{ 
              padding: '0.75rem 1rem',
              backgroundColor: (isGenerating || isFetchingKeywords) ? '#28a74599' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (isGenerating || isFetchingKeywords) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              flex: '1',
              minWidth: '200px'
            }}
          >
            {isFetchingKeywords ? 'Fetching Trending Keywords...' : 
             isGenerating ? 'Generating Articles...' : 
             '🚀 Generate All 3 Category Articles'}
          </button>
        </div>

        {(isGenerating || isFetchingKeywords) && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px' 
          }}>
            <h4>Generation Status:</h4>
            {Object.keys(CATEGORIES).map(categoryKey => (
              <div key={categoryKey} style={{ 
                marginBottom: '0.5rem',
                color: generatingCategory === categoryKey ? '#007bff' : '#666'
              }}>
                {CATEGORIES[categoryKey].name}: {
                  isFetchingKeywords ? '🔍 Fetching trending keywords...' :
                  generatingCategory === categoryKey ? '⏳ Generating article...' : 
                  '⏸️ Waiting...'
                }
              </div>
            ))}
          </div>
        )}

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