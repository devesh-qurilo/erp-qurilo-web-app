import dagre from "dagre";
import type { Node, Edge } from "reactflow";

export function layoutElements(
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction });
  g.setDefaultEdgeLabel(() => ({}));

  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 80;

  nodes.forEach((n) =>
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  );
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const laidOutNodes = nodes.map((n) => {
    const nodeWithPosition = g.node(n.id);
    if (nodeWithPosition) {
      return {
        ...n,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
      };
    }
    return n;
  });

  return { nodes: laidOutNodes, edges };
}
