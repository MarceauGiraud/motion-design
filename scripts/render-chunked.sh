#!/bin/bash
# Rendu robuste par tronçons : chaque tronçon qui échoue est relancé (3 essais),
# puis concaténation sans réencodage + piste audio rendue à part + loudnorm.
# Usage : scripts/render-chunked.sh <CompositionId> <out.mp4> [taille_tronçon]
set -u
ID=$1; OUT=$2; CH=${3:-300}
TMP=$(mktemp -d out/.chunks-XXXX)
N=$(npx remotion compositions src/index.ts 2>/dev/null | awk -v id="$ID" '$1==id{print $4}')
[ -z "$N" ] && { echo "composition $ID introuvable"; exit 1; }
i=0; : > $TMP/list.txt
for ((a=0; a<N; a+=CH)); do
  b=$(( a+CH-1 < N-1 ? a+CH-1 : N-1 )); f=$TMP/c$(printf %03d $i).mp4
  for try in 1 2 3 4 5 6; do
    npx remotion render src/index.ts $ID $f --frames=$a-$b --muted --concurrency=4 --timeout=45000 >/dev/null 2>&1 && break
    echo "tronçon $a-$b : échec $try"
  done
  [ -f $f ] || { echo "ÉCHEC définitif $a-$b"; exit 1; }
  echo "file '$(basename $f)'" >> $TMP/list.txt; i=$((i+1)); echo "ok $a-$b"
done
ffmpeg -v error -y -f concat -safe 0 -i $TMP/list.txt -c copy $TMP/video.mp4
npx remotion render src/index.ts $ID $TMP/audio.wav --codec=wav >/dev/null 2>&1 || { echo "audio KO"; exit 1; }
ffmpeg -v error -y -i $TMP/video.mp4 -i $TMP/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1:LRA=9 -c:a aac -b:a 192k -shortest $OUT
rm -rf $TMP
ffprobe -v error -show_entries stream=codec_type,width,height:format=duration -of csv=p=0 $OUT | tr '\n' ' '; echo
