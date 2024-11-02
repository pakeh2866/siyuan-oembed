import { forwardProxy } from "@/api";

/**
 * Fetches JSON data from a URL using forward proxy
 * @param url URL to fetch from
 * @returns Response body as string or null if request fails
 */
export const fetchWithProxy = async (url: string): Promise<string | null> => {
    try {
        const res = await forwardProxy(
            url,
            "GET",
            null,
            [
                {
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                },
            ],
            5000,
            "text/html"
        );

        if (!res || res.status !== 200) {
            return null;
        }

        return res.body;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
};