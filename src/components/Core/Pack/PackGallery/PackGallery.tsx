import { useCallback, useMemo, useState } from 'react';
import { Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { foldAccents } from '@/utils/stringUtils';
import {
  resolvePackCategoryLabel,
  resolvePackDescription,
  resolvePackName,
} from '@/utils/packLabel';
import type { PackCategory, PackFile } from '@/schemas/pack';
import type { ImportDomainRule } from '@/schemas/importExport';
import type { DomainRuleSetting } from '@/types/syncSettings';
import type { JsonSourceInputState } from '@/components/UI/ImportExportWizards/Source';
import { PackCard } from './PackCard/PackCard';
import { PackCategoryHeader } from './PackCategoryHeader/PackCategoryHeader';

interface PackGalleryProps {
  packs: PackFile[];
  categories: PackCategory[];
  source: JsonSourceInputState<DomainRuleSetting[]>;
}

interface PackSelectionState {
  selected: boolean;
  rules: ImportDomainRule[];
}

function matchesSearch(pack: PackFile, normalized: string): boolean {
  if (!normalized) return true;
  const haystack = [
    resolvePackName(pack.pack),
    resolvePackDescription(pack.pack),
    resolvePackCategoryLabel(pack.pack),
  ]
    .filter(Boolean)
    .map((s) => foldAccents(s.toLowerCase()))
    .join(' ');
  return haystack.includes(normalized);
}

export function PackGallery({ packs, categories, source }: PackGalleryProps) {
  const [search, setSearch] = useState('');
  const [selections, setSelections] = useState<Record<string, PackSelectionState>>({});

  const normalizedSearch = useMemo(
    () => foldAccents(search.trim().toLowerCase()),
    [search],
  );

  const filteredPacks = useMemo(
    () => packs.filter((pack) => matchesSearch(pack, normalizedSearch)),
    [packs, normalizedSearch],
  );

  const isSearching = normalizedSearch.length > 0;

  const grouped = useMemo(() => {
    if (isSearching) return null;
    const map = new Map<string | null, PackFile[]>();
    for (const pack of filteredPacks) {
      const key = pack.pack.categoryId ?? null;
      const list = map.get(key) ?? [];
      list.push(pack);
      map.set(key, list);
    }
    return map;
  }, [filteredPacks, isSearching]);

  const handlePackChange = useCallback(
    (packId: string, next: PackSelectionState) => {
      setSelections((prev) => ({ ...prev, [packId]: next }));
    },
    [],
  );

  const totals = useMemo(() => {
    const allValues = Object.values(selections) as PackSelectionState[];
    const selectedPacks = allValues.filter((s) => s.selected);
    const ruleCount = selectedPacks.reduce((sum, s) => sum + s.rules.length, 0);
    return { packCount: selectedPacks.length, ruleCount };
  }, [selections]);

  const counterLabel =
    totals.packCount === 0
      ? getMessage('packGalleryGlobalCounterEmpty')
      : getMessage('packGalleryGlobalCounter', [
          String(totals.ruleCount),
          String(totals.packCount),
        ]);

  const handleConfirm = useCallback(() => {
    const aggregated: ImportDomainRule[] = [];
    for (const pack of packs) {
      const sel = selections[pack.pack.id];
      if (sel?.selected) aggregated.push(...sel.rules);
    }
    const payload = JSON.stringify({ domainRules: aggregated });
    source.handleTextChange(payload);
  }, [packs, selections, source]);

  if (packs.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="2"
        py="6"
        data-testid="pack-gallery-empty"
      >
        <Text size="2" color="gray">
          {getMessage('packGalleryEmptyState')}
        </Text>
      </Flex>
    );
  }

  const renderPack = (pack: PackFile) => {
    const sel = selections[pack.pack.id];
    return (
      <PackCard
        key={pack.pack.id}
        pack={pack}
        selected={sel?.selected ?? false}
        onSelectionChange={(next) => handlePackChange(pack.pack.id, next)}
      />
    );
  };

  return (
    <Flex direction="column" gap="3" data-testid="pack-gallery">
      <TextField.Root
        size="2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={getMessage('packGallerySearchPlaceholder')}
        aria-label={getMessage('packGallerySearchPlaceholder')}
      >
        <TextField.Slot>
          <Search size={14} aria-hidden="true" />
        </TextField.Slot>
      </TextField.Root>

      {filteredPacks.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py="4"
          data-testid="pack-gallery-search-empty"
        >
          <Text size="2" color="gray">
            {getMessage('packGallerySearchNoResult')}
          </Text>
        </Flex>
      ) : isSearching ? (
        <Flex direction="column" gap="2">
          {filteredPacks.map(renderPack)}
        </Flex>
      ) : (
        grouped && (
          <Flex direction="column" gap="1">
            {[
              ...categories
                .filter((cat) => grouped.has(cat.id))
                .map((cat) => ({
                  key: cat.id,
                  label: resolvePackCategoryLabel(cat),
                  icon: cat.icon,
                  packs: grouped.get(cat.id) ?? [],
                })),
              ...(grouped.has(null)
                ? [
                    {
                      key: '__inline__',
                      label: '',
                      icon: undefined,
                      packs: grouped.get(null) ?? [],
                    },
                  ]
                : []),
            ].map((bucket) => (
              <Box key={bucket.key}>
                {bucket.label && (
                  <PackCategoryHeader
                    label={bucket.label}
                    icon={bucket.icon}
                    count={bucket.packs.length}
                  />
                )}
                <Flex direction="column" gap="2">
                  {bucket.packs.map(renderPack)}
                </Flex>
              </Box>
            ))}
          </Flex>
        )
      )}

      <Flex
        align="center"
        justify="between"
        gap="3"
        mt="2"
        style={{
          borderTop: '1px solid var(--gray-4)',
          paddingTop: 'var(--space-3)',
        }}
      >
        <Text size="2" color="gray" data-testid="pack-gallery-counter">
          {counterLabel}
        </Text>
        <Button
          size="2"
          onClick={handleConfirm}
          disabled={totals.ruleCount === 0}
          data-testid="pack-gallery-confirm"
        >
          {getMessage('packGalleryConfirm')}
        </Button>
      </Flex>
    </Flex>
  );
}
