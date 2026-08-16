import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { PdfModel, PdfModelBlock } from "./model";
import { QUANTANA_LOGO_DATA_URI } from "./logo";

const BRAND_PURPLE = "#6b1f9c";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    color: "#1e293b",
    backgroundColor: "#fffdf9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 22,
    objectFit: "contain",
  },
  headerTagline: {
    fontSize: 9,
    color: "#64748b",
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    color: "#1e293b",
  },
  stageBanner: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
  },
  stageScore: {
    fontSize: 10,
    color: "#ffffff",
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 6,
    marginTop: 12,
  },
  canvasWordmark: {
    position: "absolute",
    bottom: 3,
    right: 5,
    fontSize: 7,
    fontWeight: 700,
    color: "#94a3b8",
  },
  // Lean Canvas grid
  canvasFrame: {
    width: "100%",
    height: 300,
    borderWidth: 1,
    borderColor: "#000000",
    position: "relative",
    marginBottom: 6,
  },
  block: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4,
    overflow: "hidden",
  },
  blockMain: {
    flex: 1,
  },
  blockTitle: {
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#000000",
    marginBottom: 2,
  },
  blockHelper: {
    fontSize: 6,
    fontStyle: "italic",
    color: "#94a3b8",
    lineHeight: 1.3,
  },
  blockAnswer: {
    fontSize: 6.5,
    color: "#1e293b",
    lineHeight: 1.3,
  },
  blockFeedback: {
    fontSize: 5.5,
    color: BRAND_PURPLE,
    fontWeight: 700,
    marginTop: 2,
  },
  blockSuggestion: {
    fontSize: 5.5,
    fontStyle: "italic",
    color: "#94a3b8",
    marginTop: 2,
    lineHeight: 1.3,
  },
  subBlock: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    padding: 3,
    height: "30%",
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
    bottom: 16,
    left: 28,
    right: 28,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

// Row heights as fractions of the canvas frame height: rows 1-2 (the tall
// blocks) are taller than row 3 (the Cost Structure / Revenue Streams
// band), matching the authentic template proportions.
const ROW_FRACS = [0.36, 0.36, 0.28];
const COLS = 10;

function parseGridArea(gridArea: string) {
  const [rowStart, colStart, rowEnd, colEnd] = gridArea.split("/").map((n) => parseInt(n.trim(), 10));
  return { rowStart, colStart, rowEnd, colEnd };
}

function rowOffset(rowIndex1: number): number {
  // cumulative fraction of rows before rowIndex1 (1-indexed)
  return ROW_FRACS.slice(0, rowIndex1 - 1).reduce((a, b) => a + b, 0);
}

function blockPosition(gridArea: string) {
  const { rowStart, colStart, rowEnd, colEnd } = parseGridArea(gridArea);
  const top = rowOffset(rowStart) * 100;
  const height = (rowOffset(rowEnd) - rowOffset(rowStart)) * 100;
  const left = ((colStart - 1) / COLS) * 100;
  const width = ((colEnd - colStart) / COLS) * 100;
  return {
    top: `${top}%`,
    left: `${left}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

function BlockContent({ title, helper, answer, feedback, suggestion, score, max }: {
  title: string;
  helper: string;
  answer: string | null;
  feedback?: string | null;
  suggestion?: string;
  score?: number;
  max?: number;
}) {
  return (
    <>
      <Text style={styles.blockTitle}>{title}</Text>
      {answer ? (
        <>
          <Text style={styles.blockAnswer}>{answer}</Text>
          {feedback ? (
            <Text style={styles.blockFeedback}>
              {feedback}
              {score !== undefined && max !== undefined ? `  ·  ${score}/${max}` : ""}
            </Text>
          ) : null}
          {suggestion ? <Text style={styles.blockSuggestion}>{suggestion}</Text> : null}
        </>
      ) : (
        <Text style={styles.blockHelper}>{helper} (not captured in this snapshot)</Text>
      )}
    </>
  );
}

function CanvasBlock({ block }: { block: PdfModelBlock }) {
  const pos = blockPosition(block.gridArea);
  return (
    <View style={[styles.block, pos, { flexDirection: "column" }]}>
      <View style={styles.blockMain}>
        <BlockContent
          title={block.title}
          helper={block.helper}
          answer={block.answer}
          feedback={block.feedback}
          suggestion={block.suggestion}
          score={block.score}
          max={block.max}
        />
      </View>
      {block.sub ? (
        <View style={styles.subBlock}>
          <BlockContent title={block.sub.title} helper={block.sub.helper} answer={block.sub.answer} />
        </View>
      ) : null}
    </View>
  );
}

export function ResultDocument({ model }: { model: PdfModel }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Image src={QUANTANA_LOGO_DATA_URI} style={styles.logo} />
          <Text style={styles.headerTagline}>MVP Readiness Snapshot</Text>
        </View>

        <Text style={styles.title}>{model.title}</Text>

        <View style={[styles.stageBanner, { backgroundColor: model.stageColor }]}>
          <Text style={styles.stageLabel}>{model.stageLabel}</Text>
          <Text style={styles.stageScore}>{model.score} / 100</Text>
        </View>

        <Text style={styles.sectionHeading}>Your Lean Canvas</Text>
        <View style={styles.canvasFrame}>
          {model.blocks.map((block) => (
            <CanvasBlock key={block.key} block={block} />
          ))}
          <Text style={styles.canvasWordmark}>Lean Canvas · Quantana</Text>
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
