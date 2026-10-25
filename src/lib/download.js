// Saves a file: uses the host's download API when present, otherwise a normal browser download.
export async function saveFile(name, data) {
  try {
    const d = window.claude && (await window.claude.use("downloads"));
    if (d) { await d.save({ filename: name, data }); return "Saved " + name; }
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "Saved " + name;
  } catch (e) {
    return e && e.code === "declined" ? "Download cancelled." : "Couldn\u2019t download the file.";
  }
}
