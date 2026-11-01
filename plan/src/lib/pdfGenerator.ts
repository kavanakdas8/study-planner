import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SavedPlan } from "@/types/study";
import { normalizePlanToCurriculum } from "./curriculumAdapter";

/**
 * Sanitizes plain text for standard PDF encoding.
 * Replaces fancy quotes, dashes, bullets, and non-ASCII glyphs.
 */
function sanitizeText(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "*")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Formats minutes into human-readable duration (e.g. "45m", "1h 30m").
 */
function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Generates and triggers automatic download of a clean, academic curriculum
 * PDF document focused on learning structure, modules, topics, and milestones
 * without progress tracking or status indicators.
 */
export function exportCurriculumToPDF(
  inputPlan: SavedPlan,
  completedTasksMap: Record<string, boolean> = {}
): void {
  // 1. Ensure curriculum is fully normalized with modules, topics, and tasks
  const plan = normalizePlanToCurriculum(inputPlan, completedTasksMap);

  // 2. Compute curriculum structure metrics (educational content only, no progress/completion)
  const modules = plan.modules || [];
  let totalTopics = 0;
  let totalTasks = 0;
  let totalEstMinutes = 0;

  modules.forEach((mod) => {
    (mod.topics || []).forEach((top) => {
      totalTopics++;
      totalEstMinutes += top.estimated_duration_minutes || 0;
      totalTasks += (top.tasks || []).length;
    });
  });

  const totalHours = (totalEstMinutes / 60).toFixed(1);

  // 3. Initialize jsPDF document (A4, Portrait, mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Call autoTable compatibility handler
  const callAutoTable = (options: Parameters<typeof autoTable>[1]) => {
    const fn = (autoTable as unknown as { default?: typeof autoTable }).default || autoTable;
    fn(doc, options);
  };

  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let currentY = 14;

  // Top Emerald Accent Stripe (Edge to Edge)
  doc.setFillColor(5, 150, 105); // #059669 Emerald Green
  doc.rect(0, 0, pageWidth, 4, "F");

  // Sub-brand Eyebrow
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text("CURATEPLAN  |  ACADEMIC CURRICULUM BLUEPRINT", marginX, currentY);
  currentY += 6;

  // Document Title (wrapped if needed)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // #0F172A Dark Slate
  const sanitizedTitle = sanitizeText(plan.subject) || "Study Curriculum Report";
  const titleLines = doc.splitTextToSize(sanitizedTitle, contentWidth);
  doc.text(titleLines, marginX, currentY);
  currentY += titleLines.length * 7;

  // Metadata Line (Timeframe, Daily Target, Experience Level)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // #475569 Slate
  const metaText = `Timeframe: ${sanitizeText(plan.target_timeframe)}  *  Target Study Pace: ${plan.daily_hours || 2} hrs/day  *  Level: ${sanitizeText(plan.experience_level)}`;
  doc.text(metaText, marginX, currentY);
  currentY += 4.5;

  // Export Date Line
  const exportDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // #94A3B8 Muted
  doc.text(`Official Export Date: ${exportDateStr}`, marginX, currentY);
  currentY += 7;

  // Curriculum Scope Metrics Summary Card (3 Grid Columns - No Progress/Status/Completed Counts)
  const kpiBoxHeight = 16;
  const kpiColWidth = contentWidth / 3;

  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, kpiBoxHeight, 2, 2, "FD");

  // Dividers between the 3 columns
  for (let c = 1; c < 3; c++) {
    const divX = marginX + c * kpiColWidth;
    doc.line(divX, currentY + 2, divX, currentY + kpiBoxHeight - 2);
  }

  const kpis = [
    { label: "MODULES", value: `${modules.length}`, sub: "Curriculum learning units" },
    { label: "TOTAL TOPICS", value: `${totalTopics}`, sub: `${totalTasks} learning tasks` },
    { label: "EST. STUDY TIME", value: `${totalHours} hrs`, sub: `~${plan.daily_hours || 2}h daily study budget` },
  ];

  kpis.forEach((kpi, idx) => {
    const colX = marginX + idx * kpiColWidth + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, colX, currentY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text(kpi.value, colX, currentY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, colX, currentY + 14);
  });

  currentY += kpiBoxHeight + 7;

  // Curriculum Overview & Scope Section
  if (plan.overview) {
    const cleanOverview = sanitizeText(plan.overview);
    const overviewLines = doc.splitTextToSize(cleanOverview, contentWidth - 6);
    const overviewBoxHeight = overviewLines.length * 4.2 + 10;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, overviewBoxHeight, 1.5, 1.5, "FD");

    // Green Left Accent Indicator Bar
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX, currentY, 2, overviewBoxHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("CURRICULUM OVERVIEW & OBJECTIVES", marginX + 5, currentY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(overviewLines, marginX + 5, currentY + 10);

    currentY += overviewBoxHeight + 6;
  }

  // TABLE 1: Executive Curriculum Outline (Clean Module Directory without Status or Topic Directory dump)
  const directoryRows = modules.map((m, idx) => {
    const modTopics = m.topics || [];
    const modHours = (
      modTopics.reduce((acc, t) => acc + (t.estimated_duration_minutes || 0), 0) / 60
    ).toFixed(1);

    const summaryText =
      sanitizeText(m.summary) ||
      `Comprehensive learning module covering ${modTopics.length} core topics and associated hands-on tasks.`;

    return [
      `Module ${idx + 1}: ${sanitizeText(m.title)}`,
      summaryText,
      `${modTopics.length} topics`,
      `${modHours} hrs`,
    ];
  });

  callAutoTable({
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [["Module", "Module Scope & Learning Focus", "Topics", "Est. Duration"]],
    body: directoryRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.8,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: 92 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Fetch the Y position after the executive table
  const afterDirInfo = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  currentY = (afterDirInfo?.finalY || currentY) + 8;

  // SECTION: Detailed Curriculum Hierarchy (Course -> Module -> Topics -> Tasks)
  modules.forEach((mod, mIdx) => {
    // If close to page bottom, force clean page break before module header
    if (currentY > 245) {
      doc.addPage();
      currentY = 22;
    }

    // Module Header Banner
    doc.setFillColor(241, 245, 249); // #F1F5F9
    doc.setDrawColor(203, 213, 225); // #CBD5E1
    doc.roundedRect(marginX, currentY, contentWidth, 10, 1.5, 1.5, "FD");

    // Emerald accent block on the left
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX, currentY, 3, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `MODULE ${String(mIdx + 1).padStart(2, "0")}: ${sanitizeText(mod.title).toUpperCase()}`,
      marginX + 6,
      currentY + 6.5
    );

    // Module summary subtext
    if (mod.summary) {
      currentY += 12;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const sumLines = doc.splitTextToSize(sanitizeText(mod.summary), contentWidth);
      doc.text(sumLines, marginX + 2, currentY);
      currentY += sumLines.length * 3.8 + 2;
    } else {
      currentY += 12;
    }

    // Module Topics Table (No Status column, clean task bullets)
    const topicRows = mod.topics.map((top, tIdx) => {
      const topicNum = `${mIdx + 1}.${tIdx + 1}`;
      const name = sanitizeText(top.name);
      const desc = sanitizeText(top.description);
      const diff = sanitizeText(top.difficulty || "Intermediate");
      const duration = formatDuration(top.estimated_duration_minutes);

      // Tasks bullet list (clean bullet points without check status [x]/[ ])
      const taskBullets = (top.tasks || [])
        .map((tk) => {
          const resType = tk.resource_type ? ` (${sanitizeText(tk.resource_type)})` : "";
          return `* ${sanitizeText(tk.title)}${resType}`;
        })
        .join("\n");

      return [
        topicNum,
        desc ? `${name}\n${desc}` : name,
        diff,
        duration,
        taskBullets || "Self-study exercise",
      ];
    });

    callAutoTable({
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["#", "Topic Name & Syllabus Scope", "Difficulty", "Duration", "Learning Tasks & Activities"]],
      body: topicRows,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2.8,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [15, 23, 42], // Slate header for module tables
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: 2.8,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 70, fontStyle: "bold" },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 55 },
      },
      alternateRowStyles: {
        fillColor: [250, 252, 254],
      },
    });

    const afterTableInfo = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    currentY = (afterTableInfo?.finalY || currentY) + 7;
  });

  // TABLE: Curriculum Milestones (No Status column)
  if (plan.milestones && plan.milestones.length > 0) {
    if (currentY > 240) {
      doc.addPage();
      currentY = 22;
    }

    const milestoneRows = plan.milestones.map((ms, idx) => [
      String(idx + 1),
      sanitizeText(ms.title),
      sanitizeText(ms.description) || "Knowledge verification gate",
      ms.target_date || "—",
    ]);

    callAutoTable({
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["#", "Milestone Target Gate", "Description & Criteria", "Target Date"]],
      body: milestoneRows,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 60, fontStyle: "bold" },
        2: { cellWidth: 80 },
        3: { cellWidth: 30, halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    const afterMs = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    currentY = (afterMs?.finalY || currentY) + 7;
  }

  // 4. Two-Pass Running Headers & Footers on Every Page
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (Pages 2+)
    if (i > 1) {
      doc.setFillColor(5, 150, 105);
      doc.rect(marginX, 9, contentWidth, 0.6, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const truncatedTitle =
        sanitizedTitle.length > 55 ? `${sanitizedTitle.substring(0, 52)}...` : sanitizedTitle;
      doc.text(`CuratePlan Curriculum Blueprint  *  ${truncatedTitle}`, marginX, 13);
      doc.text(`Target Timeframe: ${sanitizeText(plan.target_timeframe)}`, pageWidth - marginX, 13, {
        align: "right",
      });
    }

    // Running Footer (All Pages)
    const footerY = 287;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on ${exportDateStr}  *  CuratePlan Study Blueprint`, marginX, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, footerY, { align: "right" });
  }

  // 5. Automatic Download with descriptive filename: [Curriculum_Name_study_plan].pdf
  const cleanFilenameBase = sanitizedTitle
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const outputFilename = `${cleanFilenameBase || "Curriculum"}_study_plan.pdf`;

  doc.save(outputFilename);
}
