// --- FUNÇÕES DE CHUNKING (N8N Legacy convertidas para TS) ---
const TAMANHO_IDEAL = 250;
const TAMANHO_MAX = 400;
const HARD_LIMIT = 800;

export function protegerURLs(texto: string) {
    return texto.replace(/(https?:\/\/[^\s]+)/g, (url) =>
        url.replace(/\./g, "___PONTO_URL___"),
    );
}
export function restaurarURLs(texto: string) {
    return texto.replace(/___PONTO_URL___/g, ".");
}

export function protegerAbreviacoes(texto: string) {
    const abreviacoes = [
        "Dr.",
        "Dra.",
        "Sr.",
        "Sra.",
        "Jr.",
        "Prof.",
        "Profa.",
        "etc.",
        "ex.",
        "obs.",
        "pág.",
        "tel.",
        "cel.",
        "min.",
        "máx.",
        "aprox.",
        "nº.",
    ];
    let resultado = texto;
    abreviacoes.forEach((abrev) => {
        const regex = new RegExp(abrev.replace(".", "\\."), "gi");
        resultado = resultado.replace(regex, abrev.replace(".", "___PONTO___"));
    });
    return resultado;
}
export function restaurarAbreviacoes(texto: string) {
    return texto.replace(/___PONTO___/g, ".");
}

export function protegerListasNumeradas(texto: string) {
    return texto.replace(/(\d+)\.\s/g, "$1___PONTO___ ");
}

export function encontrarPontoDeCorte(texto: string, limiteMinimo: number) {
    const pontosFrase = /[.!?](\s*(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;
    let melhorCorte = -1;
    let match;
    while ((match = pontosFrase.exec(texto)) !== null) {
        const fimDoMatch = match.index + match[0].length;
        if (fimDoMatch >= limiteMinimo) {
            melhorCorte = fimDoMatch;
            if (fimDoMatch >= TAMANHO_IDEAL) break;
        }
    }
    return melhorCorte;
}

export function chunkMessage(mensagem: string): string[] {
    if (!mensagem || mensagem.trim().length === 0) return [];

    let texto = protegerURLs(mensagem);
    texto = protegerAbreviacoes(texto);
    texto = protegerListasNumeradas(texto);

    const linhas = texto.split(/\n/).filter((l) => l.trim().length > 0);
    const textoUnificado = linhas.join("\n");

    const partes: string[] = [];
    let restante = textoUnificado;

    while (restante.trim().length > 0) {
        if (restante.length <= TAMANHO_MAX) {
            partes.push(restante.trim());
            break;
        }
        const janela = restante.substring(0, TAMANHO_MAX);
        let corte = encontrarPontoDeCorte(janela, 120);
        if (corte > 0) {
            partes.push(restante.substring(0, corte).trim());
            restante = restante.substring(corte).trim();
        } else {
            const janelaExpandida = restante.substring(0, HARD_LIMIT);
            corte = encontrarPontoDeCorte(janelaExpandida, 120);
            if (corte > 0) {
                partes.push(restante.substring(0, corte).trim());
                restante = restante.substring(corte).trim();
            } else {
                let corteEmergencia = janela.lastIndexOf("\n");
                if (corteEmergencia <= 120) corteEmergencia = janela.lastIndexOf(" ");
                if (corteEmergencia <= 120) corteEmergencia = TAMANHO_MAX;
                partes.push(restante.substring(0, corteEmergencia).trim());
                restante = restante.substring(corteEmergencia).trim();
            }
        }
    }
    return partes.map((parte) =>
        restaurarURLs(restaurarAbreviacoes(parte.trim())),
    );
}
