import '../styles/PlaylistCoverGrid.css';

const PlaylistCard = ({ playlist }) => {
  const covers = playlist.tracks?.map(track => track.CoverArtURL).filter(Boolean);
  const firstCover = covers?.[0];
  const coverTiles = covers?.slice(0, 4);

  return (
    <div className="playlist-card">
      <div className="playlist-cover-grid">
        {covers?.length >= 4 ? (
          <div className="cover-grid">
            {coverTiles.map((url, i) => (
              <img key={i} src={`http://localhost:5001/${url}`} alt="cover" className="cover-tile" />
            ))}
          </div>
        ) : covers?.length === 1 ? (
          <img src={`http://localhost:5001/${firstCover}`} alt="cover" className="cover-single" />
        ) : covers?.length >= 2 ? (
          <div className="cover-grid">
            {coverTiles.map((url, i) => (
              <img key={i} src={`http://localhost:5001/${url}`} alt="cover" className="cover-tile" />
            ))}
          </div>
        ) : (
          <div className="cover-single" style={{ backgroundColor: '#444' }} />
        )}
      </div>
      <p className="mt-2 fw-semibold">{playlist.Title}</p>
    </div>
  );
};
