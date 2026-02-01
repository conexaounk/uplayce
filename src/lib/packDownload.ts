import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function downloadPack(packName: string, userName: string, packColor: string, tracks: any[]) {
  const zip = new JSZip();
  const folder = zip.folder(packName.replace(/[^a-z0-9\- ]/gi, "_") || "pack");

  // 1. Gerar a Capa Personalizada no Canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Fundo com a cor que o usuário escolheu no Color Picker
    ctx.fillStyle = packColor || "#000";
    ctx.fillRect(0, 0, 1000, 1000);

    // Design da Capa (Exemplo Minimalista)
    ctx.fillStyle = "white";
    ctx.font = "bold 90px Montserrat, sans-serif";
    ctx.textBaseline = "alphabetic";

    // quebra simples do título se muito longo
    const title = packName.toUpperCase();
    const lines: string[] = [];
    if (title.length > 18) {
      const mid = Math.floor(title.length / 2);
      lines.push(title.slice(0, mid).trim(), title.slice(mid).trim());
    } else {
      lines.push(title);
    }

    let y = 750;
    lines.forEach((line) => {
      ctx.fillText(line, 80, y);
      y += 90;
    });

    ctx.font = "30px Montserrat, sans-serif";
    ctx.globalAlpha = 0.6;
    ctx.fillText(`PRODUCED EXCLUSIVELY FOR ${userName.toUpperCase()}`, 80, 930);

    // Convertendo a imagem para Blob para colocar no ZIP
    const coverBlob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (coverBlob && folder) {
      folder.file("cover.jpg", coverBlob);
    }
  }

  // 2. Adicionar as Músicas ao ZIP
  console.log("📦 Iniciando download das faixas...");

  const trackPromises = tracks.map(async (track: any, index: number) => {
    try {
      const response = await fetch(track.audio_url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const audioBlob = await response.blob();

      const safeTitle = (track.title || "track").replace(/[^a-z0-9\- ]/gi, "_");
      const safeArtist = (track.artist || "artist").replace(/[^a-z0-9\- ]/gi, "_");
      const fileName = `${String(index + 1).padStart(2, "0")} - ${safeTitle} - ${safeArtist}.mp3`;
      folder.file(fileName, audioBlob);
    } catch (err) {
      console.error(`Erro ao baixar a faixa ${track.title}:`, err);
    }
  });

  await Promise.all(trackPromises);

  // 3. Gerar o arquivo final e disparar o download no navegador
  console.log("⚡ Gerando arquivo ZIP...");
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${packName.replace(/[^a-z0-9\- ]/gi, "_") || "pack"}.zip`);
}
