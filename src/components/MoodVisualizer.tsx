import { useEffect, useRef, useState } from "react";
import { SpotCategory } from "@/data/spots";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPlaylists } from "@/data/mockData";
import { X, Save, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CustomEmoji from "./CustomEmoji";
import html2canvas from "html2canvas";

interface MoodVisualizerProps {
  category: SpotCategory;
  isPlaying?: boolean;
}

type EmotionType = "love" | "happy" | "content" | "disappointed" | "sad" | "angry" | "neutral" | "curious";
type MoodStage = "before" | "during" | "after";

interface MoodEntry {
  stage: MoodStage;
  emotion: EmotionType;
  timestamp: Date;
}

// Plutchik's Wheel of Emotions adapted for music/playlist context
const emotions = [
  // Positive spectrum (Joy branch - green) - highest to lowest intensity
  {
    id: "love" as EmotionType,
    emoji: "😍",
    label: "In Love",
    description: "Heart-eyes, completely captivated",
    color: "hsl(142, 76%, 36%)", // Deep vibrant green
    spectrum: "positive",
    intensity: 3,
    animation: "animate-bounce-gentle",
  },
  {
    id: "happy" as EmotionType,
    emoji: "😄",
    label: "Happy",
    description: "Joyful and energized",
    color: "hsl(142, 71%, 45%)", // Medium green
    spectrum: "positive",
    intensity: 2,
    animation: "animate-bounce-gentle",
  },
  {
    id: "content" as EmotionType,
    emoji: "😊",
    label: "Content",
    description: "Peacefully satisfied",
    color: "hsl(142, 65%, 55%)", // Light green
    spectrum: "positive",
    intensity: 1,
    animation: "animate-bounce-gentle",
  },
  // Negative spectrum (Sadness/Anger branch - red) - highest to lowest intensity
  {
    id: "angry" as EmotionType,
    emoji: "😡",
    label: "Angry",
    description: "Frustrated or agitated",
    color: "hsl(0, 84%, 60%)", // Bright red
    spectrum: "negative",
    intensity: 3,
    animation: "animate-shake-fast",
  },
  {
    id: "sad" as EmotionType,
    emoji: "😢",
    label: "Sad",
    description: "Tearful and melancholic",
    color: "hsl(0, 70%, 50%)", // Medium red
    spectrum: "negative",
    intensity: 2,
    animation: "animate-sway-slow",
  },
  {
    id: "disappointed" as EmotionType,
    emoji: "☹️",
    label: "Disappointed",
    description: "Let down or dissatisfied",
    color: "hsl(0, 60%, 40%)", // Dark red
    spectrum: "negative",
    intensity: 1,
    animation: "animate-sway-slow",
  },
  // Neutral/Curious spectrum (Anticipation branch - gray) - highest to lowest intensity
  {
    id: "neutral" as EmotionType,
    emoji: "😐",
    label: "Neutral",
    description: "Indifferent, neither good nor bad",
    color: "hsl(210, 10%, 60%)", // Light neutral gray
    spectrum: "neutral",
    intensity: 2,
    animation: "animate-pulse-steady",
  },
  {
    id: "curious" as EmotionType,
    emoji: "🧐",
    label: "Curious",
    description: "Thoughtfully intrigued",
    color: "hsl(210, 8%, 50%)", // Medium neutral gray
    spectrum: "neutral",
    intensity: 1,
    animation: "animate-pulse-steady",
  },
];

const stagePrompts = {
  before: "How does this playlist make you feel before starting your journey?",
  during: "How does this playlist feel while exploring?",
  after: "How well does this playlist match the location's atmosphere?",
};

const MoodVisualizer = ({ category, isPlaying = true }: MoodVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentStage, setCurrentStage] = useState<MoodStage>("before");
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<EmotionType | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>(mockPlaylists[0].id);
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [summaryScreenshot, setSummaryScreenshot] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef<EmotionType | null>(null);
  const reminderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [hasValidSelection, setHasValidSelection] = useState(false);
  const [currentLocationTitle, setCurrentLocationTitle] = useState<string>("");
  const [currentSpotifyPlaylist, setCurrentSpotifyPlaylist] = useState<string>("");
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [destinationPhoto, setDestinationPhoto] = useState<string | null>(null);

  // Category mapping for playlists
  const playlistCategories = {
    peaceful: ["Garden Serenity", "Nature Sounds", "Classical Focus", "Museum Ambience"],
    social: ["Coffeeshop Vibes", "Social Gathering", "Shopping Beats", "Urban Energy"],
    scenic: ["Epic Views", "Adventure time", "Sunset Chill", "Lakeside Lounge"],
  };

  // Helper function to get category of a playlist by name
  const getPlaylistCategory = (playlistName: string): "peaceful" | "social" | "scenic" | null => {
    for (const [category, names] of Object.entries(playlistCategories)) {
      if (names.some((name) => playlistName.includes(name))) {
        return category as "peaceful" | "social" | "scenic";
      }
    }
    return null;
  };

  // Validate that dropdown selection matches active Spotify category
  const validateSelection = (playlistId: string): boolean => {
    const spotifyActive = localStorage.getItem("spotifyPlaylistActive") === "true";
    if (!spotifyActive) return false;

    const activeSpotifyCategory = localStorage.getItem("selectedPlaylistCategory");
    if (!activeSpotifyCategory) return false;

    const selectedPlaylist = mockPlaylists.find((p) => p.id === playlistId);
    if (!selectedPlaylist) return false;

    const selectedCategory = getPlaylistCategory(selectedPlaylist.name);
    return selectedCategory === activeSpotifyCategory;
  };

  // Auto-sync playlist from localStorage and handle location changes
  useEffect(() => {
    const updateFromStorage = () => {
      const savedCategory = localStorage.getItem("selectedPlaylistCategory");
      const savedLocation = localStorage.getItem("selectedLocationTitle") || "";
      const savedPlaylistName = localStorage.getItem("selectedSpotifyPlaylistName") || "";
      const spotifyActive = localStorage.getItem("spotifyPlaylistActive") === "true";

      setCurrentLocationTitle(savedLocation);
      setCurrentSpotifyPlaylist(savedPlaylistName);

      // If Spotify playlist was opened, auto-sync to matching playlist in dropdown
      if (savedCategory && spotifyActive) {
        // Find first playlist that matches the category
        const matchingPlaylist = mockPlaylists.find((p) => getPlaylistCategory(p.name) === savedCategory);

        if (matchingPlaylist) {
          setSelectedPlaylist(matchingPlaylist.id);
          setHasValidSelection(true);
        } else {
          setHasValidSelection(false);
        }
      } else {
        // No active Spotify playlist, disable visualizer
        if (mockPlaylists[0]) {
          setSelectedPlaylist(mockPlaylists[0].id);
        }
        setHasValidSelection(false);
      }
    };

    updateFromStorage();

    // Listen for Spotify playlist selection events for instant refresh
    const handleSpotifySelection = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { category: newCategory, playlistName, locationName } = customEvent.detail;

      // Update location and playlist info
      setCurrentLocationTitle(locationName);
      setCurrentSpotifyPlaylist(playlistName);

      // Immediately update to match new selection
      const matchingPlaylist = mockPlaylists.find((p) => getPlaylistCategory(p.name) === newCategory);

      if (matchingPlaylist) {
        setSelectedPlaylist(matchingPlaylist.id);
        setHasValidSelection(true);
      }
    };

    // Listen for location changes to reset state
    const handleLocationChanged = () => {
      setSelectedPlaylist(mockPlaylists[0]?.id || "");
      setHasValidSelection(false); // Disable until new Spotify playlist opened
      setCurrentLocationTitle("");
      setCurrentSpotifyPlaylist("");
      setMoodEntries([]);
      setCurrentStage("before");
      setSelectedMood(null);
      moodRef.current = null;
    };

    window.addEventListener("spotifyPlaylistSelected", handleSpotifySelection);
    window.addEventListener("locationChanged", handleLocationChanged);
    return () => {
      window.removeEventListener("spotifyPlaylistSelected", handleSpotifySelection);
      window.removeEventListener("locationChanged", handleLocationChanged);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Animation parameters based on category and mood
    let particles: Particle[] = [];
    let animationId: number;

    const getMoodModifier = (mood: EmotionType | null) => {
      if (!mood) return { speedMultiplier: 1, sizeMultiplier: 1, opacityBoost: 0, baseColor: null };

      const emotion = emotions.find((e) => e.id === mood);
      if (!emotion) return { speedMultiplier: 1, sizeMultiplier: 1, opacityBoost: 0, baseColor: null };

      // Calculate modifiers based on emotion spectrum and intensity
      const intensityFactor = emotion.intensity / 3; // Normalize to 0-1

      if (emotion.spectrum === "positive") {
        // Positive emotions: faster, larger, brighter
        return {
          speedMultiplier: 1 + intensityFactor * 0.5,
          sizeMultiplier: 1 + intensityFactor * 0.3,
          opacityBoost: intensityFactor * 0.2,
          baseColor: emotion.color,
        };
      } else if (emotion.spectrum === "negative") {
        // Negative emotions: more erratic or slower
        return {
          speedMultiplier: emotion.id === "angry" ? 2 : 0.5 + intensityFactor * 0.3,
          sizeMultiplier: 0.9 + intensityFactor * 0.2,
          opacityBoost: intensityFactor * 0.1,
          baseColor: emotion.color,
        };
      } else {
        // Neutral emotions: steady, moderate
        return {
          speedMultiplier: 0.7 + intensityFactor * 0.2,
          sizeMultiplier: 1,
          opacityBoost: 0,
          baseColor: emotion.color,
        };
      }
    };

    class BurstParticle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      life: number;
      maxLife: number;
      emoji: string;

      constructor(x: number, y: number, emoji: string, color: string) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.size = Math.random() * 30 + 20;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 3;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed - 2;
        this.color = color;
        this.life = 0;
        this.maxLife = 60;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.2; // gravity
        this.life++;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const opacity = 1 - this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.font = `${this.size}px Arial`;
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.restore();
      }

      isDead() {
        return this.life >= this.maxLife;
      }
    }

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      angle: number;
      angleSpeed: number;

      constructor(canvas: HTMLCanvasElement, category: SpotCategory) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        const mood = getMoodModifier(moodRef.current);
        const baseColor = mood.baseColor;

        switch (category) {
          case "peaceful":
            this.size = (Math.random() * 30 + 20) * mood.sizeMultiplier;
            this.speedX = (Math.random() - 0.5) * 0.3 * mood.speedMultiplier;
            this.speedY = (Math.random() - 0.5) * 0.3 * mood.speedMultiplier;
            this.color = baseColor || `hsla(222, 66%, 55%, ${Math.random() * 0.3 + 0.1 + mood.opacityBoost})`;
            this.angleSpeed = (Math.random() - 0.5) * 0.01 * mood.speedMultiplier;
            break;
          case "social":
            this.size = (Math.random() * 20 + 10) * mood.sizeMultiplier;
            this.speedX = (Math.random() - 0.5) * 2 * mood.speedMultiplier;
            this.speedY = (Math.random() - 0.5) * 2 * mood.speedMultiplier;
            this.color = baseColor || `hsla(340, 80%, 60%, ${Math.random() * 0.4 + 0.2 + mood.opacityBoost})`;
            this.angleSpeed = (Math.random() - 0.5) * 0.05 * mood.speedMultiplier;
            break;
          case "scenic":
            this.size = (Math.random() * 40 + 25) * mood.sizeMultiplier;
            this.speedX = (Math.random() - 0.5) * 1 * mood.speedMultiplier;
            this.speedY = (Math.random() - 0.5) * 1 * mood.speedMultiplier;
            this.color = baseColor || `hsla(160, 70%, 50%, ${Math.random() * 0.3 + 0.15 + mood.opacityBoost})`;
            this.angleSpeed = (Math.random() - 0.5) * 0.03 * mood.speedMultiplier;
            break;
        }

        this.angle = Math.random() * Math.PI * 2;
      }

      update(canvas: HTMLCanvasElement) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.angleSpeed;

        // Wrap around edges
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
      }

      draw(ctx: CanvasRenderingContext2D, category: SpotCategory) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        switch (category) {
          case "peaceful":
            // Soft circles
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            break;
          case "social":
            // Dynamic squares
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            break;
          case "scenic":
            // Flowing shapes
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 * i) / 6;
              const x = Math.cos(angle) * this.size;
              const y = Math.sin(angle) * this.size;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            break;
        }

        ctx.restore();
      }
    }

    // Initialize particles
    const particleCount = category === "peaceful" ? 8 : category === "social" ? 15 : 12;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas, category));
    }

    let localBurstParticles: BurstParticle[] = [];

    // Animation loop
    const animate = () => {
      if (!isPlaying) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update(canvas);
        particle.draw(ctx, category);
      });

      // Update and draw burst particles
      localBurstParticles = localBurstParticles.filter((bp) => {
        bp.update();
        bp.draw(ctx);
        return !bp.isDead();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Listen for burst particle events
    const handleBurstEvent = (event: CustomEvent) => {
      const { x, y, emoji, color } = event.detail;
      for (let i = 0; i < 8; i++) {
        localBurstParticles.push(new BurstParticle(x, y, emoji, color));
      }
    };

    canvas.addEventListener("moodBurst" as any, handleBurstEvent as any);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      canvas.removeEventListener("moodBurst" as any, handleBurstEvent as any);
      cancelAnimationFrame(animationId);
    };
  }, [category, isPlaying, selectedMood]);

  // Regenerate particles when mood changes to update colors
  useEffect(() => {
    moodRef.current = selectedMood;
  }, [selectedMood]);

  // Periodic reminder effect
  useEffect(() => {
    if (!selectedMood) {
      reminderTimerRef.current = setInterval(() => {
        setShowReminder(true);
        setTimeout(() => setShowReminder(false), 3000);
      }, 15000);
    }

    return () => {
      if (reminderTimerRef.current) {
        clearInterval(reminderTimerRef.current);
      }
    };
  }, [selectedMood]);

  const handleMoodSelect = (mood: EmotionType) => {
    setSelectedMood(mood);
    moodRef.current = mood;
    setShowOverlay(false);

    // Save mood entry for current stage
    const newEntry: MoodEntry = {
      stage: currentStage,
      emotion: mood,
      timestamp: new Date(),
    };
    setMoodEntries((prev) => [...prev.filter((e) => e.stage !== currentStage), newEntry]);

    // Dispatch tutorial event when mood is selected
    window.dispatchEvent(new CustomEvent("tutorial-mood-select"));

    setShowConfirmation(true);

    // Trigger burst effect
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      const emotion = emotions.find((e) => e.id === mood);
      if (emotion) {
        const event = new CustomEvent("moodBurst", {
          detail: { x, y, emoji: emotion.emoji, color: emotion.color },
        });
        canvas.dispatchEvent(event);
      }
    }

    setTimeout(() => {
      setShowConfirmation(false);
      setShowSubmitPrompt(true);
    }, 2000);
  };

  const handleContinue = () => {
    setShowSubmitPrompt(false);

    // Move to next stage
    if (currentStage === "before") {
      setCurrentStage("during");
      setSelectedMood(null);
      moodRef.current = null;
    } else if (currentStage === "during") {
      setCurrentStage("after");
      setSelectedMood(null);
      moodRef.current = null;
    }
  };

  const handlePhotoCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          setDestinationPhoto(imageData);
          setShowPhotoCapture(false);
          // Now proceed to save
          handleSaveToJournal();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveToJournal = async () => {
    if (moodEntries.length !== 3) return;

    const playlist = mockPlaylists.find((p) => p.id === selectedPlaylist);

    // Capture screenshot of summary with light theme and no overlays
    let screenshotData: string | undefined;
    if (summaryRef.current) {
      try {
        // Hide close button and other overlays
        const closeButton = summaryRef.current.querySelector("button");
        const originalDisplay = closeButton ? closeButton.style.display : "";
        if (closeButton) closeButton.style.display = "none";

        // Apply light theme temporarily
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

        // Revert to original
        summaryRef.current.style.backgroundColor = originalBg;
        summaryRef.current.style.color = originalColor;
        if (closeButton) closeButton.style.display = originalDisplay;
      } catch (error) {
        console.error("Failed to capture screenshot:", error);
      }
    }

    // Combine destination photo with summary if both exist
    let finalImage = screenshotData;
    if (destinationPhoto && screenshotData) {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Load both images
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

          // Set canvas size - place images side by side or stacked
          const padding = 20;
          canvas.width = Math.max(destImg.width, summaryImg.width);
          canvas.height = destImg.height + summaryImg.height + padding * 3;

          // White background
          ctx.fillStyle = "#fafafa";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw destination photo on top
          const destX = (canvas.width - destImg.width) / 2;
          ctx.drawImage(destImg, destX, padding, destImg.width, destImg.height);

          // Draw summary below
          const summaryY = destImg.height + padding * 2;
          const summaryX = (canvas.width - summaryImg.width) / 2;
          ctx.drawImage(summaryImg, summaryX, summaryY, summaryImg.width, summaryImg.height);

          finalImage = canvas.toDataURL("image/png");
        }
      } catch (error) {
        console.error("Failed to combine images:", error);
        // Fallback to just the summary
        finalImage = screenshotData;
      }
    } else if (destinationPhoto) {
      // Only destination photo, no summary
      finalImage = destinationPhoto;
    }

    // Build summary text
    const summary = {
      before: moodEntries.find((e) => e.stage === "before"),
      during: moodEntries.find((e) => e.stage === "during"),
      after: moodEntries.find((e) => e.stage === "after"),
    };

    // Get stored data and selected playlist info
    const playlistCategoryName = playlist?.name || ""; // The dropdown selection (e.g., "Coffeeshop Vibes")
    const spotifyPlaylistName = currentSpotifyPlaylist || ""; // The actual Spotify playlist name
    const locationTitle = currentLocationTitle || "Unknown Location"; // Use location or "Unknown Location"

    // Create journal entry
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

    // Save to localStorage
    const existingEntries = JSON.parse(localStorage.getItem("moodJournalEntries") || "[]");
    localStorage.setItem("moodJournalEntries", JSON.stringify([...existingEntries, journalEntry]));

    // Trigger storage event for journal view
    window.dispatchEvent(new Event("storage"));

    // Sync to Google Sheets (silent fail)
    fetch(
      "https://script.google.com/macros/s/AKfycbwqmt3SyidND_gTaBINfErwGCsUvN6V6rr5oVFrNTRzJx-5B_PnCgj0gbI0zRPvDH79Eg/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journalEntry),
      },
    ).catch((err) => console.log("Sync failed:", err));

    toast({
      title: "Journey Saved! 🎵",
      description: `${playlist?.name} mood journey saved to your journal`,
    });

    setShowSubmitPrompt(false);
    setShowSaveConfirmation(true);

    // Dispatch tutorial event when journey is saved
    window.dispatchEvent(new CustomEvent("tutorial-journey-save"));

    setTimeout(() => {
      setShowSaveConfirmation(false);
      // Reset for new journey
      setMoodEntries([]);
      setCurrentStage("before");
      setSelectedMood(null);
      moodRef.current = null;
      setDestinationPhoto(null);
      setShowPhotoCapture(false);
    }, 2000);
  };

  const handleClose = () => {
    setShowOverlay(false);
    setShowSubmitPrompt(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showOverlay && !showConfirmation && hasValidSelection) {
      setShowOverlay(true);
    }
  };

  const currentPlaylist = mockPlaylists.find((p) => p.id === selectedPlaylist);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden bg-black/80 backdrop-blur-sm">
      {/* Playlist Selector */}
      <div className="absolute top-4 left-4 z-30">
        <Select
          value={selectedPlaylist}
          onValueChange={(val) => {
            setSelectedPlaylist(val);
            // Validate that selection matches active Spotify category
            const isValid = validateSelection(val);
            setHasValidSelection(isValid);
          }}
        >
          <SelectTrigger className="w-[200px] bg-black/60 backdrop-blur-md border-white/20 text-white">
            <SelectValue placeholder="Select playlist" />
          </SelectTrigger>
          <SelectContent>
            {mockPlaylists.map((playlist) => (
              <SelectItem key={playlist.id} value={playlist.id}>
                {playlist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentPlaylist && (
          <p className="text-xs text-white/60 mt-1">
            {currentPlaylist.songs.length} songs • {currentPlaylist.dominantMood}
          </p>
        )}
      </div>

      <canvas ref={canvasRef} className="w-full h-full cursor-pointer" onClick={handleCanvasClick} />

      {/* Disabled Overlay */}
      {!hasValidSelection && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20 border-4 border-red-500/50 animate-pulse">
          <div className="text-center space-y-4 px-8">
            <p className="text-white text-lg font-semibold">🎵 Mood Visualizer Disabled</p>
            <p className="text-white/70 text-sm max-w-md">
              Please open a playlist in Spotify from the Playlists tab first, then select a matching category from the
              dropdown above
            </p>
          </div>
        </div>
      )}

      {/* Periodic Reminder */}
      {showReminder && !selectedMood && !showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-fade-in">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20 animate-pulse">
            <p className="text-white/80 text-sm font-medium">Tap to share how you feel 💭</p>
          </div>
        </div>
      )}

      {/* Emotion Selection Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center animate-fade-in z-10">
          <div
            className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/10 max-w-md mx-4 animate-scale-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>

            {/* Stage indicator */}
            <div className="text-center mb-4">
              <div className="flex justify-center gap-2 mb-3">
                {(["before", "during", "after"] as MoodStage[]).map((stage) => (
                  <div
                    key={stage}
                    className={`h-2 w-12 rounded-full transition-all ${
                      currentStage === stage
                        ? "bg-primary"
                        : moodEntries.some((e) => e.stage === stage)
                          ? "bg-primary/50"
                          : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {currentStage === "before" && "Before Journey"}
                {currentStage === "during" && "During Journey"}
                {currentStage === "after" && "After Journey"}
              </p>
            </div>

            <h3 className="text-lg font-medium text-center mb-6 text-foreground">{stagePrompts[currentStage]}</h3>
            <div className="grid grid-cols-4 gap-3">
              {emotions.map((emotion) => (
                <Button
                  key={emotion.id}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:scale-110 transition-all border-2"
                  style={{
                    borderColor: `${emotion.color.replace(")", " / 0.5)")}`,
                  }}
                  onClick={() => handleMoodSelect(emotion.id)}
                >
                  <div className={emotion.animation}>
                    <CustomEmoji type={emotion.id} size={48} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{emotion.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit Prompt */}
      {showSubmitPrompt && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center animate-fade-in z-10">
          <div
            ref={summaryRef}
            className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/10 max-w-md mx-4 animate-scale-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="text-center space-y-4">
              <div className={`flex justify-center mb-4 ${emotions.find((e) => e.id === selectedMood)?.animation}`}>
                <CustomEmoji type={selectedMood || "neutral"} size={64} />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                {emotions.find((e) => e.id === selectedMood)?.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                Category: {localStorage.getItem("selectedPlaylistCategory") || category}
              </p>
              <p className="text-xs text-muted-foreground italic">
                Spotify: {currentSpotifyPlaylist || mockPlaylists.find((p) => p.id === selectedPlaylist)?.name || ""}
              </p>

              {/* Mood journey progress */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Your Journey
                </h4>
                {moodEntries.map((entry) => (
                  <div key={entry.stage} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">{entry.stage}:</span>
                    <span className="flex items-center gap-2">
                      <CustomEmoji type={entry.emotion} size={24} />
                      <span className="text-sm font-medium text-foreground">
                        {emotions.find((e) => e.id === entry.emotion)?.label}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                {currentStage !== "after" ? (
                  <>
                    <Button variant="outline" className="flex-1" onClick={handleClose}>
                      Continue Listening
                    </Button>
                    <Button className="flex-1" onClick={handleContinue}>
                      Next Stage
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" onClick={handleClose}>
                      Close
                    </Button>
                    <Button className="flex-1 gap-2" onClick={() => setShowPhotoCapture(true)}>
                      <Camera className="w-4 h-4" />
                      Add Destination Photo
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation */}
      {showSaveConfirmation && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center animate-fade-in z-20">
          <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/10 max-w-md mx-4 animate-scale-in relative">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-2">
                <Save className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Journey Saved! 🎵</h3>
              <div className={`flex justify-center mb-4 ${emotions.find((e) => e.id === selectedMood)?.animation}`}>
                <CustomEmoji type={selectedMood || "neutral"} size={64} />
              </div>
              <p className="text-sm text-muted-foreground">
                Category: {localStorage.getItem("selectedPlaylistCategory") || category}
              </p>
              <p className="text-xs text-muted-foreground italic">
                Spotify: {currentSpotifyPlaylist || mockPlaylists.find((p) => p.id === selectedPlaylist)?.name || ""}
              </p>

              {/* Mood journey progress */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Your Journey
                </h4>
                {moodEntries.map((entry) => (
                  <div key={entry.stage} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">{entry.stage}:</span>
                    <span className="flex items-center gap-2">
                      <CustomEmoji type={entry.emotion} size={24} />
                      <span className="text-sm font-medium text-foreground">
                        {emotions.find((e) => e.id === entry.emotion)?.label}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Capture Prompt */}
      {showPhotoCapture && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center animate-fade-in z-10">
          <div
            className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/10 max-w-md mx-4 animate-scale-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <Camera className="w-16 h-16 mx-auto text-primary" />
              <h3 className="text-lg font-medium text-foreground">Capture Your Destination</h3>
              <p className="text-sm text-muted-foreground">
                Take a photo of your final location to save with your mood journey
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPhotoCapture(false);
                    handleSaveToJournal();
                  }}
                >
                  Skip
                </Button>
                <Button className="flex-1 gap-2" onClick={handlePhotoCapture}>
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-background/90 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-white/10 animate-fade-in flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">Mood captured</p>
            <CustomEmoji type={selectedMood || "neutral"} size={24} />
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-white/60 text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
        {category === "peaceful" && "🌊 Peaceful"}
        {category === "social" && "✨ Social"}
        {category === "scenic" && "🌄 Scenic"}
      </div>

      {selectedMood && !showOverlay && !showConfirmation && !showSubmitPrompt && !showSaveConfirmation && (
        <div className="absolute top-4 right-4 text-white/80 text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
          <CustomEmoji type={selectedMood} size={20} />
          <span className="text-xs text-white/60 capitalize">{currentStage}</span>
        </div>
      )}
    </div>
  );
};

export default MoodVisualizer;
