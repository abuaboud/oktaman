import dayjs from "dayjs";

export const formatUtils = {
    date: {
        /**
         * Formats a date to a readable string using date-fns
         * @param date Date to format
         * @returns Formatted date string like "Mar 15, 2024, 3:45 PM"
         */
        format: (date: Date | string | number) => {
            const now = dayjs();
            const inputDate = dayjs(new Date(date));

            const isToday = inputDate.isSame(now, 'day');
            const isYesterday = inputDate.isSame(now.subtract(1, 'day'), 'day');

            const timeFormat = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            });

            if (isToday) {
                return `Today at ${timeFormat.format(new Date(date))}`;
            } else if (isYesterday) {
                return `Yesterday at ${timeFormat.format(new Date(date))}`;
            } else {
                return Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                }).format(new Date(date));
            }
        },

        /**
         * Formats a date to a readable string with seconds
         * @param date Date to format
         * @returns Formatted date string like "Mar 15, 2024, 3:45:22 PM"
         */
        formatWithSeconds: (date: Date | string | number) => {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        },

        /**
         * Formats a date to a relative time string (e.g. "5m ago")
         * @param date Date to format
         * @returns Relative time string
         */
        formatToAgo: (date: Date) => {
            const now = dayjs();
            const inputDate = dayjs(date);
            const diffInSeconds = now.diff(inputDate, 'second');
            const diffInMinutes = now.diff(inputDate, 'minute');
            const diffInHours = now.diff(inputDate, 'hour');
            const diffInDays = now.diff(inputDate, 'day');

            if (diffInSeconds < 60) {
                return `${diffInSeconds}s ago`;
            }
            if (diffInMinutes < 60) {
                return `${diffInMinutes}m ago`;
            }
            if (diffInHours < 24) {
                return `${diffInHours}h ago`;
            }
            if (diffInDays < 30) {
                return `${diffInDays}d ago`;
            }
            return inputDate.format('MMM D, YYYY');
        }
    },
    number: {
        /**
         * Formats a number with comma separators and optional decimal places
         * @param num Number to format
         * @param decimals Number of decimal places (default 0)
         * @returns Formatted number string
         */
        format: (num: number, decimals = 0) => {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(num);
        }
    },
    duration: {
        /**
         * Formats a duration in milliseconds to a readable string
         * @param durationMs Duration in milliseconds
         * @param short Whether to use short format
         * @returns Formatted duration string
         */
        format: (durationMs: number | undefined, short?: boolean): string => {
            if (durationMs === undefined) {
                return '-';
            }
            if (durationMs < 1000) {
                const durationMsFormatted = Math.floor(durationMs);
                return short
                    ? `${durationMsFormatted} ms`
                    : `${durationMsFormatted} milliseconds`;
            }
            const seconds = Math.floor(durationMs / 1000);
            const minutes = Math.floor(seconds / 60);

            if (seconds < 60) {
                return short ? `${seconds} s` : `${seconds} seconds`;
            }

            if (minutes > 0) {
                const remainingSeconds = seconds % 60;
                return short
                    ? `${minutes} min ${
                        remainingSeconds > 0 ? `${remainingSeconds} s` : ''
                    }`
                    : `${minutes} minutes${
                        remainingSeconds > 0 ? ` ${remainingSeconds} seconds` : ''
                    }`;
            }
            return short ? `${seconds} s` : `${seconds} seconds`;
        }
    }
};
