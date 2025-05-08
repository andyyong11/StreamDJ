const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');

// Create directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('Created images directory');
}

// Create basic placeholder files
const placeholders = [
  'default-album.jpg',
  'default-playlist.jpg',
  'default-genre.jpg'
];

placeholders.forEach(filename => {
  const filePath = path.join(imagesDir, filename);
  
  // Create a small text file that says "Placeholder"
  fs.writeFileSync(filePath, 'Placeholder Image');
  
  console.log(`Created placeholder: ${filename}`);
});

// Create genre-specific placeholders
const genres = [
  'Hip-Hop', 'Electronic', 'Pop', 'Rock', 'Jazz', 
  'R&B', 'Classical', 'Indie', 'Metal', 'Reggae'
];

genres.forEach(genre => {
  const safeName = genre.replace(/[&]/g, 'And');
  const filename = `genre-${safeName.toLowerCase()}.jpg`;
  const filePath = path.join(imagesDir, filename);
  
  // Create a text file with the genre name
  fs.writeFileSync(filePath, `${genre} Genre Placeholder`);
  
  console.log(`Created genre placeholder: ${filename}`);
});

console.log('All placeholder files created successfully!'); 