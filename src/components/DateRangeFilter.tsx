// src/components/DateRangeFilter.tsx

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isSameDay,
} from "date-fns"

import { tr } from "date-fns/locale"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Button } from "@/components/ui/button"

import { Calendar } from "@/components/ui/calendar"

import { cn } from "@/lib/utils"
import { useAppTimeZone } from "@/hooks/useAppTimeZone"
import { formatDateTime } from "@/lib/datetime"
import { useTranslation } from "react-i18next"

interface DateRangeFilterProps {

  label: string

  start?: string
  end?: string

  onChange: (updates: {
    startDate?: string
    endDate?: string
  }) => void
}

type PresetKey =
  | "thisMonth"
  | "lastMonth"
  | "twoMonthsAgo"

export function DateRangeFilter({
  label,
  start,
  end,
  onChange,
}: DateRangeFilterProps) {
  const { i18n } = useTranslation()
  const timeZone = useAppTimeZone()

  const [open, setOpen] = React.useState(false)

  /*
  Safe parse URL values
  */

  const startDate = React.useMemo(
    () =>
      start
        ? new Date(start + "T00:00:00")
        : undefined,
    [start],
  )

  const endDate = React.useMemo(
    () =>
      end
        ? new Date(end + "T00:00:00")
        : undefined,
    [end],
  )


  /*
  Draft state (UI only)
  */

  const [draftStart, setDraftStart] =
    React.useState<Date | undefined>(
      startDate,
    )

  const [draftEnd, setDraftEnd] =
    React.useState<Date | undefined>(
      endDate,
    )


  /*
  Sync draft when URL changes externally
  */

  React.useEffect(() => {

    setDraftStart(startDate)
    setDraftEnd(endDate)

  }, [startDate, endDate])


  /*
  Presets
  */

  const now = new Date()

  const presets = React.useMemo(() => {

    const twoAgo =
      subMonths(now, 2)

    const last =
      subMonths(now, 1)

    return {

      thisMonth: {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: formatDateTime(now, {
          locale: i18n.language,
          timeZone,
          month: "long",
        }),
      },

      lastMonth: {
        start: startOfMonth(last),
        end: endOfMonth(last),
        label: formatDateTime(last, {
          locale: i18n.language,
          timeZone,
          month: "long",
        }),
      },

      twoMonthsAgo: {
        start: startOfMonth(twoAgo),
        end: endOfMonth(twoAgo),
        label: formatDateTime(twoAgo, {
          locale: i18n.language,
          timeZone,
          month: "long",
        }),
      },

    }

  }, [now, i18n.language, timeZone])


  function applyRange(
    s?: Date,
    e?: Date,
  ) {

    onChange({

      startDate:
        s
          ? format(s, "yyyy-MM-dd")
          : undefined,

      endDate:
        e
          ? format(e, "yyyy-MM-dd")
          : undefined,

    })

    setOpen(false)
  }


  function applyPreset(
    key: PresetKey,
  ) {

    const preset =
      presets[key]

    setDraftStart(preset.start)
    setDraftEnd(preset.end)

    applyRange(
      preset.start,
      preset.end,
    )
  }


  function clear() {

    setDraftStart(undefined)
    setDraftEnd(undefined)

    applyRange(
      undefined,
      undefined,
    )
  }


  /*
  Range selection logic
  */

  function handleSelect(
    date?: Date,
  ) {

    if (!date) return

    /*
    First click
    */

    if (
      !draftStart ||
      draftEnd ||
      date < draftStart
    ) {

      setDraftStart(date)
      setDraftEnd(undefined)
      return
    }

    /*
    Second click completes range
    */

    let s = draftStart
    let e = date

    if (e < s)
      [s, e] = [e, s]

    setDraftStart(s)
    setDraftEnd(e)

    applyRange(s, e)
  }


  /*
  Detect active preset
  */

  const activePreset =
    React.useMemo<
      PresetKey | null
    >(() => {

      if (!draftStart || !draftEnd)
        return null

      for (const key of Object.keys(
        presets,
      ) as PresetKey[]) {

        const p =
          presets[key]

        if (
          isSameDay(
            draftStart,
            p.start,
          ) &&
          isSameDay(
            draftEnd,
            p.end,
          )
        ) {
          return key
        }
      }

      return null

    }, [draftStart, draftEnd, presets])


  /*
  Display label
  */

  const displayLabel =
    React.useMemo(() => {

      if (!startDate || !endDate)
        return label

      try {

        return `${format(
          startDate,
          "dd.MM.yyyy",
        )} - ${format(
          endDate,
          "dd.MM.yyyy",
        )}`

      } catch {

        return label

      }

    }, [
      startDate,
      endDate,
      label,
    ])


  const hasActiveRange =
    Boolean(startDate && endDate)


  /*
  Render
  */

  return (

    <Popover
      open={open}
      onOpenChange={setOpen}
    >

      <PopoverTrigger asChild>

        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full md:w-72 justify-start font-normal",
            !hasActiveRange &&
              "text-muted-foreground",
          )}
        >

          <CalendarIcon className="mr-2 h-4 w-4"/>

          {displayLabel}

        </Button>

      </PopoverTrigger>


      <PopoverContent
        className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-3"
        align="start"
      >

        {/* Presets */}

        <div className="grid grid-cols-3 gap-2 mb-3">

          {(Object.keys(
            presets,
          ) as PresetKey[]).map(
            key => {

              const preset =
                presets[key]

              return (

                <Button
                  type="button"
                  key={key}
                  size="sm"
                  variant={
                    activePreset === key
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    applyPreset(key)
                  }
                >

                  {preset.label}

                </Button>

              )

            },
          )}

        </div>


        {/* Calendar */}

        <Calendar
          mode="single"
          selected={
            draftEnd ??
            draftStart
          }
          onSelect={handleSelect}
          locale={tr}
          className="w-full"
        />


        {/* Clear */}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          disabled={
            !hasActiveRange
          }
          onClick={clear}
        >
          Temizle
        </Button>

      </PopoverContent>

    </Popover>

  )
}
