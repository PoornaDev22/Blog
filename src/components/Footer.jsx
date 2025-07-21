import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#2c3e50',
      color: '#ecf0f1',
      padding: '3rem 0 2rem 0',
      marginTop: '4rem',
      borderTop: '1px solid #34495e'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Brand Section */}
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#3498db'
            }}>
              📰 TechBlog
            </h3>
            <p style={{
              lineHeight: '1.6',
              color: '#bdc3c7',
              marginBottom: '1rem'
            }}>
              Your go-to source for the latest technology, sports, and political insights. 
              Powered by AI and real-time data from YouTube trending videos.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <a href="#" style={{
                color: '#3498db',
                fontSize: '1.5rem',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }} onMouseOver={(e) => e.target.style.color = '#2980b9'} onMouseOut={(e) => e.target.style.color = '#3498db'}>
                📱
              </a>
              <a href="#" style={{
                color: '#3498db',
                fontSize: '1.5rem',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }} onMouseOver={(e) => e.target.style.color = '#2980b9'} onMouseOut={(e) => e.target.style.color = '#3498db'}>
                📧
              </a>
              <a href="#" style={{
                color: '#3498db',
                fontSize: '1.5rem',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }} onMouseOver={(e) => e.target.style.color = '#2980b9'} onMouseOut={(e) => e.target.style.color = '#3498db'}>
                🐦
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#ecf0f1'
            }}>
              Quick Links
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/" style={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }} onMouseOver={(e) => e.target.style.color = '#3498db'} onMouseOut={(e) => e.target.style.color = '#bdc3c7'}>
                  🏠 Home
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/?category=tech" style={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }} onMouseOver={(e) => e.target.style.color = '#3498db'} onMouseOut={(e) => e.target.style.color = '#bdc3c7'}>
                  💻 Technology
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/?category=sports" style={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }} onMouseOver={(e) => e.target.style.color = '#3498db'} onMouseOut={(e) => e.target.style.color = '#bdc3c7'}>
                  ⚽ Sports
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/?category=politics" style={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }} onMouseOver={(e) => e.target.style.color = '#3498db'} onMouseOut={(e) => e.target.style.color = '#bdc3c7'}>
                  🏛️ Politics
                </a>
              </li>
            </ul>
          </div>

          {/* About Section */}
          <div>
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#ecf0f1'
            }}>
              About
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }} onMouseOver={(e) => e.target.style.color = '#3498db'} onMouseOut={(e) => e.target.style.color = '#bdc3c7'}>
                  📖 About Us
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }} onMouseOver={(e) => e.target.style.color = '#3498db'} onMouseOut={(e) => e.target.style.color = '#bdc3c7'}>
                  📝 Privacy Policy
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }} onMouseOver={(e) => e.target.style.color = '#3498db'} onMouseOut={(e) => e.target.style.color = '#bdc3c7'}>
                  📋 Terms of Service
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#bdc3c7',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease'
                }} onMouseOver={(e) => e.target.style.color = '#3498db'} onMouseOut={(e) => e.target.style.color = '#bdc3c7'}>
                  📞 Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#ecf0f1'
            }}>
              📬 Stay Updated
            </h4>
            <p style={{
              color: '#bdc3c7',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              Get the latest articles delivered to your inbox.
            </p>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #34495e',
                  borderRadius: '6px',
                  backgroundColor: '#34495e',
                  color: '#ecf0f1',
                  fontSize: '0.9rem'
                }}
              />
              <button style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'background-color 0.3s ease'
              }} onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'} onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}>
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #34495e',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{
            color: '#95a5a6',
            fontSize: '0.9rem'
          }}>
            © {currentYear} TechBlog. All rights reserved.
          </div>
          <div style={{
            display: 'flex',
            gap: '1rem',
            fontSize: '0.9rem'
          }}>
            <span style={{ color: '#95a5a6' }}>
              🚀 Powered by AI & YouTube Data
            </span>
            <span style={{ color: '#95a5a6' }}>
              📊 Real-time Content Generation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 