import React from 'react';

const ArticleTile = ({ article, onClick }) => {
  if (!article) return null;

  const { title, content, pubat, keyword, image, imageUrl, category } = article;
  const imgUrl = imageUrl || image?.data?.attributes?.url || image?.url;

  // Get first paragraph text for preview (first 10 words)
  const getPreviewText = () => {
    if (!content || content.length === 0) return '';
    
    // Find the first paragraph block
    const firstParagraph = content.find(block => 
      block.type === 'paragraph' && block.children?.[0]?.text
    );
    
    if (!firstParagraph) return '';
    
    const text = firstParagraph.children[0].text;
    const words = text.split(' ');
    return words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');
  };

  // Get category color based on category name
  const getCategoryColor = () => {
    switch(category) {
      case 'Technology': return '#007bff';
      case 'Sports': return '#28a745';
      case 'Politics': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid #e0e0e0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
        {imgUrl ? (
          <img
            src={imgUrl.startsWith('http') ? imgUrl : `https://effortless-connection-2f75f4ee80.strapiapp.com${imgUrl}`}
            alt={title}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
            onError={(e) => {
              e.target.src = 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg';
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            📰 No Image
          </div>
        )}
        
        {/* Category badge */}
        {category && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: getCategoryColor(),
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {category}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px', flex: 1 }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: '600',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </h3>
        
        <p style={{
          margin: '0',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {getPreviewText()}
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          fontSize: '12px',
          color: '#999'
        }}>
          <span>📅 {pubat ? new Date(pubat).toLocaleDateString() : '—'}</span>
          {keyword && (
            <span style={{
              maxWidth: '50%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              🔖 {keyword}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleTile;