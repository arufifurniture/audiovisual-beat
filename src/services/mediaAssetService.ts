import { VisualTrack, VisualType } from '../types/project';

/**
 * High-performance Media Asset Service
 * Handles native File/Blob object URLs, metadata extraction,
 * offscreen video frame capture for lightweight thumbnails, and memory lifecycle management.
 */

export function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export class MediaAssetService {
  // Global file registry keeping actual File objects for high-speed FFmpeg export
  public static fileRegistry = new Map<string, File>();

  public static registerFile(id: string, file: File) {
    this.fileRegistry.set(id, file);
  }

  public static getFile(id: string): File | undefined {
    return this.fileRegistry.get(id);
  }

  public static async getFileOrBlob(track: { id: string; url?: string; name: string }): Promise<File | null> {
    if (this.fileRegistry.has(track.id)) {
      return this.fileRegistry.get(track.id)!;
    }
    if (track.url) {
      try {
        const res = await fetch(track.url);
        const blob = await res.blob();
        const mimeType = blob.type || 'application/octet-stream';
        const file = new File([blob], track.name, { type: mimeType });
        this.fileRegistry.set(track.id, file);
        return file;
      } catch (err) {
        console.warn('Failed to fetch blob for track:', track.id, err);
      }
    }
    return null;
  }

  // Video element cache for seamless canvas playback without reloading
  private videoCache = new Map<string, HTMLVideoElement>();
  // Image element cache for instant canvas rendering
  private imageCache = new Map<string, HTMLImageElement>();

  /**
   * Process a dropped or selected File into a VisualTrack with real metadata
   */
  public async processVisualFile(file: File, index = 0): Promise<VisualTrack> {
    const isVideo =
      file.type.startsWith('video/') ||
      /\.(mp4|mov|webm|m4v|mkv|avi)$/i.test(file.name);
    const type: VisualType = isVideo ? 'video' : 'image';
    const id = `visual-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
    const url = URL.createObjectURL(file);

    MediaAssetService.registerFile(id, file);

    if (type === 'image') {
      return new Promise<VisualTrack>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const width = img.naturalWidth || 1920;
          const height = img.naturalHeight || 1080;
          const duration = 15; // Standard 15s display slot for images in a visual sequence
          const res = `${width}x${height}`;
          const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG';

          resolve({
            id,
            name: file.name,
            type: 'image',
            info: `${res} • ${ext} • ${formatTimecode(duration)}`,
            duration,
            url,
            thumbnailUrl: url, // Image object URL serves directly as thumbnail
            resolution: res,
            fps: 60,
            opacity: 100,
            scale: 1.0,
            rotation: 0,
            blendMode: 'Normal',
            anchor: 'CTR',
            isVisible: true,
            isMuted: true,
            chromaKey: false,
          });
        };

        img.onerror = () => {
          // Fallback if image load fails
          resolve({
            id,
            name: file.name,
            type: 'image',
            info: 'Image • 1080p',
            duration: 15,
            url,
            thumbnailUrl: url,
            resolution: '1920x1080',
            fps: 60,
            opacity: 100,
            scale: 1.0,
            rotation: 0,
            blendMode: 'Normal',
            anchor: 'CTR',
            isVisible: true,
            isMuted: true,
            chromaKey: false,
          });
        };

        img.src = url;
      });
    }

    // Video processing: read duration, dimensions, and extract frame 0.1s
    return new Promise<VisualTrack>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        video.removeAttribute('src');
        video.load();
      };

      const handleSuccess = (thumbnailUrl?: string) => {
        const duration = Math.max(1, Math.round(video.duration || 10));
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const res = `${width}x${height}`;
        const ext = file.name.split('.').pop()?.toUpperCase() || 'MP4';

        cleanup();

        resolve({
          id,
          name: file.name,
          type: 'video',
          info: `${res} • ${ext} • ${formatTimecode(duration)}`,
          duration,
          url,
          thumbnailUrl,
          resolution: res,
          fps: 60,
          opacity: 100,
          scale: 1.0,
          rotation: 0,
          blendMode: 'Normal',
          anchor: 'CTR',
          isVisible: true,
          isMuted: false,
          chromaKey: false,
        });
      };

      video.onloadedmetadata = () => {
        // Seek to 0.1s to capture an initial frame thumbnail
        const seekTarget = Math.min(0.2, (video.duration || 1) / 4);
        video.currentTime = seekTarget;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetW = 140;
          const aspect = (video.videoHeight || 9) / (video.videoWidth || 16);
          canvas.width = targetW;
          canvas.height = Math.round(targetW * aspect) || 78;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumb = canvas.toDataURL('image/jpeg', 0.75);
            handleSuccess(thumb);
            return;
          }
        } catch (_) {}
        handleSuccess();
      };

      video.onerror = () => {
        cleanup();
        resolve({
          id,
          name: file.name,
          type: 'video',
          info: '1080p • MP4 • 00:20',
          duration: 20,
          url,
          resolution: '1920x1080',
          fps: 60,
          opacity: 100,
          scale: 1.0,
          rotation: 0,
          blendMode: 'Normal',
          anchor: 'CTR',
          isVisible: true,
          isMuted: false,
          chromaKey: false,
        });
      };

      video.src = url;
    });
  }

  /**
   * Retrieves or initializes an HTMLVideoElement ready for canvas rendering
   */
  public getVideoElement(url: string): HTMLVideoElement {
    let video = this.videoCache.get(url);
    if (!video) {
      video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      video.muted = true; // Crucial for auto-playback in canvas
      video.loop = true;
      video.playsInline = true;
      this.videoCache.set(url, video);
    }
    return video;
  }

  /**
   * Retrieves or initializes an HTMLImageElement for canvas rendering
   */
  public getImageElement(url: string): HTMLImageElement {
    let img = this.imageCache.get(url);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      this.imageCache.set(url, img);
    }
    return img;
  }

  /**
   * Revoke object URLs and free memory for a track
   */
  public revokeTrack(track: VisualTrack) {
    if (track.url) {
      const video = this.videoCache.get(track.url);
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        this.videoCache.delete(track.url);
      }

      this.imageCache.delete(track.url);

      if (track.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(track.url);
        } catch (_) {}
      }
    }

    if (track.thumbnailUrl && track.thumbnailUrl.startsWith('blob:') && track.thumbnailUrl !== track.url) {
      try {
        URL.revokeObjectURL(track.thumbnailUrl);
      } catch (_) {}
    }
  }

  /**
   * Cleanup all tracks on reset or unmount
   */
  public revokeAllTracks(tracks: VisualTrack[]) {
    tracks.forEach((t) => this.revokeTrack(t));
  }
}

export const mediaAssetService = new MediaAssetService();
