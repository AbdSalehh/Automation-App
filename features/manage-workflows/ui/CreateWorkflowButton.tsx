"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button, Input, Modal, Spinner } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { useWorkflowListStore } from "@/entities/workflow";

export function CreateWorkflowButton() {
  const router = useRouter();
  const { createWorkflow, isCreating } = useWorkflowListStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("");

  const handleCreate = async () => {
    if (!workflowName.trim()) {
      return;
    }

    const createdWorkflowId = await createWorkflow(workflowName.trim());

    if (createdWorkflowId) {
      setIsModalOpen(false);
      setWorkflowName("");
      router.push(ROUTES.workflow(createdWorkflowId));
    }
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <PlusIcon />
        Workflow Baru
      </Button>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Workflow Baru"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>

            <Button disabled={isCreating} onClick={handleCreate}>
              {isCreating && <Spinner />}
              Buat
            </Button>
          </>
        }
      >
        <label className="text-foreground mb-1 block text-sm font-medium">
          Nama Workflow
        </label>

        <Input
          autoFocus
          value={workflowName}
          onChange={(changeEvent) => setWorkflowName(changeEvent.target.value)}
          onKeyDown={(keyboardEvent) => {
            if (keyboardEvent.key === "Enter") {
              handleCreate();
            }
          }}
          placeholder="mis. Notifikasi WhatsApp Kasus Baru"
        />
      </Modal>
    </>
  );
}
