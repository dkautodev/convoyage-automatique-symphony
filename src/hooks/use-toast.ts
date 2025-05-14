
// Re-export toast functionality from the UI components
import { useToast as useToastOriginal, toast as toastOriginal } from "@/components/ui/toast"
import { useToast as useToastUI, toast as toastUI } from "@/components/ui/use-toast"

// Export the toast functionality
export const useToast = useToastUI
export const toast = toastUI
