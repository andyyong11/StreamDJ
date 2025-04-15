import React, { createContext, useState, useContext } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);

  const playTrack = (track) => {
    setCurrentTrack(track);
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, playTrack }}>
      {children}
    </PlayerContext.Provider>
  );
};