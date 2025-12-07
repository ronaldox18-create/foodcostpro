
export interface DataPoint {
    date: Date;
    value: number;
}

/**
 * Calculates the linear regression trend line for a set of data points.
 * @param data Array of objects containing date and value
 * @returns Object with slope and intercept of the trend line
 */
export const calculateLinearRegression = (data: DataPoint[]) => {
    if (data.length < 2) return { slope: 0, intercept: 0 };

    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    // Use index as X to normalize time steps assuming daily data
    data.forEach((point, i) => {
        sumX += i;
        sumY += point.value;
        sumXY += i * point.value;
        sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

/**
 * Generates forecast data points based on historical data using linear regression.
 * @param history Array of historical data points
 * @param daysToForecast Number of days to forecast into the future
 * @returns Array of forecast data points
 */
export const generateForecast = (history: DataPoint[], daysToForecast: number) => {
    if (history.length < 2) return { forecast: [], trend: 'stable', slope: 0 };

    const { slope, intercept } = calculateLinearRegression(history);
    const lastDate = history[history.length - 1].date;

    const forecast = [];
    // Start predicting from the next day
    for (let i = 1; i <= daysToForecast; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);

        // The X coordinate for prediction continues from the history length
        // history indices were 0 to history.length-1
        // next index is history.length - 1 + i
        const nextIndex = history.length - 1 + i;
        const nextValue = slope * nextIndex + intercept;

        forecast.push({
            date: nextDate,
            value: Math.max(0, nextValue), // Prevent negative predictions
            isForecast: true
        });
    }

    return {
        forecast,
        trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable',
        slope
    };
};
