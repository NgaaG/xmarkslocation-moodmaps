import { useEffect, useRef, useState } from "react";
import { SpotCategory } from "@/data/spots";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPlaylists } from "@/data/mockData";
import { X, Save, Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CustomEmoji from "./CustomEmoji";
import html2canvas from "html2canvas";

const emotions = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "😔", label: "Sad", value: "sad" },
  { emoji: "😠", label: "Angry", value: "angry" },
  { emoji: "😰", label: "Anxious", value: "anxious" },
  { emoji: "😴", label: "Tired", value: "tired" },
  { emoji: "🤗", label: "Excited", value: "excited" },
  { emoji: "😐", label: "Neutral", value: "neutral" },
];

const stagePrompts = {
  before: "How are you feeling before starting?",
  during: "How are you feeling during your journey?",
  after: "How do you feel after your experience?",
};

interface MoodEntry {
  stage: "before" | "during" | "after";
  emotion: string;
  timestamp: Date;
}

interface MoodVisualizerProps {
  category: SpotCategory;
  isPlaying?: boolean;
}

const MoodVisualizer = ({ category, isPlaying = true }: MoodVisualizerProps) => {
  const [currentStage, setCurrentStage] = useState<"before" | "during" | "after">("before");
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [destinationPhoto, setDestinationPhoto] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [currentSpotifyPlaylist, setCurrentSpotifyPlaylist] = useState<string>("");
  const [currentLocationTitle, setCurrentLocationTitle] = useState<string>("");
  
  const moodRef = useRef<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const categoryPlaylists = mockPlaylists.filter((p) => 
    p.name.toLowerCase().includes(category.toLowerCase()) || 
    category === "peaceful" && p.name.includes("Garden") ||
    category === "social" && p.name.includes("Coffee") ||
    category === "scenic" && p.name.includes("Epic")
  );

  useEffect(() => {
    if (categoryPlaylists.length > 0 && !selectedPlaylist) {
      setSelectedPlaylist(categoryPlaylists[0].id);
    }
  }, [category, categoryPlaylists, selectedPlaylist]);

  useEffect(() => {
    const handleSpotifyPlaylist = (e: CustomEvent) => {
      setCurrentSpotifyPlaylist(e.detail.playlistName);
    };
    const handleLocationTitle = (e: CustomEvent) => {
      setCurrentLocationTitle(e.detail.locationTitle);
    };
    window.addEventListener("spotify-playlist-opened" as any, handleSpotifyPlaylist);
    window.addEventListener("location-title-set" as any, handleLocationTitle);
    return () => {
      window.removeEventListener("spotify-playlist-opened" as any, handleSpotifyPlaylist);
      window.removeEventListener("location-title-set" as any, handleLocationTitle);
    };
  }, []);

  const handleMoodSelect = (emotion: string) => {
    setSelectedMood(emotion);
    moodRef.current = emotion;
  };

  const handleSubmitMood = () => {
    if (!selectedMood) return;

    const newEntry: MoodEntry = {
      stage: currentStage,
      emotion: selectedMood,
      timestamp: new Date(),
    };

    setMoodEntries([...moodEntries, newEntry]);
    setSelectedMood(null);
    moodRef.current = null;

    if (currentStage === "before") {
      setCurrentStage("during");
    } else if (currentStage === "during") {
      setCurrentStage("after");
    } else {
      setShowPhotoCapture(true);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDestinationPhoto(event.target?.result as string);
        setShowPhotoCapture(false);
        setShowSubmitPrompt(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveToJournal = async () => {
    if (moodEntries.length !== 3) return;

    const playlist = mockPlaylists.find((p) => p.id === selectedPlaylist);

    // Capture screenshot of summary with light theme and no overlays
    let screenshotData: string | undefined;
    if (summaryRef.current) {
      try {
        const closeButton = summaryRef.current.querySelector("button");
        const originalDisplay = closeButton ? closeButton.style.display : "";
        if (closeButton) closeButton.style.display = "none";
        const originalBg = summaryRef.current.style.backgroundColor;
        const originalColor = summaryRef.current.style.color;
        summaryRef.current.style.backgroundColor = "#fafafa";
        summaryRef.current.style.color = "#111";
        const canvas = await html2canvas(summaryRef.current, {
          backgroundColor: "#fafafa",
          scale: 2,
          logging: false,
        });
        screenshotData = canvas.toDataURL("image/png");
        summaryRef.current.style.backgroundColor = originalBg;
        summaryRef.current.style.color = originalColor;
        if (closeButton) closeButton.style.display = originalDisplay;
      } catch (error) {
        console.error("Failed to capture screenshot:", error);
      }
    }

    let finalImage = screenshotData;
    if (destinationPhoto && screenshotData) {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const destImg = new Image();
          const summaryImg = new Image();
          await new Promise<void>((resolve) => {
            let loadedCount = 0;
            const checkLoaded = () => {
              loadedCount++;
              if (loadedCount === 2) resolve();
            };
            destImg.onload = checkLoaded;
            summaryImg.onload = checkLoaded;
            destImg.src = destinationPhoto;
            summaryImg.src = screenshotData!;
          });
          const padding = 20;
          canvas.width = Math.max(destImg.width, summaryImg.width);
          canvas.height = destImg.height + summaryImg.height + padding * 3;
          ctx.fillStyle = "#fafafa";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const destX = (canvas.width - destImg.width) / 2;
          ctx.drawImage(destImg, destX, padding, destImg.width, destImg.height);
          const summaryY = destImg.height + padding * 2;
          const summaryX = (canvas.width - summaryImg.width) / 2;
          ctx.drawImage(summaryImg, summaryX, summaryY, summaryImg.width, summaryImg.height);
          finalImage = canvas.toDataURL("image/png");
        }
      } catch (error) {
        console.error("Failed to combine images:", error);
        finalImage = screenshotData;
      }
    } else if (destinationPhoto) {
      finalImage = destinationPhoto;
    }

    const summary = {
      before: moodEntries.find((e) => e.stage === "before"),
      during: moodEntries.find((e) => e.stage === "during"),
      after: moodEntries.find((e) => e.stage === "after"),
    };
    const playlistCategoryName = playlist?.name || "";
    const spotifyPlaylistName = currentSpotifyPlaylist || "";
    const locationTitle = currentLocationTitle || "Unknown Location";
    const journalEntry = {
      id: `journey-${Date.now()}`,
      locationTitle,
      playlistName: spotifyPlaylistName,
      playlistCategoryName,
      spotifyPlaylistName,
      category,
      moodEntries: moodEntries.map((e) => ({
        stage: e.stage,
        emotion: e.emotion,
        timestamp: e.timestamp.toISOString(),
      })),
      timestamp: new Date().toISOString(),
      summaryData: summary,
      summaryImage: finalImage,
      destinationPhoto: destinationPhoto,
    };

    const existingEntries = JSON.parse(localStorage.getItem("moodJournalEntries") || "[]");
    localStorage.setItem("moodJournalEntries", JSON.stringify([...existingEntries, journalEntry]));
    window.dispatchEvent(new Event("storage"));

    fetch("https://mood-journeys-relay.vercel.app/api/save-journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: journalEntry.id,
        locationTitle: journalEntry.locationTitle,
        latitude: 0,
        longitude: 0,
        playlist: journalEntry.playlistName,
        moods: moodEntries.map((e) => e.emotion).join(", "),
        timestamp: journalEntry.timestamp,
      }),
    }).catch((err) => console.log("ℹ️ Cloud sync skipped:", err.message));

    toast({
      title: "Journey Saved! 🎵",
      description: `${playlist?.name} mood journey saved to your journal`,
    });

    setShowSubmitPrompt(false);
    setShowSaveConfirmation(true);

    window.dispatchEvent(new CustomEvent("tutorial-journey-save"));

    setTimeout(() => {
      setShowSaveConfirmation(false);
      setMoodEntries([]);
      setCurrentStage("before");
      setSelectedMood(null);
      moodRef.current = null;
      setDestinationPhoto(null);
      setShowPhotoCapture(false);
    }, 2000);
  };

  if (!isPlaying) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Start playing to begin your mood journey</p>
      </div>
    );
  }

  if (showSaveConfirmation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-6xl">✅</div>
        <h3 className="text-2xl font-bold text-foreground">Journey Saved!</h3>
        <p className="text-muted-foreground">Check your journal to view this entry</p>
      </div>
    );
  }

  if (showPhotoCapture) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6">
        <h3 className="text-xl font-semibold text-foreground">Capture Your Destination</h3>
        <p className="text-muted-foreground text-center">
          Take a photo of where you are to complete your journey
        </p>
        {destinationPhoto ? (
          <div className="space-y-4">
            <img src={destinationPhoto} alt="Destination" className="w-full max-w-md rounded-lg" />
            <div className="flex gap-2">
              <Button onClick={() => setDestinationPhoto(null)} variant="outline" className="flex-1">
                Retake
              </Button>
              <Button onClick={() => { setShowPhotoCapture(false); setShowSubmitPrompt(true); }} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-md">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Take Photo
            </Button>
            <Button 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = handlePhotoCapture as any;
                input.click();
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload from Gallery
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (showSubmitPrompt && moodEntries.length === 3) {
    const summary = {
      before: moodEntries.find((e) => e.stage === "before"),
      during: moodEntries.find((e) => e.stage === "during"),
      after: moodEntries.find((e) => e.stage === "after"),
    };

    return (
      <div ref={summaryRef} className="relative p-6 space-y-6 bg-background">
        <Button
          onClick={() => setShowSubmitPrompt(false)}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <h3 className="text-2xl font-bold text-foreground">Your Mood Journey</h3>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-2">Before</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{emotions.find(e => e.value === summary.before?.emotion)?.emoji}</span>
              <span className="text-lg font-medium text-foreground">
                {emotions.find(e => e.value === summary.before?.emotion)?.label}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-2">During</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{emotions.find(e => e.value === summary.during?.emotion)?.emoji}</span>
              <span className="text-lg font-medium text-foreground">
                {emotions.find(e => e.value === summary.during?.emotion)?.label}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-2">After</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{emotions.find(e => e.value === summary.after?.emotion)?.emoji}</span>
              <span className="text-lg font-medium text-foreground">
                {emotions.find(e => e.value === summary.after?.emotion)?.label}
              </span>
            </div>
          </div>
        </div>

        {destinationPhoto && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Your Destination</p>
            <img src={destinationPhoto} alt="Destination" className="w-full rounded-lg" />
          </div>
        )}

        <Button onClick={handleSaveToJournal} className="w-full" size="lg">
          <Save className="mr-2 h-5 w-5" />
          Save to Journal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Select Playlist</label>
        <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryPlaylists.map((playlist) => (
              <SelectItem key={playlist.id} value={playlist.id}>
                {playlist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {stagePrompts[currentStage]}
          </h3>
          <span className="text-sm text-muted-foreground">
            {moodEntries.length}/3
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {emotions.map((emotion) => (
            <button
              key={emotion.value}
              onClick={() => handleMoodSelect(emotion.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMood === emotion.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{emotion.emoji}</span>
                <span className="text-xs text-foreground">{emotion.label}</span>
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleSubmitMood}
          disabled={!selectedMood}
          className="w-full"
          size="lg"
        >
          {currentStage === "after" ? "Continue" : "Next"}
        </Button>
      </div>

      {moodEntries.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground">Your Entries</h4>
          <div className="space-y-2">
            {moodEntries.map((entry, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <span className="text-2xl">
                  {emotions.find(e => e.value === entry.emotion)?.emoji}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{entry.stage}</p>
                  <p className="text-xs text-muted-foreground">
                    {emotions.find(e => e.value === entry.emotion)?.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodVisualizer;
