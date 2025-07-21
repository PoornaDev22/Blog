import React from 'react';

const Navbar = ({ selectedCategory, onCategoryChange, categories }) => {
  const navItems = [
    { key: 'all', name: 'Home', color: '#333' },
    ...Object.entries(categories).map(([key, category]) => ({
      key,
      name: category.name,
      color: category.color
    }))
  ];

  return (
    <nav style={{
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid #e0e0e0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo/Brand */}
        <div style={{
          padding: '1rem 2rem',
          fontWeight: 'bold',
          fontSize: '1.5rem',
          color: '#333'
        }}>
          📰 TechBlog
        </div>

        {/* Navigation Items */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem 2rem'
        }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => onCategoryChange(item.key)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                backgroundColor: selectedCategory === item.key 
                  ? item.color 
                  : 'transparent',
                color: selectedCategory === item.key 
                  ? 'white' 
                  : item.color,
                border: selectedCategory === item.key 
                  ? 'none' 
                  : `1px solid ${item.color}20`
              }}
              onMouseOver={(e) => {
                if (selectedCategory !== item.key) {
                  e.target.style.backgroundColor = `${item.color}10`;
                }
              }}
              onMouseOut={(e) => {
                if (selectedCategory !== item.key) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;