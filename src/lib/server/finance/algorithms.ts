
export interface ChartPoint {
    date: Date;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
    [key: string]: any;
}

/**
 * Largest Triangle Three Buckets (LTTB) algorithm for downsampling time series data.
 * Keeps the visual shape of the chart while reducing the number of points.
 * 
 * @param data The input array of data points.
 * @param threshold The target number of points (limit).
 * @param xAccessor Function to access the X value (timestamp) from a point.
 * @param yAccessor Function to access the Y value (value) from a point.
 * @returns Downsampled array of points.
 */
export function largestTriangleThreeBuckets<T extends ChartPoint>(
    data: T[],
    threshold: number,
    xAccessor: (p: T) => number = (p) => p.date.getTime(),
    yAccessor: (p: T) => number = (p) => p.close ?? 0
): T[] {
    const dataLength = data.length;
    if (threshold >= dataLength || threshold === 0) {
        return data;
    }

    const sampled: T[] = [];
    let sampledIndex = 0;

    // Bucket size. Leave room for start and end data points
    const every = (dataLength - 2) / (threshold - 2);

    let a = 0;  // Initially the first point
    let maxAreaPoint: T | null = null;
    let nextA = 0;

    sampled[sampledIndex++] = data[a]; // Always add the first point

    for (let i = 0; i < threshold - 2; i++) {
        // Calculate point average for next bucket (containing c)
        let avgX = 0;
        let avgY = 0;
        let avgRangeStart = Math.floor((i + 1) * every) + 1;
        let avgRangeEnd = Math.floor((i + 2) * every) + 1;
        avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;

        const avgRangeLength = avgRangeEnd - avgRangeStart;

        for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
            avgX += xAccessor(data[avgRangeStart]);
            avgY += yAccessor(data[avgRangeStart]);
        }
        avgX /= avgRangeLength;
        avgY /= avgRangeLength;

        // Get the range for this bucket
        let rangeOffs = Math.floor((i + 0) * every) + 1;
        const rangeTo = Math.floor((i + 1) * every) + 1;

        // Point a
        const pointAX = xAccessor(data[a]);
        const pointAY = yAccessor(data[a]);

        let maxArea = -1;

        for (; rangeOffs < rangeTo; rangeOffs++) {
            // Calculate triangle area over three buckets
            const area = Math.abs(
                (pointAX - avgX) * (yAccessor(data[rangeOffs]) - pointAY) -
                (pointAX - xAccessor(data[rangeOffs])) * (avgY - pointAY)
            ) * 0.5;

            if (area > maxArea) {
                maxArea = area;
                maxAreaPoint = data[rangeOffs];
                nextA = rangeOffs; // Next a is this b
            }
        }

        if (maxAreaPoint) {
            sampled[sampledIndex++] = maxAreaPoint;
            a = nextA; // This a is the next a (chosen b)
        }
    }

    sampled[sampledIndex++] = data[dataLength - 1]; // Always add the last point

    return sampled;
}
