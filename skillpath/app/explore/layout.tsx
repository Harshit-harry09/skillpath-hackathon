// updated
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Roles | SkillPath",
  description: "Discover high-demand roles and identify the exact skills you need to transition into your next career move.",
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
