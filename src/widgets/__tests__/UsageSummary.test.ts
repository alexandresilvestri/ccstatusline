import {
    describe,
    expect,
    it
} from 'vitest';

import type { RenderContext } from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import { UsageSummaryWidget } from '../UsageSummary';

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

function localClock(iso: string): string {
    const date = new Date(Date.parse(iso));
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('UsageSummary widget', () => {
    it('renders the full summary line with every segment', () => {
        const resetAt = '2026-06-27T19:30:00.000Z';
        const weeklyResetAt = new Date(Date.now() + 2.5 * MS_PER_DAY).toISOString();
        const context: RenderContext = {
            usageData: { sessionUsage: 6, sessionResetAt: resetAt, weeklyUsage: 16, weeklyResetAt },
            tokenMetrics: {
                inputTokens: 0,
                outputTokens: 0,
                cachedTokens: 0,
                totalTokens: 0,
                contextLength: 96124
            },
            data: { cost: { total_cost_usd: 1.46 }, effort: { level: 'max' } }
        };

        const output = new UsageSummaryWidget().render({ id: 'u', type: 'usage-summary' }, context, DEFAULT_SETTINGS);
        expect(output).toBe(`5h:6% ends ${localClock(resetAt)}  context:96,124  max  $1.46  3d:16%`);
    });

    it('rounds percentages to integers and clamps them to 0-100', () => {
        const context: RenderContext = { usageData: { sessionUsage: 5.6, weeklyUsage: 120 } };

        const output = new UsageSummaryWidget().render({ id: 'u', type: 'usage-summary' }, context, DEFAULT_SETTINGS);
        expect(output).toBe('5h:6%  7d:100%');
    });

    it('omits the reset clock when sessionResetAt is absent', () => {
        const context: RenderContext = { usageData: { sessionUsage: 6 } };

        const output = new UsageSummaryWidget().render({ id: 'u', type: 'usage-summary' }, context, DEFAULT_SETTINGS);
        expect(output).toBe('5h:6%');
    });

    it('degrades gracefully to context and cost when usage data is absent', () => {
        const context: RenderContext = {
            tokenMetrics: {
                inputTokens: 0,
                outputTokens: 0,
                cachedTokens: 0,
                totalTokens: 0,
                contextLength: 96124
            },
            data: { cost: { total_cost_usd: 1.46 } }
        };

        const output = new UsageSummaryWidget().render({ id: 'u', type: 'usage-summary' }, context, DEFAULT_SETTINGS);
        expect(output).toBe('context:96,124  $1.46');
    });

    it('returns the sample line in preview mode', () => {
        const context: RenderContext = { isPreview: true };

        const output = new UsageSummaryWidget().render({ id: 'u', type: 'usage-summary' }, context, DEFAULT_SETTINGS);
        expect(output).toBe('5h:6% ends 19:30  context:96,124  max  $1.46  3d:16%');
    });

    it('places effort after context and omits it when data.effort is absent', () => {
        const context: RenderContext = {
            usageData: { sessionUsage: 6, weeklyUsage: 16 },
            tokenMetrics: {
                inputTokens: 0,
                outputTokens: 0,
                cachedTokens: 0,
                totalTokens: 0,
                contextLength: 96124
            }
        };

        const output = new UsageSummaryWidget().render({ id: 'u', type: 'usage-summary' }, context, DEFAULT_SETTINGS);
        expect(output).toBe('5h:6%  context:96,124  7d:16%');
    });

    it('returns null when no data is available', () => {
        const context: RenderContext = {};

        const output = new UsageSummaryWidget().render({ id: 'u', type: 'usage-summary' }, context, DEFAULT_SETTINGS);
        expect(output).toBeNull();
    });
});
