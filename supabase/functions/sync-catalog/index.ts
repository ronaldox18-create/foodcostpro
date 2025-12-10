
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- CONFIGURATION ---
const IFOOD_AUTH_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';
const IFOOD_CATALOG_URL = 'https://merchant-api.ifood.com.br/catalog/v2.0';

// Setup Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPERS ---

async function getIfoodToken(creds: any): Promise<string | null> {
    try {
        const params = new URLSearchParams();
        params.append('grantType', 'client_credentials');
        params.append('clientId', creds.clientId);
        params.append('clientSecret', creds.clientSecret);

        const response = await fetch(IFOOD_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!response.ok) {
            console.error(`Erro Auth: ${await response.text()}`);
            return null;
        }

        const data = await response.json();
        return data.accessToken;
    } catch (error) {
        console.error("Erro token:", error);
        return null;
    }
}

async function getMerchantId(token: string) {
    try {
        const response = await fetch('https://merchant-api.ifood.com.br/merchant/v1.0/merchants', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data[0]?.id;
    } catch (e) {
        return null;
    }
}

async function getCatalogId(token: string, merchantId: string) {
    try {
        console.log(`[DEBUG] Buscando catálogos para Merchant ID: ${merchantId}`);
        const url = `${IFOOD_CATALOG_URL}/merchants/${merchantId}/catalogs`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Erro ao buscar catálogos. Status: ${response.status}. Resp: ${errText}`);
        }
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("[WARN] Nenhum catálogo encontrado. Tentando criar um catálogo padrão...");
            const createResp = await fetch(`${IFOOD_CATALOG_URL}/merchants/${merchantId}/catalogs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'AVAILABLE',
                    title: 'Catálogo Principal'
                })
            });

            if (!createResp.ok) {
                const errCreate = await createResp.text();
                throw new Error(`Falha ao criar catálogo automático: ${errCreate}`);
            }

            const newCatalog = await createResp.json();
            return newCatalog.catalogId || newCatalog.id;
        }

        const active = data.find((c: any) => c.status === 'AVAILABLE');
        const foundId = active ? active.catalogId : data[0]?.catalogId;
        return foundId;

    } catch (e: any) {
        console.error("Erro getCatalogId Exception:", e);
        throw e;
    }
}

// --- CATALOG OPERATIONS ---

async function createProduct(token: string, merchantId: string, categoryIfoodId: string, product: any) {
    const catalogId = await getCatalogId(token, merchantId);
    if (!catalogId) throw new Error("Nenhum catálogo disponível.");

    // Validate Category Existence
    const checkCatUrl = `${IFOOD_CATALOG_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${categoryIfoodId}`;
    const checkCat = await fetch(checkCatUrl, { headers: { 'Authorization': `Bearer ${token}` } });

    if (!checkCat.ok && checkCat.status === 404) {
        throw new Error("CATEGORY_STALE");
    }

    // Ensure ALL mandatory fields are present
    const payload = {
        name: product.name,
        description: product.description || '',
        externalCode: product.id,
        status: 'AVAILABLE',
        serving: 'NOT_APPLICABLE',
        price: {
            value: product.currentPrice || 0,
            originalValue: product.currentPrice || 0,
            scalePrice: 1
        },
        shifts: []
    };

    // STRATEGY 1: Default V2 Endpoint
    const url1 = `${IFOOD_CATALOG_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${categoryIfoodId}/products`;
    console.log(`[DEBUG] Attempting CREATE (Strategy 1): ${url1}`);

    let response = await fetch(url1, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    // If Strategy 1 fails with 404, Try Strategy 2 (Template DEFAULT)
    if (!response.ok && response.status === 404) {
        const url2 = `${IFOOD_CATALOG_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${categoryIfoodId}/templates/DEFAULT/products`;
        console.warn(`[WARN] Strategy 1 failed (404). Trying Strategy 2: ${url2}`);

        response = await fetch(url2, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    }

    if (!response.ok) {
        // If it STILL fails with 404, then the category is genuinely broken (or route is totally different)
        if (response.status === 404) {
            console.warn(`[WARN] Both strategies failed with 404. Category is stale.`);
            throw new Error("CATEGORY_STALE");
        }

        const errText = await response.text();
        throw new Error(`Erro One-Step Create: ${errText}`);
    }

    const data = await response.json();
    return {
        id: data.id,
        status: 'AVAILABLE'
    };
}

async function updateProduct(token: string, merchantId: string, categoryIfoodId: string, product: any, externalId: string) {
    const catalogId = await getCatalogId(token, merchantId);
    if (!catalogId) throw new Error("Nenhum catálogo disponível.");

    const payload = {
        name: product.name,
        description: product.description || '',
        externalCode: product.id,
        status: 'AVAILABLE',
        price: {
            value: product.currentPrice || 0,
            originalValue: product.currentPrice || 0,
            scalePrice: 1
        }
    };

    const url = `${IFOOD_CATALOG_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${categoryIfoodId}/products/${externalId}`;
    console.log(`[DEBUG] Update Product URL: ${url}`);

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro ao atualizar produto no iFood: ${errText} | URL: ${url}`);
    }

    return true;
}

// Helper to extract ID from conflict error
function extractConflictId(errText: string): string | null {
    try {
        const match = errText.match(/"conflictingResources"\s*:\s*\[\s*"([^"]+)"/);
        if (match && match[1]) return match[1];
        const json = JSON.parse(errText);
        if (json.error && json.error.conflictingResources && json.error.conflictingResources[0]) {
            return json.error.conflictingResources[0];
        }
    } catch (e) { }
    return null;
}

// Added 'skipAdoption' parameter to prevent loop in recovery
async function createCategory(token: string, merchantId: string, category: any, skipAdoption = false) {
    const catalogId = await getCatalogId(token, merchantId);
    if (!catalogId) throw new Error("Nenhum catálogo disponível encontrado no iFood.");

    const payload = {
        name: category.name,
        status: 'AVAILABLE',
        template: 'DEFAULT',
        externalCode: category.id
    };

    console.log(`[REAL] Creating Category in Catalog ${catalogId}:`, payload);

    const response = await fetch(`${IFOOD_CATALOG_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();

        // CONFLICT HANDLING
        if (response.status === 409 || errText.includes("Conflict") || errText.includes("conflictingResources")) {
            // IF we are in recovery (skipAdoption=true), we do NOT want to adopt. We want to fail so we can try a new name.
            if (!skipAdoption) {
                console.log(`[INFO] Create Conflict. Adopting existing ID...`);
                const existsId = extractConflictId(errText);
                if (existsId) {
                    return { id: existsId, status: 'AVAILABLE', wasConflict: true };
                }
            } else {
                console.log("[INFO] Conflict encountered but Adoption Skipped (Recovery Mode).");
            }
        }
        throw new Error(`Erro ao criar categoria no iFood: ${errText}`);
    }

    const data = await response.json();
    return {
        id: data.id,
        status: 'AVAILABLE'
    };
}

async function updateCategory(token: string, merchantId: string, category: any, externalId: string) {
    const catalogId = await getCatalogId(token, merchantId);
    if (!catalogId) throw new Error("Nenhum catálogo disponível encontrado no iFood.");

    const payload = {
        name: category.name,
        status: 'AVAILABLE',
        externalCode: category.id
    };

    console.log(`[REAL] Updating Category ${externalId} in Catalog ${catalogId}:`, payload);

    const response = await fetch(`${IFOOD_CATALOG_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${externalId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        if (response.status === 409 || errText.includes("Conflict")) {
            console.log(`[INFO] Update Conflict. Adopting existing ID...`);
            const existsId = extractConflictId(errText);
            if (existsId) {
                return { id: existsId, status: 'AVAILABLE', wasConflict: true };
            }
        }
        throw new Error(`Erro ao atualizar categoria no iFood: ${errText}`);
    }

    return { id: externalId, status: 'AVAILABLE' };
}

// --- MAIN HANDLER ---

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    console.log("📦 Edge Function iFood Catalog Sync");

    try {
        const { action, productId, categoryName, userId } = await req.json();

        // VALIDAÇÃO DE PARÂMETROS
        if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });

        // 1. Get User Integrations
        const { data: integ, error: intError } = await supabase.from('user_integrations').select('*').eq('user_id', userId).eq('provider', 'ifood').single();
        if (intError || !integ) return new Response(JSON.stringify({ error: "Integration not found" }), { status: 404 });

        switch (action) {
            case 'test_auth': {
                const token = await getIfoodToken(integ.credentials);
                if (!token) throw new Error("Falha id:token");
                return new Response(JSON.stringify({ status: 'success' }), { headers: corsHeaders });
            }

            case 'sync_category': {
                if (!categoryName) return new Response(JSON.stringify({ error: "Missing name" }), { status: 400 });
                const { data: category } = await supabase.from('categories').select('*').eq('user_id', userId).eq('name', categoryName).single();
                if (!category) return new Response(JSON.stringify({ error: "Cat not found" }), { status: 404 });

                const token = await getIfoodToken(integ.credentials);
                const apiMerchantId = await getMerchantId(token!);
                const merchantId = apiMerchantId || integ.credentials.merchantId;

                let result = null;
                if (category.ifood_id) {
                    try {
                        const updRes = await updateCategory(token!, merchantId, category, category.ifood_id);
                        if (typeof updRes === 'object' && updRes.id !== category.ifood_id) {
                            await supabase.from('categories').update({ ifood_id: updRes.id, ifood_status: 'AVAILABLE' }).eq('id', category.id);
                            result = { status: 'merged_conflict', id: updRes.id };
                        } else {
                            result = { status: 'updated' };
                        }
                    } catch (updErr: any) {
                        if (String(updErr).includes("404")) {
                            const ifoodData = await createCategory(token!, merchantId, category);
                            await supabase.from('categories').update({ ifood_id: ifoodData.id, ifood_status: ifoodData.status }).eq('id', category.id);
                            result = { status: 'recreated', ifoodData };
                        } else throw updErr;
                    }
                } else {
                    const ifoodData = await createCategory(token!, merchantId, category);
                    await supabase.from('categories').update({ ifood_id: ifoodData.id, ifood_status: ifoodData.status }).eq('id', category.id);
                    result = { status: 'created', ifoodData };
                }
                return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            case 'sync_product': {
                if (!productId) return new Response(JSON.stringify({ error: "Missing productId" }), { status: 400 });
                const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
                if (!product) return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });

                const token = await getIfoodToken(integ.credentials);
                const apiMerchantId = await getMerchantId(token!);
                const merchantId = apiMerchantId || integ.credentials.merchantId;

                const { data: catData } = await supabase.from('categories').select('ifood_id').eq('user_id', userId).eq('name', product.category).single();
                if (!catData || !catData.ifood_id) return new Response(JSON.stringify({ error: `Categoria '${product.category}' não sinc.` }), { status: 400 });

                const categoryIfoodId = catData.ifood_id;
                let result = null;

                try {
                    if (product.ifood_id) {
                        try {
                            await updateProduct(token!, merchantId, categoryIfoodId, product, product.ifood_id);
                            result = { status: 'updated' };
                        } catch (updateErr: any) {
                            const errString = String(updateErr);
                            if (errString.includes("404") || errString.includes("no Route matched") || errString.includes("CATEGORY_STALE")) {
                                throw new Error("CATEGORY_STALE");
                            } else throw updateErr;
                        }
                    } else {
                        const ifoodData = await createProduct(token!, merchantId, categoryIfoodId, product);
                        await supabase.from('products').update({ ifood_id: ifoodData.id, ifood_status: ifoodData.status }).eq('id', productId);
                        result = { status: 'created', ifoodData };
                    }
                } catch (mainErr: any) {
                    const errMsg = String(mainErr.message || mainErr);
                    if (errMsg.includes("CATEGORY_STALE")) {
                        console.log("[RECOVERY] Recriando Categoria (Evitando Adoção)...");
                        const { data: fullCat } = await supabase.from('categories').select('*').eq('ifood_id', categoryIfoodId).single();

                        if (fullCat) {
                            // Try to create, BUT skip adoption to force error on conflict
                            let newCatData;
                            try {
                                newCatData = await createCategory(token!, merchantId, fullCat, true); // true = skipAdoption
                            } catch (catErr: any) {
                                const catErrStr = String(catErr);
                                if (catErrStr.includes("Conflict") || catErrStr.includes("already exists")) {
                                    // RANDOM TIMESTAMP SUFFIX TO ENSURE UNIQUENESS
                                    const timestamp = Date.now().toString().slice(-4);
                                    console.log(`[RECOVERY] Nome duplicado. Criando com SUFIXO ÚNICO: ${timestamp}...`);
                                    const altCat = { ...fullCat, name: `${fullCat.name} ${timestamp}` };
                                    newCatData = await createCategory(token!, merchantId, altCat, false);
                                } else {
                                    throw catErr;
                                }
                            }

                            if (newCatData) {
                                await supabase.from('categories').update({ ifood_id: newCatData.id, ifood_status: newCatData.status }).eq('id', fullCat.id);

                                console.log(`[RETRY] Criando produto na nova cat: ${newCatData.id}`);
                                const retryData = await createProduct(token!, merchantId, newCatData.id, product);
                                await supabase.from('products').update({ ifood_id: retryData.id, ifood_status: retryData.status }).eq('id', productId);
                                result = { status: 'created_after_recovery', ifoodData: retryData };
                            }
                        } else {
                            throw new Error("CATEGORY_RECOVERY_FAILED_NO_DB");
                        }
                    } else throw mainErr;
                }
                return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            default: return new Response(JSON.stringify({ error: "Invalid" }), { status: 400 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
