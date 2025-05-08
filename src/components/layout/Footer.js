import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className=" footer text-light py-4 mt-5">
      <Container>
        <Row>
          <Col md={4}>
            <h5>StreamDJ</h5>
            <p>Your ultimate music streaming platform for DJs and music lovers.</p>
            <div className="social-icons">
              <a href="https://facebook.com" className="me-2" target="_blank" rel="noopener noreferrer">
                <FaFacebook size={24} />
              </a>
              <a href="https://twitter.com" className="me-2" target="_blank" rel="noopener noreferrer">
                <FaTwitter size={24} />
              </a>
              <a href="https://instagram.com" className="me-2" target="_blank" rel="noopener noreferrer">
                <FaInstagram size={24} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                <FaYoutube size={24} />
              </a>
            </div>
          </Col>
          <Col md={2}>
            <h5>Company</h5>
            <ul className="list-unstyled">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/press">Press</Link></li>
            </ul>
          </Col>
          <Col md={2}>
            <h5>Communities</h5>
            <ul className="list-unstyled">
              <li><Link to="/artists">For Artists</Link></li>
              <li><Link to="/developers">Developers</Link></li>
              <li><Link to="/advertising">Advertising</Link></li>
            </ul>
          </Col>
          <Col md={2}>
            <h5>Useful Links</h5>
            <ul className="list-unstyled">
              <li><Link to="/support">Support</Link></li>
              <li><Link to="/app">Mobile App</Link></li>
              <li><Link to="/premium">Premium</Link></li>
            </ul>
          </Col>
          <Col md={2}>
            <h5>Legal</h5>
            <ul className="list-unstyled">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Use</Link></li>
              <li><Link to="/cookies">Cookies</Link></li>
            </ul>
          </Col>
        </Row>
        <Row className="mt-3 pt-3 border-top">
          <Col>
            <p className="text-center text-muted">© {new Date().getFullYear()} StreamDJ. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;