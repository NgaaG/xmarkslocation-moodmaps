import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Image, Video, Pencil, Download, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import FilterBar from "./FilterBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

interface JournalViewProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

interface JournalCard {
  id: string;
  locationTitle?: string;
  playlistName?: string;
  playlistCategoryName?: string;
  spotifyPlaylistName?: string;
  category: string;
  moodEntries: Array<{
    stage: string;
    emotion: string;
    timestamp: string;
  }>;
  timestamp: string;
  summaryImage?: string;
  destinationPhoto?: string;
  summaryData?: {
    before?: { stage: string; emotion: string; timestamp: Date };
    during?: { stage: string; emotion: string; timestamp: Date };
    after?: { stage: string; emotion: string; timestamp: Date };
  };
}

const JournalView = ({ selectedCategory, onCategoryChange }: JournalViewProps) => {
  const { toast } = useToast();
  const [journalCards, setJournalCards] = useState<JournalCard[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<JournalCard | null>(null);
  const [editForm, setEditForm] = useState({
    locationTitle: "",
    playlistCategoryName: "",
    spotifyPlaylistName: "",
  });

  // Load journal cards from localStorage
  useEffect(() => {
    const loadJournalCards = () => {
      const entries = JSON.parse(localStorage.getItem("moodJournalEntries") || "[]");
      setJournalCards(entries);
    };

    loadJournalCards();

    // Listen for new journal entries
    const handleStorageChange = () => {
      loadJournalCards();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handlePhotoUpload = (cardId: string, useCamera: boolean = false) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    // Enable camera on mobile devices
    if (useCamera) {
      input.setAttribute("capture", "environment");
    }
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;

          // Update the card with the destination photo
          const updatedCards = journalCards.map((card) =>
            card.id === cardId ? { ...card, destinationPhoto: imageData } : card,
          );

          setJournalCards(updatedCards);
          localStorage.setItem("moodJournalEntries", JSON.stringify(updatedCards));

          toast({
            title: "Destination photo added! 📸",
            description: "Your destination photo has been saved",
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleDownloadImage = async (card: JournalCard) => {
    if (!card.summaryImage) return;

    toast({
      title: "Processing...",
      description: "Uploading images to cloud storage",
    });

    let destinationPhotoUrl: string | null = null;
    let summaryImageUrl: string | null = null;
    let combinedImageUrl: string | null = null;

    // Helper function to upload base64 image to Supabase storage
    const uploadBase64ToStorage = async (base64: string, prefix: string): Promise<string | null> => {
      try {
        // Convert base64 to blob
        const response = await fetch(base64);
        const blob = await response.blob();
        
        const fileName = `${prefix}-${card.id}-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("journey-images")
          .upload(fileName, blob, { contentType: "image/png", upsert: true });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("journey-images")
            .getPublicUrl(fileName);
          console.log(`[Supabase] ${prefix} uploaded:`, urlData.publicUrl);
          return urlData.publicUrl;
        } else {
          console.warn(`[Supabase] ${prefix} upload failed:`, uploadError);
          return null;
        }
      } catch (err) {
        console.warn(`[Supabase] ${prefix} upload error:`, err);
        return null;
      }
    };

    // Upload summary_image to storage
    summaryImageUrl = await uploadBase64ToStorage(card.summaryImage, "summary");

    // Upload destination_photo to storage (if exists)
    if (card.destinationPhoto) {
      destinationPhotoUrl = await uploadBase64ToStorage(card.destinationPhoto, "destination");
    }

    // If there's a destination photo, create a vertical collage
    if (card.destinationPhoto) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load both images
      const destImg = document.createElement("img");
      const summaryImg = document.createElement("img");

      await Promise.all([
        new Promise<void>((resolve) => {
          destImg.onload = () => resolve();
          destImg.src = card.destinationPhoto!;
        }),
        new Promise<void>((resolve) => {
          summaryImg.onload = () => resolve();
          summaryImg.src = card.summaryImage!;
        }),
      ]);

      // Calculate optimal dimensions - fit both images at full width
      const maxWidth = 1200; // Max width for good quality
      const padding = 60;
      const gap = 40;

      // Scale summary image to fit max width
      const summaryScale = Math.min(1, maxWidth / summaryImg.width);
      const summaryWidth = summaryImg.width * summaryScale;
      const summaryHeight = summaryImg.height * summaryScale;

      // Scale destination image to match summary width
      const destScale = summaryWidth / destImg.width;
      const destWidth = destImg.width * destScale;
      const destHeight = destImg.height * destScale;

      // Mobile quality enhancement - use device pixel ratio for retina displays
      const scale = Math.min(window.devicePixelRatio || 2, 3); // Cap at 3x for performance
      
      // Set canvas size with pixel ratio scaling
      const canvasLogicalWidth = summaryWidth + padding * 2;
      const canvasLogicalHeight = summaryHeight + destHeight + gap + padding * 2;
      
      canvas.width = canvasLogicalWidth * scale;
      canvas.height = canvasLogicalHeight * scale;
      
      // Scale context for high DPI rendering
      ctx.scale(scale, scale);

      // Enable high-quality rendering with full opacity
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.globalAlpha = 1.0; // Ensure 100% opacity

      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasLogicalWidth, canvasLogicalHeight);

      // Draw summary on top (centered horizontally)
      const summaryX = padding;
      const summaryY = padding;
      ctx.drawImage(summaryImg, summaryX, summaryY, summaryWidth, summaryHeight);

      // Draw destination photo below (centered horizontally, same width)
      const destX = padding;
      const destY = summaryY + summaryHeight + gap;
      ctx.drawImage(destImg, destX, destY, destWidth, destHeight);

      // Add metadata text overlay at the bottom
      const textPadding = 20;
      const textHeight = 100;
      const textY = canvasLogicalHeight - textHeight - padding;

      // Semi-transparent background for text
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(padding, textY, summaryWidth, textHeight);

      // Configure text rendering
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Location title (larger font)
      ctx.font = "bold 28px Inter, system-ui, sans-serif";
      ctx.fillText(card.locationTitle || "Unknown Location", padding + textPadding, textY + textPadding);

      // Playlist category (medium font)
      ctx.font = "20px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#DDDDDD";
      ctx.fillText(card.playlistCategoryName || card.category, padding + textPadding, textY + textPadding + 36);

      // Spotify playlist name (medium font, italic)
      ctx.font = "italic 18px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#CCCCCC";
      ctx.fillText(
        (card.spotifyPlaylistName || "No playlist") + " - Spotify",
        padding + textPadding,
        textY + textPadding + 64,
      );

      // Convert canvas to blob for upload
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png", 1.0)
      );

      // Upload combined image to Supabase Storage
      const fileName = `combined-${card.id}-${Date.now()}.png`;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("journey-images")
          .upload(fileName, blob, { contentType: "image/png", upsert: true });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("journey-images")
            .getPublicUrl(fileName);
          combinedImageUrl = urlData.publicUrl;
          console.log("[Supabase] Combined image uploaded:", combinedImageUrl);
        } else {
          console.warn("[Supabase] Combined upload failed:", uploadError);
        }
      } catch (err) {
        console.log("[Supabase] Combined upload unavailable:", err);
      }

      // Download combined image with maximum quality
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png", 1.0);
      link.download = `${card.playlistName || "journey"}-complete.png`;
      link.click();

      toast({
        title: "Downloaded! 💾",
        description: "Complete journey with destination photo saved",
      });
    } else {
      // Download just the summary image
      const link = document.createElement("a");
      link.href = card.summaryImage;
      link.download = `${card.playlistName || "journey"}.png`;
      link.click();

      toast({
        title: "Downloaded! 💾",
        description: "Journey saved to your device",
      });
    }

    // Update database with all image URLs
    try {
      const updateData: Record<string, string | null> = {};
      if (summaryImageUrl) updateData.summary_image = summaryImageUrl;
      if (destinationPhotoUrl) updateData.destination_photo = destinationPhotoUrl;
      if (combinedImageUrl) updateData.combined_image_url = combinedImageUrl;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("journal_entries")
          .update(updateData)
          .eq("id", card.id);

        if (error) {
          console.warn("[Supabase] Database update failed:", error);
        } else {
          console.log("[Supabase] All image URLs saved to database:", updateData);
        }
      }
    } catch (err) {
      console.log("[Supabase] Database update unavailable:", err);
    }
  };

  const handleEditCard = (card: JournalCard) => {
    setEditingCard(card);
    setEditForm({
      locationTitle: card.locationTitle || "",
      playlistCategoryName: card.playlistCategoryName || "",
      spotifyPlaylistName: card.spotifyPlaylistName || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;

    const updatedCards = journalCards.map((card) =>
      card.id === editingCard.id
        ? {
            ...card,
            locationTitle: editForm.locationTitle,
            playlistCategoryName: editForm.playlistCategoryName,
            spotifyPlaylistName: editForm.spotifyPlaylistName,
          }
        : card,
    );

    setJournalCards(updatedCards);
    localStorage.setItem("moodJournalEntries", JSON.stringify(updatedCards));
    console.log('[JournalView] Card edited:', editingCard.id);
    
    // Sync to Supabase
    try {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          location_title: editForm.locationTitle,
          playlist_category_name: editForm.playlistCategoryName,
          spotify_playlist_name: editForm.spotifyPlaylistName,
        })
        .eq("id", editingCard.id);

      if (error) {
        console.warn('[Supabase] Update failed:', error);
      } else {
        console.log('[Supabase] Card updated successfully');
      }
    } catch (err) {
      console.log('[Supabase] Update unavailable:', err);
    }

  // ✅ STEP 4: Show feedback to user
  toast({
    title: "Updated! ✏️",
    description: "Journey details updated",
  });

    setEditingCard(null);
  };

  const filteredCards = selectedCategory
    ? journalCards.filter((card) => card.category === selectedCategory)
    : journalCards;

  return (
    <div className="h-full w-full overflow-y-auto">
      {/* Filter Bar */}
      <div className="sticky top-0 z-20">
        <FilterBar selectedCategory={selectedCategory} onCategoryChange={onCategoryChange} />
      </div>

      {/* Journal Grid */}
      <div className="container mx-auto p-4 md:p-6">
        {/* Add Card Button */}
        <div className="mb-6">
          <Button className="rounded-lg px-6 py-3 min-h-[44px]">
            <Plus className="w-5 h-5 mr-2" />
            Add Journal Card
          </Button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="group overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200"
            >
              {/* Card Image */}
              <div className="relative aspect-video overflow-hidden bg-muted">
                {card.summaryImage ? (
                  <img
                    src={card.summaryImage}
                    alt={card.playlistName || "Journey"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <div className="text-center space-y-2">
                      <Image className="w-12 h-12 mx-auto text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">No photo yet</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3">
                <div className="space-y-1 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 h-8 w-8"
                    onClick={() => {
                      handleEditCard(card);
                      window.dispatchEvent(new CustomEvent("tutorial-journal-edit"));
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <h3 className="text-base font-medium pr-8">{card.locationTitle || "Unknown Location"}</h3>
                  <p className="text-sm text-muted-foreground">{card.playlistCategoryName || card.category}</p>
                  {card.spotifyPlaylistName && (
                    <p className="text-xs text-muted-foreground italic">{card.spotifyPlaylistName} - Spotify</p>
                  )}

                  {/* Mood Entries Summary */}
                  <div className="space-y-1 pt-2">
                    {card.moodEntries.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground capitalize">{entry.stage}:</span>
                        <span className="capitalize font-medium">{entry.emotion}</span>
                      </div>
                    ))}
                  </div>

                  {/* Destination Photo Gallery */}
                  {card.destinationPhoto && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Destination Photo</p>
                      <div className="w-full h-32 rounded-md overflow-hidden border border-border">
                        <img
                          src={card.destinationPhoto}
                          alt="Destination"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(card.destinationPhoto!)}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground pt-2">
                    {new Date(card.timestamp).toLocaleDateString()} • {card.moodEntries.length} emotions •{" "}
                    <span className="font-medium capitalize">
                      {card.category === "peaceful" && "🌊 Peaceful"}
                      {card.category === "social" && "✨ Social"}
                      {card.category === "scenic" && "🌄 Scenic"}
                    </span>
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => {
                      if (card.summaryImage) {
                        setSelectedImage(card.summaryImage);
                        setSelectedCardId(card.id);
                      }
                      window.dispatchEvent(new CustomEvent("tutorial-journal-edit"));
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Entry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => {
                      handlePhotoUpload(card.id, false);
                      window.dispatchEvent(new CustomEvent("tutorial-journal-edit"));
                    }}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" disabled>
                    <Video className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" disabled>
                    <Pencil className="w-4 h-4 mr-2" />
                    Draw
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Empty state placeholder cards */}
          {[...Array(Math.max(1, 6 - filteredCards.length))].map((_, i) => (
            <Card
              key={`placeholder-${i}`}
              className="border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer min-h-[300px] flex items-center justify-center"
            >
              <div className="text-center space-y-2 p-6">
                <Plus className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Create a new journal card</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0" aria-describedby="image-viewer-description">
          <DialogHeader className="sr-only">
            <DialogTitle>View Journey Image</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImage && (
              <>
                <img src={selectedImage} alt="Journey summary" className="w-full h-auto" />
                <div className="absolute bottom-4 right-4">
                  <Button
                    onClick={() => {
                      const card = journalCards.find((c) => c.id === selectedCardId);
                      if (card) {
                        handleDownloadImage(card);
                      }
                    }}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={editingCard !== null} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Journey Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="locationTitle">Location</Label>
              <Input
                id="locationTitle"
                value={editForm.locationTitle}
                onChange={(e) => setEditForm({ ...editForm, locationTitle: e.target.value })}
                placeholder="Location name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playlistCategoryName">Playlist Category</Label>
              <Input
                id="playlistCategoryName"
                value={editForm.playlistCategoryName}
                onChange={(e) => setEditForm({ ...editForm, playlistCategoryName: e.target.value })}
                placeholder="e.g., Coffeeshop Vibes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spotifyPlaylistName">
                Chosen Spotify Playlist LINK (on Spotify app click share playlist & copy){" "}
              </Label>
              <Input
                id="spotifyPlaylistName"
                value={editForm.spotifyPlaylistName}
                onChange={(e) => setEditForm({ ...editForm, spotifyPlaylistName: e.target.value })}
                placeholder="e.g., Guilty Pleasures"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setEditingCard(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JournalView;
