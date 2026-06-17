export function formatDate(dateString: string, locale?: Intl.LocalesArgument): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      dateStyle: 'long',
    });
  } catch (error) {
    return dateString;
  }
}

type DateLikeInput = string | number | Date;

export function formatDateTime(dateInput: DateLikeInput, locale?: Intl.LocalesArgument): string {
  try {
    const date = new Date(dateInput);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
      timeStyle: 'short',
      hour12: false,
    }).format(date);
  } catch (error) {
    return String(dateInput);
  }
}

export function formatTimeConditional(dateInput: DateLikeInput, locale?: Intl.LocalesArgument): string {
  try {
    const date = new Date(dateInput);
    const today = new Date();

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      // Only show time (hours:minutes)
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    } else {
      // Show date and time
      return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    }
  } catch (error) {
    return String(dateInput);
  }
}

export function formatElapsedTime(
  startTime: DateLikeInput,
  endTime?: DateLikeInput,
  locale?: Intl.LocalesArgument
): string {
  try {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();

    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) {
      return 'Invalid time range';
    }

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Use Intl.RelativeTimeFormat for proper pluralization and localization
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });

    if (days > 0) {
      return rtf.format(-days, 'day').replace('in ', '').replace(' ago', '');
    } else if (hours > 0) {
      return rtf.format(-hours, 'hour').replace('in ', '').replace(' ago', '');
    } else if (minutes > 0) {
      return rtf.format(-minutes, 'minute').replace('in ', '').replace(' ago', '');
    } else {
      return rtf.format(-seconds, 'second').replace('in ', '').replace(' ago', '');
    }
  } catch (error) {
    return 'Invalid time';
  }
}
