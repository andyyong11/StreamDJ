import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import Spectrogram from "wavesurfer.js/dist/plugins/spectrogram";
import Minimap from "wavesurfer.js/dist/plugins/minimap";
import "../components/layout/DJMixer.css";

const DJMixer = () => {
  const waveARef = useRef(null);
  const waveBRef = useRef(null);
  const waveSurferA = useRef(null);
  const waveSurferB = useRef(null);

  const [cuePointsA, setCuePointsA] = useState([]);
  const [cuePointsB, setCuePointsB] = useState([]);
  const [loopA, setLoopA] = useState({ start: null, end: null });
  const [loopB, setLoopB] = useState({ start: null, end: null });
  const [crossfade, setCrossfade] = useState(0.5);

  // Tracks can later be fetched from a database
  const [tracks] = useState([
    { name: "Track 1", url: "/audio/track1.mp3" },
    { name: "Track 2", url: "/audio/track2.mp3" },
    { name: "Track 3", url: "/audio/track3.mp3" }
  ]);

  useEffect(() => {
    waveSurferA.current = WaveSurfer.create({
      container: "#waveformA",
      waveColor: "#6cf",
      progressColor: "#3af",
      height: 100,
      plugins: [
        Minimap.create({ container: "#minimapA", height: 30 }),
        Spectrogram.create({ container: "#spectrogramA", labels: true })
      ]
    });

    waveSurferB.current = WaveSurfer.create({
      container: "#waveformB",
      waveColor: "#fc6",
      progressColor: "#fa3",
      height: 100,
      plugins: [
        Minimap.create({ container: "#minimapB", height: 30 }),
        Spectrogram.create({ container: "#spectrogramB", labels: true })
      ]
    });

    return () => {
      waveSurferA.current.destroy();
      waveSurferB.current.destroy();
    };
  }, []);

  const loadTrack = (deck, url) => {
    const wave = deck === "A" ? waveSurferA.current : waveSurferB.current;
    if (url) wave.load(url);
  };

  const playPause = (deck) => {
    const wave = deck === "A" ? waveSurferA.current : waveSurferB.current;
    wave.playPause();
  };

  const setCue = (deck) => {
    const wave = deck === "A" ? waveSurferA.current : waveSurferB.current;
    const time = wave.getCurrentTime();
    deck === "A"
      ? setCuePointsA([...cuePointsA, time])
      : setCuePointsB([...cuePointsB, time]);
  };

  const goToCue = (deck, time) => {
    const wave = deck === "A" ? waveSurferA.current : waveSurferB.current;
    wave.setCurrentTime(time);
  };

  const setLoopPoint = (deck) => {
    const wave = deck === "A" ? waveSurferA.current : waveSurferB.current;
    const currentTime = wave.getCurrentTime();
    if (deck === "A") {
      !loopA.start
        ? setLoopA({ start: currentTime, end: null })
        : setLoopA({ ...loopA, end: currentTime });
    } else {
      !loopB.start
        ? setLoopB({ start: currentTime, end: null })
        : setLoopB({ ...loopB, end: currentTime });
    }
  };

  const loopTrack = (deck) => {
    const wave = deck === "A" ? waveSurferA.current : waveSurferB.current;
    const loop = deck === "A" ? loopA : loopB;
    if (loop.start !== null && loop.end !== null) {
      wave.play(loop.start, loop.end);
    }
  };

  const handleCrossfade = (e) => {
    const value = parseFloat(e.target.value);
    setCrossfade(value);
    waveSurferA.current.setVolume(1 - value);
    waveSurferB.current.setVolume(value);
  };

  return (
    <div className="dj-container">
      <h1>React DJ Mixer</h1>

      <div className="deck">
        <h2>Deck A</h2>

        <div className="track-select">
          <label htmlFor="trackSelectA">Select Track A:</label>
          <select id="trackSelectA" onChange={(e) => loadTrack("A", e.target.value)}>
            <option value="">-- Choose a track --</option>
            {tracks.map((track, index) => (
              <option key={index} value={track.url}>{track.name}</option>
            ))}
          </select>
        </div>

        <div id="waveformA" ref={waveARef}></div>
        <div id="minimapA"></div>
        <div id="spectrogramA"></div>
        <button onClick={() => playPause("A")}>Play/Pause</button>
        <button onClick={() => setCue("A")}>Set Cue</button>
        <button onClick={() => setLoopPoint("A")}>Set Loop</button>
        <button onClick={() => loopTrack("A")}>Play Loop</button>
        {cuePointsA.map((t, i) => (
          <button key={i} onClick={() => goToCue("A", t)}>
            Cue {i + 1}
          </button>
        ))}
      </div>

      <div className="deck">
        <h2>Deck B</h2>

        <div className="track-select">
          <label htmlFor="trackSelectB">Select Track B:</label>
          <select id="trackSelectB" onChange={(e) => loadTrack("B", e.target.value)}>
            <option value="">-- Choose a track --</option>
            {tracks.map((track, index) => (
              <option key={index} value={track.url}>{track.name}</option>
            ))}
          </select>
        </div>

        <div id="waveformB" ref={waveBRef}></div>
        <div id="minimapB"></div>
        <div id="spectrogramB"></div>
        <button onClick={() => playPause("B")}>Play/Pause</button>
        <button onClick={() => setCue("B")}>Set Cue</button>
        <button onClick={() => setLoopPoint("B")}>Set Loop</button>
        <button onClick={() => loopTrack("B")}>Play Loop</button>
        {cuePointsB.map((t, i) => (
          <button key={i} onClick={() => goToCue("B", t)}>
            Cue {i + 1}
          </button>
        ))}
      </div>

      <div className="crossfader">
        <label>Crossfade</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={crossfade}
          onChange={handleCrossfade}
        />
      </div>
    </div>
  );
};

export default DJMixer;