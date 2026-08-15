import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { PdfModel } from "./model";

const BRAND_PURPLE = "#6b1f9c";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: "#1e293b",
    backgroundColor: "#fffdf9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  wordmark: {
    fontSize: 20,
    fontWeight: 700,
    color: BRAND_PURPLE,
  },
  headerTagline: {
    fontSize: 9,
    color: "#64748b",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: "#1e293b",
  },
  stageBanner: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
  },
  stageScore: {
    fontSize: 11,
    color: "#ffffff",
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 6,
    marginTop: 14,
  },
  canvasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  cellTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 3,
    color: "#1e293b",
  },
  cellAnswer: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 4,
    lineHeight: 1.4,
  },
  cellMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cellFeedback: {
    fontSize: 8,
    color: BRAND_PURPLE,
    fontWeight: 700,
  },
  cellScore: {
    fontSize: 8,
    color: "#64748b",
  },
  dimensionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dimensionLabel: {
    fontSize: 9,
    color: "#1e293b",
  },
  dimensionScore: {
    fontSize: 9,
    color: "#64748b",
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#334155",
    marginBottom: 4,
  },
  listItem: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#334155",
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

export function ResultDocument({ model }: { model: PdfModel }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* Swap for <Image src="/quantana-logo.png" style={{ width: 100 }} /> once a PNG/JPG asset exists. */}
          <Text style={styles.wordmark}>quantana</Text>
          <Text style={styles.headerTagline}>MVP Readiness Snapshot</Text>
        </View>

        <Text style={styles.title}>{model.title}</Text>

        <View style={[styles.stageBanner, { backgroundColor: model.stageColor }]}>
          <Text style={styles.stageLabel}>{model.stageLabel}</Text>
          <Text style={styles.stageScore}>{model.score} / 100</Text>
        </View>

        <Text style={styles.sectionHeading}>Snapshot</Text>
        <Text style={styles.bodyText}>{model.summary}</Text>

        <Text style={styles.sectionHeading}>Your Lean Canvas</Text>
        <View style={styles.canvasGrid}>
          {model.cells.map((cell) => (
            <View key={cell.title} style={styles.cell}>
              <Text style={styles.cellTitle}>{cell.title}</Text>
              <Text style={styles.cellAnswer}>{cell.answer}</Text>
              <View style={styles.cellMeta}>
                <Text style={styles.cellFeedback}>{cell.feedback}</Text>
                <Text style={styles.cellScore}>
                  {cell.score} / {cell.max}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>Dimension Breakdown</Text>
        <View>
          {model.dimensions.map((dimension) => (
            <View key={dimension.label} style={styles.dimensionRow}>
              <Text style={styles.dimensionLabel}>{dimension.label}</Text>
              <Text style={styles.dimensionScore}>
                {dimension.score} / {dimension.max}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>What&apos;s Working</Text>
        {model.strengths.map((strength, index) => (
          <Text key={`strength-${index}`} style={styles.listItem}>
            • {strength}
          </Text>
        ))}

        <Text style={styles.sectionHeading}>Worth Testing</Text>
        {model.assumptions.map((assumption, index) => (
          <Text key={`assumption-${index}`} style={styles.listItem}>
            • {assumption}
          </Text>
        ))}

        <Text style={styles.sectionHeading}>Your Next MVP Experiment</Text>
        <Text style={styles.bodyText}>{model.mvpExperiment}</Text>

        <Text style={styles.sectionHeading}>7-Day Plan</Text>
        {model.sevenDayPlan.map((day, index) => (
          <Text key={`${day.day}-${index}`} style={styles.listItem}>
            {day.day}: {day.text}
          </Text>
        ))}

        <Text style={styles.sectionHeading}>Your Pitch, Sharpened</Text>
        <Text style={styles.bodyText}>{model.improvedPitch}</Text>

        <Text style={styles.sectionHeading}>Something to Sit With</Text>
        <Text style={styles.bodyText}>{model.reflectionQuestion}</Text>

        <Text style={styles.footer}>Generated by MVP Readiness Snapshot · Quantana</Text>
      </Page>
    </Document>
  );
}

export async function renderResultPdf(model: PdfModel): Promise<Buffer> {
  return renderToBuffer(<ResultDocument model={model} />);
}

export default ResultDocument;
