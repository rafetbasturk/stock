// src/components/DateRangeFilter.tsx
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { tr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  label: string;
  start?: string;
  end?: string;
  onChange: (updates: { startDate?: string; endDate?: string }) => void;
}

type PresetKey = "twoMonthsAgo" | "lastMonth" | "thisMonth";

export function DateRangeFilter({
  label,
  start,
  end,
  onChange,
}: DateRangeFilterProps) {
  const [open, setOpen] = React.useState(false);

  const now = new Date();
  const twoMonthsAgo = subMonths(now, 2);
  const lastMonth = subMonths(now, 1);

  // Local draft state → URL'den gelen değerleri baz al
  const [draftStart, setDraftStart] = React.useState<Date | undefined>(
    start ? new Date(start + "T00:00:00") : undefined
  );
  const [draftEnd, setDraftEnd] = React.useState<Date | undefined>(
    end ? new Date(end + "T00:00:00") : undefined
  );

  // URL değiştiğinde draft'ı da sync'le
  React.useEffect(() => {
    setDraftStart(start ? new Date(start + "T00:00:00") : undefined);
    setDraftEnd(end ? new Date(end + "T00:00:00") : undefined);
  }, [start, end]);

  // Quick presets
  const applyPreset = (preset: PresetKey) => {
    let rangeStart: Date;
    let rangeEnd: Date;

    switch (preset) {
      case "twoMonthsAgo":
        rangeStart = startOfMonth(twoMonthsAgo);
        rangeEnd = endOfMonth(twoMonthsAgo);
        break;
      case "lastMonth":
        rangeStart = startOfMonth(lastMonth);
        rangeEnd = endOfMonth(lastMonth);
        break;
      case "thisMonth":
      default:
        rangeStart = startOfMonth(now);
        rangeEnd = endOfMonth(now);
        break;
    }

    setDraftStart(rangeStart);
    setDraftEnd(rangeEnd);

    onChange({
      startDate: format(rangeStart, "yyyy-MM-dd"),
      endDate: format(rangeEnd, "yyyy-MM-dd"),
    });

    setOpen(false);
  };

  const monthLabels = React.useMemo(
    () => ({
      twoMonthsAgo: twoMonthsAgo.toLocaleString("tr-TR", {
        month: "long",
      }),
      lastMonth: lastMonth.toLocaleString("tr-TR", {
        month: "long",
      }),
      thisMonth: now.toLocaleString("tr-TR", {
        month: "long",
      }),
    }),
    [now, twoMonthsAgo, lastMonth]
  );

  const handleClear = () => {
    setDraftStart(undefined);
    setDraftEnd(undefined);
    onChange({ startDate: undefined, endDate: undefined });
    setOpen(false);
  };

  // ✅ Single-mode, manual 2-click range logic
  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    // 1. Eğer hiç başlangıç yoksa, ya da daha önce bir aralık tamamlandıysa
    //    veya tıklanan tarih mevcut başlangıçtan önceyse → yeni seçim başlat
    if (!draftStart || (draftStart && draftEnd) || date < draftStart) {
      setDraftStart(date);
      setDraftEnd(undefined);
      return; // burada fetch yok, sadece draft güncelle
    }

    // 2. İkinci tık → aralığı tamamla
    let rangeStart = draftStart;
    let rangeEnd = date;

    // start > end ise swap et
    if (rangeEnd < rangeStart) {
      [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    }

    setDraftStart(rangeStart);
    setDraftEnd(rangeEnd);

    onChange({
      startDate: format(rangeStart, "yyyy-MM-dd"),
      endDate: format(rangeEnd, "yyyy-MM-dd"),
    });

    setOpen(false); // ikinci tıktan sonra popover'ı kapat
  };

  const displayLabel = React.useMemo(() => {
    if (start && end) {
      try {
        const s = new Date(start + "T00:00:00");
        const e = new Date(end + "T00:00:00");
        return `${format(s, "dd.MM.yyyy")} - ${format(e, "dd.MM.yyyy")}`;
      } catch {
        return label;
      }
    }
    return label;
  }, [start, end, label]);

  const hasActiveRange = !!start && !!end;

  const isSameDay = (a?: Date, b?: Date) =>
    !!a && !!b && a.toDateString() === b.toDateString();

  const currentPreset: PresetKey | null = React.useMemo(() => {
    if (!draftStart || !draftEnd) return null;

    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    if (isSameDay(draftStart, thisStart) && isSameDay(draftEnd, thisEnd)) {
      return "thisMonth";
    }

    const lastStart = startOfMonth(lastMonth);
    const lastEnd = endOfMonth(lastMonth);
    if (isSameDay(draftStart, lastStart) && isSameDay(draftEnd, lastEnd)) {
      return "lastMonth";
    }

    const twoAgoStart = startOfMonth(twoMonthsAgo);
    const twoAgoEnd = endOfMonth(twoMonthsAgo);
    if (isSameDay(draftStart, twoAgoStart) && isSameDay(draftEnd, twoAgoEnd)) {
      return "twoMonthsAgo";
    }

    return null;
  }, [draftStart, draftEnd, now, lastMonth, twoMonthsAgo]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full md:max-w-72 gap-2 font-normal",
            hasActiveRange ? "text-foreground" : "text-muted-foreground"
          )}
          aria-label={
            hasActiveRange
              ? `Tarih aralığı: ${displayLabel}`
              : "Tarih aralığı seç"
          }
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="max-w-72 p-3" align="start">
        {/* Quick presets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <Button
            size="sm"
            variant={currentPreset === "twoMonthsAgo" ? "default" : "outline"}
            onClick={() => applyPreset("twoMonthsAgo")}
          >
            {monthLabels.twoMonthsAgo}
          </Button>
          <Button
            size="sm"
            variant={currentPreset === "lastMonth" ? "default" : "outline"}
            onClick={() => applyPreset("lastMonth")}
          >
            {monthLabels.lastMonth}
          </Button>
          <Button
            size="sm"
            variant={currentPreset === "thisMonth" ? "default" : "outline"}
            onClick={() => applyPreset("thisMonth")}
          >
            {monthLabels.thisMonth}
          </Button>
        </div>

        {/* Calendar – single mode, manual range handling */}
        <Calendar
          mode="single"
          selected={draftEnd ?? draftStart}
          onSelect={handleSelect}
          locale={tr}
          className="w-full"
        />

        <Button
          variant="secondary"
          size="sm"
          className="mt-3 text-xs"
          onClick={handleClear}
          disabled={!hasActiveRange}
        >
          Temizle
        </Button>
      </PopoverContent>
    </Popover>
  );
}
