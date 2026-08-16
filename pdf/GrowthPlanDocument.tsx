import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { QUANTANA_LOGO_DATA_URI } from "./logo";
import type { GrowthPlanRow } from "@/db/queries/growth";

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
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
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
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
    color: BRAND_PURPLE,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: BRAND_PURPLE,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  row: {
    marginBottom: 4,
  },
  label: {
    fontWeight: 700,
    color: "#334155",
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    color: BRAND_PURPLE,
    marginTop: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 2,
  },
  listItem: {
    fontSize: 9.5,
    marginBottom: 3,
    color: "#1e293b",
    lineHeight: 1.3,
  },
  scriptBox: {
    backgroundColor: "#f1f5f9",
    borderLeftWidth: 3,
    borderLeftColor: BRAND_PURPLE,
    padding: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  scriptText: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#334155",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
});

interface GrowthPlanPdfProps {
  founderName: string;
  startupName: string;
  plan: GrowthPlanRow;
}

export function GrowthPlanDocument({ founderName, startupName, plan }: GrowthPlanPdfProps) {
  return (
    <Document title={`90-Day Growth Plan - ${startupName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={QUANTANA_LOGO_DATA_URI} style={styles.logo} />
          <Text style={styles.headerTagline}>Quantana AI Growth Engine</Text>
        </View>

        <Text style={styles.title}>90-Day Growth & Distribution Plan</Text>
        <Text style={styles.subtitle}>Prepared for {founderName} ({startupName})</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your 90-Day Growth Focus</Text>
          <Text style={styles.row}><Text style={styles.label}>Primary Channel: </Text>{plan.primaryChannel}</Text>
          <Text style={styles.row}><Text style={styles.label}>First Target Segment: </Text>{plan.targetSegment}</Text>
          <Text style={styles.row}><Text style={styles.label}>First Conversion Goal: </Text>{plan.conversionGoal}</Text>
          <Text style={styles.row}><Text style={styles.label}>30-Day Success Metric: </Text>{plan.successMetric30Day}</Text>
          <Text style={styles.row}><Text style={styles.label}>Low-Hanging Opportunity: </Text>{plan.lowHangingOpportunity}</Text>
          <Text style={styles.row}><Text style={styles.label}>Biggest Risk: </Text>{plan.biggestRisk}</Text>
        </View>

        <Text style={styles.sectionHeading}>Top Channels to Test</Text>
        {plan.topChannels.map((c, i) => (
          <Text key={i} style={styles.listItem}>• {c}</Text>
        ))}

        <Text style={styles.sectionHeading}>30-Day Action Plan (Pilot + Discovery)</Text>
        {plan.plan30Day.map((item, i) => (
          <Text key={i} style={styles.listItem}>[ ] {item}</Text>
        ))}

        <Text style={styles.sectionHeading}>60-Day Action Plan (Repeatability + Conversion)</Text>
        {plan.plan60Day.map((item, i) => (
          <Text key={i} style={styles.listItem}>[ ] {item}</Text>
        ))}

        <Text style={styles.sectionHeading}>90-Day Action Plan (Scale + Expansion)</Text>
        {plan.plan90Day.map((item, i) => (
          <Text key={i} style={styles.listItem}>[ ] {item}</Text>
        ))}

        <Text style={styles.sectionHeading}>Recommended Metrics to Track</Text>
        {plan.metricsToTrack.map((m, i) => (
          <Text key={i} style={styles.listItem}>• {m}</Text>
        ))}

        <Text style={styles.sectionHeading}>Founder-Led Outreach Script</Text>
        <View style={styles.scriptBox}>
          <Text style={styles.scriptText}>"{plan.outreachScript}"</Text>
        </View>

        <Text style={styles.sectionHeading}>Distribution Differentiator Principle</Text>
        <Text style={styles.listItem}>• {plan.avoidOverbuildingRec}</Text>

        <Text style={styles.footer}>Generated by Quantana AI Cofounder · confidential growth plan</Text>
      </Page>
    </Document>
  );
}

export async function renderGrowthPlanPdf(
  founderName: string,
  startupName: string,
  plan: GrowthPlanRow,
): Promise<Buffer> {
  return renderToBuffer(<GrowthPlanDocument founderName={founderName} startupName={startupName} plan={plan} />);
}
