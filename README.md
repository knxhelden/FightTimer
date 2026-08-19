# FightTimer

A clear, web-based timer for managing combat sport bouts.

## Features

- Configurable round duration and number of rounds, saved in the browser
- Configurable round warning time and file names for all audio cues
- Break timer that automatically counts up after each round
- Pause and resume support for the active timer
- Automatic round tracking
- Keyboard controls and a high-contrast display designed for use at ringside

## Getting started

Place the audio files in the `sounds` subdirectory. The default files are
`round-start.mp3`, `ten-seconds.mp3`, `round-end.mp3`, and `fight-end.mp3`;
their names can be changed on the settings page. You can then open `index.html`
directly in your browser or start a local web server:

```bash
python3 -m http.server 8000
```

The application will be available at <http://localhost:8000>.
