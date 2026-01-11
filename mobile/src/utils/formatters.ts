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

export const getExcerpt = (content: string, maxLength: number = 120): string => {
  const text = content.replace(/<[^>]*>/g, "");
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, "").replace(/\n/g, "\n\n");
};

