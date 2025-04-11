import React from 'react';
import { Navbar, Nav, Container, Form, Button, InputGroup, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaBell, FaUser } from 'react-icons/fa';
// Temporarily using react logo until you add your own logo
import logo from '../../logo.svg';
import { useAuth } from '../../context/AuthContext';

const NavigationBar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img 
            src={logo} 
            alt="StreamDJ Logo" 
            height="30" 
            className="d-inline-block align-top me-2"
          />
          StreamDJ
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/discover">Discover</Nav.Link>
            <Nav.Link as={Link} to="/library">Library</Nav.Link>
            <Nav.Link as={Link} to="/liveStreams">Live Streams</Nav.Link>
          </Nav>
          <Form className="d-flex mx-auto" style={{ width: '40%' }}>
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Search for tracks, artists, or playlists"
                aria-label="Search"
              />
              <Button variant="outline-light">
                <FaSearch />
              </Button>
            </InputGroup>
          </Form>
          <Nav>
            <Nav.Link as={Link} to="/notifications">
              <FaBell size={20} />
            </Nav.Link>
            {user ? (
              <NavDropdown 
                title={<FaUser size={20} />} 
                id="basic-nav-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to={`/profile/${user.id || 1}`}>Profile</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">
                <FaUser size={20} />
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;

