export const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const months = [
      "Th1",
      "Th2",
      "Th3",
      "Th4",
      "Th5",
      "Th6",
      "Th7",
      "Th8",
      "Th9",
      "Th10",
      "Th11",
      "Th12",
    ];
    return `${day} ${months[month - 1]}`;
  } catch {
    return "";
  }
};

export const formatDateFull = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
};

const decodeHtmlEntities = (input: string): string => {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
};

export const stripHtml = (html: string): string => {
  const noTags = html.replace(/<[^>]*>/g, " ");
  return decodeHtmlEntities(noTags).replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
};

export const getExcerpt = (content: string, maxLength: number = 120): string => {
  const text = stripHtml(content);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

export const normalizeHtmlText = (html: string): string => {
  const noTags = html.replace(/<[^>]*>/g, "\n");
  const decoded = decodeHtmlEntities(noTags).replace(/\u00A0/g, " ");
  return decoded.replace(/\n{3,}/g, "\n\n").trim();
};

