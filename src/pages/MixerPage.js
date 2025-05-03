import React from "react";
import "../components/layout/DJMixer.css";
import Deck from "../components/layout/Deck";

const DJMixer = () => {
  const trackList = [
    { id: 1, name: "Track 1", artist: "Artist A", url: "/audio/track1.mp3" },
    { id: 2, name: "Track 2", artist: "Artist B", url: "/audio/track2.mp3" },
    { id: 3, name: "Track 3", artist: "Artist C", url: "/audio/track3.mp3" },
  ];

  return (
    <div className="dj-container">
      <div className="top-section">
        <Deck label="A" tracks={trackList} />
        <Deck label="B" tracks={trackList} />
      </div>

      <div className="crossfader-section">
        <label>Crossfader</label>
        <input type="range" min="0" max="100" defaultValue="50" />
      </div>

      <div className="tracklist-section">
        <h3>Track List</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Artist</th>
            </tr>
          </thead>
          <tbody>
            {trackList.map((track) => (
              <tr key={track.id}>
                <td>{track.id}</td>
                <td>{track.name}</td>
                <td>{track.artist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DJMixer;