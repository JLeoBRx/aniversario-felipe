# CHROMA MEMORIES 17

Uma experiência cinematográfica para **Pedro Henrique & Vitor Luis — OS MELHORES!**

Site em HTML5, CSS3 e JavaScript puro: sem frameworks, sem instalação e sem
etapa de compilação. Funciona abrindo o `index.html` direto no computador ou
publicado em qualquer hospedagem de site estático.

---

## As cinco cenas

| Cena | O que acontece |
| --- | --- |
| **01 · Abertura** | Escuro azul-marinho, luzes nas bordas, um campo magenta atravessando a tela e brilho ciano ao fundo. O **17** nasce no centro com desfoque e aberração cromática, a câmera recua e surgem *17 anos. Mil cores. Infinitas memórias.*, a frase de abertura, os nomes e a assinatura *Os melhores!*. Há o botão **Pular abertura**, e a tecla Esc ou a rolagem também aceleram o final. |
| **02 · Memórias** | Uma exposição de fotografias em composição assimétrica, que se organiza sozinha conforme as fotos sejam verticais, horizontais, quadradas ou panorâmicas. Cada foto surge do escuro, revelada por um feixe de luz. Ao tocar, abre a visualização ampliada com setas, teclado e gesto de deslizar. |
| **03 · O filme** | Um vídeo principal com capa ampla e botão de play, seguido de uma sequência de cartões horizontais e verticais. Os vídeos abrem numa “sala de projeção” e só tocam com o clique. Ao fechar, o vídeo para e o arquivo é liberado da memória. |
| **04 · Os melhores** | Refletores ciano e magenta acendem. Um feixe de luz atravessa a foto dos dois juntos e segue até os nomes, que se iluminam linha a linha, e em seguida aparece a frase da homenagem. |
| **05 · Final** | O 17 volta, desenhado em luz, sobre um amanhecer cromático. Surgem *17 anos. E a história está só começando.*, a frase final e *Pedro Henrique & Vitor Luis — Os melhores!*, com os botões **Voltar ao início** e **Rever a abertura**. |

A atmosfera de luz muda de cor de forma gradual a cada cena, e um fio de luz
liga uma cena à seguinte.

---

## 1. Como abrir o site

**Opção A: direto no computador.** Dê dois cliques em `index.html`. Tudo
funciona sem internet: fontes, fotos e vídeos.

**Opção B: servidor local** (recomendada para conferir antes de publicar). Na
pasta do projeto, rode um destes comandos:

```bash
npx serve .                 # precisa do Node.js instalado
# ou
python3 -m http.server 8000 # depois abra http://localhost:8000
```

> O servidor do Python não aceita o pedido de “pular para um trecho” do vídeo,
> então avançar a barra de tempo pode não funcionar. Com `npx serve`, abrindo
> pelo duplo clique ou depois de publicado, funciona normalmente.

Com o site servido por `http://`, ele também consegue dizer se um arquivo está
**faltando** ou se está num **formato que o navegador não exibe**.

---

## 2. Como colocar as fotos

1. Copie as fotos para a pasta **`assets/fotos/`**.
2. Abra o arquivo **`config.js`** num editor de texto (Bloco de Notas, VS Code…).
3. Liste as fotos dentro de `fotos: [ ... ]`, na ordem da exposição:

```js
fotos: [
  "assets/fotos/foto-01.jpg",
  "assets/fotos/foto-02.jpg",
  { arquivo: "assets/fotos/foto-03.jpg", legenda: "Uma legenda curta" },
  { arquivo: "assets/fotos/foto-04.jpg", descricao: "Descrição para leitores de tela", destaque: true },
  { arquivo: "assets/fotos/foto-05.jpg", formato: "vertical", foco: "50% 25%" },
],
```

Campos opcionais de cada foto:

| Campo | Para que serve |
| --- | --- |
| `legenda` | Texto discreto exibido abaixo da foto e na visualização ampliada. |
| `descricao` | Descrição da imagem para quem usa leitor de tela (recomendado). |
| `formato` | `"vertical"`, `"horizontal"`, `"panoramica"` ou `"quadrada"`. Se omitir, o site detecta sozinho. |
| `foco` | Ponto de enquadramento da miniatura (ex.: `"50% 25%"` mantém rostos no alto). A foto ampliada aparece sempre inteira. |
| `destaque` | `true` para usar a foto também no encerramento. |

**Dicas de foto**

- Use **JPG, PNG ou WebP**. Fotos **HEIC** do iPhone precisam ser convertidas
  para JPG, porque a maioria dos navegadores não as exibe.
- Para carregar rápido no celular, deixe o lado maior com até **2500 px**.
  Cada arquivo costuma ficar entre 300 KB e 900 KB. Ferramentas gratuitas
  como o [Squoosh](https://squoosh.app) fazem isso no navegador.
- Use nomes simples, sem espaços nem acentos (`foto-01.jpg`). Letras
  maiúsculas e minúsculas fazem diferença (`FOTO.JPG` ≠ `foto.jpg`).
- O site **nunca altera as cores** das fotografias. Os efeitos de luz acontecem
  ao redor delas e durante a revelação.

---

## 3. Como colocar os vídeos

1. Copie os vídeos para **`assets/videos/`**, de preferência em **MP4 (H.264 + AAC)**.
2. No `config.js`, liste-os em `videos: [ ... ]`:

```js
videos: [
  {
    arquivo: "assets/videos/filme-principal.mp4",
    titulo: "O filme dos melhores momentos",
    descricao: "Texto opcional",
    capa: "assets/videos/capas/filme-principal.jpg", // opcional
    principal: true
  },
  { arquivo: "assets/videos/video-02.mp4", titulo: "Bastidores", formato: "vertical" },
],
```

- O vídeo com `principal: true` (ou o primeiro da lista) ganha a capa ampla.
  Os demais viram cartões, horizontais ou verticais, detectados sozinhos.
- Sem `capa`, a miniatura é um quadro do próprio vídeo.
- `legendasVTT` (opcional) aceita um arquivo de legendas `.vtt`.
- **Nenhum vídeo começa sozinho.** A reprodução só acontece com o play.

**Converter ou comprimir um vídeo** (por exemplo, um `.MOV` do celular), com o
[ffmpeg](https://ffmpeg.org) instalado:

```bash
ffmpeg -i entrada.mov -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k -movflags +faststart saida.mp4
```

> Hospedagens gratuitas costumam limitar o tamanho de cada arquivo. No GitHub,
> o limite é 100 MB por arquivo; prefira vídeos abaixo de 50 MB.

---

## 4. Homenagem e encerramento

No `config.js`:

```js
homenagem: {
  juntos:        "assets/fotos/os-melhores/juntos.jpg",          // ponto central da cena
  pedroHenrique: "assets/fotos/os-melhores/pedro-henrique.jpg",  // opcional
  vitorLuis:     "assets/fotos/os-melhores/vitor-luis.jpg"       // opcional
},
encerramento: {
  fotos: [ "assets/fotos/foto-07.jpg" ]  // até 4; vazio = usa as fotos com destaque: true
}
```

Se a foto dos dois juntos for horizontal, a cena muda sozinha para um plano
aberto, com a foto em cima e os nomes embaixo.

---

## 5. Antes de publicar

- [ ] Todas as fotos e vídeos aparecem (sem molduras de “arquivo indisponível”).
- [ ] Se algum material não for entrar, mude `mostrarEspacosReservados` para
      `false` no `config.js`. As molduras vazias somem e as cenas se ajustam.
- [ ] Para a pré-visualização no WhatsApp e nas redes, troque em `index.html`
      o conteúdo de `og:image` pelo endereço completo da imagem publicada
      (ex.: `https://SEU-USUARIO.github.io/aniversario-felipe/assets/img/compartilhar.jpg`).
- [ ] Abra no celular e confira.

## 6. Como publicar

**GitHub Pages** (gratuito)

1. Envie os arquivos para o repositório (incluindo `assets/fotos` e `assets/videos`).
2. No GitHub, abra **Settings → Pages**.
3. Em *Build and deployment*, escolha **Deploy from a branch**, a branch
   principal e a pasta **/ (root)**, depois clique em **Save**.
4. Em alguns minutos o site estará em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

**Netlify Drop** (sem conta de GitHub)

1. Acesse <https://app.netlify.com/drop>.
2. Arraste a pasta inteira do projeto para a página.
3. O endereço é gerado na hora e pode ser personalizado depois.

Também funciona em Vercel, Cloudflare Pages ou qualquer hospedagem de arquivos
estáticos. Não há nada para instalar nem compilar.

---

## 7. Personalização

| O quê | Onde |
| --- | --- |
| Textos das cenas | `index.html`, onde cada cena está marcada com um comentário `CENA 0X` |
| Cores, luzes e degradês | `css/chroma.css`, seção **02. Tokens** e paletas de luz por cena |
| Ritmo da abertura | Linha do tempo em `css/chroma.css` (seção 07) e `TOTAL` em `js/intro.js` |
| Partículas | Paletas e quantidade em `js/particles.js` |

**Regra de cor do projeto:** nenhum laranja nem tom alaranjado, inclusive nas
cores intermediárias dos degradês. Vermelhos ficam no rubi e carmim, amarelos
e dourados no limão e champanhe, e vermelho/rosa nunca encostam em
amarelo/dourado dentro de um mesmo degradê.

---

## 8. Acessibilidade e conforto

- A preferência do sistema por **movimento reduzido** é respeitada. Nesse modo
  a abertura aparece pronta, sem animações longas, partículas em movimento ou
  parallax.
- O botão **Reduzir movimento** no topo (e no menu do celular) liga e desliga
  as animações, e a escolha fica guardada no navegador.
- Tudo funciona pelo teclado: Tab navega; Esc pula a abertura e fecha menus,
  fotos e vídeos; ← → Home End navegam na galeria ampliada. Ao fechar, o foco
  volta para onde estava.
- Botões e imagens têm nomes acessíveis. Use o campo `descricao` para
  descrever as fotos.
- Não há áudio automático em nenhum momento.

---

## Estrutura

```
index.html            estrutura das cinco cenas
config.js             ← fotos e vídeos (o único arquivo que você precisa editar)
css/chroma.css        direção de arte: paleta, luzes, tipografia, cenas
js/core.js            utilidades, configuração, cenas, navegação, diálogos
js/intro.js           abertura cinematográfica
js/particles.js       partículas de luz
js/gallery.js         exposição de fotografias
js/lightbox.js        visualização ampliada
js/videos.js          filme principal, cartões e sala de projeção
js/honor.js           homenagem e encerramento
assets/fonts/         Bodoni Moda e Archivo (licença SIL OFL 1.1)
assets/img/           ícone e imagem de compartilhamento
assets/fotos/         suas fotografias
assets/videos/        seus vídeos (e capas/)
```

## Créditos

- Tipografia: **Bodoni Moda** (Indestructible Type) e **Archivo** (Omnibus-Type),
  ambas sob a SIL Open Font License 1.1. As licenças estão em `assets/fonts/`.
- Todo o restante (luzes, partículas, ícones e composições) foi feito em
  HTML, CSS e JavaScript, sem bibliotecas externas.
