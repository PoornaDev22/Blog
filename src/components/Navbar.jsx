import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ selectedCategory, onCategoryChange, categories }) => {
  const navItems = [
    { key: 'all', name: 'Home', color: '#3a86ff' },
    ...Object.entries(categories).map(([key, category]) => ({
      key,
      name: category.name,
      color: category.color
    }))
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (key) => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    onCategoryChange(key);
  };

  return (
    <nav style={{
      backgroundColor: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      padding: '0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {/* Logo/Brand */}
        <div style={{
          padding: '1.5rem 0 1rem',
          fontWeight: '700',
          fontSize: '1.75rem',
          color: '#222',
          textAlign: 'center',
          letterSpacing: '-0.5px'
        }}>
          <span style={{ color: '#3a86ff' }}>Tech</span>Blog
        </div>

        {/* Navigation Items */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.5rem 0 1.5rem',
          justifyContent: 'center'
        }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                backgroundColor: selectedCategory === item.key 
                  ? item.color 
                  : 'transparent',
                color: selectedCategory === item.key 
                  ? 'white' 
                  : '#555',
                border: selectedCategory === item.key 
                  ? 'none' 
                  : `1px solid #f0f0f0`,
                minWidth: 'fit-content',
                whiteSpace: 'nowrap',
                boxShadow: selectedCategory === item.key 
                  ? `0 4px 12px ${item.color}40`
                  : 'none',
              }}
              onMouseOver={(e) => {
                if (selectedCategory !== item.key) {
                  e.target.style.backgroundColor = '#f9f9f9';
                  e.target.style.color = item.color;
                }
              }}
              onMouseOut={(e) => {
                if (selectedCategory !== item.key) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#555';
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