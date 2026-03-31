"use client";

import React, { useMemo, useEffect, useCallback, useState } from "react";
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
import { layoutElements } from "./_components/layout";


export default function DesignationHierarchy({
    data,
    onReorder,
}: {
    data: any[];
    onReorder?: () => void;
}) {
    const { getIntersectingNodes } = useReactFlow();
    const [direction] = useState<"TB" | "LR">("TB");

    /* -------- Nodes -------- */
    const baseNodes = useMemo<Node[]>(
        () =>
            data.map((d) => ({
                id: d.id.toString(),
                data: { label: d.designationName },
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

    /* -------- Edges -------- */
    const baseEdges = useMemo<Edge[]>(
        () =>
            data
                .filter((d) => d.parentDesignationId)
                .map((d) => ({
                    id: `edge-${d.parentDesignationId}-${d.id}`,
                    source: d.parentDesignationId.toString(),
                    target: d.id.toString(),
                    animated: true,
                })),
        [data]
    );

    const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
        () => layoutElements(baseNodes, baseEdges, direction),
        [baseNodes, baseEdges, direction]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

    useEffect(() => {
        const { nodes, edges } = layoutElements(
            baseNodes,
            baseEdges,
            direction
        );
        setNodes(nodes);
        setEdges(edges);
    }, [data]);

    /* -------- DRAG → PATCH -------- */
    const onNodeDragStop = useCallback(
        async (_, draggedNode) => {
            const intersect = getIntersectingNodes(draggedNode);
            if (!intersect.length) return;

            const parentNode = intersect[0];

            const childId = Number(draggedNode.id);
            const parentId = Number(parentNode.id);

            const child = data.find((d) => d.id === childId);
            if (!child) return;

            const token = localStorage.getItem("accessToken");


            await fetch(
                `${process.env.NEXT_PUBLIC_MAIN}/admin/designations/${childId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        designationName: child.designationName,
                        parentDesignationId: parentId,
                    }),
                }
            );

            onReorder?.();
        },
        [getIntersectingNodes, data, onReorder]
    );

    return (
        <div className="w-full h-[700px] border rounded-lg bg-white">
            <ReactFlow
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
