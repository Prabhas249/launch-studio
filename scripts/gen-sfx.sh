#!/bin/bash
# Synthesizes the SFX kit + 120BPM music bed with ffmpeg. Output: public/audio/
set -e
cd "$(dirname "$0")/../public/audio"

# Kick: 150Hz attack transient over a 55Hz body
ffmpeg -y -loglevel error -f lavfi -i "sine=f=150:d=0.35" -f lavfi -i "sine=f=55:d=0.35" \
  -filter_complex "[0]afade=t=out:st=0:d=0.08[a];[1]afade=t=out:st=0.02:d=0.3[b];[a][b]amix=inputs=2:normalize=0,volume=2.2" kick.wav

# Hat: short bright noise tick
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.08:c=white:a=0.6" \
  -af "highpass=f=9000,afade=t=out:st=0:d=0.07,volume=0.35" hat.wav

# Whoosh: pink-noise swell for scene cuts
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.55:c=pink:a=0.8" \
  -af "bandpass=f=900:w=600,afade=t=in:st=0:d=0.22,afade=t=out:st=0.22:d=0.33,volume=1.6" whoosh.wav

# Impact: sub thud + filtered noise burst (window landing)
ffmpeg -y -loglevel error -f lavfi -i "sine=f=48:d=1.0" -f lavfi -i "anoisesrc=d=0.12:c=brown:a=0.9" \
  -filter_complex "[0]afade=t=out:st=0.05:d=0.9[a];[1]lowpass=f=400,afade=t=out:st=0:d=0.12[b];[a][b]amix=inputs=2:normalize=0,volume=2.5" impact.wav

# Riser: 2s noise swell into the CTA
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=2.0:c=pink:a=0.7" \
  -af "highpass=f=1200,afade=t=in:st=0:d=1.9,afade=t=out:st=1.9:d=0.1,volume=1.1" riser.wav

# One bar at 120BPM: kicks on beats, hats on offbeats
ffmpeg -y -loglevel error -i kick.wav -i hat.wav -filter_complex "\
[0]adelay=0|0[k1];[0]adelay=500|500[k2];[0]adelay=1000|1000[k3];[0]adelay=1500|1500[k4];\
[1]adelay=250|250[h1];[1]adelay=750|750[h2];[1]adelay=1250|1250[h3];[1]adelay=1750|1750[h4];\
[k1][k2][k3][k4][h1][h2][h3][h4]amix=inputs=8:normalize=0,apad=whole_dur=2[mix]" -map "[mix]" -t 2 bar.wav

# Loop 15 bars + 55Hz sub drone, fade out at the end = 29.5s bed
ffmpeg -y -loglevel error -stream_loop 14 -i bar.wav -f lavfi -i "sine=f=55:d=30" \
  -filter_complex "[1]volume=0.22,afade=t=in:st=0:d=0.5[s];[0][s]amix=inputs=2:normalize=0,afade=t=out:st=27:d=2.5,volume=0.9" \
  -t 29.5 bed.wav

rm -f bar.wav
echo "done:" && ls -la
