# FightTimer

A clear, web-based timer for managing combat sport bouts.

## Features

- Configurable round duration and number of rounds, saved in the browser
- Start, 10-second warning, round-end, and final fight-end audio cues
- Break timer that automatically counts up after each round
- Pause and resume support for the active timer
- Automatic round tracking
- Keyboard controls and a high-contrast display designed for use at ringside

## Getting started

Place the audio files `round-start.mp3`, `ten-seconds.mp3`, and
`round-end.mp3`, and `fight-end.mp3` in the project directory. You can then open `index.html`
directly in your browser or start a local web server:

```bash
python3 -m http.server 8000
```

The application will be available at <http://localhost:8000>.
