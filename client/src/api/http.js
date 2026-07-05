const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
export async function http(path, options = {}) {
    const { body, headers, ...rest } = options;
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...headers
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const data = (await response.json());
            if (data.validation?.length) {
                const v = data.validation[0];
                message = `${v.field}: ${v.message} (recibido: ${JSON.stringify(v.received)})`;
            }
            else if (data.message) {
                message = data.message;
            }
        }
        catch {
            // Keep default message when backend has no JSON body.
        }
        throw new Error(message);
    }
    if (response.status === 204) {
        return undefined;
    }
    return (await response.json());
}
