export const getConversionFactor = (from: string, to: string): number => {
    if (!from || !to || from === to) return 1;
    const f = from.toLowerCase();
    const t = to.toLowerCase();

    // Volume
    const volNative = ["cum", "m3"];
    if (volNative.includes(f) && t === "cuft") return 35.3147;
    if (f === "cuft" && volNative.includes(t)) return 1 / 35.3147;
    if (volNative.includes(f) && t === "brass") return 0.353147;
    if (f === "brass" && volNative.includes(t)) return 1 / 0.353147;
    if (f === "cuft" && t === "brass") return 1 / 100;
    if (f === "brass" && t === "cuft") return 100;
    if (volNative.includes(f) && t === "litre") return 1000;
    if (f === "litre" && volNative.includes(t)) return 1 / 1000;
    if (f === "cuft" && t === "litre") return 28.3168;
    if (f === "litre" && t === "cuft") return 1 / 28.3168;
    if (f === "brass" && t === "litre") return 2831.68;
    if (f === "litre" && t === "brass") return 1 / 2831.68;

    // Area
    if (f === "sqm" && t === "sqft") return 10.7639;
    if (f === "sqft" && t === "sqm") return 1 / 10.7639;
    if (f === "brass" && t === "sqft") return 100; // area brass
    if (f === "sqft" && t === "brass") return 1 / 100;
    if (f === "brass" && t === "sqm") return 100 / 10.7639;
    if (f === "sqm" && t === "brass") return 10.7639 / 100;

    // Length
    if (f === "rm" && t === "rft") return 3.28084;
    if (f === "rft" && t === "rm") return 1 / 3.28084;

    // Weight
    if (f === "ton" && (t === "kg" || t === "kgs")) return 1000;
    if ((f === "kg" || f === "kgs") && t === "ton") return 1 / 1000;

    return 1;
};

export const calculateSpecialQuantity = (itemType: string, measurementData: any, targetUnit: string) => {
    const t = targetUnit.toLowerCase();

    if (itemType === "plum_concrete") {
        const cuft = measurementData.plum.l * measurementData.plum.w * measurementData.plum.h;
        const m3 = cuft / 35.3147;
        const baseFactor = getConversionFactor("cum", targetUnit);
        return t === "brass" ? cuft / 100
            : t === "sqft" ? measurementData.plum.l * measurementData.plum.w
                : t === "nos" ? 1
                    : baseFactor !== 1 ? m3 * baseFactor
                        : m3;
    }
    if (itemType === "stone_work") {
        const totalCuft = measurementData.stone.reduce((acc: number, s: any) => acc + (s.l * s.w * s.h), 0);
        const baseFactor = getConversionFactor("cuft", targetUnit);
        return (t === "cum" || t === "m3") ? totalCuft / 35.3147
            : t === "sqft" ? measurementData.stone.reduce((acc: number, s: any) => acc + (s.l * s.w), 0)
                : t === "nos" ? measurementData.stone.length
                    : t === "brass" ? totalCuft / 100
                        : baseFactor !== 1 ? totalCuft * baseFactor
                            : totalCuft / 100;
    }
    if (itemType === "soling") {
        const qtyInBrass = measurementData.soling.qty;
        const baseFactor = getConversionFactor("brass", targetUnit);
        return t === "sqft" ? qtyInBrass * 100
            : (t === "cum" || t === "m3") ? (qtyInBrass * 100) / 35.3147
                : baseFactor !== 1 ? qtyInBrass * baseFactor
                    : qtyInBrass;
    }
    return 0;
};
