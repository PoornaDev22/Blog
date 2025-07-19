import React from 'react';

const ArticleCard = ({ article }) => {
  if (!article) return null;

  const { title, content, pubat, keyword, image, imageUrl } = article;

  // Use imageUrl if available, otherwise fall back to Strapi media or nothing
  const imgUrl = imageUrl || (image?.data?.attributes?.url || image?.url);

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      padding: '16px', 
      marginBottom: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      
      {imgUrl && (
        <img
          src={
            imgUrl.startsWith('http') 
              ? imgUrl 
              : `https://effortless-connection-2f75f4ee80.strapiapp.com${imgUrl}`
          }
          alt={title}
          style={{ 
            width: '100%', 
            height: '300px', 
            objectFit: 'cover', 
            marginTop: '12px',
            borderRadius: '4px'
          }}
          onError={(e) => {
            e.target.style.display = 'none'; // Hide if image fails to load
          }}
        />
      )}
      
      <p style={{ 
        color: '#666', 
        fontSize: '14px', 
        marginTop: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📅 Published: {pubat ? new Date(pubat).toLocaleDateString() : '—'}</span>
        <span>🔖 Keyword: {keyword}</span>
      </p>
      
      <div style={{ marginTop: '16px' }}>
        {content?.map((block, idx) => {
          switch (block.type) {
            case 'heading':
              if (block.level === 1) return <h3 key={idx} style={{ margin: '24px 0 16px 0' }}>{block.children[0].text}</h3>;
              if (block.level === 2) return <h4 key={idx} style={{ margin: '20px 0 12px 0' }}>{block.children[0].text}</h4>;
              return <p key={idx}>{block.children[0].text}</p>;
            case 'paragraph':
              return <p key={idx} style={{ margin: '12px 0', lineHeight: '1.6' }}>{block.children[0].text}</p>;
            case 'list-item':
              return (
                <ul key={idx} style={{ margin: '12px 0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>{block.children[0].text}</li>
                </ul>
              );
            default:
              return <p key={idx} style={{ margin: '12px 0' }}>{block.children[0].text}</p>;
          }
        })}
      </div>
    </div>
  );
};

export default ArticleCard;
