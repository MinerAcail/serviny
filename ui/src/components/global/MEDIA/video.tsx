"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Maximize, Minimize, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  thumbnail: string;
}

export function VideoPlayer({ src, thumbnail }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Progress update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  // Seek
  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = (value[0] / 100) * videoRef.current.duration;
  };

  // Volume control
  const handleVolume = (value: number[]) => {
    if (!videoRef.current) return;
    const vol = value[0];
    setVolume(vol);
    videoRef.current.volume = vol;
  };

  // Playback speed
  const changeSpeed = (rate: number) => {
    if (!videoRef.current) return;
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current?.parentElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Events
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handleLoaded = () => setIsReady(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) video.play().catch(() => {});
    };

    const handleSeeking = () => setIsLoading(true);
    const handleSeeked = () => setIsLoading(false);

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("loadeddata", handleLoaded);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("canplaythrough", handleCanPlay);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("canplaythrough", handleCanPlay);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [isPlaying]);

  // Fullscreen state tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden",
        "backdrop-blur-md bg-white/10 border border-white/20 shadow-lg"
      )}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full object-cover"
        preload="metadata"
      />

      {/* Thumbnail Overlay */}
      {showThumbnail && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
          onClick={() => {
            setShowThumbnail(false);
            videoRef.current?.play();
            setIsPlaying(true);
          }}
        >
          <img
            src={thumbnail}
            alt="Video thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <Button
            size="lg"
            className="z-10 rounded-full bg-white/80 hover:bg-white"
          >
            <Play className="w-8 h-8 text-black" />
          </Button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
      )}

      {/* Controls */}
      {isReady && !showThumbnail && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePlay}
              className="text-white"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>

            {/* Progress Bar */}
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="flex-1"
            />

            {/* Volume */}
            <Slider
              value={[volume]}
              onValueChange={handleVolume}
              max={1}
              step={0.05}
              className="w-24"
            />

            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => changeSpeed(Number(e.target.value))}
              className="bg-black/40 text-white rounded-md p-1"
            >
              {[0.5, 1, 1.5, 2].map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>

            {/* Fullscreen / Minimize */}
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white"
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6" />
              ) : (
                <Maximize className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
