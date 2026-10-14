const campoPergunta = document.querySelector("#campo-pergunta");
const btnBuscar = document.querySelector("#btn-buscar");
const caixaResultado = document.querySelector("#caixa-resultado");
const carregando = document.querySelector("#carregando");
const textoResultado = document.querySelector("#texto-resultado");
const fonteNoticiaTexto = document.querySelector("#fonte-noticia-texto");
const btnOuvir = document.querySelector("#btn-ouvir");

let respostaTextoAtual = "";

btnBuscar.addEventListener("click", realizarBuscaInterna);
campoPergunta.addEventListener("keypress", (e) => {
    if (e.key === "Enter") realizarBuscaInterna();
});

async function realizarBuscaInterna() {
    const pergunta = campoPergunta.value.trim();

    if (!pergunta) {
        alert("Por favor, digite uma pergunta!");
        return;
    }

    // Exibe elementos de carregamento
    caixaResultado.classList.remove("esconder");
    carregando.classList.remove("esconder");
    textoResultado.textContent = "";
    fonteNoticiaTexto.textContent = "";
    window.speechSynthesis.cancel();

    try {
        // Busca direta via API sem redirecionamento externo
        const resultado = await consultarWeb(pergunta);
        
        carregando.classList.add("esconder");
        respostaTextoAtual = resultado.texto;
        textoResultado.textContent = respostaTextoAtual;
        fonteNoticiaTexto.textContent = `Origem dos dados: ${resultado.fonte}`;
        
    } catch (erro) {
        carregando.classList.add("esconder");
        respostaTextoAtual = "Não foi possível carregar a resposta para essa pesquisa no momento. Tente reformular a pergunta.";
        textoResultado.textContent = respostaTextoAtual;
    }
}

async function consultarWeb(termo) {
    // 1. Tenta buscar resumo direto na API do DuckDuckGo
    const urlDuck = `https://api.duckduckgo.com/?q=${encodeURIComponent(termo)}&format=json&no_html=1&skip_disambig=1`;
    
    try {
        const resDuck = await fetch(urlDuck);
        const dataDuck = await resDuck.json();

        if (dataDuck.AbstractText) {
            return { texto: dataDuck.AbstractText, fonte: "DuckDuckGo API" };
        } else if (dataDuck.RelatedTopics && dataDuck.RelatedTopics.length > 0 && dataDuck.RelatedTopics[0].Text) {
            return { texto: dataDuck.RelatedTopics[0].Text, fonte: "DuckDuckGo API" };
        }
    } catch (e) {
        // Segue para a alternativa caso falhe
    }

    // 2. Se a busca direta do DuckDuckGo não trouxer texto, busca no serviço público da Wikipedia
    const urlWiki = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`;
    const resWiki = await fetch(urlWiki);
    
    if (resWiki.ok) {
        const dataWiki = await resWiki.json();
        if (dataWiki.extract) {
            return { texto: dataWiki.extract, fonte: "Base de Dados Web / Wikipedia" };
        }
    }

    // 3. Fallback genérico caso a consulta não encontre resultados diretos
    return { 
        texto: `Não foi encontrado um artigo curto direto para "${termo}". Certifique-se de perguntar sobre termos relacionados como "slime", "cola pva" ou "água boricada".`, 
        fonte: "Pesquisa Interna" 
    };
}

// Leitura em voz alta com a Web Speech API
btnOuvir.addEventListener("click", () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        if (!respostaTextoAtual) return;

        const fala = new SpeechSynthesisUtterance(respostaTextoAtual);
        fala.lang = "pt-BR";
        fala.rate = 1.0;
        
        window.speechSynthesis.speak(fala);
    } else {
        alert("O seu navegador não suporta a funcionalidade de reprodução de voz.");
    }
});
