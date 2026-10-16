/* ==========================================================================
   CHROMA MEMORIES 17 — CONFIGURAÇÃO DE FOTOS E VÍDEOS
   Felipe, 17 anos · Pedro Henrique & Victor Luis — Os melhores!
   --------------------------------------------------------------------------
   Este é o único arquivo que você precisa editar para colocar o material
   no site. Não é preciso saber programar:

   1. Copie as fotos para a pasta   assets/fotos/
      e os vídeos (MP4) para        assets/videos/
   2. Escreva o caminho de cada arquivo nas listas abaixo.
   3. Salve este arquivo e recarregue a página.

   Dicas importantes:
   • Cada item da lista termina com vírgula.
   • Os textos ficam entre aspas: "assim".
   • Linhas que começam com // são comentários e são ignoradas pelo site.
     Para ativar um exemplo, apague as duas barras do começo da linha.
   • Use nomes de arquivo simples, sem acentos e sem espaços
     (ex.: foto-01.jpg). Letras maiúsculas e minúsculas fazem diferença.
   • Se um arquivo não for encontrado, o site mostra um aviso elegante
     no lugar dele, com o caminho que estava sendo procurado.
   ========================================================================== */

window.CHROMA_CONFIG = {

  /* ------------------------------------------------------------------------
     ESPAÇOS RESERVADOS
     true  → mostra molduras indicando onde cada foto/vídeo vai entrar.
     false → esconde as molduras vazias (use antes de publicar, se algum
             material não for adicionado).
     ------------------------------------------------------------------------ */
  mostrarEspacosReservados: true,

  /* ------------------------------------------------------------------------
     GALERIA — CENA 02 · MEMÓRIAS
     Pasta: assets/fotos/

     Forma simples (só o arquivo):
        "assets/fotos/foto-01.jpg",

     Forma completa (todos os campos além de "arquivo" são opcionais):
        {
          arquivo:   "assets/fotos/foto-02.jpg",
          legenda:   "Texto curto exibido abaixo da foto",
          descricao: "Descrição da imagem para leitores de tela",
          formato:   "vertical",   // "vertical", "horizontal", "panoramica"
                                   // ou "quadrada". Se omitir, o site detecta.
          foco:      "50% 30%",    // ponto de enquadramento na miniatura
                                   // (horizontal% vertical%). Padrão: centro.
          destaque:  true          // usa esta foto também no encerramento
        },

     A ordem da lista é a ordem da exposição. O site monta uma composição
     assimétrica sozinho, respeitando fotos verticais, horizontais e
     panorâmicas. As cores das fotos nunca são alteradas.
     ------------------------------------------------------------------------ */
  fotos: [
    // "assets/fotos/foto-01.jpg",
    // "assets/fotos/foto-02.jpg",
    // { arquivo: "assets/fotos/foto-03.jpg", legenda: "" },
  ],

  /* ------------------------------------------------------------------------
     VÍDEOS — CENA 03 · O FILME
     Pasta: assets/videos/   (formato recomendado: MP4 com H.264 + AAC)

        {
          arquivo:     "assets/videos/filme-principal.mp4",
          titulo:      "O filme dos melhores momentos",
          descricao:   "Texto opcional exibido no cartão",
          capa:        "assets/videos/capas/filme-principal.jpg", // opcional
          formato:     "horizontal",   // ou "vertical" (opcional; detectado)
          principal:   true,           // vira o vídeo de capa ampla
          legendasVTT: ""              // opcional: arquivo .vtt de legendas
        },

     Se nenhum vídeo tiver principal: true, o primeiro da lista será o
     principal. Os demais aparecem em uma sequência de cartões.
     Nenhum vídeo começa sozinho: a reprodução só acontece com o play.
     ------------------------------------------------------------------------ */
  videos: [
    // { arquivo: "assets/videos/filme-principal.mp4", titulo: "O filme dos melhores momentos", principal: true },
    // { arquivo: "assets/videos/video-02.mp4", titulo: "" },
  ],

  /* ------------------------------------------------------------------------
     HOMENAGEM — CENA 04 · OS MELHORES
     Pasta sugerida: assets/fotos/os-melhores/

     juntos        → foto de Pedro Henrique e Victor Luis juntos.
                     É o ponto central da seção.
     pedroHenrique → retrato de Pedro Henrique (opcional).
     victorLuis    → retrato de Victor Luis (opcional).

     Cada campo aceita só o caminho ("assets/...") ou um objeto
     { arquivo: "...", descricao: "...", foco: "50% 30%" }.
     Deixe "" (vazio) enquanto não houver a foto.
     ------------------------------------------------------------------------ */
  homenagem: {
    juntos:        "",   // ex.: "assets/fotos/os-melhores/juntos.jpg"
    pedroHenrique: "",   // ex.: "assets/fotos/os-melhores/pedro-henrique.jpg"
    victorLuis:    ""    // ex.: "assets/fotos/os-melhores/victor-luis.jpg"
  },

  /* ------------------------------------------------------------------------
     ENCERRAMENTO — CENA 05 · FINAL
     Até 4 fotos em destaque ao redor do número 17 final.
     Se a lista ficar vazia, o site usa as fotos da galeria marcadas com
     destaque: true; se não houver nenhuma marcada, usa as primeiras.
     ------------------------------------------------------------------------ */
  encerramento: {
    fotos: [
      // "assets/fotos/foto-05.jpg",
    ]
  }
};
