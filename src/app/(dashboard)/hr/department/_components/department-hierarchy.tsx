"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
} from "reactflow";

import "reactflow/dist/style.css";
import type { Department } from "@/types/departments";
import { layoutElements } from "./layout";

export default function DepartmentHierarchy({ data, onReorder }) {
  const { getIntersectingNodes } = useReactFlow();
  const [direction] = useState<"TB" | "LR">("TB");
  const [refreshKey, setRefreshKey] = useState(0);

  // Build Nodes
  const baseNodes = useMemo<Node[]>(
    () =>
      data.map((d) => ({
        id: d.id.toString(),
        type: "default",
        data: { label: d.departmentName },
        position: { x: 0, y: 0 },
        style: {
          padding: 10,
          borderRadius: 8,
          background: "#fff",
          border: "1px solid #888",
        },
      })),
    [data]
  );

  // Build Edges
  const baseEdges = useMemo<Edge[]>(
    () =>
      data
        .filter((d) => d.parentDepartmentId)
        .map((d) => ({
          id: `edge-${d.parentDepartmentId}-${d.id}`,
          source: d.parentDepartmentId!.toString(),
          target: d.id.toString(),
          animated: true,
        })),
    [data]
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutElements(baseNodes, baseEdges, direction),
    [baseNodes, baseEdges, direction]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Re-render whole tree when data updates
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = layoutElements(
      baseNodes,
      baseEdges,
      direction
    );
    setNodes(newNodes);
    setEdges(newEdges);
    setRefreshKey((k) => k + 1);
  }, [data]);

  // ⭐ FINAL WORKING DRAG-TO-RE-PARENT
  const onNodeDragStop = useCallback(
    async (_, draggedNode) => {
      const intersect = getIntersectingNodes(draggedNode);

      if (intersect.length === 0) return;

      const newParent = intersect[0];

      const childId = Number(draggedNode.id);
      const parentId = Number(newParent.id);

      // MUST SEND departmentName in body
      const childDept = data.find((d) => d.id === childId);
      if (!childDept) return;

      const token = localStorage.getItem("accessToken");

      await fetch(
        `${process.env.NEXT_PUBLIC_MAIN}/admin/departments/${childId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            departmentName: childDept.departmentName,
            parentDepartmentId: parentId,
          }),
        }
      );

      await onReorder?.();
    },
    [getIntersectingNodes, data, onReorder]
  );

  return (
    <div className="w-full h-[700px] border rounded-lg bg-white">
      <ReactFlow
        key={refreshKey}
        nodes={nodes}
        edges={edges}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
