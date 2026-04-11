"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createTaskLabel, getStoredAccessToken } from "../api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  onCreated: () => void;
}

export const AddLabelModal: React.FC<Props> = ({
  open,
  onOpenChange,
  projectId,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [colorCode, setColorCode] = useState("#000000");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }

    try {
      setLoading(true);
      await createTaskLabel(token, {
        name,
        colorCode,
        projectId: Number(projectId),
        description,
      });

      onCreated(); // refresh labels
      onOpenChange(false);
      setName("");
      setDescription("");
    } catch {
      alert("Failed to create label");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>Add Label</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Color</Label>
            <Input
              type="color"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
