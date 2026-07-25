const rawShortDateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const shortDateFmt = {
  format: (dateVal: unknown): string => {
    if (dateVal === null || dateVal === undefined) return '';
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal as string | number);
      if (isNaN(d.getTime())) return String(dateVal);
      return rawShortDateFmt.format(d);
    } catch {
      return String(dateVal);
    }
  }
};

const rawWeekdayDateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export const weekdayDateFmt = {
  format: (dateVal: unknown): string => {
    if (dateVal === null || dateVal === undefined) return '';
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal as string | number);
      if (isNaN(d.getTime())) return String(dateVal);
      return rawWeekdayDateFmt.format(d);
    } catch {
      return String(dateVal);
    }
  }
};

const rawHmsTimeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export const hmsTimeFmt = {
  format: (dateVal: unknown): string => {
    if (dateVal === null || dateVal === undefined) return '';
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal as string | number);
      if (isNaN(d.getTime())) return String(dateVal);
      return rawHmsTimeFmt.format(d);
    } catch {
      return String(dateVal);
    }
  }
};

// `Intl.NumberFormat.prototype.format` is a bound getter — safe to extract.
export const intFmt = new Intl.NumberFormat("en-US").format;
