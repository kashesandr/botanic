export const setTimeoutPromise = async (duration: number): Promise<unknown> => {
    return new Promise(resolve => setTimeout(resolve, duration));
}