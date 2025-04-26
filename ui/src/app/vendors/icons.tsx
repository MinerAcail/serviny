import React, { useState, useMemo } from 'react';
import * as lucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input'; // Or use any other Input if you prefer
import { ScrollArea } from '@/components/ui/scroll-area'; // Optional, for better scrolling

export default function LucideIconPicker() {
  const [search, setSearch] = useState('');

  // Get all Lucide icon names and components
  const iconEntries = useMemo(() => {
    return Object.entries(lucideIcons).filter(([name]) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Only show the first 5 icons in the list
  const displayedIcons = iconEntries.slice(0, 20);

  return (
    <div className="p-4 space-y-4">
      <Input
        placeholder="Search Lucide icons..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />

      <ScrollArea className="h-[400px] rounded-md border p-2">
        <div className="grid grid-cols-5 gap-4">
          {displayedIcons.map(([name, Icon]) => (
            <div
              key={name}
              className="flex flex-col items-center text-xs hover:bg-muted p-2 rounded-md cursor-pointer"
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-center break-words">{name}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
