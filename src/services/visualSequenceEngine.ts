import { VisualTrack } from '../types/project';

export interface VisualSequenceFrame {
  track: VisualTrack;
  trackIndex: number;
  localTime: number; // In seconds into this track
  trackDuration: number;
  cycleIndex: number;
  progress: number; // 0 to 1
}

export class VisualSequenceEngine {
  /**
   * Resolves the exact active visual track and its local playback offset
   * at any given timestamp on the master audio timeline.
   * Seamlessly loops visual tracks across the entire audio duration without gaps or black frames.
   */
  public static getActiveFrame(
    visualTracks: VisualTrack[],
    currentTime: number,
    selectedTrackId?: string | null
  ): VisualSequenceFrame | null {
    const visibleTracks = visualTracks.filter((t) => t.isVisible);
    if (visibleTracks.length === 0) return null;

    // If user has actively selected a track in the visual shelf, prioritize previewing it
    if (selectedTrackId) {
      const selected = visibleTracks.find((t) => t.id === selectedTrackId);
      if (selected) {
        const dur = Math.max(1, selected.duration || 10);
        const localTime = currentTime % dur;
        return {
          track: selected,
          trackIndex: visibleTracks.indexOf(selected),
          localTime,
          trackDuration: dur,
          cycleIndex: 0,
          progress: localTime / dur,
        };
      }
    }

    // Master Timeline Visual Sequence calculation
    const totalVisualDuration = visibleTracks.reduce(
      (sum, t) => sum + Math.max(1, t.duration || 10),
      0
    );

    if (totalVisualDuration <= 0) {
      const track = visibleTracks[0];
      return {
        track,
        trackIndex: 0,
        localTime: 0,
        trackDuration: track.duration || 10,
        cycleIndex: 0,
        progress: 0,
      };
    }

    // Wrap currentTime into total visual cycle (seamless loop)
    const cycleIndex = Math.floor(currentTime / totalVisualDuration);
    const timeInCycle = Math.max(0, currentTime % totalVisualDuration);

    let accumulated = 0;
    for (let i = 0; i < visibleTracks.length; i++) {
      const track = visibleTracks[i];
      const dur = Math.max(1, track.duration || 10);
      if (
        timeInCycle >= accumulated &&
        (timeInCycle < accumulated + dur || i === visibleTracks.length - 1)
      ) {
        const localTime = Math.max(0, timeInCycle - accumulated);
        return {
          track,
          trackIndex: i,
          localTime,
          trackDuration: dur,
          cycleIndex,
          progress: Math.min(1, localTime / dur),
        };
      }
      accumulated += dur;
    }

    // Fallback to first track
    const fallback = visibleTracks[0];
    return {
      track: fallback,
      trackIndex: 0,
      localTime: 0,
      trackDuration: fallback.duration || 10,
      cycleIndex: 0,
      progress: 0,
    };
  }
}
