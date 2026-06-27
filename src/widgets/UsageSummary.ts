import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowContextLengthTokens } from '../utils/context-window';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function weeklyDaysRemaining(weeklyResetAt?: string): number | null {
    if (!weeklyResetAt) {
        return null;
    }

    const resetMs = Date.parse(weeklyResetAt);
    if (Number.isNaN(resetMs)) {
        return null;
    }

    const remainingMs = resetMs - Date.now();
    if (remainingMs <= 0) {
        return 0;
    }

    return Math.ceil(remainingMs / MS_PER_DAY);
}

function formatLocalClock(resetAt?: string): string | null {
    if (!resetAt) {
        return null;
    }

    const ms = Date.parse(resetAt);
    if (Number.isNaN(ms)) {
        return null;
    }

    const date = new Date(ms);
    const pad = (value: number): string => value.toString().padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export class UsageSummaryWidget implements Widget {
    getDefaultColor(): string { return 'brightWhite'; }
    getDescription(): string { return 'Shows 5h/7d usage limits, reset clock, context length and session cost in one line'; }
    getDisplayName(): string { return 'Usage Summary'; }
    getCategory(): string { return 'Usage'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return '5h:6% ends 19:30  context:96,124  max  $1.46  3d:16%';
        }

        const segments: string[] = [];
        const usage = context.usageData ?? {};

        if (usage.sessionUsage !== undefined) {
            const percent = Math.round(Math.max(0, Math.min(100, usage.sessionUsage)));
            let group = `5h:${percent}%`;
            const clock = formatLocalClock(usage.sessionResetAt);
            if (clock) {
                group += ` ends ${clock}`;
            }
            segments.push(group);
        }

        const contextLength = getContextWindowContextLengthTokens(context.data) ?? context.tokenMetrics?.contextLength;
        if (contextLength !== undefined) {
            segments.push(`context:${contextLength.toLocaleString('en-US')}`);
        }

        const effort = context.data?.effort?.level;
        if (effort) {
            segments.push(effort);
        }

        const cost = context.data?.cost?.total_cost_usd;
        if (cost !== undefined) {
            segments.push(`$${cost.toFixed(2)}`);
        }

        if (usage.weeklyUsage !== undefined) {
            const percent = Math.round(Math.max(0, Math.min(100, usage.weeklyUsage)));
            const days = weeklyDaysRemaining(usage.weeklyResetAt);
            const daysLabel = days !== null ? `${days}d` : '7d';
            segments.push(`${daysLabel}:${percent}%`);
        }

        return segments.length > 0 ? segments.join('  ') : null;
    }

    supportsRawValue(): boolean { return false; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
