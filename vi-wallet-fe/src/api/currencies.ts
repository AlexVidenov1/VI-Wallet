import api from "./axios";
import { Currency } from "../models";

// decide which URL is correct for your API:
const URL = "/Currencies";     // plural  ← if controller route = [Route("api/[controller]")]
// const URL = "/Currency";    // singular ← if you routed it like that

export const getCurrencies = async (): Promise<Currency[]> => {
    try {
        const res = await api.get(URL);

        // unwrap possible ReferenceHandler / $values wrapper
        const raw = res.data;
        const list = Array.isArray(raw)
            ? raw
            : // { $values: [...] }
            raw?.$values ??
            // { currencies:[{…}] }  (in case you wrap it differently)
            raw?.currencies ??
            [];

        return list as Currency[];
    } catch {
        // on 404 or any other error => return empty list so UI doesn't crash
        return [];
    }
};