// updated
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analysis Results | SkillPath",
  description: "View your personalized skill gap analysis and custom learning roadmap for your target role.",
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
