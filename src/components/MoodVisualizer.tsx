import { useEffect, useRef, useState } from "react";
import { SpotCategory } from "@/data/spots";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPlaylists } from "@/data/mockData";
import { X, Save, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CustomEmoji from "./CustomEmoji";
import html2canvas from "html2canvas";

// (Insert your emotion array, stagePrompts, and other top-level code HERE.)

const MoodVisualizer = ({ category, isPlaying = true }) => {
  // (Insert all your relevant hooks, useEffects, and handler functions above...)

  // --- ONLY THIS FUNCTION HAS BEEN CHANGED ---
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

    // --- IMPORTANT, THE ONLY REMOTE SYNC NOW: ---
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
    // --- NO GOOGLE SCRIPTS USED HERE! ---

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

  // (All other internal visualizer code and JSX remains unchanged!)
};

export default MoodVisualizer;
