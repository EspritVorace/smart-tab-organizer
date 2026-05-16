import { useMemo, useState } from 'react';
import { Box, Callout, Flex, Text, TextField } from '@radix-ui/themes';
import { PackageCheck, PackageOpen, Search, SearchX } from 'lucide-react';
import { getMessage, getPluralMessage } from '@/utils/i18n';
import { foldAccents } from '@/utils/stringUtils';
import {
  resolvePackCategoryLabel,
  resolvePackDescription,
  resolvePackName,
} from '@/utils/packLabel';
import type { PackCategory, PackFile } from '@/schemas/pack';
import { computePackInstallStatus } from '@/utils/packInstallStatus';
import { PackCard } from './PackCard/PackCard';
import { PackCategoryHeader } from './PackCategoryHeader/PackCategoryHeader';
import {
  ALL_CATEGORIES,
  PackCategoryNav,
} from './PackCategoryNav/PackCategoryNav';
import type { PackSelectionState } from './usePackSelections';
import styles from './PackGallery.module.css';

interface PackGalleryProps {
  packs: PackFile[];
  categories: PackCategory[];
  selections: Record<string, PackSelectionState>;
  onSelectionChange: (packId: string, next: PackSelectionState) => void;
  existingRuleIds?: ReadonlySet<string>;
}

const EMPTY_RULE_IDS: ReadonlySet<string> = new Set();

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

function computeTotals(selections: Record<string, PackSelectionState>): {
  packCount: number;
  ruleCount: number;
} {
  let packCount = 0;
  let ruleCount = 0;
  for (const s of Object.values(selections)) {
    if (!s.selected) continue;
    packCount += 1;
    ruleCount += s.rules.length;
  }
  return { packCount, ruleCount };
}

export function PackGallery({
  packs,
  categories,
  selections,
  onSelectionChange,
  existingRuleIds = EMPTY_RULE_IDS,
}: PackGalleryProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);

  const normalizedSearch = useMemo(
    () => foldAccents(search.trim().toLowerCase()),
    [search],
  );

  const searchFilteredPacks = useMemo(
    () => packs.filter((pack) => matchesSearch(pack, normalizedSearch)),
    [packs, normalizedSearch],
  );

  const isSearching = normalizedSearch.length > 0;
  const totals = useMemo(() => computeTotals(selections), [selections]);

  const countsByCategory = useMemo(() => {
    const map = new Map<string | null, number>();
    for (const pack of packs) {
      const key = pack.pack.categoryId ?? null;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [packs]);

  const filteredPacks = useMemo(() => {
    if (isSearching) return searchFilteredPacks;
    if (activeCategory === ALL_CATEGORIES) return searchFilteredPacks;
    return searchFilteredPacks.filter(
      (pack) => pack.pack.categoryId === activeCategory,
    );
  }, [activeCategory, isSearching, searchFilteredPacks]);

  const grouped = useMemo(() => {
    if (isSearching) return null;
    if (activeCategory !== ALL_CATEGORIES) return null;
    const map = new Map<string | null, PackFile[]>();
    for (const pack of filteredPacks) {
      const key = pack.pack.categoryId ?? null;
      const list = map.get(key) ?? [];
      list.push(pack);
      map.set(key, list);
    }
    return map;
  }, [activeCategory, filteredPacks, isSearching]);

  if (packs.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="2"
        py="7"
        data-testid="pack-gallery-empty"
      >
        <PackageOpen
          size={32}
          aria-hidden="true"
          style={{ color: 'var(--gray-9)' }}
        />
        <Text size="2" color="gray">
          {getMessage('packGalleryEmptyState')}
        </Text>
      </Flex>
    );
  }

  const renderPack = (pack: PackFile) => {
    const sel = selections[pack.pack.id];
    const installInfo = computePackInstallStatus(pack, existingRuleIds);
    return (
      <PackCard
        key={pack.pack.id}
        pack={pack}
        selected={sel?.selected ?? false}
        onSelectionChange={(next) => onSelectionChange(pack.pack.id, next)}
        installInfo={installInfo}
      />
    );
  };

  const summaryLine =
    totals.packCount > 0 ? (
      <Callout.Root
        color="indigo"
        size="1"
        variant="soft"
        data-testid="pack-gallery-selection-summary"
        role="status"
        aria-live="polite"
      >
        <Callout.Icon>
          <PackageCheck size={14} aria-hidden="true" />
        </Callout.Icon>
        <Callout.Text>
          <Text weight="medium">
            {getPluralMessage(
              totals.packCount,
              'packGallerySelectionSummaryPacksOne',
              'packGallerySelectionSummaryPacks',
            )}
          </Text>
          {' · '}
          {getPluralMessage(
            totals.ruleCount,
            'packGalleryRuleCountOne',
            'packGalleryRuleCount',
          )}
        </Callout.Text>
      </Callout.Root>
    ) : null;

  return (
    <Flex
      direction="column"
      gap="3"
      data-testid="pack-gallery"
      className={styles.gallery}
    >
      <Box className={styles.searchSticky}>
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
      </Box>

      {summaryLine}

      {!isSearching && (
        <PackCategoryNav
          categories={categories}
          countsByCategory={countsByCategory}
          totalCount={packs.length}
          activeCategory={activeCategory}
          onActiveCategoryChange={setActiveCategory}
        />
      )}

      {filteredPacks.length === 0 && isSearching && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="2"
          py="6"
          data-testid="pack-gallery-search-empty"
        >
          <SearchX
            size={32}
            aria-hidden="true"
            style={{ color: 'var(--gray-9)' }}
          />
          <Text size="2" color="gray">
            {getMessage('packGallerySearchNoResult')}
          </Text>
        </Flex>
      )}

      {filteredPacks.length === 0 &&
        !isSearching &&
        activeCategory !== ALL_CATEGORIES && (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="2"
            py="6"
            data-testid="pack-gallery-category-empty"
          >
            <PackageOpen
              size={32}
              aria-hidden="true"
              style={{ color: 'var(--gray-9)' }}
            />
            <Text size="2" color="gray">
              {getMessage('packGalleryCategoryEmpty')}
            </Text>
          </Flex>
        )}

      {filteredPacks.length > 0 && isSearching && (
        <Box className={styles.packList}>{filteredPacks.map(renderPack)}</Box>
      )}

      {filteredPacks.length > 0 &&
        !isSearching &&
        activeCategory !== ALL_CATEGORIES && (
          <Box className={styles.packList}>{filteredPacks.map(renderPack)}</Box>
        )}

      {filteredPacks.length > 0 && !isSearching && grouped && (
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
              <Box className={styles.packList}>{bucket.packs.map(renderPack)}</Box>
            </Box>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
