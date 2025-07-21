import React from 'react';

const ArticleCard = ({ article }) => {
  if (!article) return null;

  const { title, content, pubat, keyword, image, imageUrl } = article;
  const imgUrl = imageUrl || image?.data?.attributes?.url || image?.url;

  // Convert **bold** to <strong>
  const parseBold = (text) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
      chunk.startsWith('**') && chunk.endsWith('**')
        ? <strong key={i}>{chunk.slice(2, -2)}</strong>
        : chunk
    );

  return (
    <div style={{
      border: '1px solid #ddd',
      padding: '20px',
      margin: '32px auto',
      borderRadius: '10px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
      backgroundColor: '#fff',
      maxWidth: '800px'
    }}>
      <h2>{title}</h2>

      {imgUrl && (
        <img
          src={imgUrl.startsWith('http') ? imgUrl : `https://effortless-connection-2f75f4ee80.strapiapp.com${imgUrl}`}
          alt={title}
          style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '6px', marginTop: '16px' }}
          onError={(e) => (e.target.style.display = 'none')}
        />
      )}

      <div style={{ color: '#555', fontSize: '14px', marginTop: '12px', display: 'flex', gap: '12px' }}>
        <span>📅 {pubat ? new Date(pubat).toLocaleDateString() : '—'}</span>
        <span>🔖 {keyword}</span>
      </div>

      <div style={{ marginTop: '20px' }}>
        {(() => {
          const elements = [];
          let currentList = [];

          const flushList = (key) => {
            if (currentList.length) {
              elements.push(
                <ul key={`ul-${key}`} style={{ paddingLeft: '20px', margin: '12px 0' }}>
                  {currentList}
                </ul>
              );
              currentList = [];
            }
          };

          content?.forEach((block, idx) => {
            const text = block.children?.[0]?.text || '';

            // Fake list detection: "* item"
            if (block.type === 'paragraph' && text.trim().startsWith('* ')) {
              currentList.push(
                <li key={`li-${idx}`} style={{ marginBottom: '6px', lineHeight: '1.6' }}>
                  {parseBold(text.trim().slice(2))}
                </li>
              );
              if (idx === content.length - 1) flushList(idx);
              return;
            }

            // Real list from editor
            if (block.type === 'list-item') {
              currentList.push(
                <li key={`li-${idx}`} style={{ marginBottom: '6px', lineHeight: '1.6' }}>
                  {parseBold(text)}
                </li>
              );
              const next = content[idx + 1];
              if (!next || next.type !== 'list-item') flushList(idx);
              return;
            }

            flushList(idx); // List break

            // Headings and paragraphs
            if (block.type === 'heading') {
              const HeadingTag = `h${Math.min(block.level, 4)}`;
              elements.push(
                <HeadingTag key={idx} style={{ margin: '24px 0 12px' }}>
                  {parseBold(text)}
                </HeadingTag>
              );
            } else {
              elements.push(
                <p key={idx} style={{ margin: '12px 0', lineHeight: '1.6', color: '#333' }}>
                  {parseBold(text)}
                </p>
              );
            }
          });

          return elements;
        })()}
      </div>
    </div>
  );
};

export default ArticleCard;
