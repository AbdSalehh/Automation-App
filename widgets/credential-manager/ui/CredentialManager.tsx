"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { Button, Modal } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { staggerContainer } from "@/shared/lib/motion-presets";
import { useCredentialStore } from "@/entities/credential";
import { CredentialForm } from "@/features/manage-credentials";
import { CredentialStatsCards } from "./CredentialStatsCards";
import {
  CredentialFilterBar,
  type CredentialFilters,
} from "./CredentialFilterBar";
import { CredentialTableRow } from "./CredentialTableRow";
import {
  deriveCredentialMetrics,
  summarizeCredentials,
} from "../lib/credentialMetrics";

const INITIAL_FILTERS: CredentialFilters = {
  search: "",
  type: "all",
  status: "all",
  sort: "name",
};

const TABLE_HEADERS = [
  "Credential",
  "Type",
  "Status",
  "Last Used",
  "Created",
  "",
];

export function CredentialManager() {
  const { credentials, isLoading, errorMessage, fetchCredentials } =
    useCredentialStore();

  const [filters, setFilters] = useState<CredentialFilters>(INITIAL_FILTERS);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const summary = useMemo(
    () => summarizeCredentials(credentials),
    [credentials],
  );

  const filteredCredentials = useMemo(() => {
    const matched = credentials.filter((credential) => {
      const metrics = deriveCredentialMetrics(credential);

      const matchesSearch = credential.name
        .toLowerCase()
        .includes(filters.search.toLowerCase());

      const matchesType =
        filters.type === "all" || metrics.typeLabel === filters.type;

      const matchesStatus =
        filters.status === "all" || metrics.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });

    if (filters.sort === "name") {
      return [...matched].sort((first, second) =>
        first.name.localeCompare(second.name),
      );
    }

    return matched;
  }, [credentials, filters]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Credentials</h1>
          <p className="text-muted-foreground text-sm">
            Manage all credentials and connections used in your workflows.
          </p>
        </div>

        <Button
          onClick={() => setIsFormOpen(true)}
          className="gap-2 bg-orange-500 text-white hover:bg-orange-600"
        >
          <PlusIcon className="size-4" />
          New Credential
        </Button>
      </div>

      <CredentialStatsCards
        total={summary.total}
        encrypted={summary.encrypted}
        connected={summary.connected}
        expired={summary.expired}
      />

      <CredentialFilterBar filters={filters} onChange={setFilters} />

      {errorMessage && (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_unused, index) => (
            <div
              key={index}
              className="bg-muted h-16 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : filteredCredentials.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed py-16 text-center">
          No credentials match the filter.
        </div>
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-border bg-muted/40 border-b">
                  {TABLE_HEADERS.map((header, index) => (
                    <th
                      key={header || index}
                      className={cn(
                        "text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase",
                        index === TABLE_HEADERS.length - 1 && "text-right",
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <motion.tbody
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {filteredCredentials.map((credential) => (
                  <CredentialTableRow
                    key={credential.id}
                    credential={credential}
                  />
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add Credential"
      >
        <CredentialForm onCreated={() => setIsFormOpen(false)} />
      </Modal>
    </div>
  );
}
