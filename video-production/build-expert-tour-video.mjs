import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = "/home/ubuntu/nibras/video-production";
const staticAssets = "/home/ubuntu/webdev-static-assets";
const audioAssets = "/home/ubuntu/webdev-static-assets/nibras-video-production-source/audio";
const outputDir = "/home/ubuntu/webdev-static-assets/nibras-video-production-output/original";
mkdirSync(outputDir, { recursive: true });

const scenes = [
  { image: path.join(staticAssets, "nibras-video-classroom-reference.png"), audio: path.join(audioAssets, "01-season.wav"), name: "01-season" },
  { image: path.join(staticAssets, "nibras-video-workdesk-reference.png"), audio: path.join(audioAssets, "02-today.wav"), name: "02-today" },
  { image: path.join(staticAssets, "nibras-video-assessment-reference.png"), audio: path.join(audioAssets, "03-assessment.wav"), name: "03-assessment" },
  { image: path.join(staticAssets, "nibras-video-devices-reference.png"), audio: path.join(audioAssets, "04-conclusion.wav"), name: "04-conclusion" },
];

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function duration(file) {
  return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], { encoding: "utf8" }).trim());
}

for (const scene of scenes) {
  if (!existsSync(scene.image) || !existsSync(scene.audio)) throw new Error(`Missing asset for ${scene.name}`);
  const seconds = duration(scene.audio) + 1.2;
  const segment = path.join(outputDir, `${scene.name}.mp4`);
  run("ffmpeg", [
    "-y", "-loop", "1", "-i", scene.image, "-i", scene.audio,
    "-filter_complex", "[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,zoompan=z='min(zoom+0.00035,1.08)':d=1:s=1280x720:fps=24,format=yuv420p[v]",
    "-map", "[v]", "-map", "1:a", "-t", seconds.toFixed(2), "-r", "24",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-c:a", "aac", "-b:a", "160k", "-shortest", segment,
  ]);
}

const listPath = path.join(outputDir, "segments.txt");
writeFileSync(listPath, scenes.map((scene) => `file '${path.join(outputDir, `${scene.name}.mp4`)}'`).join("\n"));
const joined = path.join(outputDir, "nibras-expert-tour-narrated.mp4");
run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", joined]);

const music = path.join(audioAssets, "nibras-expert-tour-music.wav");
const finalOutput = path.join(outputDir, "nibras-expert-tour-ar.mp4");
if (existsSync(music)) {
  run("ffmpeg", [
    "-y", "-i", joined, "-stream_loop", "-1", "-i", music,
    "-filter_complex", "[0:a]volume=1.0[narration];[1:a]volume=0.12[music];[narration][music]amix=inputs=2:duration=first:dropout_transition=2[a]",
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", finalOutput,
  ]);
} else {
  run("ffmpeg", ["-y", "-i", joined, "-c", "copy", finalOutput]);
}

console.log(`Created ${finalOutput}`);
