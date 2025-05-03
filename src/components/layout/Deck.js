import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import Spectrogram from "wavesurfer.js/dist/plugins/spectrogram";
import Minimap from "wavesurfer.js/dist/plugins/minimap";
import { Knob } from "rc-knob";

const Deck = ({ label, tracks }) => {
  const waveRef = useRef(null);
  const waveSurfer = useRef(null);
  const [cuePoints, setCuePoints] = useState([]);
  const [loop, setLoop] = useState({ start: null, end: null });
  const [eq, setEq] = useState({ gain: 1, low: 0, mid: 0, high: 0, filter: 10000 });

  useEffect(() => {
    waveSurfer.current = WaveSurfer.create({
      container: `#waveform${label}`,
      waveColor: "#6cf",
      progressColor: "#3af",
      height: 100,
      plugins: [
        Minimap.create({ container: `#minimap${label}`, height: 30 }),
        Spectrogram.create({ container: `#spectrogram${label}`, labels: true })
      ]
    });

    return () => {
      waveSurfer.current.destroy();
    };
  }, [label]);

  const loadTrack = (url) => {
    const wave = waveSurfer.current;
    if (!url) return;
    wave.load(url);

    wave.on("ready", () => {
      const ctx = wave.backend.ac;
      const source = wave.backend.bufferSource;

      const gainNode = ctx.createGain();
      const lowEQ = ctx.createBiquadFilter();
      const midEQ = ctx.createBiquadFilter();
      const highEQ = ctx.createBiquadFilter();
      const filterNode = ctx.createBiquadFilter();

      lowEQ.type = "lowshelf";
      midEQ.type = "peaking";
      highEQ.type = "highshelf";
      filterNode.type = "lowpass";

      lowEQ.frequency.value = 320;
      midEQ.frequency.value = 1000;
      highEQ.frequency.value = 3200;
      filterNode.frequency.value = eq.filter;

      source.disconnect();
      source.connect(gainNode);
      gainNode.connect(lowEQ);
      lowEQ.connect(midEQ);
      midEQ.connect(highEQ);
      highEQ.connect(filterNode);
      filterNode.connect(ctx.destination);

      wave.eqNodes = { gainNode, lowEQ, midEQ, highEQ, filterNode };
    });
  };

  const playPause = () => waveSurfer.current.playPause();

  const setCue = () => {
    const time = waveSurfer.current.getCurrentTime();
    setCuePoints([...cuePoints, time]);
  };

  const goToCue = (time) => waveSurfer.current.setCurrentTime(time);

  const setLoopPoint = () => {
    const currentTime = waveSurfer.current.getCurrentTime();
    !loop.start
      ? setLoop({ start: currentTime, end: null })
      : setLoop({ ...loop, end: currentTime });
  };

  const playLoop = () => {
    if (loop.start !== null && loop.end !== null) {
      waveSurfer.current.play(loop.start, loop.end);
    }
  };

  const handleEQChange = (param, value) => {
    const updated = { ...eq, [param]: value };
    setEq(updated);
    const nodes = waveSurfer.current.eqNodes;
    if (!nodes) return;

    switch (param) {
      case "gain":
        nodes.gainNode.gain.value = value;
        break;
      case "low":
        nodes.lowEQ.gain.value = value;
        break;
      case "mid":
        nodes.midEQ.gain.value = value;
        break;
      case "high":
        nodes.highEQ.gain.value = value;
        break;
      case "filter":
        nodes.filterNode.frequency.value = value;
        break;
    }
  };

  return (
    <div className="deck">
      <h2>Deck {label}</h2>
      <div className="track-select">
        <label>Select Track:</label>
        <select onChange={(e) => loadTrack(e.target.value)}>
          <option value="">-- Choose a track --</option>
          {tracks.map((track, index) => (
            <option key={index} value={track.url}>{track.name}</option>
          ))}
        </select>
      </div>

      <div id={`waveform${label}`} ref={waveRef}></div>
      <div id={`minimap${label}`}></div>
      <div id={`spectrogram${label}`}></div>

      <div className="eq-section">
        {["gain", "high", "mid", "low", "filter"].map((param) => (
          <div className="knob-wrapper" key={param}>
            <Knob
              size={50}
              angleOffset={220}
              angleRange={280}
              min={param === "filter" ? 500 : 0}
              max={param === "filter" ? 10000 : 2}
              value={eq[param]}
              onChange={(v) => handleEQChange(param, v)}
              fgColor="#ccc"
              bgColor="#333"
            />
            <label>{param.toUpperCase()}</label>
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={playPause}>Play/Pause</button>
        <button onClick={setCue}>Set Cue</button>
        <button onClick={setLoopPoint}>Set Loop</button>
        <button onClick={playLoop}>Play Loop</button>
        {cuePoints.map((t, i) => (
          <button key={i} onClick={() => goToCue(t)}>Cue {i + 1}</button>
        ))}
      </div>
    </div>
  );
};

export default Deck;