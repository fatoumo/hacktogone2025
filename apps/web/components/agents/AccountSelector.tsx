"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface Account {
  id: string;
  name: string;
  description?: string;
  tier: string;
  max_concurrent: number;
  monthly_chars: number;
  enabled: boolean;
  configured: boolean;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onAccountChange: (accountId: string) => void;
  className?: string;
}

export function AccountSelector({
  accounts,
  selectedAccountId,
  onAccountChange,
  className,
}: AccountSelectorProps) {
  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  return (
    <div className={className}>
      <Select
        value={selectedAccountId || undefined}
        onValueChange={onAccountChange}
      >
        <SelectTrigger className="w-full md:w-[300px]">
          <SelectValue placeholder="Select an account">
            {selectedAccount && (
              <div className="flex items-center gap-2">
                <span>{selectedAccount.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedAccount.tier}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{account.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {account.tier}
                  </Badge>
                </div>
                {account.description && (
                  <span className="text-xs text-muted-foreground">
                    {account.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
