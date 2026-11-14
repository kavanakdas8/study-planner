import { StudyPlan } from "@/types/study";

// Shared Web Audio context singleton for smooth, glitch-free audio playback
let sharedAudioCtx: AudioContext | null = null;
let lastChimeTime = 0;
let lastChimeType = "";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes a pleasant, natural audio chime using the Web Audio API.
 * Features acoustic envelope shaping and debouncing to prevent harsh clipping or duplicate audio.
 */
export function playChime(type: "complete" | "timer" | "click" = "click") {
  if (typeof window === "undefined") return;

  const nowMs = Date.now();
  // Prevent duplicate overlapping sounds triggered within 60ms
  if (lastChimeType === type && nowMs - lastChimeTime < 60) {
    return;
  }
  lastChimeTime = nowMs;
  lastChimeType = type;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master filter to ensure warm, soft acoustics without harsh high frequencies
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.connect(ctx.destination);

    if (type === "complete") {
      // Warm, satisfying two-tone chime (C5 -> G5) with subtle resonance
      const notes = [
        { freq: 523.25, timeOffset: 0, duration: 0.28, gain: 0.12 },
        { freq: 783.99, timeOffset: 0.08, duration: 0.38, gain: 0.14 },
        { freq: 1046.5, timeOffset: 0.08, duration: 0.32, gain: 0.05 }, // Soft harmonic sparkle
      ];

      notes.forEach(({ freq, timeOffset, duration, gain: peakGain }) => {
        const start = now + timeOffset;
        const stop = start + duration;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        // Gentle attack followed by exponential decay
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.linearRampToValueAtTime(peakGain, start + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, stop);

        osc.connect(gainNode);
        gainNode.connect(filter);

        osc.start(start);
        osc.stop(stop);
      });
    } else if (type === "timer") {
      // Resonant, gentle notification chime
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(gainNode);
      gainNode.connect(filter);

      osc.start(now);
      osc.stop(now + 0.95);
    } else {
      // Subtle, tactile micro-tick
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(450, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.04, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gainNode);
      gainNode.connect(filter);

      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Graceful fallback if audio is not permitted
  }
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatTimeSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function exportPlanToMarkdown(
  plan: StudyPlan,
  dailyHours: number,
  completedMap: Record<string, boolean>
): string {
  let md = `# 🎓 Study Plan: ${plan.subject}\n\n`;
  md += `> **Timeframe**: ${plan.target_timeframe} | **Commitment**: ${dailyHours} hrs/day\n\n`;
  md += `## 📌 Strategic Overview\n${plan.overview}\n\n`;
  md += `---\n\n## 📅 Curriculum Breakdown\n\n`;

  plan.schedule.forEach((period, pIdx) => {
    md += `### ${period.period_label}: ${period.topic_summary}\n\n`;
    period.tasks.forEach((task, tIdx) => {
      const isDone = completedMap[`${pIdx}_${tIdx}`];
      const check = isDone ? "[x]" : "[ ]";
      md += `- ${check} **${task.title}** (${task.duration_minutes}m) [${task.resource_type}]\n`;
      md += `  - ${task.description}\n`;
    });
    md += `\n`;
  });

  md += `\n*Generated by CuratePlan Engine with Gemini* ⚡\n`;
  return md;
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateICS(plan: StudyPlan): string {
  const now = new Date();
  const formatICSDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CuratePlan//Curriculum Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Study Plan - ${plan.subject}`,
  ];

  const currentStartDate = new Date(now);
  currentStartDate.setHours(9, 0, 0, 0); // start at 9am each day

  plan.schedule.forEach((period, pIdx) => {
    // Advance day for each period
    const periodDate = new Date(currentStartDate);
    periodDate.setDate(periodDate.getDate() + pIdx);

    let taskTime = new Date(periodDate);

    period.tasks.forEach((task) => {
      const endTime = new Date(taskTime.getTime() + task.duration_minutes * 60000);
      const uid = `study-${Date.now()}-${pIdx}-${Math.random().toString(36).substring(2, 9)}@studyplanner.app`;

      ics.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatICSDate(now)}`,
        `DTSTART:${formatICSDate(taskTime)}`,
        `DTEND:${formatICSDate(endTime)}`,
        `SUMMARY:[${period.period_label}] ${task.title} (${task.resource_type})`,
        `DESCRIPTION:${task.description.replace(/\n/g, "\\n")}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );

      // Next task starts 10m break after
      taskTime = new Date(endTime.getTime() + 10 * 60000);
    });
  });

  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}
