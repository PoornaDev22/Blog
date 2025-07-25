import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ categories = {}, selectedCategory, onCategoryChange }) => {
  return (
    <nav style={{
      backgroundColor: '#343a40',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link 
          to="/" 
          style={{
            color: 'white',
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          News Generator
        </Link>
      </div>
      
      {Object.keys(categories).length > 0 && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => onCategoryChange('all')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedCategory === 'all' ? '#007bff' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            All
          </button>
          
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => onCategoryChange(key)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedCategory === key ? category.color : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;