import { ProjectState } from '../types/project';

export interface FFmpegCommandResult {
  command: string;
  args: string[];
  filterComplex: string;
  notes: string[];
}

export class FFmpegService {
  /**
   * Generates exact, copy-pasteable production-grade FFmpeg command based on project settings.
   */
  public static generateCommand(project: ProjectState): FFmpegCommandResult {
    const { outputSettings, audioTracks, visualTracks, intros, logos, beatSync } = project;

    const [width, height] = outputSettings.resolution.split('x').map(Number);
    const fps = outputSettings.fps;
    const notes: string[] = [];

    // Hardware encoder selection
    let videoEncoder = 'libx264';
    let encoderArgs: string[] = ['-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p'];

    if (outputSettings.hardwareAcceleration.includes('VideoToolbox')) {
      if (outputSettings.codec.includes('ProRes')) {
        videoEncoder = 'prores_videotoolbox';
        encoderArgs = ['-profile:v', '2', '-pix_fmt', 'yuv422p10le'];
        notes.push('Using macOS Apple Silicon VideoToolbox ProRes 422 hardware pipeline.');
      } else if (outputSettings.codec.includes('HEVC')) {
        videoEncoder = 'hevc_videotoolbox';
        encoderArgs = ['-b:v', '12M', '-tag:v', 'hvc1'];
        notes.push('Using macOS Apple Silicon VideoToolbox HEVC hardware acceleration.');
      } else {
        videoEncoder = 'h264_videotoolbox';
        encoderArgs = ['-b:v', '8M'];
        notes.push('Using macOS Apple Silicon VideoToolbox H.264 hardware acceleration.');
      }
    } else if (outputSettings.hardwareAcceleration.includes('NVENC')) {
      videoEncoder = 'h264_nvenc';
      encoderArgs = ['-preset', 'p6', '-cq', '19', '-pix_fmt', 'yuv420p'];
      notes.push('Using NVIDIA NVENC hardware encoder.');
    } else if (outputSettings.hardwareAcceleration.includes('QSV')) {
      videoEncoder = 'h264_qsv';
      encoderArgs = ['-preset', 'medium', '-global_quality', '20'];
      notes.push('Using Intel QuickSync Video (QSV) hardware encoder.');
    } else {
      notes.push('Using high-performance CPU software encoder (libx264).');
    }

    // Build filter_complex
    const filters: string[] = [];
    
    // Visual loops & scaling
    if (visualTracks.length > 0) {
      filters.push(`[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1[base_v]`);
    } else {
      filters.push(`color=c=black:s=${width}x${height}:r=${fps}:d=${project.totalDuration}[base_v]`);
    }

    let currentVideoNode = '[base_v]';

    // Beat effect: Vignette & Color Pulse if active
    if (beatSync.active && beatSync.effects.vignette) {
      filters.push(`${currentVideoNode}vignette=PI/4[v_vig]`);
      currentVideoNode = '[v_vig]';
    }

    // Intro Text Overlay
    intros.forEach((intro, idx) => {
      if (intro.isVisible && intro.text.trim()) {
        const escapedText = intro.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
        const start = intro.startTime.toFixed(2);
        const end = (intro.startTime + intro.duration).toFixed(2);
        const outNode = `[v_intro_${idx}]`;
        filters.push(
          `${currentVideoNode}drawtext=text='${escapedText}':font='${intro.font}':fontsize=${intro.fontSize * 1.5}:fontcolor=${intro.color}@${intro.opacity / 100}:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${start},${end})'${outNode}`
        );
        currentVideoNode = outNode;
      }
    });

    // Logo Overlay
    logos.forEach((logo, idx) => {
      if (logo.isVisible) {
        const outNode = `[v_logo_${idx}]`;
        const xPos = logo.anchor.includes('L') ? '30' : logo.anchor.includes('R') ? 'W-w-30' : '(W-w)/2';
        const yPos = logo.anchor.includes('T') ? '30' : logo.anchor.includes('B') ? 'H-h-30' : '(H-h)/2';
        filters.push(
          `${currentVideoNode}[logo_${idx}]overlay=x=${xPos}:y=${yPos}:enable='between(t,${logo.startTime},${logo.startTime + logo.duration})'${outNode}`
        );
        currentVideoNode = outNode;
      }
    });

    const filterComplexStr = filters.join('; ');

    const args: string[] = [
      '-y',
      '-threads', '0',
      '-filter_complex', filterComplexStr,
      '-map', currentVideoNode,
      '-map', '0:a?',
      '-c:v', videoEncoder,
      ...encoderArgs,
      '-c:a', 'aac',
      '-b:a', '320k',
      '-r', fps.toString(),
      `${outputSettings.destination}/${outputSettings.filename}.mp4`
    ];

    const command = `ffmpeg ${args.map(a => a.includes(' ') || a.includes(';') ? `"${a}"` : a).join(' ')}`;

    return {
      command,
      args,
      filterComplex: filterComplexStr,
      notes
    };
  }
}
