import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = "/home/ubuntu/nibras/video-production";
const walkthroughAssets = "/home/ubuntu/webdev-static-assets/nibras-expert-tour-walkthrough";
const audioAssets = "/home/ubuntu/webdev-static-assets/nibras-video-production-source/audio";
const outputDir = "/home/ubuntu/webdev-static-assets/nibras-video-production-output/walkthrough";
mkdirSync(outputDir, { recursive: true });

const scenes = [
  { image: "01-season-setup.webp", audio: "revision-01-season-setup.wav", name: "01-season-setup" },
  { image: "02-today.webp", audio: "revision-02-today.wav", name: "02-today" },
  { image: "03-planning.webp", audio: "revision-03-planning.wav", name: "03-planning" },
  { image: "04-assessment.webp", audio: "revision-04-assessment.wav", name: "04-assessment" },
];

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function duration(file) {
  return Number(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file],
      { encoding: "utf8" },
    ).trim(),
  );
}

for (const scene of scenes) {
  const image = path.join(walkthroughAssets, scene.image);
  const audio = path.join(audioAssets, scene.audio);
  if (!existsSync(image) || !existsSync(audio)) throw new Error(`Missing asset for ${scene.name}`);

  const voiceDuration = duration(audio);
  const seconds = voiceDuration + 1.5;
  const segment = path.join(outputDir, `${scene.name}.mp4`);
  const audioFadeStart = Math.max(voiceDuration + 0.75, 0.5);

  run("ffmpeg", [
    "-y",
    "-loop", "1",
    "-framerate", "24",
    "-i", image,
    "-i", audio,
    "-filter_complex",
    `[0:v]crop=764:430:60:265,scale=1408:792,zoompan=z='min(zoom+0.00025,1.075)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=24,format=yuv420p[v];[1:a]apad=pad_dur=1.5,afade=t=in:st=0:d=0.25,afade=t=out:st=${audioFadeStart.toFixed(2)}:d=0.5[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-t",
    seconds.toFixed(2),
    "-r",
    "24",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-shortest",
    segment,
  ]);
}

const listPath = path.join(outputDir, "segments.txt");
writeFileSync(listPath, scenes.map((scene) => `file '${path.join(outputDir, `${scene.name}.mp4`)}'`).join("\n"));

const narrated = path.join(outputDir, "nibras-expert-tour-walkthrough-narrated.mp4");
run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", narrated]);

const music = path.join(audioAssets, "nibras-expert-tour-music.wav");
const finalOutput = path.join(outputDir, "nibras-expert-tour-ar-walkthrough.mp4");
if (existsSync(music)) {
  run("ffmpeg", [
    "-y",
    "-i",
    narrated,
    "-stream_loop",
    "-1",
    "-i",
    music,
    "-filter_complex",
    "[0:a]volume=1.0[narration];[1:a]volume=0.09[music];[narration][music]amix=inputs=2:duration=first:dropout_transition=2[a]",
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    "-shortest",
    finalOutput,
  ]);
} else {
  run("ffmpeg", ["-y", "-i", narrated, "-c", "copy", finalOutput]);
}

console.log(`Created ${finalOutput}`);
