import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ArticleCard from '../components/ArticleCard';
import ArticleTile from '../components/ArticleTile';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate, useParams } from 'react-router-dom';

const API_CONFIG = {
  STRAPI_BASE_URL: 'https://effortless-connection-2f75f4ee80.strapiapp.com'
};

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
      setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [cache]);
  
  return cachedFetch;
};

const useArticleGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
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

    return `${baseSlug}-${Date.now()}`;
  }, []);
  
  const parseTitleAndContentBlocks = useCallback((markdown, availableTitle) => {
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

    return { title, blocks };
  }, []);
  
  const fetchPexelsImage = useCallback(async (keyword) => {
    try {
      const data = await cachedFetch(
        `${API_CONFIG.STRAPI_BASE_URL}/api/fetch-pexels-image`,
        {
          method: 'POST',
          body: JSON.stringify({ keyword })
        }
      );
      return data.imageUrl || null;
    } catch (error) {
      console.error('Error fetching image from Pexels:', error);
      return null;
    }
  }, [cachedFetch]);
  
  const generateArticleContent = useCallback(async (title) => {
    try {
      const data = await cachedFetch(
        `${API_CONFIG.STRAPI_BASE_URL}/api/generate-article`,
        {
          method: 'POST',
          body: JSON.stringify({ title })
        }
      );
      return { content: data.content, category: data.category };
    } catch (error) {
      console.error('Error generating article content:', error);
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
  
  const generateArticles = useCallback(async (keywords, usedKeywords) => {
    setIsGenerating(true);
    let successCount = 0;
    let errors = [];

    const keywordsToProcess = keywords.slice(0, 15);
    
    for (const keyword of keywordsToProcess) {
      try {
        if (usedKeywords.has(keyword.toLowerCase().trim())) {
          continue;
        }
        
        const imageKeywords = keyword
          .replace(/[^\w\s]/g, '')
          .split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3)
          .join(' ');

        const [articleResult, imageUrl] = await Promise.all([
          generateArticleContent(keyword),
          fetchPexelsImage(imageKeywords)
        ]);

        if (!articleResult.content) {
          throw new Error('No content returned from AI generator');
        }

        const { title, blocks } = parseTitleAndContentBlocks(articleResult.content, keyword);
        const slug = generateSlug(title, keyword);

        const articleData = {
          title,
          content: blocks,
          keyword,
          category: articleResult.category, // Add the category here
          pubstatus: 'draft',
          slug,
          imageUrl: imageUrl || 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg'
        };

        await saveArticleToStrapi(articleData);
        successCount++;
        
        if (successCount >= 10) break;
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        errors.push(`${keyword}: ${err.message}`);
      }
    }

    setIsGenerating(false);

    if (successCount > 0) {
      alert(`✅ Successfully generated ${successCount} articles!${errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : ''}`);
      return true;
    } else {
      alert('❌ Failed to generate any articles:\n' + errors.join('\n'));
      return false;
    }
  }, [generateArticleContent, fetchPexelsImage, parseTitleAndContentBlocks, generateSlug, saveArticleToStrapi]);
  
  return {
    isGenerating,
    generateArticles
  };
};

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [usedKeywords, setUsedKeywords] = useState(new Set());
  const [isFetchingKeywords, setIsFetchingKeywords] = useState(false);
  
  const navigate = useNavigate();
  const { slug } = useParams();
  const cachedFetch = useApiWithCache();
  const {
    isGenerating,
    generateArticles
  } = useArticleGeneration();

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
        `${API_CONFIG.STRAPI_BASE_URL}/api/articles?populate=*&filters[pubstatus][$eq]=published`
      );
      setArticles(data.data || []);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  }, [cachedFetch]);

  const fetchTrendingKeywords = useCallback(async () => {
    console.log('[SerpAPI] Fetching trending keywords');
    setIsFetchingKeywords(true);
    try {
      const data = await cachedFetch(
        `${API_CONFIG.STRAPI_BASE_URL}/api/fetch-trending-keywords`
      );

      console.log(`[SerpAPI] Received ${data.keywords?.length || 0} keywords`);
      return data.keywords || [];
    } catch (err) {
      console.error('Failed to fetch trending keywords:', err);
      
      const fallbackKeywords = [
        'AI breakthrough 2025',
        'Latest smartphone technology',
        'Government policy changes',
        'Championship playoffs 2025',
        'Home organization trends',
        'New restaurant trends',
        'Mental health awareness',
        'Sustainable tourism',
        'Investment strategies',
        'Viral internet trends'
      ];
      return fallbackKeywords;
    } finally {
      setIsFetchingKeywords(false);
    }
  }, [cachedFetch]);

  const generateNewArticles = useCallback(async () => {
    const keywords = await fetchTrendingKeywords();
    const success = await generateArticles(keywords, usedKeywords);
    if (success) {
      await fetchArticles();
    }
  }, [fetchTrendingKeywords, generateArticles, usedKeywords, fetchArticles]);

  const handleTileClick = useCallback((article) => {
    if (article.slug) {
      navigate(`/article/${article.slug}`);
    }
  }, [navigate]);

  const handleBackToTiles = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const selectedArticle = useMemo(() => {
    if (!slug || articles.length === 0) return null;
    
    return articles
      .map(a => a.attributes || a)
      .find(a => a.slug === slug);
  }, [slug, articles]);

  if (selectedArticle) {
    return (
      <div>
        <Navbar />
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
      <Navbar />
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: 'auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button 
            onClick={generateNewArticles} 
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
             '🚀 Generate New Articles'}
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
            <div>
              {isFetchingKeywords ? '🔍 Fetching trending keywords...' :
               isGenerating ? '⏳ Generating articles...' : 
               'Ready to generate'}
            </div>
          </div>
        )}

        {articles.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>
            No published articles available yet. Click "Generate New Articles" to get started.
          </p>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {articles.map(article => (
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