import { logger } from "@/utils/logger"
import { fetchWithProxy } from "./utils/fetch"

type Provider = {
    provider_name: string
    provider_url: string
    endpoints: Array<{
        schemes?: string[]
        discovery?: boolean
        url: string
    }>
}
type Providers = Array<Provider>

type Config = {
    params?: {[key: string]: unknown}
}

type OEmbedData = {
    html: string;
    version: string;
    type: string;
    title: string;
    author_name: string;
    author_url: typeof URL;
    cache_age: number;
    provider_name: string;
    provider_url: typeof URL;
    width: number;
    height: number;
    url: typeof URL;
    thumbnail_width: number;
    thumbnail_height: number;
    thumbnail_url: typeof URL;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace ProvidersCache {
    export let cache: Providers | undefined;
}

const getProviders = async (): Promise<Providers> => {
    if (!ProvidersCache.cache) {
        const providersUrl = "https://oembed.com/providers.json";
        const responseBody = await fetchWithProxy(providersUrl);

        if (!responseBody) {
            return null;
        }

        try {
            const providers = JSON.parse(responseBody);
            ProvidersCache.cache = providers;
        } catch (error) {
            logger.error("Error parsing providers JSON:", error);
            return null;
        }
    }

    return ProvidersCache.cache;
};

export const getProviderEndpointURLForURL = async (url: string): Promise<{ provider: Provider; endpoint: string } | null> => {
    const providers = await getProviders();
    for (const provider of providers) {
        for (const endpoint of provider.endpoints) {
            if (endpoint.schemes?.some((scheme) => new RegExp(scheme.replace(/\*/g, '(.*)')).test(url))) {
                return { provider, endpoint: endpoint.url };
            }
        }
    }
    return null;
};

const oembedConfig = ({ provider }: { url: string; provider: { provider_name: string } }): Config => {
    if (provider.provider_name === 'Twitter' || provider.provider_name === 'X') {
        return {
            params: { theme: 'dark', dnt: true, omit_script: false },
        };
    }
    if (provider.provider_name === 'Instagram' || provider.provider_name === 'Facebook') {
        return {
            // params: { access_token: FACEBOOK_ACCESS_TOKEN },
            params: { access_token: "xxxxx" },
        };
    }
    return { params: {} };
};

export const getOembed = async (urlString: string ): Promise<string> => {
        const result = await getProviderEndpointURLForURL(urlString)
        logger.debug("Provider endpoint:", { result });

        if (!result) return null

        const {provider, endpoint} = result

        const url = new URL(endpoint.includes("{format}")
            ? endpoint.replace("{format}", "json")
            : endpoint);

        url.searchParams.set('url', urlString)

        const config = oembedConfig({ url: urlString, provider });
        for (const [key, value] of Object.entries(config.params ?? {})) {
            url.searchParams.set(key, String(value));
        }

        // format has to be json so it is not configurable
        url.searchParams.set('format', 'json')

        let data: OEmbedData | null = null;
        try {
            const responseBody = await fetchWithProxy(url.toString());

            data = JSON.parse(responseBody) as OEmbedData;
            logger.debug("Oembed data:", { data });
        } catch (error) {
            logger.error("Error fetching oembed data:", { error });
        }

        return data?.html ?? null
}

export default getOembed
