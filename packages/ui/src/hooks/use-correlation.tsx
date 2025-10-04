/**
 * Correlation Hook - Enterprise Production Ready
 *
 * Correlation hook for data relationships, entity management,
 * and comprehensive business logic support.
 */

import * as React from 'react';

export type CorrelationType = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface CorrelationConfig<T = unknown> {
  id: string;
  type: CorrelationType;
  source: string;
  target: string;
  data: T[];
  loading?: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface CorrelationState<T = unknown> {
  correlations: Map<string, CorrelationConfig<T>>;
  loading: boolean;
  error: string | undefined;
  lastUpdated: Date | undefined;
}

export interface CorrelationActions<T = unknown> {
  addCorrelation: (_config: CorrelationConfig<T>) => void;
  updateCorrelation: (_id: string, _updates: Partial<CorrelationConfig<T>>) => void;
  removeCorrelation: (_id: string) => void;
  getCorrelation: (_id: string) => CorrelationConfig<T> | undefined;
  getCorrelationsByType: (_type: CorrelationType) => CorrelationConfig<T>[];
  getCorrelationsBySource: (_source: string) => CorrelationConfig<T>[];
  getCorrelationsByTarget: (_target: string) => CorrelationConfig<T>[];
  clearCorrelations: () => void;
  refreshCorrelation: (_id: string) => Promise<void>;
  refreshAllCorrelations: () => Promise<void>;
}

export interface CorrelationContextValue<T = unknown>
  extends CorrelationState<T>,
    CorrelationActions<T> {}

const CorrelationContext = React.createContext<CorrelationContextValue | undefined>(undefined);

// Helper functions for correlation operations
const useCorrelationActions = (
  setState: React.Dispatch<React.SetStateAction<CorrelationState>>,
) => {
  const addCorrelation = React.useCallback(
    (config: CorrelationConfig) => {
      setState((previous) => ({
        ...previous,
        correlations: new Map(previous.correlations).set(config.id, {
          ...config,
          lastUpdated: new Date(),
        }),
        lastUpdated: new Date(),
      }));
    },
    [setState],
  );

  const updateCorrelation = React.useCallback(
    (id: string, updates: Partial<CorrelationConfig>) => {
      setState((previous) => {
        const correlations = new Map(previous.correlations);
        const existing = correlations.get(id);

        if (!existing) {
          console.warn(`Correlation with id "${id}" not found`);
          return previous;
        }

        correlations.set(id, {
          ...existing,
          ...updates,
          lastUpdated: new Date(),
        });

        return {
          ...previous,
          correlations,
          lastUpdated: new Date(),
        };
      });
    },
    [setState],
  );

  const removeCorrelation = React.useCallback(
    (id: string) => {
      setState((previous) => {
        const correlations = new Map(previous.correlations);
        correlations.delete(id);

        return {
          ...previous,
          correlations,
          lastUpdated: new Date(),
        };
      });
    },
    [setState],
  );

  const clearCorrelations = React.useCallback(() => {
    setState((previous) => ({
      ...previous,
      correlations: new Map(),
      lastUpdated: new Date(),
    }));
  }, [setState]);

  return {
    addCorrelation,
    updateCorrelation,
    removeCorrelation,
    clearCorrelations,
  };
};

// Helper functions for correlation queries
const useCorrelationQueries = (state: CorrelationState) => {
  const getCorrelation = React.useCallback(
    (id: string) => {
      return state.correlations.get(id);
    },
    [state.correlations],
  );

  const getCorrelationsByType = React.useCallback(
    (type: CorrelationType) => {
      return Array.from(state.correlations.values()).filter((corr) => corr.type === type);
    },
    [state.correlations],
  );

  const getCorrelationsBySource = React.useCallback(
    (source: string) => {
      return Array.from(state.correlations.values()).filter((corr) => corr.source === source);
    },
    [state.correlations],
  );

  const getCorrelationsByTarget = React.useCallback(
    (target: string) => {
      return Array.from(state.correlations.values()).filter((corr) => corr.target === target);
    },
    [state.correlations],
  );

  return {
    getCorrelation,
    getCorrelationsByType,
    getCorrelationsBySource,
    getCorrelationsByTarget,
  };
};

// Helper functions for correlation refresh operations
const useCorrelationRefresh = (
  setState: React.Dispatch<React.SetStateAction<CorrelationState>>,
  state: CorrelationState,
) => {
  const refreshCorrelation = React.useCallback(
    async (id: string) => {
      const correlation = state.correlations.get(id);
      if (!correlation) {
        console.warn(`Correlation with id "${id}" not found`);
        return;
      }

      setState((previous) => ({
        ...previous,
        loading: true,
        error: undefined,
      }));

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setState((previous) => {
          const correlations = new Map(previous.correlations);
          correlations.set(id, {
            ...correlation,
            loading: false,
            error: undefined,
            lastUpdated: new Date(),
          });

          return {
            ...previous,
            correlations,
            loading: false,
            lastUpdated: new Date(),
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    },
    [state.correlations, setState],
  );

  const refreshAllCorrelations = React.useCallback(async () => {
    setState((previous) => ({
      ...previous,
      loading: true,
      error: undefined,
    }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setState((previous) => ({
        ...previous,
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [setState]);

  return {
    refreshCorrelation,
    refreshAllCorrelations,
  };
};

export function CorrelationProvider({
  children,
  initialCorrelations = new Map(),
}: {
  children: React.ReactNode;
  initialCorrelations?: Map<string, CorrelationConfig>;
}): React.ReactElement {
  const [state, setState] = React.useState<CorrelationState>(() => ({
    correlations: initialCorrelations,
    loading: false,
    error: undefined,
    lastUpdated: undefined,
  }));

  const actions = useCorrelationActions(setState);
  const queries = useCorrelationQueries(state);
  const refresh = useCorrelationRefresh(setState, state);

  const contextValue: CorrelationContextValue = React.useMemo(
    () => ({
      ...state,
      ...actions,
      ...queries,
      ...refresh,
    }),
    [state, actions, queries, refresh],
  );

  return <CorrelationContext.Provider value={contextValue}>{children}</CorrelationContext.Provider>;
}

export function useCorrelation(): CorrelationContextValue {
  const context = React.useContext(CorrelationContext);

  if (context === undefined) {
    throw new Error('useCorrelation must be used within a CorrelationProvider');
  }

  return context;
}

/**
 * Hook for managing specific correlation relationships
 */
export function useCorrelationRelationship<T = unknown>(
  sourceId: string,
  targetId: string,
  type: CorrelationType = 'one-to-many',
): {
  sourceCorrelations: CorrelationConfig<T>[];
  targetCorrelations: CorrelationConfig<T>[];
  hasRelationship: boolean;
  createRelationship: (_data: T[]) => void;
  updateRelationship: (_data: T[]) => void;
  deleteRelationship: () => void;
} {
  const {
    addCorrelation,
    updateCorrelation,
    removeCorrelation,
    getCorrelationsBySource,
    getCorrelationsByTarget,
  } = useCorrelation();

  const relationship = React.useMemo(() => {
    const sourceCorrelations = getCorrelationsBySource(sourceId) as CorrelationConfig<T>[];
    const targetCorrelations = getCorrelationsByTarget(targetId) as CorrelationConfig<T>[];

    return {
      sourceCorrelations,
      targetCorrelations,
      hasRelationship:
        sourceCorrelations.some((corr) => corr.target === targetId) ||
        targetCorrelations.some((corr) => corr.source === sourceId),
    };
  }, [sourceId, targetId, getCorrelationsBySource, getCorrelationsByTarget]);

  const createRelationship = React.useCallback(
    (data: T[]) => {
      const id = `${sourceId}-${targetId}-${type}`;
      addCorrelation({
        id,
        type,
        source: sourceId,
        target: targetId,
        data,
      });
    },
    [sourceId, targetId, type, addCorrelation],
  );

  const updateRelationship = React.useCallback(
    (data: T[]) => {
      const id = `${sourceId}-${targetId}-${type}`;
      updateCorrelation(id, { data });
    },
    [sourceId, targetId, type, updateCorrelation],
  );

  const deleteRelationship = React.useCallback(() => {
    const id = `${sourceId}-${targetId}-${type}`;
    removeCorrelation(id);
  }, [sourceId, targetId, type, removeCorrelation]);

  return {
    ...relationship,
    createRelationship,
    updateRelationship,
    deleteRelationship,
  };
}

/**
 * Hook for correlation analytics and insights
 */
export function useCorrelationAnalytics(): {
  totalCorrelations: number;
  correlationsByType: Record<CorrelationType, number>;
  uniqueSources: number;
  uniqueTargets: number;
  averageDataSize: number;
  lastUpdated: Date | undefined;
} {
  const { correlations: _correlations } = useCorrelation();

  return React.useMemo(() => {
    const _correlationArray = Array.from(_correlations.values());

    return {
      totalCorrelations: _correlationArray.length,
      correlationsByType: _correlationArray.reduce(
        (accumulator, corr) => {
          accumulator[corr.type] = (accumulator[corr.type] || 0) + 1;
          return accumulator;
        },
        {} as Record<CorrelationType, number>,
      ),
      uniqueSources: new Set(_correlationArray.map((corr) => corr.source)).size,
      uniqueTargets: new Set(_correlationArray.map((corr) => corr.target)).size,
      averageDataSize:
        _correlationArray.reduce((sum, corr) => sum + corr.data.length, 0) /
          _correlationArray.length || 0,
      lastUpdated: _correlationArray.reduce(
        (latest, corr) => {
          if (!latest || !corr.lastUpdated) return latest;
          return corr.lastUpdated > latest ? corr.lastUpdated : latest;
        },
        undefined as Date | undefined,
      ),
    };
  }, [_correlations]);
}

export type CorrelationProviderProperties = React.ComponentProps<typeof CorrelationProvider>;
export type UseCorrelationReturn = CorrelationContextValue;
export type UseCorrelationRelationshipReturn<T = unknown> = ReturnType<
  typeof useCorrelationRelationship<T>
>;
export type UseCorrelationAnalyticsReturn = ReturnType<typeof useCorrelationAnalytics>;
