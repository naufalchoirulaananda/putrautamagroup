// lib/notification-ui.ts

export function getNotificationIcon(type: string) {
    switch (type) {
      case "cuti_request":
      case "cuti_waiting_hrd":
      case "cuti_approved":
      case "cuti_rejected":
      default:
        return "";
    }
  }
  
  export function getNotificationColor(type: string) {
    switch (type) {
      case "cuti_request":
      case "cuti_waiting_hrd":
        return "blue";
      case "cuti_approved":
        return "green";
      case "cuti_rejected":
        return "red";
      default:
        return "gray";
    }
  }
  