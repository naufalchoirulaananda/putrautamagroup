// lib/datetime.ts
export function getJakartaDate(): string {
  const jakartaTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  });
  
  const date = new Date(jakartaTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function getJakartaTime(): string {
  const jakartaTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    hour12: false,
  });
  
  const date = new Date(jakartaTime);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}