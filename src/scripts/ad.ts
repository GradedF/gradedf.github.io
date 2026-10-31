const pools = new Map<string, HTMLElement[]>();

function getPool(poolId: string): HTMLElement[] {
    let pool = pools.get(poolId);
    if (pool) return pool;

    const template = document.querySelector<HTMLTemplateElement>(`#${poolId}`);
    pool = template ? [...template.content.querySelectorAll<HTMLElement>(".ad")] : [];
    pool.forEach((ad, i) => (ad.dataset.adId = `${poolId}-${i}`));
    pools.set(poolId, pool);
    return pool;
}

/** Swap the ad in `slot` for a random one from <template id={poolId}> that isn't already on screen. */
export function refreshAd(slot: HTMLElement, poolId = "ad-pool"): void {
    const shown = new Set(
        [...document.querySelectorAll<HTMLElement>(".ad[data-ad-id]")].map(ad => ad.dataset.adId)
    );

    const candidates = getPool(poolId).filter(ad => !shown.has(ad.dataset.adId));
    if (candidates.length === 0) return;

    slot.querySelectorAll(":scope > .ad").forEach(old => old.remove());

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    slot.append(pick.cloneNode(true));
}

export function initAdRedirects(): void {
    document.addEventListener("click", (event) => {
        const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(".redirect-link");
        if (!link) return;

        const url = link.getAttribute("href");
        const url2 = link.getAttribute("data-link2");
        const delay = Number(link.getAttribute("data-delay"));
        if (!url || !url2 || !delay) return;

        event.preventDefault();
        const tab = window.open(url, "_blank");

        setTimeout(() => {
            if (tab && !tab.closed) tab.location.href = url2;
        }, delay);
    });
}
