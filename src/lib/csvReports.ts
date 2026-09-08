export type CSVReport = {
  device_id: string;
  captured_at: string;
  substance_label: string;
  category: string;
  spectral_json: string;
  gas_ppm: number;
  gas_baseline_ppm: number;
  temperature_c: number;
  humidity_pct: number;
  confidence: number;
  risk_level: string;
  lat: number;
  lng: number;
  zone: string;
  location_id: string;
  status: string;
};

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());

  return values;
}

export async function loadCSVReports(): Promise<CSVReport[]> {
  try {
    const response = await fetch("/data/sentinel_reports.csv");

    if (!response.ok) {
      throw new Error(`CSV request failed: ${response.status}`);
    }

    const text = await response.text();

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return [];
    }

    const headers = parseCSVLine(lines[0] ?? "");

    return lines.slice(1).map((line: string) => {
      const values = parseCSVLine(line);

      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });

      return {
  device_id: row["device_id"] ?? "",
  captured_at: row["captured_at"] ?? "",
  substance_label: row["substance_label"] ?? "",
  category: row["category"] ?? "",
  spectral_json: row["spectral_json"] ?? "",
  gas_ppm: Number(row["gas_ppm"] ?? 0),
  gas_baseline_ppm: Number(row["gas_baseline_ppm"] ?? 0),
  temperature_c: Number(row["temperature_c"] ?? 0),
  humidity_pct: Number(row["humidity_pct"] ?? 0),
  confidence: Number(row["confidence"] ?? 0),
  risk_level: row["risk_level"] ?? "",
  lat: Number(row["lat"] ?? 0),
  lng: Number(row["lng"] ?? 0),
  zone: row["zone"] ?? "",
  location_id: row["location_id"] ?? "",
  status: row["status"] ?? "",
};
    });
  } catch (error) {
    console.error("Failed to load CSV reports:", error);
    return [];
  }
}