import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Volume2, Pause, Loader2, Download, X } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";

// Audio player for TTS-generated Arabic speech (free Gemini tier).
// Generates the audio on first click, then offers play/pause + download.
export function VoicePlayer({ text, label }: { text: string; label?: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateMutation = trpc.tts.generate.useMutation({
    onSuccess: data => {
      setAudioUrl(data.audioUrl);
      setDuration(data.durationSeconds ?? null);
      toast.success("تم إنشاء النسخة الصوتية");
    },
    onError: err => toast.error(err.message || "تعذر إنشاء النسخة الصوتية"),
  });

  const handleGenerate = () => {
    if (generateMutation.isPending || audioUrl) return;
    if (!text.trim()) {
      toast.error("لا يوجد نص لتحويله إلى صوت");
      return;
    }
    generateMutation.mutate({ text: text.trim() });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (audio.paused) {
      audio.play().catch(() => toast.error("تعذر تشغيل الصوت"));
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const handleEnded = () => setPlaying(false);

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `nibras-tts-${Date.now()}.mp3`;
    a.click();
  };

  const durationLabel = duration ? `(${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")})` : "";

  return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} src={audioUrl ?? undefined} onEnded={handleEnded} hidden />

      {!audioUrl ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 ml-1 animate-spin" />
              جاري إنشاء الصوت...
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 ml-1" />
              {label || "استماع"}
            </>
          )}
        </Button>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={togglePlay}>
            {playing ? <Pause className="w-4 h-4 ml-1" /> : <Volume2 className="w-4 h-4 ml-1" />}
            {playing ? "إيقاف" : "تشغيل"} {durationLabel}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setAudioUrl(null);
              setDuration(null);
              setPlaying(false);
            }}
            aria-label="إزالة النسخة الصوتية"
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}
