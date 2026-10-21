import type { Cycle, LogEntry, PCOSProfile, Profile, StoredChatMessage } from "@/lib/store";

export interface HealthReportPdfInput {
  profile: Profile;
  cycles: Cycle[];
  logs: Record<string, LogEntry>;
  pcosProfile: PCOSProfile;
  chatHistory: StoredChatMessage[];
  exportedAt: string;
}

const pageWidth = 612;
const pageHeight = 792;
const margin = 44;
const contentWidth = pageWidth - margin * 2;
const encoder = new TextEncoder();

interface PdfPage {
  commands: string[];
  y: number;
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function escapePdfText(value: unknown) {
  return cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function titleCase(value: string | null | undefined) {
  const text = cleanText(value || "Not set");
  return text.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (char) => char.toUpperCase());
}

function valueOr(value: unknown, fallback = "Not set") {
  if (value === null || value === undefined || value === "") return fallback;
  return cleanText(value);
}

function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function cycleLengths(cycles: Cycle[]) {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1].startDate).getTime();
    const next = new Date(sorted[i].startDate).getTime();
    const days = Math.round((next - prev) / 86_400_000);
    if (Number.isFinite(days) && days > 0 && days < 120) lengths.push(days);
  }
  return lengths;
}

function wrapText(text: string, maxChars: number) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word.length > maxChars ? word.slice(0, maxChars) : word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

class PdfBuilder {
  pages: PdfPage[] = [];
  private page: PdfPage;

  constructor() {
    this.page = this.newPage();
  }

  private newPage() {
    const page: PdfPage = { commands: [], y: pageHeight - margin };
    this.pages.push(page);
    this.page = page;
    return page;
  }

  private ensure(height: number) {
    if (this.page.y - height < margin + 24) this.newPage();
  }

  private rect(x: number, y: number, width: number, height: number, color: string) {
    this.page.commands.push(`q ${color} rg ${x} ${y} ${width} ${height} re f Q`);
  }

  private textAt(text: string, x: number, y: number, size: number, font: "F1" | "F2", color = "0.16 0.12 0.18") {
    this.page.commands.push(`${color} rg BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
  }

  title(name: string, exportedAt: string) {
    this.rect(0, 724, pageWidth, 68, "0.89 0.22 0.44");
    this.textAt("Lotus Phase Health Report", margin, 762, 24, "F2", "1 1 1");
    this.textAt(`Prepared for ${valueOr(name, "Friend")}`, margin, 742, 11, "F1", "1 0.90 0.95");
    this.textAt(`Exported ${formatDate(exportedAt)}`, pageWidth - 204, 742, 10, "F1", "1 0.90 0.95");
    this.page.y = 696;
  }

  section(title: string) {
    this.ensure(44);
    this.rect(margin, this.page.y - 20, contentWidth, 26, "0.98 0.90 0.94");
    this.textAt(title, margin + 12, this.page.y - 12, 12, "F2", "0.63 0.12 0.31");
    this.page.y -= 42;
  }

  line(text: string, options: { size?: number; bold?: boolean; indent?: number; color?: string } = {}) {
    const size = options.size ?? 10;
    const indent = options.indent ?? 0;
    const maxChars = Math.max(28, Math.floor((contentWidth - indent) / (size * 0.52)));
    const lines = wrapText(text, maxChars);
    for (const line of lines) {
      this.ensure(size + 8);
      this.textAt(line, margin + indent, this.page.y, size, options.bold ? "F2" : "F1", options.color);
      this.page.y -= size + 6;
    }
  }

  keyValue(label: string, value: unknown) {
    this.ensure(18);
    this.textAt(label, margin, this.page.y, 9, "F2", "0.44 0.34 0.48");
    this.textAt(valueOr(value), margin + 150, this.page.y, 9, "F1", "0.16 0.12 0.18");
    this.page.y -= 17;
  }

  metricRow(metrics: { label: string; value: string | number }[]) {
    this.ensure(72);
    const gap = 10;
    const width = (contentWidth - gap * 2) / 3;
    metrics.slice(0, 3).forEach((metric, index) => {
      const x = margin + index * (width + gap);
      this.rect(x, this.page.y - 52, width, 54, "0.99 0.96 0.98");
      this.textAt(metric.label, x + 12, this.page.y - 16, 8, "F2", "0.50 0.38 0.55");
      this.textAt(String(metric.value), x + 12, this.page.y - 38, 18, "F2", "0.89 0.22 0.44");
    });
    this.page.y -= 76;
  }

  footer() {
    const total = this.pages.length;
    this.pages.forEach((page, index) => {
      page.commands.push("0.72 0.62 0.68 rg");
      page.commands.push(`BT /F1 8 Tf ${margin} 24 Td (Lotus Phase - Private health export) Tj ET`);
      page.commands.push(`BT /F1 8 Tf ${pageWidth - 90} 24 Td (Page ${index + 1} of ${total}) Tj ET`);
    });
  }
}

function buildPdf(pages: PdfPage[]) {
  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const regularFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pagesId = addObject("");
  const pageIds: number[] = [];

  pages.forEach((page) => {
    const content = page.commands.join("\n");
    const contentId = addObject(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

export function buildHealthReportPdf(input: HealthReportPdfInput) {
  const logs = Object.values(input.logs).sort((a, b) => b.date.localeCompare(a.date));
  const sleeps = logs.map((log) => log.sleepHrs).filter((value): value is number => typeof value === "number");
  const waters = logs.map((log) => log.waterCups).filter((value): value is number => typeof value === "number");
  const lengths = cycleLengths(input.cycles);
  const avgCycle = average(lengths);
  const avgSleep = average(sleeps);
  const avgWater = average(waters);

  const pdf = new PdfBuilder();
  pdf.title(input.profile.name, input.exportedAt);
  pdf.metricRow([
    { label: "Cycles tracked", value: input.cycles.length },
    { label: "Daily logs", value: logs.length },
    { label: "Avg cycle", value: avgCycle ? `${avgCycle.toFixed(1)} days` : `${input.profile.avgCycleLength} days` },
  ]);

  pdf.section("Profile");
  pdf.keyValue("Name", input.profile.name);
  pdf.keyValue("Email", input.profile.email);
  pdf.keyValue("Average period", `${input.profile.avgPeriodLength} days`);
  pdf.keyValue("Health goal", titleCase(input.profile.healthGoal));
  pdf.keyValue("Diet preference", titleCase(input.profile.dietPreference));
  pdf.keyValue("Activity level", titleCase(input.profile.activityLevel));
  pdf.keyValue("Height", input.profile.height ? `${input.profile.height} cm` : null);
  pdf.keyValue("Weight", input.profile.weight ? `${input.profile.weight} kg` : null);
  pdf.keyValue("Stress level", input.profile.stressLevel ?? null);
  pdf.keyValue("Medical conditions", input.profile.medicalConditions?.join(", ") || "None recorded");
  pdf.keyValue("Food allergies", input.profile.foodAllergies?.join(", ") || "None recorded");

  pdf.section("Wellness summary");
  pdf.keyValue("Average sleep", avgSleep ? `${avgSleep.toFixed(1)} hours` : "Not enough logs");
  pdf.keyValue("Average water", avgWater ? `${avgWater.toFixed(1)} cups` : "Not enough logs");
  pdf.keyValue("PCOS assessment", input.pcosProfile.completedAt ? `Completed ${formatDate(input.pcosProfile.completedAt)}` : "Not completed");
  pdf.keyValue("Recent Luna messages", input.chatHistory.length);

  pdf.section("Cycle history");
  if (input.cycles.length === 0) {
    pdf.line("No cycle records yet.");
  } else {
    [...input.cycles]
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .forEach((cycle) => {
        pdf.line(`Started ${formatDate(cycle.startDate)} | Ended ${cycle.endDate ? formatDate(cycle.endDate) : "not recorded"}`);
      });
  }

  pdf.section("Daily logs");
  if (logs.length === 0) {
    pdf.line("No daily logs yet.");
  } else {
    logs.forEach((log) => {
      const tags = [
        log.flow ? `flow: ${log.flow}` : "",
        log.mood ? `mood: ${log.mood}` : "",
        log.symptoms.length ? `symptoms: ${log.symptoms.join(", ")}` : "",
        typeof log.sleepHrs === "number" ? `sleep: ${log.sleepHrs}h` : "",
        typeof log.waterCups === "number" ? `water: ${log.waterCups} cups` : "",
      ].filter(Boolean);
      pdf.line(`${formatDate(log.date)} - ${tags.join(" | ") || "Log recorded"}`, { bold: true });
      if (log.notes) pdf.line(`Notes: ${log.notes}`, { indent: 14, color: "0.38 0.30 0.42" });
    });
  }

  pdf.section("PCOS answers");
  const pcosEntries = Object.entries(input.pcosProfile.answers);
  if (pcosEntries.length === 0) {
    pdf.line("No PCOS answers saved.");
  } else {
    pcosEntries.forEach(([key, value]) => pdf.keyValue(titleCase(key), value));
  }

  pdf.section("Recent Luna AI chat");
  if (input.chatHistory.length === 0) {
    pdf.line("No recent chat history saved.");
  } else {
    input.chatHistory.slice(-12).forEach((message) => {
      pdf.line(`${titleCase(message.role)} - ${formatDate(message.ts)}: ${message.content}`);
    });
  }

  pdf.footer();
  return buildPdf(pdf.pages);
}
