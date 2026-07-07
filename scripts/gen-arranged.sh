#!/bin/bash
# Arranged 32s / 16-bar bed @120BPM with a story arc:
# bars 1-2 sparse -> 3-4 hats in -> riser -> CRASH at bar 5 (reveal) ->
# full groove -> thin out -> taper. Plus crash.wav + boom.wav one-shots.
set -e
cd "$(dirname "$0")/../public/audio"

# One-shots -----------------------------------------------------------
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=1.6:c=white:a=0.7" \
  -af "highpass=f=2600,afade=t=out:st=0.03:d=1.55,volume=1.3" crash.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=42:d=1.2" -f lavfi -i "anoisesrc=d=0.1:c=brown:a=0.9" \
  -filter_complex "[0]afade=t=out:st=0.04:d=1.1[a];[1]lowpass=f=300,afade=t=out:st=0:d=0.1[b];[a][b]amix=inputs=2:normalize=0,volume=2.6" boom.wav

# Bar variants (2s each) ----------------------------------------------
# A: sparse — kicks on 1 & 3 + sub root
ffmpeg -y -loglevel error -i kick.wav -f lavfi -i "sine=f=55:d=2" -filter_complex "\
[0]adelay=0|0[k1];[0]adelay=1000|1000[k2];[1]volume=0.3[s];\
[k1][k2][s]amix=inputs=3:normalize=0,apad=whole_dur=2" -t 2 barA.wav
# B: kicks on all beats + offbeat hats
ffmpeg -y -loglevel error -i kick.wav -i hat.wav -filter_complex "\
[0]adelay=0|0[k1];[0]adelay=500|500[k2];[0]adelay=1000|1000[k3];[0]adelay=1500|1500[k4];\
[1]adelay=250|250[h1];[1]adelay=750|750[h2];[1]adelay=1250|1250[h3];[1]adelay=1750|1750[h4];\
[k1][k2][k3][k4][h1][h2][h3][h4]amix=inputs=8:normalize=0,apad=whole_dur=2" -t 2 barB.wav
# C: full — B + syncopated bass stabs (82Hz)
ffmpeg -y -loglevel error -f lavfi -i "sine=f=82:d=0.16" -af "afade=t=out:st=0.02:d=0.14,volume=1.1" stab.wav
ffmpeg -y -loglevel error -i barB.wav -i stab.wav -filter_complex "\
[1]adelay=250|250[b1];[1]adelay=750|750[b2];[1]adelay=1375|1375[b3];[1]adelay=1750|1750[b4];\
[0][b1][b2][b3][b4]amix=inputs=5:normalize=0,apad=whole_dur=2" -t 2 barC.wav

# Sequence: A A B B | C C C C | C C C C | C B A A  (16 bars = 32s)
cat > seq.txt <<TXT
file 'barA.wav'
file 'barA.wav'
file 'barB.wav'
file 'barB.wav'
file 'barC.wav'
file 'barC.wav'
file 'barC.wav'
file 'barC.wav'
file 'barC.wav'
file 'barC.wav'
file 'barC.wav'
file 'barC.wav'
file 'barC.wav'
file 'barB.wav'
file 'barA.wav'
file 'barA.wav'
TXT
ffmpeg -y -loglevel error -f concat -safe 0 -i seq.txt -c copy seq.wav

# Overlay: riser into 8s, crash+boom AT 8s (reveal), soft crash at 26s (CTA), master fade
ffmpeg -y -loglevel error -i seq.wav -i riser.wav -i crash.wav -i boom.wav -i crash.wav -filter_complex "\
[1]adelay=6000|6000,volume=0.7[r];\
[2]adelay=8000|8000,volume=0.8[c1];\
[3]adelay=8000|8000[bm];\
[4]adelay=26000|26000,volume=0.5[c2];\
[0][r][c1][bm][c2]amix=inputs=5:normalize=0,afade=t=out:st=29.5:d=2.5,volume=0.9" -t 32 arranged.wav

rm -f barA.wav barB.wav barC.wav stab.wav seq.wav seq.txt
echo done && ls -la arranged.wav crash.wav boom.wav

# ——— Variant B: "heavy" — halftime, dark, snare on the back beat ———
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.18:c=white:a=0.8" \
  -af "bandpass=f=1800:w=1200,afade=t=out:st=0.01:d=0.17,volume=1.5" snare.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=41:d=2" -af "volume=0.35" subB.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=65:d=0.18" -af "afade=t=out:st=0.02:d=0.16,volume=1.2" stab2.wav
# bar D: kick 1&3, snare on 3, sub drone
ffmpeg -y -loglevel error -i kick.wav -i snare.wav -i subB.wav -filter_complex "\
[0]adelay=0|0[k1];[0]adelay=1000|1000[k2];[1]adelay=1000|1000[s1];[2]volume=1[dr];\
[k1][k2][s1][dr]amix=inputs=4:normalize=0,apad=whole_dur=2" -t 2 barD.wav
# bar E: D + offbeat bass stabs + hats
ffmpeg -y -loglevel error -i barD.wav -i stab2.wav -i hat.wav -filter_complex "\
[1]adelay=500|500[b1];[1]adelay=1500|1500[b2];\
[2]adelay=250|250[h1];[2]adelay=750|750[h2];[2]adelay=1250|1250[h3];[2]adelay=1750|1750[h4];\
[0][b1][b2][h1][h2][h3][h4]amix=inputs=7:normalize=0,apad=whole_dur=2" -t 2 barE.wav
cat > seqB.txt <<TXT
file 'barD.wav'
file 'barD.wav'
file 'barD.wav'
file 'barD.wav'
file 'barE.wav'
file 'barE.wav'
file 'barE.wav'
file 'barE.wav'
file 'barE.wav'
file 'barE.wav'
file 'barE.wav'
file 'barE.wav'
file 'barE.wav'
file 'barD.wav'
file 'barD.wav'
file 'barD.wav'
TXT
ffmpeg -y -loglevel error -f concat -safe 0 -i seqB.txt -c copy seqB.wav
ffmpeg -y -loglevel error -i seqB.wav -i riser.wav -i crash.wav -i boom.wav -filter_complex "\
[1]adelay=6000|6000,volume=0.7[r];[2]adelay=8000|8000,volume=0.8[c1];[3]adelay=8000|8000[bm];\
[0][r][c1][bm]amix=inputs=4:normalize=0,afade=t=out:st=29.5:d=2.5,volume=0.9" -t 32 arranged-heavy.wav
# whoosh2: reverse whoosh (fast attack, long tail)
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.8" \
  -af "bandpass=f=1400:w=900,afade=t=in:st=0:d=0.05,afade=t=out:st=0.05:d=0.45,volume=1.4" whoosh2.wav
rm -f barD.wav barE.wav seqB.txt seqB.wav snare.wav subB.wav

# ——— keystroke tick (terminal typing) ———
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.03:c=white:a=0.9" \
  -af "highpass=f=3000,lowpass=f=9000,afade=t=out:st=0.005:d=0.025,volume=0.7" keytick.wav

# ——— Variant C: "adrenaline" — 16th hats, driving bass 8ths, snare fills ———
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.18:c=white:a=0.8" \
  -af "bandpass=f=1800:w=1200,afade=t=out:st=0.01:d=0.17,volume=1.4" snareC.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=73:d=0.13" -af "afade=t=out:st=0.02:d=0.11,volume=1.15" bassC.wav
# bar F: 4 kicks + 16th hats + bass 8ths
ffmpeg -y -loglevel error -i kick.wav -i hat.wav -i bassC.wav -filter_complex "\
[0]adelay=0|0[k1];[0]adelay=500|500[k2];[0]adelay=1000|1000[k3];[0]adelay=1500|1500[k4];\
[1]adelay=125|125[h1];[1]adelay=375|375[h2];[1]adelay=625|625[h3];[1]adelay=875|875[h4];\
[1]adelay=1125|1125[h5];[1]adelay=1375|1375[h6];[1]adelay=1625|1625[h7];[1]adelay=1875|1875[h8];\
[2]adelay=250|250[b1];[2]adelay=750|750[b2];[2]adelay=1250|1250[b3];[2]adelay=1750|1750[b4];\
[k1][k2][k3][k4][h1][h2][h3][h4][h5][h6][h7][h8][b1][b2][b3][b4]amix=inputs=16:normalize=0,apad=whole_dur=2" -t 2 barF.wav
# bar G: F + snare on 2&4 (full-throttle)
ffmpeg -y -loglevel error -i barF.wav -i snareC.wav -filter_complex "\
[1]adelay=500|500[s1];[1]adelay=1500|1500[s2];[0][s1][s2]amix=inputs=3:normalize=0,apad=whole_dur=2" -t 2 barG.wav
# fill bar: G with 16th snare roll in last half
ffmpeg -y -loglevel error -i barG.wav -i snareC.wav -filter_complex "\
[1]adelay=1500|1500,volume=0.5[r1];[1]adelay=1625|1625,volume=0.6[r2];[1]adelay=1750|1750,volume=0.8[r3];[1]adelay=1875|1875,volume=1.0[r4];\
[0][r1][r2][r3][r4]amix=inputs=5:normalize=0,apad=whole_dur=2" -t 2 barH.wav
cat > seqC.txt <<TXT
file 'barF.wav'
file 'barF.wav'
file 'barF.wav'
file 'barH.wav'
file 'barG.wav'
file 'barG.wav'
file 'barG.wav'
file 'barH.wav'
file 'barG.wav'
file 'barG.wav'
file 'barG.wav'
file 'barH.wav'
file 'barG.wav'
file 'barG.wav'
file 'barF.wav'
file 'barF.wav'
TXT
ffmpeg -y -loglevel error -f concat -safe 0 -i seqC.txt -c copy seqC.wav
ffmpeg -y -loglevel error -i seqC.wav -i riser.wav -i crash.wav -i boom.wav -i riser.wav -filter_complex "\
[1]adelay=6000|6000,volume=0.8[r1];[2]adelay=8000|8000,volume=0.9[c1];[3]adelay=8000|8000[bm];\
[4]adelay=20000|20000,volume=0.6[r2];\
[0][r1][c1][bm][r2]amix=inputs=5:normalize=0,afade=t=out:st=29.5:d=2.5,volume=0.95" -t 32 arranged-adrenaline.wav
rm -f barF.wav barG.wav barH.wav seqC.txt seqC.wav snareC.wav bassC.wav

# ——— UI one-shots: enter thock, pop, counter tick ———
ffmpeg -y -loglevel error -f lavfi -i "sine=f=180:d=0.09" -f lavfi -i "anoisesrc=d=0.04:c=brown:a=0.8" \
  -filter_complex "[0]afade=t=out:st=0.01:d=0.08[a];[1]lowpass=f=900,afade=t=out:st=0:d=0.04[b];[a][b]amix=inputs=2:normalize=0,volume=1.6" enter.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=520:d=0.07" \
  -af "afade=t=in:st=0:d=0.01,afade=t=out:st=0.02:d=0.05,volume=0.9" pop.wav
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.02:c=white:a=0.5" \
  -af "highpass=f=5000,afade=t=out:st=0.002:d=0.018,volume=0.35" tick.wav
