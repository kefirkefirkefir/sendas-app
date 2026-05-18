"use client";

import { useRef, useCallback } from "react";
import { useGameStore } from "@/lib/game-store";
import { getAudioEngine } from "@/lib/audio-engine";
import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useModeColors } from "@/hooks/use-mode-colors";

export default function AudioControls() {
  const { audioEnabled, toggleAudio, currentMode } = useGameStore();
  const mc = useModeColors();
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(async () => {
    const engine = getAudioEngine();

    if (!audioEnabled) {
      // Turning ON: init and unmute directly in the click handler
      if (!engine.initialized) {
        await engine.init();
      }
      engine.setMode(currentMode);
      engine.setVolume(volume);
      engine.setMuted(false);
    } else {
      // Turning OFF: mute directly
      if (engine.initialized) {
        engine.setMuted(true);
      }
    }

    // Update store state AFTER audio control
    toggleAudio();
  }, [audioEnabled, currentMode, volume, toggleAudio]);

  const handleVolumeChange = useCallback(
    (newVol: number) => {
      setVolume(newVol);
      const engine = getAudioEngine();
      if (engine.initialized && audioEnabled) {
        engine.setVolume(newVol);
      }
    },
    [audioEnabled]
  );

  const handleMouseEnter = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setShowSlider(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Small delay to prevent flickering when moving to slider
    hideTimerRef.current = setTimeout(() => {
      setShowSlider(false);
    }, 200);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-2 py-1 rounded border text-[#6b8a6b] transition-all font-mono text-[10px] cursor-pointer"
        data-tooltip="Sonido"
        style={{ borderColor: `rgba(${mc.accentRgb},0.15)` }}
        onMouseEnter={(e) => { e.currentTarget.style.color = mc.accent; e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.3)`; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.15)`; }}
      >
        {audioEnabled ? (
          <Volume2 className="w-3.5 h-3.5" style={{ color: mc.accent }} />
        ) : (
          <VolumeX className="w-3.5 h-3.5" />
        )}
      </button>

      {showSlider && audioEnabled && (
        <div className="absolute top-full right-0 mt-1 p-2 xfiles-card rounded z-50">
          <input
            type="range"
            min={0}
            max={100}
            value={volume * 100}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
            className="w-24 h-1.5 appearance-none rounded-full bg-[rgba(0,0,0,0.4)] cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--mode-accent)] [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(var(--mode-accent-rgb),0.5)]
              [&::-webkit-slider-thumb]:cursor-pointer"
            />
          <div className="font-mono text-[9px] text-[#6b8a6b] text-center mt-1">
            Volumen: {Math.round(volume * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
