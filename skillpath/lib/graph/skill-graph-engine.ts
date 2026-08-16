import Graph from "graphology";
import type { RoleAdjacencyGraph } from "@/types/agent-state";

export class SkillGraphEngine {
  private graph: Graph;

  constructor() {
    this.graph = new Graph({ type: "directed", multi: false });
  }

  public populateFromRoleAdjacency(roleGraph: RoleAdjacencyGraph): void {
    this.graph.clear();

    // Add nodes
    Object.values(roleGraph).forEach((role) => {
      if (!this.graph.hasNode(role.slug)) {
        this.graph.addNode(role.slug, {
          label: role.label,
          baseSalary: role.baseSalary,
        });
      }
    });

    // Add directed edges
    Object.values(roleGraph).forEach((role) => {
      role.adjacentRoles.forEach((edge) => {
        if (this.graph.hasNode(role.slug) && this.graph.hasNode(edge.targetSlug)) {
          if (!this.graph.hasEdge(role.slug, edge.targetSlug)) {
            this.graph.addEdge(role.slug, edge.targetSlug, {
              weight: edge.transitionDifficulty,
            });
          }
        }
      });
    });
  }

  public getNodeCount(): number {
    return this.graph.order;
  }

  public getEdgeCount(): number {
    return this.graph.size;
  }

  public getDirectNeighbors(nodeSlug: string): string[] {
    if (!this.graph.hasNode(nodeSlug)) return [];
    return this.graph.outNeighbors(nodeSlug);
  }

  public getPrerequisites(nodeSlug: string): string[] {
    if (!this.graph.hasNode(nodeSlug)) return [];
    return this.graph.inNeighbors(nodeSlug);
  }
}
