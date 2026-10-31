let pool: HTMLElement[] | null = null;

function getPool(): HTMLElement[] {
    if (pool) return pool;

    const template = document.querySelector<HTMLTemplateElement>("#ad-pool");
    pool = template ? [...template.content.querySelectorAll<HTMLElement>(".ad")] : [];
    pool.forEach((ad, i) => (ad.dataset.adId = String(i)));
    return pool;
}

export function refreshAd(slot: HTMLElement): void {
    const shown = new Set(
        [...document.querySelectorAll<HTMLElement>(".ad[data-ad-id]")].map(ad => ad.dataset.adId)
    );
    
    const candidates = getPool().filter(ad => !shown.has(ad.dataset.adId));
    if (candidates.length === 0) return;

    slot.querySelectorAll(":scope > .ad").forEach(old => old.remove());

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    slot.append(pick.cloneNode(true));
}
