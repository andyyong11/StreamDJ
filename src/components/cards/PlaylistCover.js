import React from 'react';
import '../styles/PlaylistCover.css';

const PlaylistCover = ({ tracks }) => {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="playlist-cover empty-cover">
        <span>No Cover</span>
      </div>
    );
  }

  return (
    <div className="playlist-cover">
      {tracks.length === 1 && (
        <img
          src={tracks[0].CoverArtURL}
          alt="Playlist Cover"
          className="single-cover"
        />
      )}

      {tracks.length >= 4 && (
        <div className="cover-grid">
          {tracks.slice(0, 4).map((track, index) => (
            <img
              key={index}
              src={track.CoverArtURL}
              alt={`Track ${index + 1}`}
              className="grid-cover"
            />
          ))}
        </div>
      )}

      {tracks.length > 1 && tracks.length < 4 && (
        <img
          src={tracks[0].CoverArtURL}
          alt="Playlist Cover"
          className="single-cover"
        />
      )}
    </div>
  );
};

export default PlaylistCover;