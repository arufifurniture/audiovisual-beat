import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import multer from 'multer';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Temp storage for render jobs
const TEMP_DIR = path.join(os.tmpdir(), 'auvibeat_render');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Multer upload handler for media assets - using upload.any() to prevent field errors
const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: 2048 * 1024 * 1024 }, // 2GB
});

// Job tracking map
export interface RenderJob {
  id: string;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  speed: string;
  elapsedSeconds: number;
  remainingSeconds: number;
  status: 'idle' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  outputFilePath?: string;
  outputFilename?: string;
  resolution?: string;
  durationFormatted?: string;
  fileSizeFormatted?: string;
  renderTimeFormatted?: string;
  renderSpeed?: string;
  downloadUrl?: string;
}

const renderJobs = new Map<string, RenderJob>();

function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Resolve user desktop directory safely
function resolveTargetFolder(folderNameOrPath: string): string {
  const home = os.homedir();
  if (!folderNameOrPath || folderNameOrPath === 'Downloads') {
    const dl = path.join(home, 'Downloads');
    if (fs.existsSync(dl)) return dl;
    return home;
  }
  if (folderNameOrPath === 'Movies' || folderNameOrPath === 'Videos') {
    const movies = path.join(home, 'Movies');
    if (fs.existsSync(movies)) return movies;
    const vids = path.join(home, 'Videos');
    if (fs.existsSync(vids)) return vids;
    return path.join(home, 'Downloads');
  }
  if (folderNameOrPath === 'Desktop') {
    const dt = path.join(home, 'Desktop');
    if (fs.existsSync(dt)) return dt;
    return path.join(home, 'Downloads');
  }
  if (folderNameOrPath === 'Documents') {
    const doc = path.join(home, 'Documents');
    if (fs.existsSync(doc)) return doc;
    return path.join(home, 'Downloads');
  }

  // If path starts with ~, expand to homedir
  let resolved = folderNameOrPath;
  if (resolved.startsWith('~/')) {
    resolved = path.join(home, resolved.slice(2));
  } else if (!path.isAbsolute(resolved)) {
    resolved = path.join(home, resolved);
  }

  if (!fs.existsSync(resolved)) {
    try {
      fs.mkdirSync(resolved, { recursive: true });
    } catch {
      return path.join(home, 'Downloads');
    }
  }

  return resolved;
}

// Sanitize filename & calculate unique collision-free filename
function getUniqueFilename(targetDir: string, rawFilename: string): string {
  // Sanitize illegal filesystem characters
  const clean = rawFilename
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/\.mp4$/i, '');
  const baseName = clean || 'Project_Master';

  let candidate = `${baseName}.mp4`;
  let counter = 1;

  while (fs.existsSync(path.join(targetDir, candidate))) {
    candidate = `${baseName} (${counter}).mp4`;
    counter++;
  }

  return candidate;
}

// ==========================================
// 1. Filesystem & System Info APIs
// ==========================================

app.get('/api/filesystem/system-info', (req, res) => {
  const home = os.homedir();
  const downloads = path.join(home, 'Downloads');
  const movies = path.join(home, 'Movies');
  const videos = path.join(home, 'Videos');
  const desktop = path.join(home, 'Desktop');
  const documents = path.join(home, 'Documents');

  res.json({
    platform: process.platform,
    home,
    defaultFolders: [
      { name: 'Downloads', path: fs.existsSync(downloads) ? downloads : home },
      { name: 'Movies / Videos', path: fs.existsSync(movies) ? movies : fs.existsSync(videos) ? videos : home },
      { name: 'Desktop', path: fs.existsSync(desktop) ? desktop : home },
      { name: 'Documents', path: fs.existsSync(documents) ? documents : home },
    ],
  });
});

app.post('/api/filesystem/list-folders', (req, res) => {
  try {
    const rawPath = req.body.currentPath || path.join(os.homedir(), 'Downloads');
    const targetDir = resolveTargetFolder(rawPath);

    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Folder does not exist', path: targetDir });
    }

    const items = fs.readdirSync(targetDir, { withFileTypes: true });
    const subfolders = items
      .filter((item) => item.isDirectory() && !item.name.startsWith('.'))
      .map((item) => {
        const full = path.join(targetDir, item.name);
        let isWritable = true;
        try {
          fs.accessSync(full, fs.constants.W_OK);
        } catch {
          isWritable = false;
        }
        return {
          name: item.name,
          path: full,
          isWritable,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Check targetDir writability
    let targetWritable = true;
    try {
      fs.accessSync(targetDir, fs.constants.W_OK);
    } catch {
      targetWritable = false;
    }

    res.json({
      currentPath: targetDir,
      parentPath: path.dirname(targetDir),
      isWritable: targetWritable,
      subfolders,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/filesystem/check-collision', (req, res) => {
  const { folderPath, baseFilename } = req.body;
  const targetDir = resolveTargetFolder(folderPath || 'Downloads');
  const uniqueName = getUniqueFilename(targetDir, baseFilename || 'Project');
  res.json({
    folderPath: targetDir,
    uniqueFilename: uniqueName,
    fullPath: path.join(targetDir, uniqueName),
  });
});

app.post('/api/filesystem/open-output', (req, res) => {
  const { filePath } = req.body;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File does not exist', filePath });
  }

  const folder = path.dirname(filePath);

  if (process.platform === 'darwin') {
    spawn('open', ['-R', filePath], { detached: true });
  } else if (process.platform === 'win32') {
    spawn('explorer.exe', ['/select,', filePath], { detached: true });
  } else {
    spawn('xdg-open', [folder], { detached: true });
  }

  res.json({ success: true, opened: filePath });
});

// ==========================================
// 2. Real FFmpeg High-Speed Render Engine
// ==========================================

app.post(
  '/api/export/render',
  upload.any(),
  async (req, res) => {
    try {
      const rawFiles = (req.files as Express.Multer.File[]) || [];
      const body = req.body;

      let project: any = {};
      try {
        project = JSON.parse(body.project || '{}');
      } catch {
        project = {};
      }

      const destinationFolder = resolveTargetFolder(body.destinationFolder || 'Downloads');
      const resolution = body.resolution || '1280x720';
      const [width, height] = resolution.split('x').map(Number);
      const fps = Number(body.fps) || 60;

      // Extract uploaded assets by fieldname or mimetype
      const audioUploads = rawFiles.filter(
        (f) => f.fieldname.includes('audio') || f.mimetype.startsWith('audio/')
      );
      const visualUploads = rawFiles.filter(
        (f) =>
          f.fieldname.includes('visual') ||
          f.mimetype.startsWith('video/') ||
          f.mimetype.startsWith('image/')
      );
      const logoUpload = rawFiles.find((f) => f.fieldname.includes('logo'));

      // Calculate effective project duration (AUTO = total audio duration)
      let totalDuration = Number(project.totalDuration) || 0;

      // Fallback duration if 0
      if (totalDuration <= 0) {
        totalDuration = 15; // fallback
      }

      const rawFilename = body.filename || project.projectName || 'AuviBeat_Master';
      const uniqueFilename = getUniqueFilename(destinationFolder, rawFilename);
      const finalOutputPath = path.join(destinationFolder, uniqueFilename);
      const tempOutputFile = path.join(TEMP_DIR, `output_${Date.now()}_${uniqueFilename}`);

      const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const totalFrames = Math.max(1, Math.floor(totalDuration * fps));

      const job: RenderJob = {
        id: jobId,
        progress: 0,
        currentFrame: 0,
        totalFrames,
        fps: 0,
        speed: '0x',
        elapsedSeconds: 0,
        remainingSeconds: 0,
        status: 'rendering',
        outputFilePath: finalOutputPath,
        outputFilename: uniqueFilename,
        resolution: `${width} × ${height} (16:9)`,
        durationFormatted: formatSecs(totalDuration),
      };
      renderJobs.set(jobId, job);

      res.json({ jobId, uniqueFilename, destinationFolder, finalOutputPath });

      // Execute FFmpeg in background
      (async () => {
        const startTime = performance.now();
        const ffmpegArgs: string[] = ['-y'];
        const filterComplex: string[] = [];

        // Input 1: Visuals
        if (visualUploads.length === 1) {
          const vFile = visualUploads[0];
          const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(vFile.originalname);
          if (isImg) {
            ffmpegArgs.push('-loop', '1', '-t', totalDuration.toString(), '-i', vFile.path);
          } else {
            ffmpegArgs.push('-stream_loop', '-1', '-i', vFile.path);
          }
          filterComplex.push(
            `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[base_v]`
          );
        } else if (visualUploads.length > 1) {
          const scaledNodes: string[] = [];
          visualUploads.forEach((vFile, idx) => {
            const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(vFile.originalname);
            if (isImg) {
              ffmpegArgs.push('-loop', '1', '-t', '15', '-i', vFile.path);
            } else {
              ffmpegArgs.push('-stream_loop', '-1', '-i', vFile.path);
            }
            filterComplex.push(
              `[${idx}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v_scale_${idx}]`
            );
            scaledNodes.push(`[v_scale_${idx}]`);
          });
          filterComplex.push(
            `${scaledNodes.join('')}concat=n=${visualUploads.length}:v=1:a=0[v_cat]`,
            `[v_cat]loop=loop=-1:size=32767:start=0[base_v]`
          );
        } else {
          // Solid aesthetic dark background if no visual uploaded
          ffmpegArgs.push('-f', 'lavfi', '-i', `color=c=#05070d:s=${width}x${height}:r=${fps}:d=${totalDuration}`);
          filterComplex.push(`[0:v]fps=${fps}[base_v]`);
        }

        let currentVideoNode = '[base_v]';

        // Input 2: Audio
        const audioInputIndex = visualUploads.length > 0 ? visualUploads.length : 1;

        if (audioUploads.length > 0) {
          audioUploads.forEach((aFile) => {
            ffmpegArgs.push('-i', aFile.path);
          });

          if (audioUploads.length === 1) {
            ffmpegArgs.push('-map', `${audioInputIndex}:a`);
          } else {
            const audioInputs = audioUploads.map((_, idx) => `[${audioInputIndex + idx}:a]`).join('');
            filterComplex.push(`${audioInputs}concat=n=${audioUploads.length}:v=0:a=1[out_a]`);
            ffmpegArgs.push('-map', '[out_a]');
          }
        } else {
          ffmpegArgs.push('-f', 'lavfi', '-i', `anullsrc=channel_layout=stereo:sample_rate=44100`);
          const nullAudioIdx = visualUploads.length > 0 ? visualUploads.length : 1;
          ffmpegArgs.push('-map', `${nullAudioIdx}:a`);
        }

        // Watermark logo
        if (logoUpload) {
          const logoIdx = ffmpegArgs.length;
          ffmpegArgs.push('-i', logoUpload.path);
          filterComplex.push(`${currentVideoNode}[${logoIdx}:v]overlay=x=W-w-30:y=H-h-30[v_logo]`);
          currentVideoNode = '[v_logo]';
        }

        if (filterComplex.length > 0) {
          ffmpegArgs.push('-filter_complex', filterComplex.join(';'));
        }

        // Map final video
        ffmpegArgs.push('-map', currentVideoNode);

        // Duration parameter
        ffmpegArgs.push('-t', totalDuration.toString());

        // Encoding settings
        ffmpegArgs.push(
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '256k',
          '-movflags', '+faststart',
          '-threads', '0',
          tempOutputFile
        );

        console.log('Spawning FFmpeg:', 'ffmpeg', ffmpegArgs.join(' '));

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);
        const stderrLines: string[] = [];

        ffmpeg.stderr.on('data', (data) => {
          const text = data.toString();
          stderrLines.push(text);
          if (stderrLines.length > 30) stderrLines.shift();

          const frameMatch = text.match(/frame=\s*(\d+)/);
          const fpsMatch = text.match(/fps=\s*([\d.]+)/);
          const speedMatch = text.match(/speed=\s*([\d.]+)x/);
          const timeMatch = text.match(/time=(\d{2}):(\d{2}):([\d.]+)/);

          if (frameMatch) {
            const currentFrame = parseInt(frameMatch[1], 10);
            const currentFps = fpsMatch ? parseFloat(fpsMatch[1]) : 0;
            const currentSpeed = speedMatch ? `${speedMatch[1]}x` : '1.0x';

            let currentTimeSec = 0;
            if (timeMatch) {
              const h = parseInt(timeMatch[1], 10);
              const m = parseInt(timeMatch[2], 10);
              const s = parseFloat(timeMatch[3]);
              currentTimeSec = h * 3600 + m * 60 + s;
            }

            const progress = Math.min(99, Math.round((currentTimeSec / totalDuration) * 100));
            const elapsed = (performance.now() - startTime) / 1000;
            const remaining = progress > 0 ? Math.max(0, Math.round((elapsed / progress) * (100 - progress))) : 0;

            job.progress = progress;
            job.currentFrame = currentFrame;
            job.fps = Math.round(currentFps);
            job.speed = currentSpeed;
            job.elapsedSeconds = Math.round(elapsed);
            job.remainingSeconds = remaining;
          }
        });

        ffmpeg.on('close', (code) => {
          const totalElapsed = (performance.now() - startTime) / 1000;
          if (code === 0 && fs.existsSync(tempOutputFile)) {
            const ffprobe = spawn('ffprobe', ['-hide_banner', tempOutputFile]);
            ffprobe.on('close', () => {
              try {
                fs.copyFileSync(tempOutputFile, finalOutputPath);
                const stats = fs.statSync(finalOutputPath);
                const finalSpeed = `${(totalDuration / Math.max(0.1, totalElapsed)).toFixed(1)}x realtime`;

                job.status = 'completed';
                job.progress = 100;
                job.fileSizeFormatted = formatBytes(stats.size);
                job.renderTimeFormatted = formatSecs(totalElapsed);
                job.renderSpeed = finalSpeed;
                job.downloadUrl = `/api/export/download/${jobId}`;

                console.log(`Render complete! Saved: ${finalOutputPath}`);
              } catch (err: unknown) {
                job.status = 'failed';
                job.error = `File write error: ${(err as Error).message}`;
              }
            });
          } else {
            job.status = 'failed';
            job.error = `FFmpeg error (code ${code}): ${stderrLines.slice(-5).join(' ')}`;
          }
        });

        ffmpeg.on('error', (err) => {
          job.status = 'failed';
          job.error = err.message;
        });
      })();
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message || 'Server error' });
    }
  }
);

app.get('/api/export/progress/:jobId', (req, res) => {
  const job = renderJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

app.get('/api/export/download/:jobId', (req, res) => {
  const job = renderJobs.get(req.params.jobId);
  if (!job || !job.outputFilePath || !fs.existsSync(job.outputFilePath)) {
    return res.status(404).json({ error: 'Rendered file not found' });
  }
  res.download(job.outputFilePath, job.outputFilename || path.basename(job.outputFilePath));
});

// Global Express error handler ensuring JSON responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error handler caught:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || 'Server processing error' });
  }
});

// ==========================================
// 3. Vite Middleware Setup
// ==========================================
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-Stack Video Creator running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
