import React, { useState } from 'react';
import { ScrollArea } from '@radix-ui/themes';
import { GroupRowBase } from '../TabTree/GroupRowBase';
import { TabRowBase } from '../TabTree/TabRowBase';
import { extractDomain } from '../TabTree/tabTreeUtils';
import type { Session } from '../../../types/session';

interface SessionPreviewTreeProps {
  session: Session;
}

export function SessionPreviewTree({ session }: SessionPreviewTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(session.groups.map((g) => g.id)),
  );

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const content = (
    <div>
      {session.groups.map((group) => (
        <React.Fragment key={group.id}>
          <GroupRowBase
            color={group.color}
            title={group.title}
            tabCount={group.tabs.length}
            isExpanded={expandedGroups.has(group.id)}
            onToggleExpand={() => toggleGroup(group.id)}
            level={1}
          />
          {expandedGroups.has(group.id) &&
            group.tabs.map((tab) => (
              <TabRowBase
                key={tab.id}
                favIconUrl={tab.favIconUrl}
                title={tab.title}
                domain={extractDomain(tab.url)}
                fullUrl={tab.url}
                level={2}
              />
            ))}
        </React.Fragment>
      ))}

      {session.ungroupedTabs.map((tab) => (
        <TabRowBase
          key={tab.id}
          favIconUrl={tab.favIconUrl}
          title={tab.title}
          domain={extractDomain(tab.url)}
          fullUrl={tab.url}
          level={1}
        />
      ))}
    </div>
  );

  return (
    <ScrollArea style={{ maxHeight: 220 }} scrollbars="vertical">
      {content}
    </ScrollArea>
  );
}
