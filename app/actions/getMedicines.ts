"use server";

export async function searchMedicines(query: string) {
    if (!query || query.length < 2) return [];

    try {
        const res = await fetch(`https://medex.com.bd/ajax/search?searchtype=search&searchkey=${encodeURIComponent(query)}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!res.ok) throw new Error("Failed to fetch");

        const html = await res.text();
        const suggestions: any[] = [];

        // Regex Parse the HTML structure
        // <a href="..." class="lsri"> <li title="..."> <img ...> <span> NAME <span class="sr-strength">STRENGTH</span> </span> </li> </a>

        // Match the list items
        const listItems = html.match(/<a href="[^"]+" class="lsri">[\s\S]*?<\/a>/g) || [];

        listItems.forEach(item => {
            // Extract Name
            const nameMatch = item.match(/<span>\s*(.*?)\s*<span/);
            // Extract Strength
            const strengthMatch = item.match(/class="sr-strength">\s*(.*?)\s*<\/span>/);
            // Extract Form (from img alt or li title)
            const formMatch = item.match(/title="([^"]+)"/);

            if (nameMatch) {
                const name = nameMatch[1].trim();
                const strength = strengthMatch ? strengthMatch[1].trim() : "";
                const form = formMatch ? formMatch[1].trim() : "";

                suggestions.push({
                    name: name,
                    strength: strength,
                    form: form,
                    full: `${name} ${strength}`.trim()
                });
            }
        });

        return suggestions;

    } catch (error) {
        console.error("Medex Search Error:", error);
        return [];
    }
}
